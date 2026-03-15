# KiwiSDR Webclient Architecture & External API Reference

> Generated: 2026-03-14
> Based on: KiwiSDR-downstream codebase
> Covers: WebSocket protocol, REST endpoints, extension API, data formats

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        KiwiSDR Server                               │
│                                                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────────────┐  │
│  │  Web Server  │   │  Rx Engine   │   │  Extension Framework   │  │
│  │  (Mongoose)  │   │  (C++ DSP)   │   │  (C++ Plugin Host)     │  │
│  │              │   │              │   │                        │  │
│  │ web_7.14.cpp │   │ rx_sound.cpp │   │ extensions/ext.h       │  │
│  │ web_7.14.h   │   │ rx_wfall.cpp │   │ extensions/ext.cpp     │  │
│  └──────┬───────┘   └──────┬───────┘   └──────────┬─────────────┘  │
│         │                  │                       │               │
│         └──────────────────┴───────────────────────┘               │
│                            │                                        │
│                     WebSocket / HTTP                                │
└────────────────────────────┼────────────────────────────────────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                     │
   ws://host/ws/kiwi/…/SND             ws://host/ws/kiwi/…/W/F
   (Audio stream + control)            (Waterfall/Spectrum stream)
          │                                     │
          └──────────────────┬──────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                     Browser Webclient                               │
│                                                                     │
│  kiwi.js          openwebrx.js         audio.js      ext.js        │
│  (init/config)    (UI/canvas/control)  (Web Audio)   (extensions)  │
│                                                                     │
│  kiwi_util.js     waterfall.js         w3_util.js    kiwi_map.js   │
│  (WebSocket/AJAX) (canvas render)      (DOM/CSS)     (map/list)    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. Connection Establishment

### HTTP Endpoints

| Endpoint | Method | Purpose | Handler |
|----------|--------|---------|---------|
| `/` | GET | Main webclient HTML | `web_7.14.cpp` file serve |
| `/VER` | GET | Version compatibility check | `rx_server_ajax()` |
| `/status` | GET | Server status JSON | `rx_server_ajax()` |
| `/admin` | GET | Admin panel HTML | `web_7.14.cpp` file serve |
| `/kiwi/...` | GET | Static assets (JS/CSS) | `web_7.14.cpp` file serve |

**Version check** (`kiwi_util.js:2261`):
```javascript
kiwi_ajax("/VER", function(data) { ... });
// Returns: {"version":"vX.Y", "rx_chans":4, "wf_chans":4, ...}
```

**Status check**:
```javascript
kiwi_ajax("/status", function(data) { ... });
// Returns: {"status":"active", "users":2, "gps":{"lat":..,"lon":..}, ...}
```

### URL Query Parameters (Session Initialization)

These are parsed at page load (`kiwi.js:208` → `kiwi_bodyonload()`):

| Parameter | Type | Example | Purpose |
|-----------|------|---------|---------|
| `freq` | float kHz | `?freq=14100` | Initial tuning frequency |
| `mode` | string | `?mode=usb` | Initial demodulation mode |
| `zoom` | int 0–14 | `?zoom=3` | Initial waterfall zoom level |
| `foff` | int Hz | `?foff=1500` | Frequency offset (calibration) |
| `pwd` | string | `?pwd=secret` | Pre-fill password |
| `no_wf` | flag | `?no_wf` | Disable waterfall (audio only) |
| `mobile` | flag | `?mobile` | Force mobile UI layout |
| `nolocal` | flag | `?nolocal` | Force remote-only mode |
| `bar_mkr` | flag | `?bar_mkr` | Show bar/marker UI elements |

---

## 2. WebSocket Protocol

### Connection URLs

```
ws[s]://host:8073/ws/kiwi/<timestamp>/SND    ← Audio + command stream
ws[s]://host:8073/ws/kiwi/<timestamp>/W/F    ← Waterfall/spectrum stream
ws[s]://host:8073/ws/kiwi/<timestamp>/EXT    ← Extension stream
ws[s]://host:8073/ws/admin/<timestamp>/ADM   ← Admin stream
```

**`<timestamp>`** is a Unix millisecond timestamp used as a session token.

**Constructed in** `kiwi_util.js:2651` → `open_websocket()`:
```javascript
function open_websocket(stream, open_cb, msg_cb, close_cb, binary_cb)
```

**Opened in** `openwebrx.js:13711`:
```javascript
function owrx_ws_open_snd() { open_websocket('SND', ...) }
function owrx_ws_open_wf()  { open_websocket('W/F', ...) }
```

### Message Frame Format

All WebSocket frames begin with a 3-byte ASCII magic identifier:

```
┌────────┬──────────────────────────────────┐
│  "MSG" │  key=value key2=value2 ...        │  ← Text control messages
├────────┼──────────────────────────────────┤
│  "AUD" │  <ADPCM compressed audio bytes>  │  ← Binary audio data
├────────┼──────────────────────────────────┤
│  "WF " │  <spectral bin bytes>            │  ← Binary waterfall data
├────────┼──────────────────────────────────┤
│  "DAT" │  <cmd_byte><payload bytes>       │  ← Binary extension data
└────────┴──────────────────────────────────┘
```

**Client → Server**: Plain UTF-8 text commands
**Server → Client**: Binary frames (audio/waterfall) + text MSG frames

---

## 3. Audio Stream (SND) Command API

All commands sent as UTF-8 text on the SND WebSocket. Parsed in `rx/rx_sound_cmd.cpp`.

**Send helper** (`openwebrx.js:13737`):
```javascript
function snd_send(msg) { ws_snd.send(msg); }
```

### Authentication

Must be sent before any other commands:

```
SET auth t=kiwi pwd=<password_hash>
SET auth t=admin pwd=<admin_password_hash>
```

| Field | Values | Notes |
|-------|--------|-------|
| `t` | `kiwi`, `admin`, `mfg` | Connection type |
| `pwd` | MD5 hex string | Password hash |

Auth result codes (`rx/rx_cmd.h:32-44`):

| Code | Meaning |
|------|---------|
| `BADP_OK` | Authenticated, connection allowed |
| `BADP_NOT_ALLOWED_FROM_IP` | IP is blocked |
| `BADP_NO_ADMIN_PWD_SET` | Admin password not configured |
| `BADP_NO_MULTIPLE_CONNS` | Admin already has an active session |
| `BADP_RESET_NOT_LOCAL` | Password reset only permitted from LAN |

### Frequency & Mode Control

**`SET mod=`** — Primary tuning command (`rx_sound_cmd.cpp:169`):

```
SET mod=<mode> low_cut=<hz> high_cut=<hz> freq=<khz> param=<n>
```

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `mod` | string | `usb` | Demodulation mode (see table below) |
| `low_cut` | int Hz | `300` | Passband low edge (relative to carrier) |
| `high_cut` | int Hz | `3000` | Passband high edge (relative to carrier) |
| `freq` | float kHz | `14100.0` | Carrier frequency |
| `param` | int | `0` | Mode-specific parameter |

**Supported Modes** (`kiwi.js:103`):

| Mode | Description |
|------|-------------|
| `am` | AM (wide) |
| `amn` | AM narrow |
| `amw` | AM wide (broadcast) |
| `usb` | Upper Sideband |
| `lsb` | Lower Sideband |
| `usn` | USB narrow |
| `lsn` | LSB narrow |
| `cw` | CW (wide) |
| `cwn` | CW narrow |
| `nbfm` | Narrow-band FM |
| `nnfm` | Very narrow FM |
| `iq` | Raw IQ (stereo) |
| `drm` | Digital Radio Mondiale |
| `sam` | Synchronous AM (auto) |
| `sau` | Synchronous AM (upper) |
| `sal` | Synchronous AM (lower) |
| `sas` | Synchronous AM (stereo) |
| `qam` | QAM |

### AGC Control

```
SET agc=<0|1> hang=<0|1> thresh=<dB> slope=<dB> decay=<ms> manGain=<dB>
```

| Parameter | Range | Description |
|-----------|-------|-------------|
| `agc` | 0/1 | AGC enable |
| `hang` | 0/1 | Hang on peaks |
| `thresh` | -130 to 0 | Threshold dBm |
| `slope` | 0–10 | Slope dB/dB |
| `decay` | 20–5000 | Decay time ms |
| `manGain` | 0–120 | Manual gain dB |

### Other SND Commands

```
SET squelch=<0|1> param=<threshold>     ← Squelch gate
SET mute                                 ← Toggle mute
SET passband=<low_hz> <high_hz>         ← Adjust passband only
SET notch=<0|1> freq=<hz> bw=<hz>      ← Notch filter
SET comp_ratio=<ratio>                   ← ADPCM compression ratio
SET pan=<-1.0..1.0>                     ← IQ stereo panning
SET nr=<0|1> param=<n>                  ← Noise reduction
SET nb=<0|1> param=<n>                  ← Noise blanker
SET nf=<0|1> param=<n>                  ← Noise filter
SET rf_attn=<dB>                        ← RF attenuator
```

### Server → Client MSG Responses (SND stream)

Delivered as `MSG key=value ...` frames, parsed in `owrx_msg_cb()` (`openwebrx.js:13558`):

| Key | Example Value | Description |
|-----|--------------|-------------|
| `audio_init` | `1` | Audio stream ready |
| `audio_rate` | `12000` | Sample rate Hz |
| `audio_adpcm_state` | `...` | ADPCM codec state |
| `audio_camp` | `1` | Audio channel amp |
| `audio_flags2` | `0x03` | Audio feature flags |
| `audio_passband` | `300 3000` | Current passband |
| `kiwi_up` | `1` | Server fully up |
| `gps` | `{lat, lon, fix}` | GPS position |
| `freq` | `14100.0` | Confirmed frequency kHz |
| `mode` | `USB` | Confirmed mode |
| `rf_attn` | `-10` | Current attenuation dB |

---

## 4. Waterfall Stream (W/F) Command API

Commands sent on the W/F WebSocket. Parsed in `rx/rx_waterfall_cmd.cpp`.

**Send helper** (`openwebrx.js:13750`):
```javascript
function wf_send(msg) { ws_wf.send(msg); }
```

### Zoom & Pan

```
SET zoom=<0-14> [cf=<freq_khz>]        ← Zoom to level, center on freq
SET zoom=<0-14> [start=<freq_khz>]     ← Zoom to level, start at freq
```

| Zoom Level | Span (approx) |
|-----------|---------------|
| 0 | Full bandwidth (30 MHz) |
| 7 | ~234 kHz |
| 14 | ~1.8 kHz (maximum zoom) |

### Waterfall Display

```
SET maxdb=<dB> mindb=<dB>              ← dB range (e.g. 0 to -100)
SET cmap=<0-11>                        ← Color map index
SET wf_speed=<1-4>                     ← Update speed (fps)
SET wf_comp=<0|1>                      ← Enable compression
SET aper=<0|1> algo=<n> param=<n>      ← Aperture auto/manual
```

**Color map indices** (`kiwi.js`):

| Index | Name |
|-------|------|
| 0 | Kiwi (default) |
| 1 | CSDR |
| 2 | Grey |
| 3 | Linear |
| 4 | Turbo |
| 5 | SdrDx |
| 6–9 | Custom 1–4 |

### Server → Client MSG Responses (W/F stream)

| Key | Example | Description |
|-----|---------|-------------|
| `wf_setup` | `1` | Waterfall ready |
| `bandwidth` | `30000000` | Total bandwidth Hz |
| `center_freq` | `15000000` | Center frequency Hz |
| `wf_fft_size` | `1024` | FFT bin count |
| `wf_fps_max` | `23` | Maximum FPS |
| `wf_fps` | `4` | Current FPS |
| `wf_cal` | `0.0` | Calibration offset dB |
| `start` | `0` | Current start bin |
| `zoom` | `3` | Current zoom level |
| `zoom_max` | `14` | Maximum zoom level |
| `maxdb` | `0` | Upper dB limit |
| `mindb` | `-100` | Lower dB limit |
| `max_thr` | `-80` | Max threshold dBm |

---

## 5. Common Commands (Both Streams)

```
SET keepalive                           ← Heartbeat (send every ~5s)
SET ident_user=<string>                ← Identify this client
SET options=<flags>                    ← Connection options (e.g. nolocal=1)
SET send_dB=<0|1>                      ← Request waterfall in dB format
SET DX_UPD                             ← Request DX cluster update
SET save_cfg=<json>                    ← Save user config (admin only)
SET save_dxcfg=<json>                  ← Save DX config (admin only)
SET save_adm=<json>                    ← Save admin settings (admin only)
```

---

## 6. Extension Stream (EXT) Command API

Extensions use a separate WebSocket connection or piggyback on SND/W/F.

**Client-side API** (`ext.js`):

```javascript
// Activate an extension
ext_switch_to_client(ext_name, first_time, recv_callback)
// ext_name: string matching extension name
// first_time: boolean
// recv_callback: function(data) called on incoming data

// Send text message to server-side extension
ext_send("SET <key>=<value> ...")

// Send chunked config data
ext_send_cfg(config_object, "config_name")

// Show extension UI panel
ext_panel_show(controls_html, data_html, config_html)

// Close extension
ext_close()
```

**Extension lifecycle callbacks** (implement in your extension JS):

```javascript
function extension_main()                          // Activation entry point
function extension_recv(data)                      // Receive data from server
function extension_focus()                         // Panel focused
function extension_blur()                          // Panel unfocused
function extension_help(id)                        // Help requested
function extension_config_html()                   // Return config HTML string
function extension_environment_changed(changed)    // Resize / layout change
```

---

## 7. Built-in Extensions

| Extension | Activate Command | Purpose |
|-----------|-----------------|---------|
| `FAX` | `ext_switch_to_client('FAX', ...)` | Weather FAX reception |
| `FT8` | `ext_switch_to_client('FT8', ...)` | FT8 digital decode |
| `WSPR` | `ext_switch_to_client('WSPR', ...)` | WSPR beacon decode |
| `NAVTEX` | `ext_switch_to_client('NAVTEX', ...)` | Maritime NAVTEX |
| `CW_decoder` | `ext_switch_to_client('CW_decoder', ...)` | Morse decode |
| `CW_skimmer` | `ext_switch_to_client('CW_skimmer', ...)` | CW band skimmer |
| `SSTV` | `ext_switch_to_client('SSTV', ...)` | Slow-scan TV |
| `DRM` | `ext_switch_to_client('DRM', ...)` | Digital Radio Mondiale |
| `HFDL` | `ext_switch_to_client('HFDL', ...)` | HF Data Link |
| `FSK` | `ext_switch_to_client('FSK', ...)` | FSK decode |
| `Loran_C` | `ext_switch_to_client('Loran_C', ...)` | Loran-C decode |
| `IQ_display` | `ext_switch_to_client('IQ_display', ...)` | IQ constellation |
| `S_meter` | `ext_switch_to_client('S_meter', ...)` | Signal meter logging |
| `IBP_scan` | `ext_switch_to_client('IBP_scan', ...)` | Beacon scanner |
| `TDoA` | `ext_switch_to_client('TDoA', ...)` | Direction finding |
| `colormap` | `ext_switch_to_client('colormap', ...)` | Waterfall color editor |
| `noise_blank` | `ext_switch_to_client('noise_blank', ...)` | Noise blanking |
| `noise_filter` | `ext_switch_to_client('noise_filter', ...)` | Noise filtering |
| `ant_switch` | `ext_switch_to_client('ant_switch', ...)` | Antenna selection |
| `prefs` | `ext_switch_to_client('prefs', ...)` | User preferences |
| `digi_modes` | `ext_switch_to_client('digi_modes', ...)` | Digital modes |

---

## 8. Full Connection Sequence for an External Client

```
1. GET http://host:8073/VER
   → {"version":"vX.Y", ...}  (verify compatibility)

2. GET http://host:8073/status
   → {"rx_chans":4, "users":1, ...}  (check capacity)

3. WebSocket CONNECT ws://host:8073/ws/kiwi/<ts>/SND
   WebSocket CONNECT ws://host:8073/ws/kiwi/<ts>/W/F

4. Send on SND: "SET auth t=kiwi pwd=<md5_hash>"
   Recv MSG:    "MSG authOK=1"  (or "MSG badPwd=1")

5. Send on SND: "SET ident_user=MyApp"

6. Send on SND: "SET mod=usb low_cut=300 high_cut=3000 freq=14100.0 param=0"
   Recv MSG:    "MSG freq=14100.0 mode=USB ..."

7. Send on W/F: "SET zoom=5 cf=14100.0"
   Recv MSG:    "MSG zoom=5 start=<bin> ..."

8. Send on SND: "SET agc=1 hang=1 thresh=-100 slope=6 decay=1000 manGain=50"

9. Send keepalives every 5s on both streams:
   "SET keepalive"

10. Receive binary AUD frames → ADPCM decode → PCM audio
    Receive binary WF  frames → dB bin array → render spectrum
```

---

## 9. Audio Data Processing

Audio arrives as binary `AUD` frames. The client decodes with IMA-ADPCM:

**Files:**
- `web/openwebrx/audio.js` — Web Audio API integration, sample queuing
- `web/kiwi/ima_adpcm.js` — IMA-ADPCM decompressor
- `web/kiwi/adpcm.js` — ADPCM state management

**Sample rates by mode:**

| Mode | Sample Rate |
|------|------------|
| Most modes | 12,000 Hz |
| IQ | 12,000 Hz (stereo) |
| DRM | 24,000 Hz |
| WB (wideband) | 48,000 Hz |

**Format**: Mono 16-bit PCM after decompression, except IQ mode which is stereo (L=I, R=Q).

---

## 10. Waterfall Data Processing

Waterfall frames arrive as binary `WF` frames after the 3-byte magic:

```
Byte 0-2:  "WF "  magic
Byte 3:    flags byte
Byte 4-N:  spectral bins (uint8 compressed dB values or raw)
```

Number of bins = `wf_fft_size` (typically 1024), each byte maps to a dB level scaled between `mindb` and `maxdb`.

---

## 11. Server-Side Extension C++ API

For building native extensions (`extensions/ext.h`):

```c
// Register extension
void ext_register(ext_t *ext);

// Register sample hooks
void ext_register_receive_iq_samps(ext_receive_iq_samps_t func, int rx_chan, int flags);
void ext_register_receive_FFT_samps(ext_receive_FFT_samps_t func, int rx_chan, int flags);
void ext_register_receive_real_samps(ext_receive_real_samps_t func, int rx_chan);
void ext_register_receive_S_meter(ext_receive_S_meter_t func, int rx_chan);
void ext_register_receive_cmds(ext_receive_cmds_t func, int rx_chan);

// Send data to client
int ext_send_msg(int rx_chan, bool debug, const char *msg, ...);
int ext_send_msg_data(int rx_chan, bool debug, u1_t cmd, u1_t *bytes, int nbytes);
int ext_send_msg_encoded(int rx_chan, bool debug, const char *dst,
                         const char *cmd, const char *fmt, ...);

// Extension descriptor
typedef struct {
    const char         *name;
    ext_close_conn_t    close_conn;      // Connection closed
    ext_receive_msgs_t  receive_msgs;    // Receive text messages
    u4_t                version;
    u4_t                flags;
    ext_poll_t          poll_cb;         // Periodic poll
} ext_t;
```

---

## 12. Key File Index

| File | Purpose |
|------|---------|
| `web/kiwi/kiwi.js:208` | `kiwi_bodyonload()` — client entry point |
| `web/kiwi/kiwi.js:55` | Auth constants `AUTH_LOCAL/PASSWORD/USER` |
| `web/kiwi/kiwi.js:103` | `modes_lc[]` — all supported mode strings |
| `web/kiwi/kiwi_util.js:2261` | `kiwi_ajax()` — HTTP helper |
| `web/kiwi/kiwi_util.js:2651` | `open_websocket()` — WebSocket factory |
| `web/openwebrx/openwebrx.js:13558` | `owrx_msg_cb()` — MSG frame dispatcher |
| `web/openwebrx/openwebrx.js:13711` | `owrx_ws_open_snd/wf()` — stream openers |
| `web/openwebrx/openwebrx.js:13737` | `snd_send()` / `wf_send()` — command senders |
| `web/openwebrx/audio.js` | Web Audio pipeline, ADPCM integration |
| `web/extensions/ext.js:59` | `ext_switch_to_client()` — extension activator |
| `web/extensions/ext.js:67` | `ext_send()` — extension command sender |
| `rx/rx_sound_cmd.cpp:169` | `SET mod=` parser — frequency/mode handler |
| `rx/rx_waterfall_cmd.cpp:140` | `SET zoom=` parser — waterfall handler |
| `rx/rx_cmd.h:22` | Common command enumeration |
| `rx/rx_cmd.h:32` | Auth result codes |
| `extensions/ext.h:59` | C++ extension registration API |
| `web/web/web_7.14.cpp` | Mongoose HTTP/WebSocket server |

---

## 13. Multi-Receiver Channel Layout

KiwiSDR supports multiple simultaneous independent receivers:

| Configuration | RX Channels | WF Channels |
|--------------|-------------|-------------|
| RX4_WF4 | 4 | 4 |
| RX8_WF2 | 8 | 2 |
| RX3_WF3 | 3 | 3 |
| RX14_WF0 | 14 | 0 |
| RX_WB | 1 (wideband) | 1 |

Each channel is an independent WebSocket session pair (SND + W/F) with its own frequency, mode, and passband settings.

---

**Summary for external client developers**: Connect two WebSockets (`SND` + `W/F`), authenticate with `SET auth`, send `SET mod=` to tune, send `SET zoom=` for spectrum view, keep connections alive with `SET keepalive` every 5 seconds, and decode incoming binary `AUD`/`WF` frames using IMA-ADPCM and the bin-scaling formula respectively. Extensions are activated via `ext_switch_to_client()` and communicate over the same transport with `DAT`/`MSG` framing.
