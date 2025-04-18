export const _xaOffset = {
    'no-recoil': 0x33BEAE0, // -1124072416 => 505942016
    'no-clip': 0x33B9BE8, // 0.01 => 100
    'no-spread1': 0x35AFC8C, // -1119869952 => 505942016
    'no-spread2': 0x35AFCA4, // -1119870976 => 505942016
    'no-reload': 0x35AFC74, // -1136562176 => 505925632
    'instant-respawn': 0x3161540, // 505415712 => 505415680
    'body-one-kill': 0x35AFDF0, // 506335232 => 505925632
    'head-one-kill': 0x35AFDE8, // -1136594944 => 505925632
    'skill-damage': 0x33136B4, // -1203335166 => 1384184322
    'cookerbuff': 0x35B065C, // 506335232 => 505925632
}
export const _anOffset = {
    "camera-base": 0x8B26DC,
    "yaw": 0x8B26DC + 0x4,
    "pitch": 0x8B26DC + 0x0,
    "camX": 0x8B26DC + 0xC,
    "camY": 0x8B26DC + 0x10,
    "camZ": 0x8B26DC + 0x14,
    "cam-distance": 0x8B26DC + 0x24,

    "position-base": 0x7ABE28,
    "x": 0x7ABE28 + 0x0,
    "y": 0x7ABE28 + 0x4,
    "z": 0x7ABE28 + 0x8,

    "cash-base": 0x2D16FC,
    "dia": 0x2D16FC + 0x0,
    "dia-total": 0x2D16FC + 0x8,
    "dia-used": 0x2D16FC + 0xC,
    "gold": 0x2D16FC + 0x10,
    "gold-total": 0x2D16FC + 0x14,
    "gold-used": 0x2D16FC + 0x18,
    "clan-gold": 0x2D16FC + 0x1C,

    "skill-base": 0x8BF075,
    "grenade-base": 0x8BEFC9,
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
    'slot':0xC0, // byte
    'movable':0xC2, // byte
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
    'pointer':0xF00, // pointer
};