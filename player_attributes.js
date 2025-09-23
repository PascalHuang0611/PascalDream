// player_attributes.js

// 玩家的初始屬性點設定
const initialPlayerAttributes = {
    assignablePoints: 5, // 初始可分配點數
    strength: 0,         // 力量
    agility: 0,          // 敏捷
    constitution: 0,     // 體質
    intelligence: 0,     // 智力
};

// 升級時獲得的屬性點數設定
const ATTRIBUTE_POINT_GAINS = {
    onLayerUp: 1,    // 每提升一層
    onStageUp: 3,    // 每個小境界提升 (前期 -> 中期)
    onRealmUp: 10,   // 每個大境界提升 (煉氣 -> 築基)
};

// 屬性點對戰鬥能力的影響係數
const ATTRIBUTE_EFFECTS = {
    strength_to_atk: 1,       // 1 力量 = 1 攻擊力
    agility_to_spd: 0.2,      // 1 敏捷 = 0.2 速度
    constitution_to_def: 0.5, // 1 體質 = 0.5 防禦力
};

// 升級時獲得的生命值
const HP_GAINS_ON_LEVELUP = {
    onLayerUp: 10,
    onStageUp: 30,
    onRealmUp: 100,
};

