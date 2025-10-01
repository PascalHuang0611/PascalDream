// main.js
// 這是遊戲的核心邏輯檔案，負責處理遊戲狀態、玩家互動和主要的遊戲循環。

document.addEventListener('DOMContentLoaded', () => {

    const settings = window.GameSettings;
    const ui = window.UIManager;

    if (!settings || !ui) {
        console.error("GameSettings or UIManager not found. Make sure game_settings.js and ui_manager.js are loaded correctly.");
        return;
    }

    // --- 1. 初始設定 ---
    const PET_NORMAL_IMAGE = './pet_image.png';
    const PET_CRY_IMAGE = './pet_image_cry.png';
    const GAME_VERSION = '1.9'; // 版本更新
    const SAVE_KEY = 'cultivationGameSave';

    // --- 遊戲狀態變數 ---
    let playerStats = { ...settings.initialPlayerStats, actionProgress: 0 };
    let playerAttributes = { ...settings.initialPlayerAttributes };
    let monsterStats = {};
    let petName = "豬豬";
    let playerExperience = 0;
    let cultivationLevelIndex = 0;
    let totalHpBonusFromLevels = 0;
    let isAwaitingTribulation = false;
    let currentTemperature = null;
    let currentHumidity = null;
    let currentWeatherCode = null;
    let monsterLevel = 1;
    let isGameRunning = false;
    let gameInterval = null;
    let petCryTimeout = null;
    let activeView = 'combat'; 
    let bgmPlayer; // 新增：音樂播放器元素
    
    // --- 農場變數 ---
    let farmAnimals = []; // 全新的動物數據結構
    let lastChickenSpawnTime = Date.now();

    const ACTION_THRESHOLD = 1000;
    const TICK_RATE = 50;

    // --- 3. 遊戲核心功能 ---

    // --- 存檔/讀檔 ---
    function saveGame() {
        // 儲存前更新動物在數據中的位置
        const animalElements = ui.UIElements.farmPlot.querySelectorAll('.farm-animal');
        animalElements.forEach(el => {
            const id = parseInt(el.dataset.id, 10);
            if (farmAnimals[id]) {
                farmAnimals[id].x = el.style.left;
                farmAnimals[id].y = el.style.top;
            }
        });

        const saveData = {
            version: GAME_VERSION,
            cultivationLevelIndex: cultivationLevelIndex,
            playerExperience: playerExperience,
            playerAttributes: playerAttributes,
            totalHpBonusFromLevels: totalHpBonusFromLevels,
            petName: petName,
            farmAnimals: farmAnimals, // 直接儲存動物陣列 (包含點擊次數、死亡時間)
            lastChickenSpawnTime: lastChickenSpawnTime,
            activeView: activeView,
            musicSelection: ui.UIElements.musicSelect.value // 新增：儲存音樂選項
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    }

    function loadGame() {
        const savedData = localStorage.getItem(SAVE_KEY);
        if (!savedData) return false;

        try {
            const parsedData = JSON.parse(savedData);
            if (parsedData.version !== GAME_VERSION) {
                ui.logMessage('偵測到不相容的舊存檔，已開始新遊戲。', '#ffa500');
                localStorage.removeItem(SAVE_KEY);
                return false;
            }

            cultivationLevelIndex = parsedData.cultivationLevelIndex;
            playerExperience = parsedData.playerExperience;
            playerAttributes = parsedData.playerAttributes;
            totalHpBonusFromLevels = parsedData.totalHpBonusFromLevels;
            petName = parsedData.petName || '豬豬';
            ui.UIElements.petName.textContent = petName;
            activeView = parsedData.activeView || 'combat';
            farmAnimals = parsedData.farmAnimals || [];

            // --- 讀取農場資料並計算離線產出 ---
            lastChickenSpawnTime = parsedData.lastChickenSpawnTime || Date.now();
            
            const offlineSeconds = (Date.now() - lastChickenSpawnTime) / 1000;
            const spawnInterval = settings.FARM_SETTINGS.chicken_spawn_interval_seconds;
            const chickensToSpawn = Math.floor(offlineSeconds / spawnInterval);

            if (chickensToSpawn > 0) {
                const currentChickenCount = farmAnimals.filter(a => a !== null).length;
                const availableSlots = settings.FARM_SETTINGS.max_chickens - currentChickenCount;
                const canSpawnCount = Math.min(availableSlots, chickensToSpawn);

                if (canSpawnCount > 0) {
                     for (let i = 0; i < canSpawnCount; i++) {
                        farmAnimals.push(createNewChicken());
                    }
                    ui.logMessage(`離線期間，靈田增加了 ${canSpawnCount} 隻靈獸！`, '#4caf50');
                }
                lastChickenSpawnTime += canSpawnCount * spawnInterval * 1000;
            }

            // --- 載入音樂選擇 ---
            if (parsedData.musicSelection) {
                ui.UIElements.musicSelect.value = parsedData.musicSelection;
                // 注意：這裡不再直接播放，交給 initGame 處理
            }

            ui.logMessage('成功讀取進度。');
            return true;

        } catch(e) {
            console.error("讀取存檔失敗:", e);
            localStorage.removeItem(SAVE_KEY);
            return false;
        }
    }

    function clearSaveData() {
        localStorage.removeItem(SAVE_KEY);
        location.reload();
    }

    // --- 音樂播放 ---
    function playSelectedMusic() {
        const selectedIndex = ui.UIElements.musicSelect.value;
        const track = settings.MUSIC_TRACKS[selectedIndex];
        if (track && track.src) {
            if (bgmPlayer.src !== track.src) {
                bgmPlayer.src = track.src;
            }
            bgmPlayer.play().catch(e => console.error("音樂播放需要使用者互動才能開始。", e));
        } else {
            bgmPlayer.pause();
            bgmPlayer.src = "";
        }
    }

    // --- 屬性與能力值 ---
    function recalculatePlayerStats() {
        const newMaxHp = settings.initialPlayerStats.maxHp + totalHpBonusFromLevels;
        const hpDiff = newMaxHp - playerStats.maxHp;

        playerStats.atk = settings.initialPlayerStats.atk + (playerAttributes.strength * settings.ATTRIBUTE_EFFECTS.strength_to_atk);
        playerStats.spd = settings.initialPlayerStats.spd + (playerAttributes.agility * settings.ATTRIBUTE_EFFECTS.agility_to_spd);
        playerStats.def = settings.initialPlayerStats.def + (playerAttributes.constitution * settings.ATTRIBUTE_EFFECTS.constitution_to_def);
        playerStats.maxHp = newMaxHp;

        if (hpDiff > 0 && playerStats.hp > 0) {
             playerStats.hp += hpDiff;
        }
        playerStats.hp = Math.min(playerStats.hp, playerStats.maxHp);

        ui.updateCharacterStatsUI(playerStats, monsterStats, monsterLevel);
        ui.updateExpRateUI(getExpRateDetails());
    }

    function assignPoint(stat) {
        if (playerAttributes.assignablePoints > 0) {
            playerAttributes.assignablePoints--;
            playerAttributes[stat]++;
            recalculatePlayerStats();
            ui.updateAttributesUI(playerAttributes, settings.initialPlayerAttributes);
        }
    }

    function removePoint(stat) {
        if (playerAttributes[stat] > settings.initialPlayerAttributes[stat]) {
            playerAttributes[stat]--;
            playerAttributes.assignablePoints++;
            recalculatePlayerStats();
            ui.updateAttributesUI(playerAttributes, settings.initialPlayerAttributes);
        }
    }

    function assignMaxPoints(stat) {
        if (playerAttributes.assignablePoints > 0) {
            playerAttributes[stat] += playerAttributes.assignablePoints;
            playerAttributes.assignablePoints = 0;
            recalculatePlayerStats();
            ui.updateAttributesUI(playerAttributes, settings.initialPlayerAttributes);
        }
    }

    function resetAttributes() {
        let spentPoints = 0;
        const stats = ['strength', 'agility', 'constitution', 'intelligence'];
        stats.forEach(stat => {
            spentPoints += (playerAttributes[stat] - settings.initialPlayerAttributes[stat]);
            playerAttributes[stat] = settings.initialPlayerAttributes[stat];
        });

        playerAttributes.assignablePoints += spentPoints;

        recalculatePlayerStats();
        ui.updateAttributesUI(playerAttributes, settings.initialPlayerAttributes);
    }

    // --- 天氣與修煉速度 ---
    function calculateBaseExpRate() {
        const baseGain = settings.BASE_EXP_GAINS.auto_gain_per_second;
        const livingChickens = farmAnimals.filter(a => a && !a.isDead).length;
        const chickenBonus = livingChickens * settings.FARM_SETTINGS.exp_bonus_per_chicken;
        const totalBase = baseGain + chickenBonus;

        if (currentTemperature === null || currentHumidity === null) {
            return { baseGain, chickenBonus, tempBonus: 0, humidBonus: 0, total: totalBase };
        }

        const OPTIMAL_TEMP_MIN = 20, OPTIMAL_TEMP_MAX = 25;
        const BAD_TEMP_LOW = 10, BAD_TEMP_HIGH = 35;
        const OPTIMAL_HUMID_MIN = 40, OPTIMAL_HUMID_MAX = 60;
        const BAD_HUMID_LOW = 20, BAD_HUMID_HIGH = 80;

        function calculateBonus(value, min, max, badLow, badHigh, maxBonus) {
            if (value >= min && value <= max) return maxBonus;
            if (value < min && value > badLow) return ((value - badLow) / (min - badLow)) * maxBonus;
            if (value > max && value < badHigh) return (1.0 - ((value - max) / (badHigh - max))) * maxBonus;
            return 0.0;
        }

        const tempBonus = calculateBonus(currentTemperature, OPTIMAL_TEMP_MIN, OPTIMAL_TEMP_MAX, BAD_TEMP_LOW, BAD_TEMP_HIGH, settings.BASE_EXP_GAINS.max_temp_bonus);
        const humidBonus = calculateBonus(currentHumidity, OPTIMAL_HUMID_MIN, OPTIMAL_HUMID_MAX, BAD_HUMID_LOW, BAD_HUMID_HIGH, settings.BASE_EXP_GAINS.max_humidity_bonus);
        
        return {
            baseGain,
            chickenBonus,
            tempBonus,
            humidBonus,
            total: totalBase + tempBonus + humidBonus
        };
    }

    function getIntelligenceBonus() {
        return 1 + (playerAttributes.intelligence * settings.ATTRIBUTE_EFFECTS.intelligence_to_exp_rate);
    }

    function getExpRateDetails() {
        const baseComponents = calculateBaseExpRate();
        const intelligenceMultiplier = getIntelligenceBonus();
        const intBonus = baseComponents.total * (intelligenceMultiplier - 1);
        const totalRate = baseComponents.total + intBonus;
    
        return {
            baseGain: baseComponents.baseGain,
            tempBonus: baseComponents.tempBonus,
            humidBonus: baseComponents.humidBonus,
            chickenBonus: baseComponents.chickenBonus,
            intBonus: intBonus,
            totalRate: totalRate
        };
    }

    async function fetchWeather() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                
                let locationName = '未知地區';
                try {
                    const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
                    const geoResponse = await fetch(geoUrl);
                    if (!geoResponse.ok) throw new Error('Reverse geocoding API error');
                    const geoData = await geoResponse.json();
                    locationName = geoData.address.city || geoData.address.town || geoData.address.suburb || '您的目前位置';
                } catch (geoError) {
                    console.error("無法進行反向地理編碼:", geoError);
                }

                const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code`;
                try {
                    const weatherResponse = await fetch(weatherUrl);
                    if (!weatherResponse.ok) throw new Error('天氣API回應錯誤');
                    const weatherData = await weatherResponse.json();
                    
                    currentTemperature = weatherData.current.temperature_2m;
                    currentHumidity = weatherData.current.relative_humidity_2m;
                    currentWeatherCode = weatherData.current.weather_code;
                    
                    ui.updateWeatherUI(locationName, ui.translateWeatherCode(currentWeatherCode), currentTemperature, currentHumidity);
                    ui.updateExpRateUI(getExpRateDetails());
                    ui.updateCultivationUI(settings.CULTIVATION_DATA[cultivationLevelIndex], playerExperience, isAwaitingTribulation, currentWeatherCode);

                } catch (error) {
                    console.error("無法獲取天氣資訊:", error);
                    ui.updateWeatherUI("無法載入天氣", "--", "--", "--");
                }
            }, (error) => {
                console.error("地理位置錯誤:", error);
                ui.updateWeatherUI("無法獲取您的位置", "--", "--", "--");
            });
        } else {
            ui.updateWeatherUI("瀏覽器不支援地理位置", "--", "--", "--");
        }
    }

    // --- 升級與渡劫 ---
    function levelUp() {
        const oldLevelData = settings.CULTIVATION_DATA[cultivationLevelIndex];
        playerExperience -= oldLevelData.expRequired;
        cultivationLevelIndex++;
        const newLevelData = settings.CULTIVATION_DATA[cultivationLevelIndex];
        ui.logMessage(`恭喜！你成功晉升到了 ${newLevelData.displayName}！`, newLevelData.color);

        let pointsGained = 0;
        let hpGained = 0;

        if (newLevelData.realmIndex !== oldLevelData.realmIndex) {
            pointsGained = settings.ATTRIBUTE_POINT_GAINS.onRealmUp;
            hpGained = settings.HP_GAINS_ON_LEVELUP.onRealmUp;
            ui.updateRevolvingOrbs(cultivationLevelIndex); 
        } else if (newLevelData.stageName !== oldLevelData.stageName) {
            pointsGained = settings.ATTRIBUTE_POINT_GAINS.onStageUp;
            hpGained = settings.HP_GAINS_ON_LEVELUP.onStageUp;
        } else {
            pointsGained = settings.ATTRIBUTE_POINT_GAINS.onLayerUp;
            hpGained = settings.HP_GAINS_ON_LEVELUP.onLayerUp;
        }
        
        if (pointsGained > 0) {
             playerAttributes.assignablePoints += pointsGained;
             ui.logMessage(`靈氣灌頂！你獲得了 ${pointsGained} 點可分配屬性點！`, '#FFD700');
        }
        if (hpGained > 0) {
            totalHpBonusFromLevels += hpGained;
            ui.logMessage(`根基穩固！你的生命上限提升了 ${hpGained} 點！`, '#4caf50');
        }
        
        recalculatePlayerStats();
        ui.updateAttributesUI(playerAttributes, settings.initialPlayerAttributes);
        saveGame();
    }

    function attemptBreakthrough() {
        if (!isAwaitingTribulation) return;

        const currentLevelData = settings.CULTIVATION_DATA[cultivationLevelIndex];
        const baseSuccessRate = currentLevelData.tribulationSuccessRate;
        
        let weatherBonusRate = 0;
        if (currentWeatherCode !== null) {
            weatherBonusRate = (currentWeatherCode * settings.TRIBULATION_SETTINGS.weather_code_multiplier) / 100;
        }
        const finalSuccessRate = Math.min(1.0, baseSuccessRate + weatherBonusRate);
        
        if (Math.random() < finalSuccessRate) {
            ui.playTribulationAnimation(true);
            const nextLevelData = settings.CULTIVATION_DATA[cultivationLevelIndex + 1];
            ui.logMessage(`天雷淬體，渡劫成功！恭喜突破至 ${nextLevelData.displayName}！`, nextLevelData.color);
            levelUp();
            isAwaitingTribulation = false;
        } else {
            ui.playTribulationAnimation(false);
            const penalty = currentLevelData.expRequired * 0.20;
            playerExperience -= penalty;
            if (playerExperience < 0) playerExperience = 0;
            ui.logMessage(`渡劫失敗，真氣逆行，損失了 ${Math.round(penalty)} 點修為...`, '#dc3545');
            isAwaitingTribulation = false;
        }
        ui.updateCultivationUI(settings.CULTIVATION_DATA[cultivationLevelIndex], playerExperience, isAwaitingTribulation, currentWeatherCode);
    }

    function checkLevelUp() {
        const currentLevelData = settings.CULTIVATION_DATA[cultivationLevelIndex];
        if (!currentLevelData) return;
        
        const expRequired = currentLevelData.expRequired;

        if (isFinite(expRequired) && playerExperience >= expRequired) {
            if (currentLevelData.isTribulationLevel) {
                playerExperience = expRequired;
                isAwaitingTribulation = true;
            } else {
                levelUp();
            }
        }
        ui.updateCultivationUI(settings.CULTIVATION_DATA[cultivationLevelIndex], playerExperience, isAwaitingTribulation, currentWeatherCode);
    }

    function gainExperience(amount) {
        if (isAwaitingTribulation) return;
        playerExperience += amount;
        checkLevelUp();
    }

    function handlePetClick() {
        if (isAwaitingTribulation) return;

        const expAmount = settings.BASE_EXP_GAINS.pet_click_gain * getIntelligenceBonus();
        gainExperience(expAmount);
        ui.showExperienceGainIndicator(expAmount.toFixed(2), { isPet: true });

        if (petCryTimeout) {
            clearTimeout(petCryTimeout);
        }
        
        ui.UIElements.petImg.src = PET_CRY_IMAGE;

        petCryTimeout = setTimeout(() => {
            ui.UIElements.petImg.src = PET_NORMAL_IMAGE;
        }, 300);
    }
    
    // --- 戰鬥邏輯 ---
    function spawnNextMonster() {
        monsterLevel++;
        ui.logMessage(`遭遇新的敵人！`, '#FFD700');
        playerStats.hp = playerStats.maxHp;
        const playableMonsters = settings.MONSTERS_DATABASE.filter(m => !m.isTestMonster);
        const monsterIndexInPlayable = (monsterLevel - 1) % playableMonsters.length;
        const monsterData = playableMonsters[monsterIndexInPlayable];
        monsterStats = { ...monsterData, hp: monsterData.maxHp, actionProgress: 0, };
        const originalIndex = settings.MONSTERS_DATABASE.findIndex(m => m.name === monsterData.name);
        ui.UIElements.monsterSelectEl.value = originalIndex;
        ui.updateCharacterStatsUI(playerStats, monsterStats, monsterLevel); 
    }

    function gameLoop() {
        if (isGameRunning) {
            const fasterSpd = Math.max(playerStats.spd, monsterStats.spd);
            if (fasterSpd <= 0) return;
            const desiredAttackTimeMs = 1000;
            const ticksToAttackForFaster = desiredAttackTimeMs / TICK_RATE; 
            const baseProgressGain = ACTION_THRESHOLD / ticksToAttackForFaster; 
            const playerProgressGain = baseProgressGain * (playerStats.spd / fasterSpd);
            const monsterProgressGain = baseProgressGain * (monsterStats.spd / fasterSpd);
            playerStats.actionProgress += playerProgressGain;
            monsterStats.actionProgress += monsterProgressGain;

            if (playerStats.actionProgress >= ACTION_THRESHOLD) {
                playerStats.actionProgress -= ACTION_THRESHOLD;
                let damage = Math.round(Math.max(1, playerStats.atk - monsterStats.def));
                monsterStats.hp = Math.max(0, monsterStats.hp - damage);
                ui.logMessage(`你對 ${monsterStats.name} 造成了 ${damage} 點傷害。`, '#87CEFA');
                ui.showDamageIndicator(ui.UIElements.monsterCard, damage);
                ui.playAttackAnimation(ui.UIElements.monsterCard, 'slash');
                ui.UIElements.monsterCard.classList.add('attacking');
                ui.UIElements.combatScreen.classList.add('screen-shake');
                setTimeout(() => {
                    ui.UIElements.monsterCard.classList.remove('attacking');
                    ui.UIElements.combatScreen.classList.remove('screen-shake');
                }, 300);
                if (monsterStats.hp <= 0) {
                    ui.logMessage(`你擊敗了 ${monsterStats.name}！`, '#90EE90');
                    spawnNextMonster();
                }
            }
            if (monsterStats.actionProgress >= ACTION_THRESHOLD) {
                 if (monsterStats.hp > 0) {
                    monsterStats.actionProgress -= ACTION_THRESHOLD;
                    let damage = Math.round(Math.max(1, monsterStats.atk - playerStats.def));
                    playerStats.hp = Math.max(0, playerStats.hp - damage);
                    ui.logMessage(`${monsterStats.name} 對你造成了 ${damage} 點傷害。`, '#F08080');
                    ui.showDamageIndicator(ui.UIElements.playerCard, damage);
                    ui.playAttackAnimation(ui.UIElements.playerCard, 'impact');
                    ui.UIElements.playerCard.classList.add('attacking');
                    ui.UIElements.combatScreen.classList.add('screen-shake');
                    setTimeout(() => {
                        ui.UIElements.playerCard.classList.remove('attacking');
                        ui.UIElements.combatScreen.classList.remove('screen-shake');
                    }, 300);
                    if (playerStats.hp <= 0) {
                        ui.logMessage('你被擊敗了... 遊戲結束。', '#DC143C');
                        isGameRunning = false;
                        ui.UIElements.startPauseButton.style.display = 'none';
                        ui.UIElements.restartButton.style.display = 'block';
                    }
                } else {
                    monsterStats.actionProgress = 0;
                }
            }
        }
        
        const expDetails = getExpRateDetails();
        gainExperience(expDetails.totalRate / (1000 / TICK_RATE));
        updateChickenSpawning();
        ui.updateCharacterStatsUI(playerStats, monsterStats, monsterLevel);
    }

    // --- 農場邏輯 ---
    function createNewChicken() {
        return {
            clicks: 0,
            isDead: false,
            deathTimestamp: null,
            x: `${Math.random() * 90}%`,
            y: `${Math.random() * 90}%`,
            movementIntervalId: null,
        };
    }

    function updateChickenSpawning() {
        const livingChickens = farmAnimals.filter(a => a !== null).length;
        if (livingChickens >= settings.FARM_SETTINGS.max_chickens) {
            return;
        }

        const spawnInterval = settings.FARM_SETTINGS.chicken_spawn_interval_seconds * 1000;
        if (Date.now() - lastChickenSpawnTime > spawnInterval) {
            farmAnimals.push(createNewChicken());
            lastChickenSpawnTime += spawnInterval;
            ui.logMessage(`你的靈田裡多了一隻靈獸！`, '#FFD700');
            recalculatePlayerStats();

            if (activeView === 'farm') {
                ui.syncFarmAnimals(farmAnimals);
                startFarmAnimalMovement();
            }
        }
    }

    function moveSingleAnimal(animalElement) {
        const plot = ui.UIElements.farmPlot;
        if (!plot) return;

        const plotRect = plot.getBoundingClientRect();
        const animalRect = animalElement.getBoundingClientRect();
        
        const maxX = plotRect.width - animalRect.width;
        const maxY = plotRect.height - animalRect.height;
        
        const newX = Math.random() * maxX;
        const newY = Math.random() * maxY;

        const currentX = animalElement.offsetLeft;
        const isMovingRight = newX > currentX;
        animalElement.style.transform = isMovingRight ? 'scaleX(-1)' : 'scaleX(1)';

        animalElement.style.left = `${newX}px`;
        animalElement.style.top = `${newY}px`;
    }

    function startSingleAnimalMovement(animalElement, animalData) {
        if (animalData.movementIntervalId) {
            clearInterval(animalData.movementIntervalId);
        }
        if (animalData.isDead) return;

        const movementAction = () => moveSingleAnimal(animalElement);
        
        // 增加一個隨機的延遲來錯開初始移動
        const initialDelay = animalData.hasMoved ? 0 : Math.random() * 3000;

        setTimeout(() => {
            if (!farmAnimals[parseInt(animalElement.dataset.id, 10)] || farmAnimals[parseInt(animalElement.dataset.id, 10)].isDead) return;
            moveSingleAnimal(animalElement);
            animalData.hasMoved = true;
            animalData.movementIntervalId = setInterval(movementAction, 4000 + Math.random() * 2000); // 4-6秒的隨機間隔
        }, initialDelay);
    }
    
    // --- 遊戲流程控制 ---
    function toggleCombat() {
        isGameRunning = !isGameRunning;
        ui.UIElements.startPauseButton.textContent = isGameRunning ? '暫停戰鬥' : '繼續戰鬥';
    }
    
    function reviveAndRestartCombat() {
        ui.logMessage("浴火重生，再來一次！", "#ffa500");
        monsterLevel = 1;
        startSpecificMonsterFight(0);
    }

    function resetGame() {
        playerExperience = 0;
        cultivationLevelIndex = 0;
        totalHpBonusFromLevels = 0;
        isAwaitingTribulation = false;
        playerAttributes = { ...settings.initialPlayerAttributes };
        petName = '豬豬';
        ui.UIElements.petName.textContent = petName;
        activeView = 'combat';
        
        farmAnimals = [createNewChicken()];
        lastChickenSpawnTime = Date.now();

        ui.UIElements.musicSelect.value = 1; // 預設播放 "Sun Moon Dark"

        startSpecificMonsterFight(0);

        recalculatePlayerStats();
        ui.updateAttributesUI(playerAttributes, settings.initialPlayerAttributes);
        ui.updateCultivationUI(settings.CULTIVATION_DATA[cultivationLevelIndex], playerExperience, isAwaitingTribulation, currentWeatherCode);
        ui.updateRevolvingOrbs(cultivationLevelIndex);
    }
    
    function startSpecificMonsterFight(monsterIndex) {
        isGameRunning = false;
        monsterLevel = monsterIndex + 1;
        
        const selectedMonsterData = settings.MONSTERS_DATABASE[monsterIndex];
        monsterStats = { ...selectedMonsterData, hp: selectedMonsterData.maxHp, actionProgress: 0 };
        ui.UIElements.combatLog.innerHTML = "";
        ui.logMessage(`測試戰鬥開始！對手: ${monsterStats.name}`);
        ui.UIElements.startPauseButton.textContent = '開始戰鬥';
        ui.UIElements.startPauseButton.style.display = 'block';
        ui.UIElements.restartButton.style.display = 'none';
        ui.UIElements.monsterSelectEl.value = monsterIndex;
        
        playerStats.hp = playerStats.maxHp; 
        playerStats.actionProgress = 0;
        recalculatePlayerStats();
    }

    function startFarmAnimalMovement() {
        stopFarmAnimalMovement(); // 先清除舊的計時器

        const animals = ui.UIElements.farmPlot.querySelectorAll('.farm-animal');
        animals.forEach(animalElement => {
            const id = parseInt(animalElement.dataset.id, 10);
            const animalData = farmAnimals[id];
            if (animalData) {
                startSingleAnimalMovement(animalElement, animalData);
            }
        });
    }

    function stopFarmAnimalMovement() {
        farmAnimals.forEach(animal => {
            if (animal && animal.movementIntervalId) {
                clearInterval(animal.movementIntervalId);
                animal.movementIntervalId = null;
            }
        });
    }

    function handleFarmPlotClick(event) {
        const target = event.target;
        if (!target.classList.contains('farm-animal')) return;

        const id = parseInt(target.dataset.id, 10);
        const animalData = farmAnimals[id];

        if (!animalData) return;

        // --- 點擊骷髏的邏輯 ---
        if (animalData.isDead) {
            const COOLDOWN_MS = 10000; // 10 秒
            if (Date.now() - animalData.deathTimestamp < COOLDOWN_MS) {
                ui.showFloatingText("于庭被點壞了QQ!!", target);
                return;
            }

            const expAmount = settings.FARM_SETTINGS.exp_per_skeleton_clear;
            gainExperience(expAmount);
            ui.showFloatingText("于庭發出強烈白光後消失了~", target);
            
            farmAnimals[id] = null;
            target.remove();
            recalculatePlayerStats();
            return;
        }

        // --- 點擊活著小雞的邏輯 ---
        if (animalData.movementIntervalId) {
            clearInterval(animalData.movementIntervalId);
            animalData.movementIntervalId = null;
        }

        const computedStyle = window.getComputedStyle(target);
        const currentLeft = computedStyle.left;
        const currentTop = computedStyle.top;
        target.style.transition = 'none';
        target.style.left = currentLeft;
        target.style.top = currentTop;
        target.offsetHeight; 
        target.style.transition = 'top 4s ease-in-out, left 4s ease-in-out, transform 0.5s ease';

        const expAmount = settings.FARM_SETTINGS.exp_per_chicken_click;
        gainExperience(expAmount);
        ui.showExperienceGainIndicator(expAmount, { targetElement: target });
        ui.showAnimalClickFeedback(target);
        animalData.clicks++;

        if (animalData.clicks >= settings.FARM_SETTINGS.chicken_clicks_to_die) {
            animalData.isDead = true;
            animalData.deathTimestamp = Date.now(); // 記錄死亡時間
            ui.logMessage('一隻于庭壽元已盡，化為了骸骨...', '#aaaaaa');
            
            animalData.movementIntervalId = null;
            ui.updateAnimalState(target, animalData);
            recalculatePlayerStats();
        } else {
            setTimeout(() => {
                if (farmAnimals[id] && !animalData.isDead) { 
                    startSingleAnimalMovement(target, animalData);
                }
            }, 300);
        }
    }

    // --- 4. 設定事件監聽 ---
    function setupEventListeners() {
        ui.UIElements.startPauseButton.addEventListener('click', toggleCombat);
        ui.UIElements.restartButton.addEventListener('click', reviveAndRestartCombat);
        ui.UIElements.breakthroughButton.addEventListener('click', attemptBreakthrough);
        ui.UIElements.monsterSelectEl.addEventListener('change', (event) => {
            const selectedIndex = parseInt(event.target.value, 10);
            startSpecificMonsterFight(selectedIndex);
        });
        // 新增：音樂選擇事件
        ui.UIElements.musicSelect.addEventListener('change', playSelectedMusic);

        ui.UIElements.petImg.addEventListener('click', handlePetClick);
        ui.UIElements.editPetName.addEventListener('click', () => {
            const newName = prompt('請為您的寵物取新名字:', petName);
            if (newName && newName.trim()) {
                const forbidden = ['培', '根', '豬'];
                let matchCount = 0;
                if (newName.includes('培')) matchCount++;
                if (newName.includes('根')) matchCount++;
                if (newName.includes('豬')) matchCount++;

                if (matchCount >= 2) {
                    ui.showCustomAlert('想幹嘛，不給你改~~');
                } else {
                    petName = newName.trim();
                    ui.UIElements.petName.textContent = petName;
                    saveGame();
                }
            }
        });
        ui.UIElements.customAlertClose.addEventListener('click', ui.hideCustomAlert);
        ui.UIElements.customAlertOverlay.addEventListener('click', (event) => {
            if (event.target === ui.UIElements.customAlertOverlay) {
                ui.hideCustomAlert();
            }
        });
        ui.UIElements.addPointBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                assignPoint(btn.dataset.stat);
                saveGame();
            });
        });
        ui.UIElements.removePointBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                removePoint(btn.dataset.stat);
                saveGame();
            });
        });
        ui.UIElements.maxPointBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                assignMaxPoints(btn.dataset.stat);
                saveGame();
            });
        });
        ui.UIElements.resetAttributesBtn.addEventListener('click', () => {
            resetAttributes();
            saveGame();
        });
        ui.UIElements.clearSaveBtn.addEventListener('click', clearSaveData);

        ui.UIElements.switchCombatBtn.addEventListener('click', () => {
            activeView = 'combat';
            ui.switchGameView('combat');
            stopFarmAnimalMovement();
        });
        ui.UIElements.switchFarmBtn.addEventListener('click', () => {
            activeView = 'farm';
            farmAnimals = farmAnimals.filter(a => a !== null); // 清理已移除的動物
            ui.switchGameView('farm');
            ui.syncFarmAnimals(farmAnimals);
            startFarmAnimalMovement();
        });

        // 為農場添加點擊事件監聽
        ui.UIElements.farmPlot.addEventListener('click', handleFarmPlotClick);
    }
    
    // --- 5. 遊戲初始化 ---
    function initGame() {
        bgmPlayer = document.getElementById('bgm-player'); // 獲取 audio 元素
        ui.populateMonsterSelector(settings.MONSTERS_DATABASE, ui.UIElements.monsterSelectEl);
        ui.populateMusicSelector(settings.MUSIC_TRACKS, ui.UIElements.musicSelect); // 填充音樂選項
        setupEventListeners();
        
        const gameLoaded = loadGame();
        
        if (!gameLoaded) {
            ui.logMessage("點擊按鈕開始自動戰鬥。");
            resetGame(); 
        } else {
            startSpecificMonsterFight(0);
            recalculatePlayerStats();
            ui.updateAttributesUI(playerAttributes, settings.initialPlayerAttributes);
            ui.updateCultivationUI(settings.CULTIVATION_DATA[cultivationLevelIndex], playerExperience, isAwaitingTribulation, currentWeatherCode);
            ui.updateRevolvingOrbs(cultivationLevelIndex);
        }
        
        // 修正：無論是新遊戲還是讀檔，都設定一次性的事件監聽器來處理首次播放
        if (ui.UIElements.musicSelect.value > 0) {
            const playMusicOnFirstInteraction = () => {
                playSelectedMusic();
            };
            document.body.addEventListener('click', playMusicOnFirstInteraction, { once: true });
            document.body.addEventListener('keydown', playMusicOnFirstInteraction, { once: true });
        }
        
        farmAnimals = farmAnimals.filter(a => a !== null); // 初始載入時清理
        if (farmAnimals.length === 0) {
            farmAnimals.push(createNewChicken());
        }
        
        // 遊戲主循環
        if (gameInterval) clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, TICK_RATE);
        
        // 其他計時器
        setInterval(() => {
            // 每秒只顯示一次總修煉速度，避免干擾
            const expDetails = getExpRateDetails();
            const mainPlayerIndicator = document.querySelector('.meditating-person-img');
            if (mainPlayerIndicator) {
                 ui.showExperienceGainIndicator(expDetails.totalRate.toFixed(2), { targetElement: mainPlayerIndicator });
            }
        }, 1000);
        setInterval(saveGame, 5000);
        fetchWeather();
        setInterval(fetchWeather, 900000); // 15 minutes

        // 初始視圖設定
        ui.switchGameView(activeView);
        if (activeView === 'farm') {
            ui.syncFarmAnimals(farmAnimals);
            startFarmAnimalMovement();
        } else {
            stopFarmAnimalMovement();
        }
    }

    initGame();
});

