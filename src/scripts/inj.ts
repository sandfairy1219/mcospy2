const bypassMode = false;
const cookie = "";

let excs:number[] = [];
let cwbots:number[] = [];
const inj_defaultConfig = {
    elec: false,
    mago: false,
    heal: false,
    bf: false,
    br: false,
    bh: false,
    ab: true,
    ab_radius: 10,
    ab_shoot: true,
    ab_main: true,
    as: true,
    esp: false,
    ws: false,
    nr: true,
    us: true,
    mv: false,
    skc: true,
    ld: false,
    win: false,
    kick: false,
    ccl: 0,
    // static
    clip: false,
    onek: false,
    onesk: true,
    resp: true,
}

const libMyGame = "libMyGame.so";
let modl = Module.findBaseAddress(libMyGame);

interface OffsetInfo {
    name: string;
    str: string;
    args: NativeFunctionArgumentType[];
}

const eposOffsets = {
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
    'dz2':0x110, // float
    'dx2':0x114, // float
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
    'pointer':0xED8, // pointer
};

const cheatOffsets: Record<string, OffsetInfo> = {
    setClanExp: {
        name: "setClanExp",
        str: "_ZN16SystemPacketSend15CheatSetClanExpEj",
        args: ["uint"],
    },
    forceEndGame: {
        name: "forceEndGame",
        str: "_ZN16SystemPacketSend17CheatForceEndGameENS_16ForceEndGameTypeE",
        args: ["pointer"],
    },
    disconnectGameServer: {
        name: "disconnectGameServer",
        str: "_ZN16SystemPacketSend39CheatDisconnectGameServerFromDataServerEh",
        args: ["uchar"],
    },
    setLatency: {
        name: "setLatency",
        str: "_ZN16SystemPacketSend15CheatSetLatencyEj",
        args: ["uint"],
    },
    setStarLeaguePoint: {
        name: "setStarLeaguePoint",
        str: "_ZN16SystemPacketSend23CheatSetStarLeaguePointEt",
        args: ["uint16"],
    },
    getStarLeagueReward: {
        name: "getStarLeagueReward",
        str: "_ZN16SystemPacketSend24CheatGetStarLeagueRewardEv",
        args: [],
    },
    setStarLeagueCoin: {
        name: "setStarLeagueCoin",
        str: "_ZN16SystemPacketSend22CheatSetStarLeagueCoinEj",
        args: ["uint"],
    },
    setGradeAndPoint: {
        name: "setGradeAndPoint",
        str: "_ZN16SystemPacketSend21CheatSetGradeAndPointEhj",
        args: ["uchar", "uint"],
    },
    setPoint: {
        name: "setPoint",
        str: "_ZN16SystemPacketSend13CheatSetPointEhj",
        args: ["uchar", "uint"],
    },
    setGold: {
        name: "setGold",
        str: "_ZN16SystemPacketSend12CheatSetGoldEii",
        args: ["int", "int"],
    },
    setBMoney: {
        name: "setBMoney",
        str: "_ZN16SystemPacketSend14CheatSetBMoneyEii",
        args: ["int", "int"],
    },
    setMoney: {
        name: "setMoney",
        str: "_ZN16SystemPacketSend13CheatSetMoneyEii",
        args: ["int", "int"],
    },
    setAllSkillCoolTimeOneSecond: {
        name: "setAllSkillCoolTimeOneSecond",
        str: "_ZN16SystemPacketSend33CheatSetAllSkillCoolTimeOneSecondEb",
        args: ["bool"],
    },
    getStarLeagueMedal: {
        name: "getStarLeagueMedal",
        str: "_ZN16SystemPacketSend23CheatGetStarLeagueMedalEhm",
        args: ["uchar", "ulong"],
    },
}

const buyOffsets: Record<string, OffsetInfo> = {
    buyWithGold: {
        name: "buyWithGold",
        str: "_ZN16SystemPacketSend11BuyWithGoldEh",
        args: ["uchar"],
    },
    buyCharacter: {
        name: "buyCharacter",
        str: "_ZN16SystemPacketSend12BuyCharacterEh",
        args: ["uchar"],
    },
    buyBoost: {
        name: "buyBoost",
        str: "_ZN16SystemPacketSend8BuyBoostEh",
        args: ["uchar"],
    },
    buyWithClanGold: {
        name: "buyWithClanGold",
        str: "_ZN16SystemPacketSend15BuyWithClanGoldEh",
        args: ["uchar"],
    },
    buyResetKillDeathRatio: {
        name: "buyResetKillDeathRatio",
        str: "_ZN16SystemPacketSend22BuyResetKillDeathRatioEh",
        args: ["uchar"],
    },
    buyItem: {
        name: "buyItem",
        str: "_ZN16SystemPacketSend7BuyItemEhhhh",
        args: ["uchar", "uchar", "uchar", "uchar"], // character, slot, itemid, count (grenade)
    },
    buyRandomOption: {
        name: "buyRandomOption",
        str: "_ZN16SystemPacketSend15BuyRandomOptionEhhhh",
        args: ["uchar", "uchar", "uchar", "uchar"], // character, slot, ?, ?
    },
    buyToyItem: {
        name: "buyToyItem", // guess sky kong kong
        str: "_ZN16SystemPacketSend10BuyToyItemEjhi",
        args: ["uint", "uchar", "int"],
    },
    equip: {
        name: "equip",
        str: "_ZN16SystemPacketSend5EquipEhhh",
        args: ["uchar", "uchar", "uchar"],
    },
    getRewardClassPacket: {
        name: "getRewardClassPackage",
        str: "_ZN16SystemPacketSend12ClassPackage23GetRewardInClassPackageEhhmhhhh",
        args: [],
    }
}

const inGameOffsets: Record<string, OffsetInfo> = {
    hitUser: {
        name: "hitUser",
        str: "_ZN16SystemPacketSend7HitUserERK9UserInforhS2_RKN7cocos2d4Vec3Esf",
        args: ["pointer", "uchar", "pointer", "pointer", "int16", "float"],
    },
    ElectricDebuffToUser: {
        name: "ElectricDebuffToUser",
        str: "_ZN9GameScene25ElectricDebuffToUserSkillER9UserInforR5CBuff",
        args: ["pointer", "pointer"],
    },
    buffHitElectric: {
        name: "buffHitElectric",
        str: "_ZN16SystemPacketSend15BuffHitElectricERK9UserInforjj",
        args: ["pointer", "uint", "uint"],
    },
    buffHitElectricAi: {
        name: "buffHitElectricAi",
        str: "_ZN16SystemPacketSend21BuffHitElectricAIUserERK9UserInforjj",
        args: ["pointer", "uint", "uint"],
    },
    buffHitElectricOff: {
        name: "buffHitElectricOff",
        str: "_ZN19SystemOfflinePacket15BuffHitElectricERK9UserInforjj",
        args: ["pointer", "uint", "uint"],
    },
    debuffToUser: {
        name: "debuffToUser",
        str: "_ZN9GameScene25ElectricDebuffToUserSkillER9UserInforR5CBuff",
        args: ["pointer", "pointer"],
    },
    debuffSkillMagoTotem: {
        name: "debuffSkillMagoTotem",
        str: "_ZN16SystemPacketSend20DeBuffSkillMagoTotemEjj",
        args: ["uint", "uint"],
    },
    updateHookSkill: {
        name: "updateHookSkill",
        str: "_ZN9GameScene15UpdateHookSkillEP9UserInfor",
        args: ["pointer"],
    },
    updateMedicSkill: {
        name: "updateMedicSkill",
        str: "_ZN9GameScene16UpdateMedicSkillEP9UserInfor",
        args: ["pointer"],
    },
    ironSetActivation: {
        name: "ironSetActivation",
        str: "_ZN5Skill4Iron13SetActivationER9UserInforb",
        args: ["pointer", "bool"],
    },
    setEnableJump: {
        name: "setEnableJump",
        str: "_ZN5Cloud8CharData13SetEnableJumpEb",
        args: ["bool"],
    },
    medicSelfHeal: {
        name: "medicSelfHeal",
        str: "_ZN19SystemOfflinePacket20ProcessMedicSelfHealERK9UserInfor",
        args: ["pointer"],
    },
    buffOnWheelleg: {
        name: "buffOnWheelleg",
        str: "_ZN16SystemPacketSend14BuffOnWheellegERK9UserInfor",
        args: ["pointer"],
    },
    buffMagoTotem: {
        name: "buffMagoTotem",
        str: "_ZN16SystemPacketSend18BuffSkillMagoTotemEjRKSt4listIjSaIjEE",
        args: ["uint", "pointer"],
    },
    timeOverRespawn: {
        name: "timeOverRespawn",
        str: "_ZN16SystemPacketSend22TimeOverRespawnWaitingERK9UserInfor",
        args: ["pointer"],
    },
    changeMissionCount: {
        name: "changeMissionCount",
        str: "_ZN16SystemPacketSend22SendChangeMissionCountEjmjt",
        args: ["uint", "ulong", "uint", "uint16"],
    },
    completeGameData: {
        name: "completeGameData",
        str: "_ZN16SystemPacketSend20SendCompleteGameDataEi",
        args: ["uint"],
    },
    MoveAi: {
        name: "MoveAi",
        str: "_ZN14UserMoveSystem6MoveAIERNS_13CollisionDataERN7cocos2d4Vec3ES4_fR9GameSceneR9UserInforf",
        args: ["pointer", "pointer", "pointer", "float", "pointer", "pointer", "float"],
    },
    getMySkillCoolTime: {
        name: "getMySkillCoolTime",
        str: "_ZN5Skill18GetMySkillCoolTimeEv",
        args: [],
    },
    getMaxSkill: {
        name: "getMaxSkill",
        str: "_ZN5Skill16GetMaxSkillCountEh",
        args: ["uchar"],
    },
    getCurSkill: {
        name: "getCurSkill",
        str: "_ZN5Skill16GetCurSkillCountEv",
        args: [],
    },
    makeSkillAvailable: {
        name: "makeSkillAvailable",
        str: "_ZN9GameScene18MakeSkillAvailableEv",
        args: [],
    },
    getSkillInvokeTime: {
        name: "getSkillInvokeTime",
        str: "_ZN20CharStatusCalculator18GetSkillInvokeTimeEh",
        args: ['uchar'],
    },
    skillOff: {
        name: "skillOff",
        str: "_ZN16SystemPacketSend8SkillOffERK9UserInfor",
        args: ['pointer'],
    },
    isSkillManyTimes: {
        name: "isSkillManyTimes",
        str: "_ZN5Skill16IsSkillManyTimesEh",
        args: ["uchar"],
    },
    calculateSpeed: {
        name: "calculateSpeed",
        str: "_ZN14UserMoveSystem14CalculateSpeedERfR9GameSceneR9UserInforf",
        args: ["float", "pointer", "pointer", "float"],
    },
    createMoveSpeed: {
        name: "createMoveSpeed",
        str: "_ZN16SystemPacketSend19CreateMoveSpeedBuffEjj",
        args: ["uint", "uint"],
    },
    createMaxBarrier: {
        name: "createMaxBarrier",
        str: "_ZN16SystemPacketSend20CreateMaxBarrierBuffEjj",
        args: ["uint", "uint"],
    },
    createDamageReduction: {
        name: "createDamageReduction",
        str: "_ZN16SystemPacketSend25CreateDamagereductionBuffERK9UserInfor",
        args: ["pointer"],
    },
    barrierRecharge: {
        name: "barrierRecharge",
        str: "_ZN16SystemPacketSend15BarrierRechargeERK9UserInfor",
        args: ["pointer"],
    },
    createChooChoo: {
        name: "createChooChoo",
        str: "_ZN16SystemPacketSend18CreateChooChooBuffERK9UserInfor",
        args: ["pointer"],
    },
    getRespawnTime: {
        name: "getRespawnTime",
        str: "_ZNK9GameScene14GetRespawnTimeEv",
        args: ["pointer"],
    },
    wheellegSpeedUpBuffApplyBuff: {
        name: "wheellegSpeedUpBuffApplyBuff",
        str: "_ZN20CWheellegSpeedUpBuff9ApplyBuffEP9UserInfor",
        args: ["pointer"],
    },
    checkRemainedBullet: {
        name: "checkRemainedBullet",
        str: "_ZN10UtilWeapon19CheckRemainedBulletERK9UserInfor",
        args: ["pointer"],
    },
    getMedal: {
        name: "getMedal",
        str: "_ZN9GameScene8GetMedalEh",
        args: ["uchar"],
    },
    canHeal: {
        name: "canHeal",
        str: "_ZN9GameScene7CanHealEP9UserInforS1_",
        args: ["pointer", "pointer"],
    },
}

const charStatusOffsets: Record<string, OffsetInfo> = {
    getMaxHP: {
        name: "getMaxHP",
        str: "_ZN20CharStatusCalculator8GetMaxHPERK9UserInforh",
        args: ["pointer", "uchar"],
    },
    getMaxBarrier: {
        name: "getMaxBarrier",
        str: "_ZN20CharStatusCalculator13GetMaxBarrierERK9UserInfor",
        args: ["pointer", "uchar"],
    },
    getShootDelay: {
        name: "getShootDelay",
        str: "_ZN20CharStatusCalculator13GetShootDelayERK9UserInfor",
        args: ["pointer", "uchar"],
    },
    getReloadSpeed: {
        name: "getReloadSpeed",
        str: "_ZN20CharStatusCalculator18GetReloadSpeedRateERK9UserInfor",
        args: ["pointer", "uchar"],
    },
    getMoveSpeed: {
        name: "getMoveSpeed",
        str: "_ZN20CharStatusCalculator12GetMoveSpeedER9UserInfor",
        args: ["pointer", "uchar"],
    },
    getSkillDamage: {
        name: "getSkillDamage",
        str: "_ZN20CharStatusCalculator14GetSkillDamageERK9UserInfor",
        args: ["pointer", "uchar"],
    },
    getSkillCooltime: {
        name: "getSkillCooltime",
        str: "_ZN20CharStatusCalculator16GetSkillCoolTimeERK9UserInfor",
        args: ["pointer", "uchar"],
    },
    getShotgunBullet: {
        name: "getShotgunBullet",
        str: "_ZN20CharStatusCalculator16GetShotGunBulletERK9UserInfor",
        args: ["pointer", "uchar"],
    },
    getBodyshotDamage: {
        name: "getBodyshotDamage",
        str: "_ZN20CharStatusCalculator21GetBodyShotDamageRateERK9UserInfor",
        args: ["pointer"],
    },
    getHeadshotDamage: {
        name: "getHeadshotDamage",
        str: "_ZN20CharStatusCalculator21GetHeadShotDamageRateERK9UserInfor",
        args: ["pointer"],
    },
    cookerBuffWeight: {
        name: "cookerBuffWeight",
        str: "_ZN20CharStatusCalculator19GetCookerBuffWeightERK9UserInfor",
        args: ["pointer"],
    },
}

const charRefOffsets: Record<string, OffsetInfo> = {
    getJumpSpeed: {
        name: "getJumpSpeed",
        str: "_ZNK13CCharacterRef12GetJumpSpeedEh",
        args: ["uchar"],
    },
    getMoveSpeed: {
        name: "getMoveSpeed",
        str: "_ZNK13CCharacterRef12GetMoveSpeedEh",
        args: ["uchar"],
    },
    getMaxBarrier: {
        name: "getMaxBarrier",
        str: "_ZNK13CCharacterRef13GetMaxBarrierEh",
        args: ["uchar"],
    },
    getSkillDamage: {
        name: "getSkillDamage",
        str: "_ZNK13CCharacterRef14GetSkillDamageEh",
        args: ["uchar"],
    },
    getSkillCooltime: {
        name: "getSkillCooltime",
        str: "_ZNK13CCharacterRef16GetSkillCoolTimeEh",
        args: ["uchar"],
    },
    getBarrierRecovery: {
        name: "getBarrierRecovery",
        str: "_ZNK13CCharacterRef18GetBarrierRecoveryEh",
        args: ["uchar"],
    },
}

const clanOffsets: Record<string, OffsetInfo> = {
    matchEndGame: {
        name: "matchEndGame",
        str: "_ZN16SystemPacketSend16ClanMatchEndGameEjhj",
        args: ["uint", "uchar", "uint"], // uid, result, clanid
    },
    matchStartReq: {
        name: "matchStartReq",
        str: "_ZN16SystemPacketSend21ClanMatchStartRequestEv",
        args: [],
    },
    matchReqReady: {
        name: "matchReqReady",
        str: "_ZN16SystemPacketSend17ClanMatchReqReadyEv",
        args: [],
    },
    matchCreateTeam: {
        name: "matchCreateTeam",
        str: "_ZN16SystemPacketSend19ClanMatchCreateTeamEv",
        args: [],
    },
    reqInfoEndMatch: {
        name: "reqInfoEndMatch",
        str: "_ZN16SystemPacketSend30ClanRequestInformationEndMatchEj",
        args: ["uint"],
    },
    clanBreakup: {
        name: "clanBreakup",
        str: "_ZN16SystemPacketSend11ClanBreakupEv",
        args: [],
    },
    clanCreate: {
        name: "clanCreate",
        str: "_ZN16SystemPacketSend10ClanCreateERKSsS1_hh",
        args: ["pointer", "pointer", "uchar", "uchar"], // name, desc, mark(0), flag(151=korea)
    },
    clanLeave: {
        name: "clanLeave",
        str: "_ZN16SystemPacketSend9ClanLeaveEv",
        args: [], // 1
    },
    clanAccept: {
        name: "clanAccept",
        str: "_ZN16SystemPacketSend27ClanAcceptWaitingUserToJoinEjj",
        args: ["uint", "uint"], // clanid, userid
    },
    clanInvite: {
        name: "clanInvite",
        str: "_ZN16SystemPacketSend14ClanInviteUserEj",
        args: ["uint"], // userid
    },
    clanChangeMemberGrade: {
        name: "clanChangeMemberGrade",
        str: "_ZN16SystemPacketSend21ClanChangeMemberGradeEjh",
        args: ["uint", "uchar"], // userid, grade (0=member, 1=vice, 2=master)
    },
    clanChangeIntroduceMessage: {
        name: "clanChangeIntroduceMessage",
        str: "_ZN16SystemPacketSend26ClanChangeIntroduceMessageEjPKc",
        args: ["uint", "pointer"], // clanid,. message
    },
    clanRequestInformation: {
        name: "clanRequestInformation",
        str: "_ZN16SystemPacketSend22ClanRequestInformationEj",
        args: ["uint"], // clanid,
    },
    clanKickMember: {
        name: "clanKickMember",
        str: "_ZN16SystemPacketSend14ClanKickMemberEj",
        args: ["uint"], // userid
    },
}

const cloudOffsets: Record<string, OffsetInfo> = {
    getSkillTime: {
        name: "getSkillTime",
        str: "_ZN5Cloud8CharData12GetSkillTimeEv",
        args: [],
    },
    getSkillElapsed: {
        name: "getSkillElapsed",
        str: "_ZN5Cloud8CharData19GetSkillElapsedTimeEv",
        args: [],
    },
    isSkillAvailable: {
        name: "isSkillAvailable",
        str: "_ZN5Cloud8CharData16IsSkillAvailableEv",
        args: [],
    },
    getSendContribPacketTime: {
        name: "getSendContribPacketTime",
        str: "_ZN5Cloud8GameData24GetSendContribPacketTimeEv",
        args: [],
    },
    setSendContribPacketTime: {
        name: "setSendContribPacketTime",
        str: "_ZN5Cloud8GameData24SetSendContribPacketTimeEf",
        args: ["float"],
    },
    getIsVisibleSnail: {
        name: "getIsVisibleSnail",
        str: "_ZN5Cloud8GameData17GetIsVisibleSnailEv",
        args: [],
    },
    setIsVisibleSnail: {
        name: "setIsVisibleSnail",
        str: "_ZN5Cloud8GameData17SetIsVisibleSnailEb",
        args: ["bool"],
    },
    getAbusingDetector: {
        name: "getAbusingDetector",
        str: "_ZN5Cloud7NetData18GetAbusingDetectorEv",
        args: [],
    },
    getIsTest: {
        name: "getIsTest",
        str: "_ZN5Cloud8GameData9GetIsTestEv",
        args: [],
    },
    getIsTutorial: {
        name: "getIsTutorial",
        str: "_ZN5Cloud8GameData13GetIsTutorialEv",
        args: [],
    },
}

const globalOffsets: Record<string, OffsetInfo> = {
    updatePacketReceiveTime: {
        name: "updatePacketReceiveTime",
        str: "_ZN16SystemPacketSend23UpdatePacketReceiveTimeEf",
        args: ["float"],
    },
    requestLogin: {
        name: "requestLogin",
        str: "_ZN16SystemPacketSend12RequestLoginEiRKSsS1_",
        args: ["int", "ssize_t", "ssize_t"],
    },
    testDeleteAccount: {
        name: "testDeleteAccount",
        str: "_ZN16SystemPacketSend17TestDeleteAccountEv",
        args: [],
    },
    deleteAccount: {
        name: "deleteAccount",
        str: "_ZN16SystemPacketSend20RequestDeleteAccountEv",
        args: [],
    },
    chatting: {
        name: "chatting",
        str: "_ZN16SystemPacketSend8ChattingEhOSs",
        args: ["uchar", "pointer"],
    },
    getUserByOrder: {
        name: "getUserByOrder",
        str: "_ZN15UserInfoManager14GetUserByOrderEh",
        args: ["uchar"],
    },
    getUserByUserSeq: {
        name: "getUserByUserSeq",
        str: "_ZN15UserInfoManager16GetUserByUserSeqEj",
        args: ["uint"],
    },
    resetPacketReceive: {
        name: "resetPacketReceive",
        str: "_ZN16SystemPacketSend22ResetPacketReceiveTimeEv",
        args: [],
    },
    sendPacket: {
        name: "sendPacket",
        str: "_ZN16SystemPacketSend10SendPacketEv",
        args: [],
    },
    addPacketData: {
        name: "addPacketData",
        str: "_ZN16SystemPacketSend13AddPacketDataIhEEvRKT_",
        args: ["pointer"],
    },
    getTCPSocketManager: {
        name: "getTCPSocketManager",
        str: "_ZN5Cloud7NetData19GetTCPSocketManagerEv",
        args: [],
    },
    changeNickname: {
        name: "changeNickname",
        str: "_ZN16SystemPacketSend14ChangeNicknameEhPKch",
        args: ["uchar", "pointer", "uchar"],
    },
    connectToGameServer: {
        name: "connectToGameServer",
        str: "_ZN19SystemPacketReceive19ConnectToGameServerEv",
        args: [],
    },
    setPSAuthCode: {
        name: "setPSAuthCode",
        str: "_ZN19SystemPacketReceive13SetPSAuthCodeEv",
        args: [],
    },
    toggleAbuseDetector: {
        name: "toggleAbuseDetector",
        str: "_ZN9GameScene21ToggleAbusingDetectorEb",
        args: ["bool"],
    },
    abuseDetectorOnSkill: {
        name: "abuseDetectorOnSkill",
        str: "_ZN15AbusingDetector10OnUseSkillERK14InGameNotiInfo",
        args: ["pointer"],
    },
    sendPurchasePass: {
        name: "sendPurchasePass",
        str: "_ZN16SystemPacketSend16SendPurchasePassEjh",
        args: ["uint", "uchar"], // userid, tier
    },
    sendPurchasePassTier: {
        name: "sendPurchasePassTier",
        str: "_ZN16SystemPacketSend20SendPurchasePassTierEjh",
        args: ["uint", "uchar"], // userid, tier
    },
    purchaseHeroPackage: {
        name: "purchaseHeroPackage",
        str: "_ZN12UtilPurchase19PurchaseHeroPackageEih",
        args: ["int", "uchar"], // userid, tier
    },
    receiveReward: {
        name: "receiveReward",
        str: "_ZN12UIMilChoPass13ReceiveRewardEh",
        args: ["uchar"],
    },
    sendReqPassReward: {
        name: "sendReqPassReward",
        str: "_ZN16SystemPacketSend17SendReqPassRewardEjjhhh",
        args: ["uint", "uint", "uchar", "uchar", "uchar"], // userid, season, pass tier, ?, slot
    },
    sendKnockBack: {
        name: "sendKnockBack",
        str: "_ZN16SystemPacketSend13SendKnockBackEjN7cocos2d4Vec3E",
        args: ["uint", "pointer"], // userid, vec3
    },
    changeTeam: {
        name: "changeTeam",
        str: "_ZN16SystemPacketSend10ChangeTeamEv",
        args: [],
    },
    reportClanMark: {
        name: "reportClanMark",
        str: "_ZN16SystemPacketSend14ReportClanMarkEjj",
        args: ['uint', 'uint'],
    },
    reportHackingUser: {
        name: "reportHackingUser",
        str: "_ZN16SystemPacketSend17ReportHackingUserEjjh",
        args: ['uint', 'uint', 'uchar'],
    },
}

const cameraOffsets: Record<string, OffsetInfo> = {
    getCamera: {
        name: "getCamera",
        str: "_ZN5Cloud10CameraData9GetCameraEv",
        args: [],
    },
    getCameraAngleX: {
        name: "getCameraAngleX",
        str: "_ZN5Cloud10CameraData15GetCameraAngleXEv",
        args: [], // float
    },
    setCameraAngleX: {
        name: "setCameraAngleX",
        str: "_ZN5Cloud10CameraData15SetCameraAngleXEf",
        args: ["float"],
    },
    getCameraAngleY: {
        name: "getCameraAngleY",
        str: "_ZN5Cloud10CameraData15GetCameraAngleYEv",
        args: [], // float
    },
    setCameraAngleY: {
        name: "setCameraAngleY",
        str: "_ZN5Cloud10CameraData15SetCameraAngleYEf",
        args: ["float"],
    },
    getCameraZoom: {
        name: "getCameraZoom",
        str: "_ZN5Cloud10CameraData13GetCameraZoomEv",
        args: [], // float
    },
    setCameraZoom: {
        name: "setCameraZoom",
        str: "_ZN5Cloud10CameraData13SetCameraZoomEf",
        args: ["float"],
    },
    getCameraDistanceZ: {
        name: "getCameraDistanceZ",
        str: "_ZN5Cloud10CameraData18GetCameraDistanceZEv",
        args: [], // float
    },
    getCameraDistanceY: {
        name: "getCameraDistanceY",
        str: "_ZN5Cloud10CameraData18GetCameraDistanceYEv",
        args: [], // 9.0 float
    },
    getCameraRay: {
        name: "getCameraRay",
        str: "_ZN5Cloud10CameraData12GetCameraRayEv",
        args: [], // cocos2d::Vec3 const&
    },
    setCameraRayOrigin: {
        name: "setCameraRayOrigin",
        str: "_ZN5Cloud10CameraData18SetCameraRayOriginERKN7cocos2d4Vec3E",
        args: ["pointer"], // cocos2d::Vec3 const&
    },
    getCameraUser: {
        name: "getCameraUser",
        str: "_ZN5Cloud10CameraData24GetCameraUserInformationEv",
        args: ["pointer"], // UserInfor*
    },
}

const callOffsets: Record<string, OffsetInfo> = {
    changeGun: {
        name: "changeGun",
        str: "_ZN9GameScene13CallChangeGunEh",
        args: ["pointer"],
    },
    gameChangeGun: {
        name: "gameChangeGun",
        str: "_ZN9GameScene12ChangeWeaponEP9UserInfor",
        args: ["pointer"]
    },
    touchGunEvent: {
        name: "touchGunEvent",
        str: "_ZN9GameScene13touchGunEventEPN7cocos2d3RefENS0_2ui6Widget14TouchEventTypeEh",
        args: ["pointer", "pointer", "uchar"]
    },
    throw: {
        name: "throw",
        str: "_ZN9GameScene9CallThrowEv",
        args: []
    },
    jump: {
        name: "jump",
        str: "_ZN9GameScene8CallJumpEv",
        args: []
    },
    skill: {
        name: "skill",
        str: "_ZN9GameScene9CallSkillEv",
        args: []
    },
    zoom: {
        name: "zoom",
        str: "_ZN9GameScene8CallZoomEb",
        args: ["bool"]
    },
    reload: {
        name: "reload",
        str: "_ZN9GameScene10CallReloadEv",
        args: []
    },
    shootStart: {
        name: "shootStart",
        str: "_ZN9GameScene14CallShootStartEv",
        args: []
    },
    shootEnd: {
        name: "shootEnd",
        str: "_ZN9GameScene12CallShootEndEv",
        args: []
    },
}

const mapDataOffsets: Record<string, OffsetInfo> = {
    getMapType: {
        name: "getMapType",
        str: "_ZN5Cloud7MapData10GetMapTypeEv",
        args: [],
    },
    // 0 dom old 17 dom new
    // 1 dm space 13 dm container 19 dm desert 23 dm apt 26 dm river 29 dm coloseum
    // 3 ctm old 21 ctm desert 24 ctm castle 27 ctm mountain
    // 14 ec new
    // 2 ecor 20 ecor bridge 28 ecor ice
    // 4 orange maze 5 purple maze
    // 11 ib
    // 25 spray
    // 12 fr
    // 6~8 br new, 9 br old
    // 22 bomb
    // 18 town
    getMode: {
        name: "getMode",
        str: "_ZN5Cloud7MapData7GetModeEv",
        args: [],
    },
    // 0 = domination, 1 = deathmatch, 2 = escort origin, 3 = ctf, 4 = killdevil, 5 = free for all, 6 = br solo,
    // 7 = friendly match, 8 = star league, 9 = ice bang, 10 = br duo, 11 = escort, 12 = offline,
    // 13 = town, 14 = custom lobby, 15 = bomb mode, 16 = spray painting
    getRowCountSprite: {
        name: "getRowCountSprite",
        str: "_ZN5Cloud7MapData20GetMapRowCountSpriteEv",
        args: [],
    },
    getVisibleCountSprite: {
        name: "getVisibleCountSprite",
        str: "_ZN5Cloud7MapData24GetMapVisibleCountSpriteEv",
        args: [],
    },
}

const socketOffsets: Record<string, OffsetInfo> = {
    connect: {
        name: "connect",
        str: "_ZN16TCPSocketManager7connectEP13SocketAddress",
        args: ["pointer"]
    },
    disconnect: {
        name: "disconnect",
        str: "_ZN16TCPSocketManager10disconnectEi",
        args: ["int"]
    },
    disconnectAll: {
        name: "disconnectAll",
        str: "_ZN16TCPSocketManager13disconnectAllEv",
        args: []
    },
    setCodeKey: {
        name: "setCodeKey",
        str: "_ZN16TCPSocketManager10setCodeKeyEiPSsmRKSsS2_",
        args: ["int", "pointer", "ulong", "pointer", "pointer"]
    },
}

const assistOffsets: Record<string, OffsetInfo> = {
    isAimAssist: {
        name: "isAimAssist",
        str: "_ZNK9GameScene11IsAimAssistEv",
        args: [],
    },
    AssistRequestInGameRoomUsers: {
        name: "AssistRequestInGameRoomUsers",
        str: "_ZN16SystemPacketSend28AssistRequestInGameRoomUsersEv",
        args: [],
    },
    SendAimAssistOption: {
        name: "SendAimAssistOption",
        str: "_ZN16SystemPacketSend19SendAimAssistOptionEb",
        args: ['bool'],
    },
}

async function inj_sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function changeArgs(args:NativeFunctionArgumentType[], target:InvocationArguments){
    let _args = [];
    for(let i = 0; i < args.length; i++){
        let type = args[i]
        let tar = target[i]
        let val;
        switch (type) {
            case "bool":
                val = !!tar.toInt32();
                break;
            case "char":
            case "int16":
            case "int":
            case "long":
                val = tar.toInt32();
                break;
            case "uchar":
            case "uint16":
            case "uint":
            case "ulong":
                val = tar.toUInt32();
                break;
            case "float":
                val = tar.readFloat();
                break;
            case "double":
                val = tar.readDouble();
                break;
            case "void":
                val = tar.toString();
                break;
            case "pointer":
                val = tar.toString();
                break;
            case "size_t":
                val = tar.readUtf8String();
                break;
            case "ssize_t":
                const v = tar.readPointer();
                val = v.readUtf8String()
                break;
            default:
                val = tar;
                break;
        }
        _args.push(val)
    }
    return _args;
}

function attach(ofst:OffsetInfo){
    const pt = Module.findExportByName(libMyGame, ofst.str);
    if(pt){
        Interceptor.attach(pt, {
            onEnter: (args) => {
                const _args = changeArgs(ofst.args, args);
                console.log(`[+] ${ofst.name} (${pt.toString()}) Called:`, ..._args)
            },
            onLeave: (retval) => {
                console.log(`[-] ${ofst.name} (${pt.toString()}) Returned:`, retval, retval.toUInt32())
            }
        })
    }
}

function attachStr(str: string, fargs?: NativeFunctionArgumentType[]){
    const pt = Module.findExportByName(libMyGame, str);
    Interceptor.attach(pt, {
        onEnter: args => {
            console.log(`[+] (${pt.toString()}) Called:`, fargs ? changeArgs(fargs, args) : args[0])
        },
        onLeave: (retval) => {
            console.log(`[-] (${pt.toString()}) Returned:`, retval, retval.toUInt32())
        }
    })
}

function func(ofst: OffsetInfo): NativeFunction<any, any>{
    const pt = Module.findExportByName(libMyGame, ofst.str)
    if(pt) return new NativeFunction(pt, "bool", ofst.args)
    else return null;
}

function intercept(ofst: OffsetInfo, callbacksOrProbe: InvocationListenerCallbacks | InstructionProbeCallback) {
    Interceptor.attach(Module.findExportByName(libMyGame, ofst.str), callbacksOrProbe)
}

function isValidAddress(ptrAddr:NativePointer) {
    try {
        return Process.findRangeByAddress(ptrAddr) !== null;
    } catch (e) {
        return false;
    }
}

function genRandom(length: number = 9): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      const randIndex = Math.floor(Math.random() * chars.length);
      result += chars[randIndex];
    }
    return result;
}

class Ch{
    elec:boolean = inj_defaultConfig.elec;
    mago:boolean = inj_defaultConfig.mago;
    heal:boolean = inj_defaultConfig.heal;
    bf:boolean = inj_defaultConfig.bf;
    br:boolean = inj_defaultConfig.br;
    bh:boolean = inj_defaultConfig.bh;
    ab:boolean = inj_defaultConfig.ab;
    esp:boolean = inj_defaultConfig.esp;
    ws:boolean = inj_defaultConfig.ws;
    nr:boolean = inj_defaultConfig.nr;
    us:boolean = inj_defaultConfig.us;
    mv:boolean = inj_defaultConfig.mv;
    skc:boolean = inj_defaultConfig.skc;
    ld:boolean = inj_defaultConfig.ld;
    win:boolean = inj_defaultConfig.win;
    kick:boolean = inj_defaultConfig.kick;
    ccl:number = inj_defaultConfig.ccl;
    _clip:boolean = true;
    _onek:boolean = false;
    _onesk:boolean = false;
    _resp:boolean = false;

    me:string = "";
    yaw:number = 0;
    pitch:number = 0;
    campos: number[] = [0, 0, 0];

    constructor(clip: boolean, onek: boolean, onesk: boolean, resp: boolean){
        this.clip = clip;
        this.onek = onek;
        this.onesk = onesk;
        this.resp = resp;
    }

    sk(n: number){
        if(this.me && ptr(this.me) && !ptr(this.me).isNull()){
            ptr(this.me).add(eposOffsets.sk).writeU8(n);
        };
    }

    set clip(b:boolean){
        this._clip = b;
        const pt = Module.findExportByName(libMyGame, inGameOffsets.MoveAi.str).sub(0x4);
        Memory.protect(pt, Process.pageSize, 'rwx');
        pt.writeFloat(b ? 0.01 : 100);
        Memory.protect(pt, Process.pageSize, 'r-x');
    }
    set onek(b:boolean){
        this._onek = b;
        const bd = Module.findExportByName(libMyGame, charStatusOffsets.getBodyshotDamage.str);
        Memory.protect(bd, Process.pageSize, 'rwx');
        bd.writeS32(b ? 505_925_632 : 506_335_232);
        Memory.protect(bd, Process.pageSize, 'r-x');
        const hd = Module.findExportByName(libMyGame, charStatusOffsets.getHeadshotDamage.str).add(0x10);
        Memory.protect(hd, Process.pageSize, 'rwx');
        hd.writeS32(b ? 505_925_632 : -1_136_594_944);
        Memory.protect(hd, Process.pageSize, 'r-x');
    }
    set onesk(b:boolean){
        this._onesk = b;
        const pt = Module.findExportByName(libMyGame, charRefOffsets.getSkillDamage.str).add(0x60);
        Memory.protect(pt, Process.pageSize, 'rwx');
        pt.writeS32(b ? 1_384_184_322 : -1_203_335_166);
        Memory.protect(pt, Process.pageSize, 'r-x');
    }
    set resp(b:boolean){
        this._resp = b;
        const pt = Module.findExportByName(libMyGame, inGameOffsets.getRespawnTime.str).add(0x18);
        Memory.protect(pt, Process.pageSize, 'rwx');
        pt.writeS32(b ? 505_415_680 : 505_415_712);
        Memory.protect(pt, Process.pageSize, 'r-x');
    }
}

let ch = new Ch(inj_defaultConfig.clip, inj_defaultConfig.onek, inj_defaultConfig.onesk, inj_defaultConfig.resp)
let players:Set<string> = new Set();
let dia: any, gold: any, xp: any, slcoin: any, slmedal: any, slpoint: any, point: any, skill: any, clan: any, win: any, boom: any,
    eq: any, item: any, char: any, unlock: any, del:any, cg: any, medal: any,
    clancr: any, clandel: any, clanlv: any, clandesc: any, clanacc: any, claninv: any, clangrade: any, clankick: any,
    clmtcr: any, clmtst: any,
    chat: any, nick: any,
    purp: any, purt: any, puri: any, kb: any, kick: any,
    ex: any, unlockAll: any;
const ls = () => {
    Array.from(players).forEach(str => {
        const pt = ptr(str);
        const uid = pt.add(eposOffsets.number).readS32();
        const name = pt.add(eposOffsets.nickname).readUtf8String();
        console.log(`[+] ${name} (${uid})`)
    })
}
const inj_all = (callback:(pt: NativePointer) => void) => {
    Array.from(players).forEach(str => callback(ptr(str)))
}
const inj_main = async () => {
    if(!Process.arch.includes("arm")) return console.log("[!] Only ARM architect can execute this script.");
    if(modl.isNull()) return console.log("[!] No Module Found.");

    console.log("[*] Initialized - Pixel Injection CLI v2.3", `(LibMyGame: ${modl}), PID: ${Process.getCurrentThreadId()}, Arch: ${Process.arch}`);
    dia = (amount:number) => func(cheatOffsets.setMoney)(amount, 0);
    gold = (amount:number) => func(cheatOffsets.setGold)(amount, 0);
    xp = (amount: number) => func(cheatOffsets.setGradeAndPoint)(1, amount);
    slcoin = func(cheatOffsets.setStarLeagueCoin);
    slmedal = func(cheatOffsets.getStarLeagueMedal);
    slpoint = func(cheatOffsets.setStarLeaguePoint);
    point = (char:number, amount:number) => func(cheatOffsets.setPoint)(char, amount);
    skill = func(cheatOffsets.setAllSkillCoolTimeOneSecond);
    clan = func(cheatOffsets.setClanExp);
    win = (team:number) => func(cheatOffsets.forceEndGame)(ptr(team));
    boom = (uchar:number) => func(cheatOffsets.disconnectGameServer)(uchar);
    eq = func(buyOffsets.equip);
    item = func(buyOffsets.buyItem);
    char = func(buyOffsets.buyCharacter);
    unlock = (ch:number) => {
        for(let i = 1; i <= 255; i++){item(ch, 0, i, 1)}
        for(let i = 1; i <= 255; i++){item(ch, 1, i, 1)}
        for(let i = 1; i <= 255; i++){item(ch, 2, i, 1)}
        for(let i = 1; i <= 255; i++){item(ch, 3, i, 1)}
        for(let i = 1; i <= 255; i++){item(ch, 4, i, 1)}
        for(let i = 1; i <= 127; i++){item(ch, 6, i, 1)}
        for(let i = 1; i <= 127; i++){item(ch, 7, i, 1)}
    }
    del = () => func(globalOffsets.deleteAccount)();
    cg = (amount: number) => {
        for(let i = 0; i < amount; i++){
            func(buyOffsets.buyWithClanGold)(3);
        }
    }
    medal = (id:number) => func(inGameOffsets.getMedal)(id);
    clancr = (name:string = genRandom(), desc:string = "", mark:number = 0, flag:number = 1) => {
        const npt = Memory.allocUtf8String(name);
        const dpt = Memory.allocUtf8String(desc);
        const nobj = Memory.alloc(Process.pageSize);
        const dobj = Memory.alloc(Process.pageSize);
        nobj.writePointer(npt);
        dobj.writePointer(dpt);
        func(clanOffsets.clanCreate)(nobj, dobj, mark, flag);
    };
    clandel = () => func(clanOffsets.clanBreakup)();
    clanlv = () => func(clanOffsets.clanLeave)();
    clandesc = (id:number, msg:string) => {
        const msgpt = Memory.allocUtf8String(msg);
        func(clanOffsets.clanChangeIntroduceMessage)(id, msgpt);
    };
    clanacc = (id:number, uid:number) => func(clanOffsets.clanAccept)(id, uid);
    claninv = (uid:number) => func(clanOffsets.clanInvite)(uid);
    clangrade = (uid:number, grade:number) => func(clanOffsets.clanChangeMemberGrade)(uid, grade);
    clankick = (uid:number) => func(clanOffsets.clanKickMember)(uid);
    clmtcr = () => func(clanOffsets.matchCreateTeam)();
    clmtst = () => func(clanOffsets.matchStartReq)();
    chat = (msg:string) => {
        const pt = Memory.allocUtf8String(msg);
        const obj = Memory.alloc(Process.pageSize);
        obj.writePointer(pt);
        func(globalOffsets.chatting)(0, obj);
    }
    nick = (name:string) => {
        const sp = Memory.allocUtf8String(name);
        func(globalOffsets.changeNickname)(1, sp, 0);
    }
    purp = func(globalOffsets.sendPurchasePass);
    purt = func(globalOffsets.sendPurchasePassTier);
    puri = func(globalOffsets.sendReqPassReward);
    kick = (id:number) => purt(id, 0);
    kb = (id:number, x:number, y:number, z:number) => {
        const pt = Memory.alloc(Process.pageSize*3);
        pt.writeFloat(x);
        pt.add(0x4).writeFloat(y);
        pt.add(0x8).writeFloat(z);
        func(globalOffsets.sendKnockBack)(id, pt);
    }
    ex = () => {
        dia(15_9999_9999)
        gold(15_9999_9999)
        slcoin(15_9999_9999)
        for(let i = 1; i <= 12; i++){
            slmedal(i, 4)
        }
    }
    unlockAll = () => {
        for(let i = 2; i <= 27; i++){char(i)}
        for(let i = 1; i <= 27; i++){unlock(i)}
    }

    // Debug Zone
    // ==========

    intercept(inGameOffsets.setEnableJump, {
        onEnter(args) {
            args[0] = ptr(0x1);
        },
        onLeave(retval) {
            retval.replace(1 as any);
        }
    })
    
    intercept(globalOffsets.chatting, {
        onEnter(args) {
            const msg = args[1].readPointer();
            const str = msg.readUtf8String();
            if(str.startsWith('/')){
                const cmd = str.split(' ')[0].substring(1).toLowerCase();
                const args = str.split(' ').slice(1);
                switch (cmd) {
                    case 'w':
                        if(ch.me && ptr(ch.me) && !ptr(ch.me).isNull()){
                            win(ptr(ch.me).add(eposOffsets.slot).readU8() % 2);
                        }
                        break;
                    case 'l':
                        if(ch.me && ptr(ch.me) && !ptr(ch.me).isNull()){
                            win(1 - (ptr(ch.me).add(eposOffsets.slot).readU8() % 2));
                        }
                        break;
                    case 'd':
                        win(3);
                        break;
                    case 'cc':
                        clancr();
                        setTimeout(() => {
                            clmtcr();
                            cwbots.forEach((bot) => {
                                claninv(bot);
                            })
                        }, 500);
                        break;
                    case 'cd':
                        cwbots.forEach((bot) => {
                            clankick(bot);
                        })
                        setTimeout(clandel, 500);
                        break;
                }
            }
        }
    })

    intercept(inGameOffsets.getMaxSkill, {onLeave: retval => {if(ch.skc) retval.replace(12 as any)}})
    intercept(inGameOffsets.getCurSkill, {onLeave: retval => {if(ch.skc) retval.replace(12 as any)}})
    intercept(inGameOffsets.isSkillManyTimes, {onLeave: retval => {if(ch.skc) retval.replace(1 as any)}})
    intercept(cloudOffsets.getSkillTime, {onLeave: retval => {if(ch.skc) retval.writeFloat(1)}})

    intercept(clanOffsets.clanCreate, {onLeave(retval) {if(ch.ccl){setTimeout(clandel, 400);}}})
    intercept(clanOffsets.clanBreakup, {onLeave(retval) {if(ch.ccl){ch.ccl--;setTimeout(clancr, 100);}}})

    intercept(cameraOffsets.getCameraAngleX, {
        onLeave(retval) {
            if(!retval.isNull()) {
                ch.yaw = retval.readFloat();
            } else ch.yaw = 0;
        }
    })
    intercept(cameraOffsets.getCameraAngleY, {
        onLeave(retval) {
            if(!retval.isNull()) {
                ch.pitch = retval.readFloat();
                ch.campos = [
                    retval.add(0xC).readFloat(),
                    retval.add(0x10).readFloat(),
                    retval.add(0x14).readFloat()
                ];
            } else {
                ch.pitch = 0;
                ch.campos = [0, 0, 0];
            };
        }
    })
    
    intercept(cameraOffsets.getCameraUser, {
        onLeave(retval) {
            ch.me = retval.toString();
            if(!retval || retval.isNull()) ch.me = "";
        },
    })

    setInterval(() => {
        const mypt = ptr(ch.me);
        if(!mypt || mypt.isNull()) return;
        let mynum = mypt.readS32();
        let slot = mypt.add(eposOffsets.slot).readU8();
        // func(globalOffsets.resetPacketReceive)();
        // func(cheatOffsets.setLatency)(0);
        func(globalOffsets.toggleAbuseDetector)(0);
        if(ch.bf){
            func(inGameOffsets.buffOnWheelleg)(mypt);
            func(inGameOffsets.createDamageReduction)(mypt);
            func(inGameOffsets.createMoveSpeed)(mynum, mynum);
            func(inGameOffsets.createMaxBarrier)(mynum, mynum);
        }
        inj_all(async pt => {
            const num = pt.readS32(), sl = pt.add(eposOffsets.slot).readU8();
            if(ch.elec){
                if(num !== mynum && slot % 2 != sl % 2 && !excs.includes(num)) func(inGameOffsets.buffHitElectric)(pt, mynum, mynum)
            }
            if(ch.mago){
                await inj_sleep(200)
                if(num !== mynum && slot % 2 != sl % 2 && !excs.includes(num)) func(inGameOffsets.debuffSkillMagoTotem)(mynum, num)
            }
        })
    }, 400)
    setInterval(() => {
        const mypt = ptr(ch.me);
        if(!mypt || mypt.isNull()) return;
        let mynum = mypt.readS32();
        let x = mypt.add(eposOffsets.x).readFloat(), y = mypt.add(eposOffsets.y).readFloat(), z = mypt.add(eposOffsets.z).readFloat();
        let st = mypt.add(eposOffsets.state).readS32();
        if(ch.br){
            func(globalOffsets.toggleAbuseDetector)(0);
            func(inGameOffsets.barrierRecharge)(mypt);
        }
        if(ch.bh){
            inj_all(pt => {
                const num = pt.readS32();
                if(num !== mynum && !excs.includes(num)){
                    pt.add(eposOffsets.x).writeFloat(x);
                    pt.add(eposOffsets.y).writeFloat(y);
                    pt.add(eposOffsets.z).writeFloat(z + 10);
                }
            })
        }
        if(ch.ws){
            mypt.add(eposOffsets.w1c).writeFloat(0);
            mypt.add(eposOffsets.w2c).writeFloat(0);
        }
        if(ch.nr){
            if(st >= 64 && st <= 67) mypt.add(eposOffsets.timer).writeFloat(9999);
        }
        if(ch.mv){
            mypt.add(eposOffsets.dx).writeFloat(Math.min(Math.max(mypt.add(eposOffsets.dx2).readFloat()*3, -3), 3))
            mypt.add(eposOffsets.dz).writeFloat(Math.min(Math.max(mypt.add(eposOffsets.dz2).readFloat()*3, -3), 3))
        }
        if(ch.ld){
            if(mypt.add(eposOffsets.state).readS32() != 16 && mypt.add(eposOffsets.hp).readS16() > 0){
                mypt.add(eposOffsets.y).writeFloat(-999)
                mypt.add(eposOffsets.state).writeS32(3)
            }
        }
        if(ch.ab){
            if(inj_defaultConfig.ab_main && mypt.add(eposOffsets.weapon).readU8() != 0) return;
            if(inj_defaultConfig.ab_shoot && (st < 8 || st > 11)) return;
            const rad = inj_defaultConfig.ab_radius / 180 * Math.PI;
            inj_all(pt => {
                const num = pt.readS32();
                if(
                    num !== mynum && !excs.includes(num) &&
                    mypt.add(eposOffsets.slot).readU8() % 2 != pt.add(eposOffsets.slot).readU8() % 2 &&
                    pt.add(eposOffsets.state).readS32() != 16 && pt.add(eposOffsets.hp).readS16() > 0
                ){
                    let dx = pt.add(eposOffsets.x).readFloat() - ch.campos[0];
                    let dy = pt.add(eposOffsets.y).readFloat() + 4.8 - ch.campos[1];
                    let dz = pt.add(eposOffsets.z).readFloat() - ch.campos[2];
                    const yo = Math.atan2(dx, dz);
                    let ya = yo - ch.yaw;
                    while(ya > Math.PI) ya -= Math.PI * 2;
                    while(ya < -Math.PI) ya += Math.PI * 2;
                    const po = Math.atan2(dy, Math.sqrt(dx*dx + dz*dz));
                    let pa = po - ch.pitch;
                    const from = Math.sqrt(ya*ya + pa*pa);
                    if(from >= rad) return;
                    func(cameraOffsets.setCameraAngleX)(yo);
                    func(cameraOffsets.setCameraAngleY)(po);
                    // const radyaw = -ya > 0 ? rad : -rad;
                    // const radpitch = -pa > 0 ? rad : -rad;
                    // const getStep = (val: number, radVal: number) =>
                    //     val > 0 ? Math.max(radVal, val) : Math.min(radVal, val);
                    // const ry = getStep(-ya, getStep(-ya, radyaw) + ya);
                    // const rp = getStep(-pa, getStep(-pa, radpitch) + pa);
                    // func(cameraOffsets.setCameraAngleX)(ch.yaw - ry * inj_defaultConfig.ab_speed/100);
                    // func(cameraOffsets.setCameraAngleY)(ch.pitch - rp * inj_defaultConfig.ab_speed/100);
                }
            })
        }
    }, 10)

    intercept(globalOffsets.getUserByUserSeq, {
        onLeave: retval => {
            players.add(retval.toString());
            players.forEach(player => {
                try{
                    const pt = ptr(player);
                    const myslot = ptr(ch.me).add(eposOffsets.slot).readU8() % 2
                    if(player == ch.me) {
                        if(ch.win) win(pt.add(eposOffsets.slot).readU8() % 2);
                    } else if(ch.kick) {
                        let n = pt.readS32()
                        let slot = pt.add(eposOffsets.slot).readU8() % 2
                        if(n > 0 && myslot != slot && !excs.includes(n)){
                            kick(n);
                        }
                    }
                    const n = pt.add(eposOffsets.nickname).readCString();
                    const zr1 = pt.add(eposOffsets.zr1).readFloat();
                    const zr2 = pt.add(eposOffsets.zr2).readFloat();
                    if(zr1 !== 0 || zr2 !== 0 || n === "") players.delete(player);
                } catch (e){
                    players.delete(player)
                }
            })
        }
    })
}

Java.perform(async () => {
    let callbackClass = Java.use("com.wellbia.xigncode.XigncodeClientSystem$Callback");
    var FakeCallback = Java.registerClass({
        name: "com.wellbia.xigncode.FakeCallback",
        implements: [callbackClass],
        methods: {
            OnHackDetected: function (code, message) {
                console.log("[*] Hack Detected! (Blocked)");
                console.log(code, message)
            },
            OnLog: function (logMessage) {
                console.log("[*] Xigncode Log:", logMessage);
                return;
            },
            SendPacket: function (data) {
                console.log("[*] SendPacket intercepted!");
                return 0;
            }
        }
    });
    let XigncodeClientSystem = Java.use("com.wellbia.xigncode.XigncodeClientSystem");
    XigncodeClientSystem["initialize"].implementation = function (activity:any, str:string, app:string, str3:string, callback:any) {
        var fakeCallback = FakeCallback.$new();
        if(!bypassMode) this["initialize"](activity, str, app, str3, fakeCallback)
        console.log("[*] XigncodeClientSystem.initialize", activity, str, app, str3);
        return 0;
    };
    XigncodeClientSystem["getCookie2"].implementation = function (str:string) {
        let result = this["getCookie2"](str);
        // console.log("[*] XigncodeClientSystem.getCookie2", result);
        return bypassMode ? (cookie || null) : result;
    }
    while(!modl){
        await inj_sleep(500)
        modl = Module.getBaseAddress(libMyGame)
    }
    await inj_main().catch(e => console.log("[!]", e))
})
