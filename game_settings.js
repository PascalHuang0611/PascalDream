(function(window) {
    'use strict';

    // --- 玩家初始數值 ---
    const initialPlayerStats = {
        name: "玩家",
        maxHp: 100,
        hp: 100,
        atk: 20,
        def: 5,
        spd: 20
    };

    // --- 玩家初始屬性 ---
    const initialPlayerAttributes = {
        assignablePoints: 5,
        strength: 0,
        agility: 0,
        constitution: 0,
        intelligence: 0
    };

    // --- 屬性效果 ---
    const ATTRIBUTE_EFFECTS = {
        strength_to_atk: 1,
        agility_to_spd: 0.2,
        constitution_to_def: 0.5,
        intelligence_to_exp_rate: 0.01
    };

    // --- 升級獎勵 ---
    const ATTRIBUTE_POINT_GAINS = {
        onLayerUp: 1,
        onStageUp: 3,
        onRealmUp: 10
    };

    const HP_GAINS_ON_LEVELUP = {
        onLayerUp: 10,
        onStageUp: 30,
        onRealmUp: 100
    };

    // --- 經驗值設定 ---
    const BASE_EXP_GAINS = {
        auto_gain_per_second: 3,
        pet_click_gain: 1,
        max_temp_bonus: 2,
        max_humidity_bonus: 2
    };

    // --- 農場設定 ---
    const FARM_SETTINGS = {
        chicken_spawn_interval_seconds: 300, 
        max_chickens: 20,                    
        exp_bonus_per_chicken: 0.5,
        exp_per_chicken_click: 100,
        chicken_clicks_to_die: 100,
        exp_per_skeleton_clear: 1000, 
        chicken_normal_image: './chicken.png',
        chicken_clicked_image: './chicken_clicked.png',
        chicken_dead_image: './chicken_dead.png'
    };

    // --- 音樂清單 ---
    const MUSIC_TRACKS = [
        { name: "停止播放", src: "" },
        { name: "Sun Moon Dark", src: "https://github.com/PascalHuang0611/PascalDream/raw/refs/heads/main/Sun%20Moon%20Dark%E4%B8%BB%E9%A1%8C.mp3" },
        { name: "Light of the future", src: "https://github.com/PascalHuang0611/PascalDream/raw/refs/heads/main/Light%20of%20the%20future%E4%B8%BB%E9%A1%8C..mp3" },
        { name: "Zero", src: "https://github.com/PascalHuang0611/PascalDream/raw/refs/heads/main/Zero.mp3" },
        { name: "Kira", src: "https://github.com/PascalHuang0611/PascalDream/raw/refs/heads/main/Kira-audio.mp3" },
        { name: "冷褲的難能", src: "https://github.com/PascalHuang0611/PascalDream/raw/refs/heads/main/%E5%81%9A%E4%B8%80%E5%80%8B%E5%86%B7%E8%A4%B2%E7%9A%84%E9%9B%A3%E8%83%BD.mp3" },
        { name: "聽起來好興奮", src: "https://github.com/PascalHuang0611/PascalDream/raw/refs/heads/main/%E7%82%BA%E4%BB%80%E9%BA%BC%E8%81%BD%E8%B5%B7%E4%BE%86%E5%A5%BD%E8%88%88%E5%A5%AE%E5%A5%BD%E5%A5%BD%E5%94%B1.mp3" },
        { name: "苦境桿來的感覺", src: "https://github.com/PascalHuang0611/PascalDream/raw/refs/heads/main/%E7%B5%82%E6%96%BC%E6%9C%89%E8%8B%A6%E5%A2%83%E6%A1%BF%E4%BE%86%E7%9A%84%E6%84%9F%E8%A6%BA.mp3" },
        { name: "強史詩戰鬥", src: "https://github.com/PascalHuang0611/PascalDream/raw/refs/heads/main/%E8%92%B8%E6%B0%A3%E9%B5%AC%E5%85%8B%EF%BC%8C%E9%82%AA%E6%83%A1%EF%BC%8C%E5%BC%B7%E5%8F%B2%E8%A9%A9%E6%88%B0%E9%AC%A5.mp3" },
        { name: "精力充沛", src: "https://github.com/PascalHuang0611/PascalDream/raw/refs/heads/main/%E7%B2%BE%E5%8A%9B%E5%85%85%E6%B2%9B.mp3" },
        { name: "蒸氣鵬克", src: "https://github.com/PascalHuang0611/PascalDream/raw/refs/heads/main/%E8%92%B8%E6%B0%A3%E9%B5%AC%E5%85%8B.mp3" },
        { name: "輪到女主", src: "https://github.com/PascalHuang0611/PascalDream/raw/refs/heads/main/%E8%BC%AA%E5%88%B0%E5%A5%B3%E4%B8%BB.mp3" },
        { name: "魔王來了嗎", src: "https://github.com/PascalHuang0611/PascalDream/raw/refs/heads/main/%E9%AD%94%E7%8E%8B%E4%BE%86%E4%BA%86%E5%97%8E.mp3" },
        { name: "魔王都好可憐", src: "https://github.com/PascalHuang0611/PascalDream/raw/refs/heads/main/%E9%AD%94%E7%8E%8B%E9%83%BD%E5%A5%BD%E5%8F%AF%E6%86%90.mp3" },
        { name: "Music-audio", src: "https://github.com/PascalHuang0611/PascalDream/raw/refs/heads/main/Music-audio.mp3" },
        { name: "Music-audio2", src: "https://github.com/PascalHuang0611/PascalDream/raw/refs/heads/main/Music-audio2.mp3" }
    ];

    // --- 渡劫設定 ---
    const TRIBULATION_SETTINGS = {
        weather_code_multiplier: 0.3
    };

    // --- 怪物資料庫 ---
    const MONSTERS_DATABASE = [
        { name: "史萊姆", maxHp: 80, atk: 10, def: 3, spd: 10, isTestMonster: false },
        { name: "哥布林", maxHp: 120, atk: 15, def: 5, spd: 12, isTestMonster: false },
        { name: "兇猛野狼", maxHp: 100, atk: 20, def: 4, spd: 25, isTestMonster: false },
        { name: "石頭人", maxHp: 250, atk: 8, def: 20, spd: 5, isTestMonster: false },
        { name: "鷹身女妖", maxHp: 150, atk: 18, def: 8, spd: 30, isTestMonster: false },
        { name: "食人魔", maxHp: 300, atk: 25, def: 15, spd: 8, isTestMonster: false },
        { name: "劇毒蜘蛛", maxHp: 180, atk: 22, def: 12, spd: 20, isTestMonster: false },
        { name: "地獄犬", maxHp: 220, atk: 35, def: 10, spd: 35, isTestMonster: false },
        { name: "裝甲野豬", maxHp: 400, atk: 20, def: 30, spd: 10, isTestMonster: false },
        { name: "蛇髮女妖", maxHp: 250, atk: 30, def: 18, spd: 28, isTestMonster: false },
        { name: "牛頭怪", maxHp: 500, atk: 45, def: 25, spd: 15, isTestMonster: false },
        { name: "獅鷲", maxHp: 350, atk: 40, def: 22, spd: 45, isTestMonster: false },
        { name: "獨眼巨人", maxHp: 600, atk: 55, def: 20, spd: 12, isTestMonster: false },
        { name: "元素石像", maxHp: 450, atk: 38, def: 40, spd: 18, isTestMonster: false },
        { name: "奇美拉", maxHp: 550, atk: 60, def: 30, spd: 40, isTestMonster: false },
        { name: "深淵眼魔", maxHp: 400, atk: 70, def: 25, spd: 32, isTestMonster: false },
        { name: "巫妖", maxHp: 380, atk: 80, def: 28, spd: 38, isTestMonster: false },
        { name: "九頭蛇", maxHp: 800, atk: 65, def: 35, spd: 20, isTestMonster: false },
        { name: "炎魔", maxHp: 700, atk: 90, def: 40, spd: 30, isTestMonster: false },
        { name: "上古巨龍", maxHp: 1200, atk: 120, def: 50, spd: 50, isTestMonster: false },
        { name: "測試用", maxHp: 999999, atk: 99999, def: 99999, spd: 1000, isTestMonster: true }
    ];

    // --- 境界資料 ---
    const REALM_DEFINITIONS = [
        { name: "煉氣期", baseExp: 10, successRate: 0.95, color: "#9E9E9E" }, // 灰色
        { name: "築基期", baseExp: 100, successRate: 0.90, color: "#E0E0E0" }, // 白色
        { name: "結丹期", baseExp: 500, successRate: 0.85, color: "#A5D6A7" }, // 綠色
        { name: "元嬰期", baseExp: 2500, successRate: 0.80, color: "#90CAF9" }, // 藍色
        { name: "化神期", baseExp: 10000, successRate: 0.70, color: "#CE93D8" }, // 紫色
        { name: "煉虛期", baseExp: 50000, successRate: 0.60, color: "#FFCC80" }, // 橙色
        { name: "合體期", baseExp: 200000, successRate: 0.50, color: "#FFB74D" }, // 深橙
        { name: "大乘期", baseExp: 1000000, successRate: 0.40, color: "#FF8A65" }, // 橘紅
        { name: "渡劫期", baseExp: 5000000, successRate: 0.30, color: "#E57373" }, // 紅色
        { name: "真仙境", baseExp: 20000000, successRate: 0.25, color: "#4DD0E1" }, // 青色
        { name: "金仙境", baseExp: 100000000, successRate: 0.20, color: "#4DB6AC" }, // 藍綠
        { name: "太乙境", baseExp: 500000000, successRate: 0.15, color: "#F06292" }, // 粉色
        { name: "道祖境", baseExp: Infinity, successRate: 0.10, color: "#FFD700" }  // 金色
    ];

    const CULTIVATION_DATA = [];

    (function generateCultivationData() {
        function lightenHexColor(hex, percent) {
            hex = hex.replace(/^\s*#|\s*$/g, '');
            if (hex.length === 3) {
                hex = hex.replace(/(.)/g, '$1$1');
            }
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            const newR = Math.min(255, r + Math.floor((255 - r) * (percent / 100)));
            const newG = Math.min(255, g + Math.floor((255 - g) * (percent / 100)));
            const newB = Math.min(255, b + Math.floor((255 - b) * (percent / 100)));
            return '#' + newR.toString(16).padStart(2, '0') + newG.toString(16).padStart(2, '0') + newB.toString(16).padStart(2, '0');
        }

        REALM_DEFINITIONS.forEach((realm, realmIndex) => {
            for (let layer = 1; layer <= 13; layer++) {
                let stageName = "";
                let isTribulationLevel = false;
                let stageColor = realm.color;
                if (layer >= 1 && layer <= 4) {
                    stageName = "前期";
                    if (layer === 4) isTribulationLevel = true;
                } else if (layer >= 5 && layer <= 8) {
                    stageName = "中期";
                    stageColor = lightenHexColor(realm.color, 20);
                    if (layer === 8) isTribulationLevel = true;
                } else if (layer >= 9 && layer <= 12) {
                    stageName = "後期";
                    stageColor = lightenHexColor(realm.color, 40);
                    if (layer === 12) isTribulationLevel = true;
                } else {
                    stageName = "大圓滿";
                    const nextRealm = REALM_DEFINITIONS[realmIndex + 1];
                    stageColor = nextRealm ? nextRealm.color : "#FFFFFF";
                    isTribulationLevel = true;
                }
                const expRequired = Math.floor(realm.baseExp * Math.pow(1.2, layer - 1));
                let successRate = realm.successRate;
                if (layer === 13 && realmIndex + 1 < REALM_DEFINITIONS.length) {
                   successRate = REALM_DEFINITIONS[realmIndex + 1].successRate;
                }
                CULTIVATION_DATA.push({
                    realmName: realm.name,
                    stageName: stageName,
                    layer: layer,
                    displayName: `${realm.name} ${stageName} (第${layer}層)`,
                    expRequired: expRequired,
                    isTribulationLevel: isTribulationLevel,
                    tribulationSuccessRate: successRate,
                    color: stageColor,
                    realmIndex: realmIndex
                });
            }
        });
    })();

    window.GameSettings = {
        initialPlayerStats,
        initialPlayerAttributes,
        ATTRIBUTE_EFFECTS,
        ATTRIBUTE_POINT_GAINS,
        HP_GAINS_ON_LEVELUP,
        BASE_EXP_GAINS,
        FARM_SETTINGS,
        MUSIC_TRACKS, // 匯出音樂清單
        TRIBULATION_SETTINGS,
        MONSTERS_DATABASE,
        REALM_DEFINITIONS,
        CULTIVATION_DATA
    };

})(window);

