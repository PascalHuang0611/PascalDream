// cultivation_levels.js

// 顏色處理函式，用於將基礎顏色變得更亮
function lightenHexColor(hex, percent) {
    hex = hex.replace(/^\s*#|\s*$/g, '');
    if (hex.length === 3) {
        hex = hex.replace(/(.)/g, '$1$1');
    }
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 4), 16);
    const b = parseInt(hex.substr(4, 6), 16);

    const newR = Math.min(255, r + Math.floor((255 - r) * (percent / 100)));
    const newG = Math.min(255, g + Math.floor((255 - g) * (percent / 100)));
    const newB = Math.min(255, b + Math.floor((255 - b) * (percent / 100)));

    return '#' + 
           newR.toString(16).padStart(2, '0') + 
           newG.toString(16).padStart(2, '0') + 
           newB.toString(16).padStart(2, '0');
}


// 基礎設定，定義每個大境界的基礎顏色
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

// 自動產生詳細的境界等級，並根據小境界設定不同顏色
REALM_DEFINITIONS.forEach((realm, realmIndex) => {
    for (let layer = 1; layer <= 13; layer++) {
        let stageName = "";
        let isTribulationLevel = false;
        let stageColor = realm.color;

        if (layer >= 1 && layer <= 4) {
            stageName = "前期";
            stageColor = realm.color; // 基礎顏色
            if (layer === 4) isTribulationLevel = true;
        } else if (layer >= 5 && layer <= 8) {
            stageName = "中期";
            stageColor = lightenHexColor(realm.color, 20); // 提亮 20%
            if (layer === 8) isTribulationLevel = true;
        } else if (layer >= 9 && layer <= 12) {
            stageName = "後期";
            stageColor = lightenHexColor(realm.color, 40); // 提亮 40%
            if (layer === 12) isTribulationLevel = true;
        } else {
            stageName = "大圓滿";
            // 大圓滿時，顏色預示著下一個境界
            const nextRealm = REALM_DEFINITIONS[realmIndex + 1];
            stageColor = nextRealm ? nextRealm.color : "#FFFFFF"; // 如果有下個境界，用它的顏色，否則用白色
            isTribulationLevel = true;
        }

        // 恢復為原本的測試用經驗值公式
        const expRequired = Math.floor(realm.baseExp * Math.pow(1.2, layer - 1));

        let successRate = realm.successRate;
        if (layer === 13 && realmIndex + 1 < REALM_DEFINITIONS.length) {
           successRate = REALM_DEFINITIONS[realmIndex + 1].successRate;
        }

        CULTIVATION_DATA.push({
            realmIndex: realmIndex, // 新增：大境界的索引，用於判斷光球數量
            realmName: realm.name,
            stageName: stageName,
            layer: layer,
            displayName: `${realm.name} ${stageName} (第${layer}層)`,
            expRequired: expRequired,
            isTribulationLevel: isTribulationLevel,
            tribulationSuccessRate: successRate,
            color: stageColor 
        });
    }
});

