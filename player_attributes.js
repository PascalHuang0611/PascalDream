// player_attributes.js

// 玩家的初始屬性點
const initialPlayerAttributes = {
  assignablePoints: 5,
  strength: 0,
  agility: 0,
  constitution: 0,
  intelligence: 0
};

// 每點屬性對應的戰鬥能力加成
const ATTRIBUTE_EFFECTS = {
  strength_to_atk: 1,      // 1 力量 = 1 攻擊力
  agility_to_spd: 0.2,     // 1 敏捷 = 0.2 速度
  constitution_to_def: 0.5,// 1 體質 = 0.5 防禦力
  intelligence_to_exp_rate: 0.01 // 1 智力 = 1% 修煉速度加成
};

// 升級時獲得的屬性點
const ATTRIBUTE_POINT_GAINS = {
  onLayerUp: 1,      // 每提升一層
  onStageUp: 3,      // 每提升一個小境界 (前/中/後/圓滿)
  onRealmUp: 10      // 每提升一個大境界 (煉氣/築基...)
};

// 升級時獲得的生命值
const HP_GAINS_ON_LEVELUP = {
  onLayerUp: 10,     // 每提升一層
  onStageUp: 30,     // 每提升一個小境界
  onRealmUp: 100     // 每提升一個大境界
};

// 基礎經驗值獲取設定
const BASE_EXP_GAINS = {
  auto_gain_per_second: 3, // 每秒自動修煉基礎值
  pet_click_gain: 1,       // 點擊寵物基礎值
  max_temp_bonus: 2,       // 溫度在最佳範圍時的最大加成
  max_humidity_bonus: 2    // 濕度在最佳範圍時的最大加成
};

