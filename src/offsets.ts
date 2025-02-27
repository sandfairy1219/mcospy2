export const _xaOffset = {
    'no-recoil': 0x3376274, // -1124072416 => 505942016
    // 18 20 20 1E 0D 02 00 54 01 00 40 BD 21 00 44 F9 00
    // 1.51.0 0x3376274
    // 1.50.2 0x330E7CC
    // 1.50.0 0x331078C
    'no-clip': 0x3371384, // 0.01 => 100
    // 0A D7 23 3C
    // 1.51.0 0x3371384
    // 1.50.2 0x33098EC
    // 1.50.0 0x330B8AC
    'no-spread1': 0x35671F4, // -1119869952 => 505942016
    // 00 24 40 BD  C0 03 5F D6 FD 7B BF A9
    // 1.51.0 0x35651DC
    // 1.50.2 0x34F9304
    // 1.50.0 0x35020C4
    'no-spread2': 0x356720C, // -1119870976 => 505942016
    // 00 20 40 BD C0 03 5F D6 FD 7B BE A9
    // 1.51.0 0x35651F4
    // 1.50.2 0x34F931C
    // 1.50.0 0x35020DC
    'no-reload': 0x35671DC, // -1136562176 => 505925632
    // 00 70 41 BC C0 03 5F D6 FD 7B BF A9
    // 1.51.0 0x35651C4
    // 1.50.2 0x34F92EC
    // 1.50.0 0x35020AC
    'instant-respawn': 0x3116344, // 505415712 => 505415680
    // 20 08 20 1E C0 03 5F D6 6F 12 83 3A FD 7B BE A9
    // 1.51.0 0x3116344
    // 1.50.2 0x30B6FD8
    // 1.50.0 0x30B6FD8
    'body-one-kill': 0x3567358, // 506335232 => 505925632
    // 00 10 2E 1E C0 03 5F D6 FD 7B BF A9
    // 1.51.0 0x3565340
    // 1.50.2 0x34F9450
    // 1.50.0 0x3502210
    'head-one-kill': 0x3567350, // -1136594944 => 505925632
    // 00 F0 40 BC C0 03 5F D6 00 10 2E 1E
    // 1.51.0 0x3565338
    // 1.50.2 0x34F9448
    // 1.50.0 0x3502208
    'skill-damage': 0x32C9A24, // -1203335166 => 1384184322
    // 02 90 46 B8 E0 03 02 2A C0 03 5F D6 42 0C 40 F9
    // 1.51.0 0x32C9A24
    // 1.50.2 0x32651B8
    // 1.50.0 0x3266178
    'cookerbuff': 0x3567BB4, // 506335232 => 505925632
    // 00 10 2E 1E C0 03 5F D6
    // 1.51.0 0x3565B9C
    // 1.50.2 0x34F9C68
    // 1.50.0 0x3502A28
}
export const _anOffset = {
    "camera-base": 0x8AB0CC,
    // 1.50.2 0x8A917C
    // 1.50.0 0x8A900C
    "yaw": 0x8AB0CC + 0x4,
    "pitch": 0x8AB0CC + 0x0,
    "camX": 0x8AB0CC + 0xC,
    "camY": 0x8AB0CC + 0x10,
    "camZ": 0x8AB0CC + 0x14,
    "cam-distance": 0x8AB0CC + 0x24,

    "position-base": 0x7A55E0,
    // 1.50.2 0x7A3950
    // 1.50.0 0x7A37E0
    "x": 0x7A55E0 + 0x0,
    "y": 0x7A55E0 + 0x4,
    "z": 0x7A55E0 + 0x8,

    "cash-base": 0x2CF018,
    "dia": 0x2CF018 + 0x0,
    "dia-total": 0x2CF018 + 0x8,
    "dia-used": 0x2CF018 + 0xC,
    "gold": 0x2CF018 + 0x10,
    "gold-total": 0x2CF018 + 0x14,
    "gold-used": 0x2CF018 + 0x18,
    "clan-gold": 0x2CF018 + 0x1C,
    // 1.50.2 0x2CE0C8
    // 1.50.0 0x2CDF60
    "skill-base": 0x8B7985,
    // 1.50.2 0x8B5A15
    // 1.50.0 0x8B58A5
    "grenade-base": 0x8B78D9,
    // 1.50.2 0x8B5969
    // 1.50.0 0x8B5805
}
export const _cdOffset = {
    "epos-pointer": [0x668, 0x58, 0x178, 0x130, 0x200, 0x158],
}
export const _eposOffset = {
    'number': 0x0, // int32
    'exp': 0x4, // int32
    'totalkill': 0x8, // int32
    'totaldeath': 0xC, // int32
    'totalassist': 0x10, // int32
    'kda': 0x14, // float
    'kill': 0x18, // int32
    'death': 0x1C, // int32
    'assist': 0x20, // int32
    'hp':0x2C, // int16
    'weapon':0x2E, // int16
    'barrier':0x30, // int16
    'nickname':0x88, // string 10
    'sk':0xAD, // byte
    'fall':0xAF, // byte
    'timer':0xC8, // float
    'sc':0xCC, // float
    'dc':0xE0, // float
    'w1c':0xE8, // float
    'w2c':0xEC, // float
    'dz':0xFC, // float
    'dx':0x100, // float
    'state':0x12C, // int32
    'dy':0x134, // float
    'gx':0x13C, // float
    'gy':0x140, // float
    'gz':0x144, // float
    'zr1':0x18C, // float
    'x': 0x190, // float
    'y': 0x194, // float
    'z': 0x198, // float
    'zr2':0x19C, // float
    'gc':0x1A8, // float
    'ox':0x1AC, // float
    'oy':0x1B0, // float
    'oz':0x1B4, // float
    'pointer':0xEE8, // pointer
};