export const SHIP_TYPE_MAP: Record<number, string> = {
    30: 'Fishing vessel',
    35: 'Military operations',
    37: 'Pleasure craft',
    52: 'Tug',
    55: 'Law enforcement',
    60: 'Passenger ship',
    70: 'Cargo ship',
    80: 'Tanker'
};

export const NAV_STATUS_MAP: Record<number, string> = {
    0: 'Under way using engine',
    1: 'At anchor',
    2: 'Not under command',
    3: 'Restricted maneuverability',
    4: 'Constrained by draught',
    5: 'Moored',
    6: 'Aground',
    7: 'Engaged in fishing',
    8: 'Under way sailing',
    14: 'AIS-SART active',
    15: 'Not defined'
};
