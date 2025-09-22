// monsters.js
// 這裡是存放所有怪物基本屬性的資料庫。
// 遊戲會根據怪物等級從這個陣列中讀取資料。

const MONSTERS_DATABASE = [
  {
    name: "史萊姆",
    maxHp: 80,
    atk: 10,
    def: 3,
    spd: 10
  },
  {
    name: "哥布林",
    maxHp: 120,
    atk: 15,
    def: 5,
    spd: 12
  },
  {
    name: "兇猛野狼",
    maxHp: 100,
    atk: 20,
    def: 4,
    spd: 25
  },
  {
    name: "石頭人",
    maxHp: 250,
    atk: 8,
    def: 20,
    spd: 5
  },
  {
    name: "鷹身女妖",
    maxHp: 150,
    atk: 18,
    def: 8,
    spd: 30
  },
  {
    name: "食人魔",
    maxHp: 300,
    atk: 25,
    def: 15,
    spd: 8
  }
  // 您可以隨時在這裡新增更多不同種類的怪物！
];
