import logging
import os
import yaml
from fastapi import APIRouter, HTTPException, Path, Request
from sse_starlette.sse import EventSourceResponse
from litellm import acompletion
from models.schemas import AnalyzeRequest
from core.database import db
from routers.system import AI_MODEL_REDIS_KEY, AI_MODEL_DEFAULT
from datetime import datetime, timezone, timedelta
import numpy as np
from sgp4.api import Satrec, jday
from utils.sgp4_utils import teme_to_ecef, ecef_to_lla_vectorized
import math
from services.schema_context import get_schema_context

router = APIRouter()
logger = logging.getLogger("SovereignWatch.Analysis")

def _haversine_km(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    R = 6371.0 # Radius of earth in kilometers.
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# ---------------------------------------------------------------------------
# Model alias → LiteLLM model string mapping (loaded from litellm_config.yaml)
# ---------------------------------------------------------------------------
_LITELLM_CONFIG_PATH = os.getenv("LITELLM_CONFIG_PATH", "/app/litellm_config.yaml")

def _load_model_map() -> dict:
    try:
        with open(_LITELLM_CONFIG_PATH) as f:
            cfg = yaml.safe_load(f)
        
        model_map = {}
        for m in cfg.get("model_list", []):
            name = m["model_name"]
            params = m.get("litellm_params", {}).copy()
            
            # Resolve environment variables for all parameters
            for key, val in params.items():
                if isinstance(val, str) and val.startswith("os.environ/"):
                    env_var = val.split("/", 1)[1]
                    params[key] = os.getenv(env_var, val)
                
            model_map[name] = params
            
        return model_map
    except Exception as e:
        logger.warning(f"Could not load LiteLLM config from {_LITELLM_CONFIG_PATH}: {e}")
        return {}

_MODEL_MAP = _load_model_map()

@router.post("/api/analyze/{uid}")
async def analyze_track(
    request: Request,
    req: AnalyzeRequest,
    uid: str = Path(..., max_length=100, description="Unique identifier for the track entity")
):
    """
    Fusion Analysis Endpoint:
    1. Fetch Track History (Hard Data)
    2. Generate AI Assessment (Cognition)
    """
    if not db.pool:
        raise HTTPException(status_code=503, detail="Database not ready")

    # 0. Rate Limiting to prevent LLM API exhaustion/DoS
    if db.redis_client:
        client_ip = request.client.host if request.client else "unknown"
        rate_limit_key = f"rate_limit:analyze:{client_ip}"
        try:
            # Limit to 10 requests per minute per IP
            requests = await db.redis_client.incr(rate_limit_key)
            if requests == 1:
                await db.redis_client.expire(rate_limit_key, 60)
            if requests > 10:
                logger.warning(f"Rate limit exceeded for AI analysis from {client_ip}")
                raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"Rate limiting failed: {e}")

    # 1. Fetch Track History Summary & Metadata (Optimized Query from PR 136)
    track_query = """
        WITH raw_points AS (
            SELECT 
                time, lat, lon, alt, speed, heading, type, meta, geom,
                ROW_NUMBER() OVER (ORDER BY time ASC) as row_start,
                ROW_NUMBER() OVER (ORDER BY time DESC) as row_end
            FROM tracks
            WHERE entity_id = $1
            AND time > NOW() - INTERVAL '1 hour' * $2
        )
        SELECT 
            COUNT(*) as points,
            MIN(time) as start_time,
            MAX(time) as last_seen,
            AVG(speed) as avg_speed,
            MAX(speed) as max_speed,
            MIN(speed) as min_speed,
            AVG(alt) as avg_alt,
            MAX(alt) as max_alt,
            MIN(alt) as min_alt,
            ST_Centroid(ST_Collect(geom)) as centroid_geom,
            MAX(CASE WHEN row_start = 1 THEN lat END) as start_lat,
            MAX(CASE WHEN row_start = 1 THEN lon END) as start_lon,
            MAX(CASE WHEN row_end = 1 THEN lat END) as end_lat,
            MAX(CASE WHEN row_end = 1 THEN lon END) as end_lon,
            MAX(CASE WHEN row_end = 1 THEN heading END) as last_heading,
            MAX(CASE WHEN row_end = 1 THEN type END) as entity_type,
            MAX(CASE WHEN row_end = 1 THEN meta END) as latest_meta
        FROM raw_points
    """
    try:
        track_summary = await db.pool.fetchrow(track_query, uid, req.lookback_hours)
    except Exception as e:
        logger.error(f"Analysis track query failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    # 1.1 SATELLITE FALLBACK: If no hard tracks exist, but it's a known satellite, synthesize a track using SGP4
    if (not track_summary or track_summary['points'] == 0) and uid.startswith("SAT-"):
        norad_id = uid.replace("SAT-", "")
        async with db.pool.acquire() as conn:
            sat_row = await conn.fetchrow(
                "SELECT name, category, constellation, tle_line1, tle_line2 FROM satellites WHERE norad_id = $1",
                norad_id
            )
        
        if sat_row and sat_row['tle_line1'] and sat_row['tle_line2']:
            try:
                satrec = Satrec.twoline2rv(sat_row['tle_line1'], sat_row['tle_line2'])
                now = datetime.now(timezone.utc)
                
                # Synthesize 10 points over the lookback period
                points = []
                for i in range(10):
                    t = now - timedelta(hours=req.lookback_hours * (i / 10))
                    jd, fr = jday(t.year, t.month, t.day, t.hour, t.minute, t.second + t.microsecond / 1e6)
                    e, r, v = satrec.sgp4(jd, fr)
                    if e == 0:
                        r_ecef = teme_to_ecef(np.array(r), jd, fr)
                        lat, lon, alt = ecef_to_lla_vectorized(r_ecef.reshape(1, 3))
                        speed = np.linalg.norm(np.array(v)) * 1000 # km/s to m/s
                        points.append({
                            "lat": lat[0], "lon": lon[0], "alt": alt[0] * 1000, "speed": speed, "time": t
                        })
                
                if points:
                    speeds = [p['speed'] for p in points]
                    alts = [p['alt'] for p in points]
                    
                    # Construct a virtual track summary
                    track_summary = {
                        'start_time': points[-1]['time'],
                        'last_seen': points[0]['time'],
                        'points': len(points),
                        'avg_speed': sum(speeds) / len(speeds),
                        'min_speed': min(speeds),
                        'max_speed': max(speeds),
                        'avg_alt': sum(alts) / len(alts),
                        'min_alt': min(alts),
                        'max_alt': max(alts),
                        'centroid_geom': f"SRID=4326;POINT({points[0]['lon']} {points[0]['lat']})",
                        'start_lat': points[-1]['lat'], 'start_lon': points[-1]['lon'],
                        'end_lat': points[0]['lat'], 'end_lon': points[0]['lon'],
                        'last_heading': 0.0,
                        'entity_type': 'a-s-K',
                        'latest_meta': json.dumps({
                            'callsign': sat_row['name'],
                            'classification': {
                                'category': sat_row['category'],
                                'constellation': sat_row['constellation']
                            }
                        })
                    }
                    logger.info(f"Synthesized virtual track for satellite {uid} ({len(points)} points)")
            except Exception as e:
                logger.warning(f"Failed to synthesize satellite track for {uid}: {e}")

    if not track_summary or track_summary['points'] == 0:
        async def error_generator():
            yield {"event": "error", "data": "No track data found for this entity within lookback period"}
        return EventSourceResponse(error_generator())

    # 1.5 Fetch Nearby Intel Reports (Fusion - from main)
    intel_context = ""
    if track_summary['centroid_geom']:
        intel_query = """
            SELECT content, timestamp
            FROM intel_reports
            WHERE ST_DWithin(geom::geography, $1::geography, 50000) -- 50km radius
            ORDER BY timestamp DESC
            LIMIT 3
        """
        try:
            intel_rows = await db.pool.fetch(intel_query, track_summary['centroid_geom'])
            if intel_rows:
                intel_context = "\nCORRELATED INTEL REPORTS (50km Radius):\n"
                for r in intel_rows:
                    intel_context += f"- [{r['timestamp'].strftime('%Y-%m-%d %H:%M')}] {r['content']}\n"
        except Exception as e:
            logger.warning(f"Failed to fetch intel for analysis: {e}")

    # 1.6 Derive trajectory displacement (from PR 136)
    displacement_km: float | None = None
    if all(track_summary.get(k) is not None for k in ('start_lat', 'start_lon', 'end_lat', 'end_lon')):
        displacement_km = _haversine_km(
            track_summary['start_lat'], track_summary['start_lon'],
            track_summary['end_lat'], track_summary['end_lon']
        )

    # 2. Construct Prompt
    entity_type = track_summary.get('entity_type', 'u-u-U')
    schema_ctx = get_schema_context(entity_type if entity_type != "unknown" else None)
    
    # Mode-based Personas (from main)
    # Helper to decode CoT type
    parts = entity_type.split('-')
    affiliation_map = {'f': 'FRIENDLY', 'h': 'HOSTILE', 's': 'SUSPECT', 'n': 'NEUTRAL', 'u': 'UNKNOWN'}
    domain_map = {'A': 'AIR', 'S': 'SURFACE / MARITIME', 'G': 'GROUND', 's': 'SPACE / ORBITAL', 'p': 'INFRASTRUCTURE', 'K': 'SPACE / ORBITAL'}
    affil_char = parts[1] if len(parts) > 1 else 'u'
    domain_char = parts[2] if len(parts) > 2 else 'u'
    resolved_affil = affiliation_map.get(affil_char, 'UNKNOWN')
    resolved_domain = domain_map.get(domain_char, 'UNKNOWN')

    COT_KNOWLEDGE = f"""
    ENTITY CONTEXT (Derived from CoT ID '{uid}' and Type '{entity_type}'):
    - DETECTED DOMAIN: {resolved_domain}
    - DETECTED AFFILIATION: {resolved_affil}
    
    TAK/CoT DECODING RULES:
    1. Type Hierarchy: atom-affiliation-domain-platform-subplatform
    2. Domains: A=Air, S=Surface(Sea), G=Ground, s=Space.
    """

    personas = {
        "tactical": {
            "system": f"You are a Tactical Intelligence Analyst. Focus on telemetry anomalies and trajectory.\n{COT_KNOWLEDGE}",
            "instruction": "Provide a tactical assessment. ENTITY TYPE | IDENTITY | BEHAVIOR | ANOMALY FLAGS | CONFIDENCE"
        },
        "osint": {
            "system": f"You are an OSINT Specialist. Focus on identity and registration.\n{COT_KNOWLEDGE}",
            "instruction": "Analyze identity. ENTITY TYPE | IDENTITY | BEHAVIOR | ANOMALY FLAGS | CONFIDENCE"
        },
        "sar": {
            "system": f"You are a Search and Rescue Coordinator. Look for distress patterns.\n{COT_KNOWLEDGE}",
            "instruction": "Evaluate distress. ENTITY TYPE | IDENTITY | BEHAVIOR | ANOMALY FLAGS | CONFIDENCE"
        }
    }
    
    selected_persona = personas.get(req.mode.lower(), personas["tactical"])
    system_prompt = f"""{selected_persona["system"]}

FIELD DEFINITIONS AND UNITS:
{schema_ctx}

ANALYTICAL GUIDANCE:
- Convert units in your reasoning (alt m→ft, speed m/s→knots) but report both where helpful.
- For displacement near zero with high point count: suspect loitering.
"""

    # Build user content (Combined from main + PR 136)
    latest_meta = track_summary['latest_meta'] or "{}"
    if isinstance(latest_meta, str):
        try: latest_meta = json.loads(latest_meta)
        except: latest_meta = {}
            
    callsign = latest_meta.get('callsign') or latest_meta.get('flight') or "Unknown"
    avg_speed_ms  = track_summary['avg_speed'] or 0.0
    avg_speed_kts = avg_speed_ms * 1.944
    avg_alt_m     = track_summary['avg_alt'] or 0.0
    avg_alt_ft    = avg_alt_m * 3.281
    displacement_str = f"{displacement_km:.1f} km" if displacement_km is not None else "unknown"

    user_content = f"""
    TARGET: {uid} | IDENTITY: {callsign}
    WINDOW: {req.lookback_hours}h | OBSERVATIONS: {track_summary['points']}
    
    TELEMETRY:
      Speed (avg): {avg_speed_kts:.1f} kts [{avg_speed_ms:.1f} m/s]
      Altitude (avg): {avg_alt_ft:.0f} ft [{avg_alt_m:.0f} m]
      Last Heading: {track_summary['last_heading'] or 'N/A'}°
      Net Displacement: {displacement_str}
    
    {intel_context}
    
    IDENTITY (meta): {json.dumps(latest_meta)}
    
    INSTRUCTION: {selected_persona['instruction']}
    ASSESSMENT:
    """

    # 3. Resolve active model
    active_model = AI_MODEL_DEFAULT
    if db.redis_client:
        try:
            stored = await db.redis_client.get(AI_MODEL_REDIS_KEY)
            if stored: active_model = stored
        except Exception as e:
            logger.warning(f"Could not read AI model from Redis: {e}")

    # 4. Stream AI Response
    # NEW-003 (supersedes BUG-005): The prior asyncio.to_thread(completion, ...,
    # stream=True) fix only offloaded the initial HTTP handshake. The generator
    # returned immediately, but the chunk-by-chunk iteration ran synchronously
    # back in the event loop — recreating the blocking problem, one token at a
    # time. Switching to acompletion() + async for keeps the event loop fully
    # unblocked throughout the entire streaming response.
    model_params = _MODEL_MAP.get(active_model, {"model": active_model})
    target_model_str = model_params.get("model", active_model)
    
    logger.info(f"Running fusion analysis for {uid} with model {target_model_str}")

    async def event_generator():
        try:
            response = await acompletion(
                **model_params,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                stream=True
            )
            async for chunk in response:
                content = chunk.choices[0].delta.content or ""
                if content: yield {"data": content}
        except Exception as e:
            logger.error(f"AI analysis failed for {uid}: {e}")
            yield {"event": "error", "data": str(e)}

    return EventSourceResponse(event_generator())
