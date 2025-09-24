(function(window) {
    'use strict';

    // --- 獲取所有需要的 UI 元素 ---
	const UIElements = {
		weatherLocation: document.getElementById('weather-location'),
		weatherCondition: document.getElementById('weather-condition'),
		weatherTemp: document.getElementById('weather-temp'),
		weatherHumidity: document.getElementById('weather-humidity'),
		cultivationLevelName: document.getElementById('cultivation-level-name'),
		playerExp: document.getElementById('player-exp'),
		expRequired: document.getElementById('exp-required'),
		expProgressBar: document.getElementById('exp-progress-bar'),
		expRate: document.getElementById('exp-rate'),
        expRateTooltip: document.getElementById('exp-rate-tooltip'), 
		tribulationRate: document.getElementById('tribulation-rate'),
		breakthroughButton: document.getElementById('breakthrough-button'),
		playerHpText: document.getElementById('player-hp-text'),
		playerAtk: document.getElementById('player-atk'),
		playerDef: document.getElementById('player-def'),
		playerSpd: document.getElementById('player-spd'),
		playerHealthBar: document.getElementById('player-health-bar'),
		playerActionBar: document.getElementById('player-action-bar'),
		monsterName: document.getElementById('monster-name'),
		monsterHpText: document.getElementById('monster-hp-text'),
		monsterAtk: document.getElementById('monster-atk'),
		monsterDef: document.getElementById('monster-def'),
		monsterSpd: document.getElementById('monster-spd'),
		monsterHealthBar: document.getElementById('monster-health-bar'),
		monsterActionBar: document.getElementById('monster-action-bar'),
		combatLog: document.getElementById('combat-log'),
		playerCard: document.getElementById('player'),
		monsterCard: document.getElementById('monster'),
		combatScreen: document.getElementById('combat-screen'),
		meditationContainer: document.querySelector('.meditation-container'),
		assignablePoints: document.getElementById('assignable-points'),
		strengthValue: document.getElementById('strength-value'),
		agilityValue: document.getElementById('agility-value'),
		constitutionValue: document.getElementById('constitution-value'),
		intelligenceValue: document.getElementById('intelligence-value'),
		addPointBtns: document.querySelectorAll('.add-point-btn'),
		removePointBtns: document.querySelectorAll('.remove-point-btn'),
		maxPointBtns: document.querySelectorAll('.max-point-btn'),
		resetAttributesBtn: document.getElementById('reset-attributes-btn'),
		customAlertOverlay: document.getElementById('custom-alert-overlay'),
		customAlertMessage: document.getElementById('custom-alert-message'),
		customAlertClose: document.getElementById('custom-alert-close'),
		petName: document.getElementById('pet-name'),
		petImg: document.querySelector('.pet-img'),
		monsterSelectEl: document.getElementById('monster-select'),
		clearSaveBtn: document.getElementById('clear-save-btn'),
		startPauseButton: document.getElementById('start-pause-button'),
		restartButton: document.getElementById('restart-button'),
		editPetName: document.getElementById('edit-pet-name'),
        // --- 農場 & 視圖切換 ---
        combatViewWrapper: document.getElementById('combat-view-wrapper'),
        farmScreen: document.getElementById('farm-screen'),
        switchCombatBtn: document.getElementById('switch-combat-btn'),
        switchFarmBtn: document.getElementById('switch-farm-btn'),
        farmPlot: document.getElementById('farm-plot'),
        // --- 音樂 ---
        musicSelect: document.getElementById('music-select')
	};

    function populateMonsterSelector(database, selectElement) {
        database.forEach((monster, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = monster.name;
            selectElement.appendChild(option);
        });
    }

    // --- 新增：填充音樂選擇器 ---
    function populateMusicSelector(tracks, selectElement) {
        tracks.forEach((track, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = track.name;
            selectElement.appendChild(option);
        });
    }

    function translateWeatherCode(code) {
        const weatherMap = {
            0: "晴天 ☀️", 1: "晴時多雲 🌤️", 2: "多雲 🌥️", 3: "陰天 ☁️",
            45: "霧 🌫️", 48: "霧 🌫️", 51: "毛毛雨 💧", 53: "毛毛雨 💧",
            55: "毛毛雨 💧", 61: "雨天 🌧️", 63: "大雨 🌧️", 65: "豪雨 🌧️",
            80: "陣雨 🌦️", 81: "陣雨 🌦️", 82: "強陣雨 🌦️", 95: "雷雨 ⛈️",
            96: "雷雨 ⛈️", 99: "雷雨 ⛈️",
        };
        return weatherMap[code] || "未知天氣";
    }

    function updateWeatherUI(location, condition, temp, humidity) {
        UIElements.weatherLocation.textContent = location;
        UIElements.weatherCondition.textContent = condition;
        UIElements.weatherTemp.textContent = temp;
        UIElements.weatherHumidity.textContent = humidity;
    }

    function updateCultivationUI(levelData, experience, isAwaiting, weatherCode) {
        const { displayName, color, stageName, expRequired, isTribulationLevel, tribulationSuccessRate } = levelData;
        
        UIElements.cultivationLevelName.textContent = displayName;
        UIElements.cultivationLevelName.style.color = color;
        
        UIElements.cultivationLevelName.classList.remove('late-stage-glow', 'perfection-glow');
        if (stageName === "後期") UIElements.cultivationLevelName.classList.add('late-stage-glow');
        else if (stageName === "大圓滿") UIElements.cultivationLevelName.classList.add('perfection-glow');
        
        UIElements.playerExp.textContent = Math.round(experience);
        UIElements.expRequired.textContent = isFinite(expRequired) ? expRequired : '---';
        
        const progress = isFinite(expRequired) ? (experience / expRequired) * 100 : 100;
        UIElements.expProgressBar.style.width = `${Math.min(100, progress)}%`;

        if (isTribulationLevel) {
            const baseRate = tribulationSuccessRate * 100;
            let bonusRate = 0;
            if (weatherCode !== null) {
                bonusRate = weatherCode * window.GameSettings.TRIBULATION_SETTINGS.weather_code_multiplier;
            }
            if (bonusRate > 0.04) {
                UIElements.tribulationRate.innerHTML = `${baseRate.toFixed(0)}<span style="color: #4caf50; font-weight: bold;"> + ${bonusRate.toFixed(1)}</span>`;
            } else {
                UIElements.tribulationRate.textContent = `${baseRate.toFixed(0)}`;
            }
        } else {
            UIElements.tribulationRate.textContent = '--';
        }

        if (isAwaiting) {
            UIElements.breakthroughButton.disabled = false;
            UIElements.breakthroughButton.textContent = "渡劫";
            UIElements.breakthroughButton.classList.add('ready');
        } else {
            UIElements.breakthroughButton.disabled = true;
            UIElements.breakthroughButton.textContent = "修練中...";
            UIElements.breakthroughButton.classList.remove('ready');
        }
    }

    function updateCharacterStatsUI(playerStats, monsterStats, monsterLevel) {
        UIElements.playerAtk.textContent = playerStats.atk.toFixed(1);
        UIElements.playerDef.textContent = playerStats.def.toFixed(1);
        UIElements.playerSpd.textContent = playerStats.spd.toFixed(1);
        UIElements.playerHpText.textContent = `${Math.round(playerStats.hp)} / ${playerStats.maxHp}`;
        UIElements.playerHealthBar.style.width = `${(playerStats.hp / playerStats.maxHp) * 100}%`;
        UIElements.playerActionBar.style.width = `${(playerStats.actionProgress / 1000) * 100}%`;
        
        if (monsterStats.name) {
            UIElements.monsterName.textContent = `${monsterStats.name} Lv.${monsterLevel}`;
            UIElements.monsterAtk.textContent = monsterStats.atk;
            UIElements.monsterDef.textContent = monsterStats.def;
            UIElements.monsterSpd.textContent = monsterStats.spd;
            UIElements.monsterHpText.textContent = `${monsterStats.hp} / ${monsterStats.maxHp}`;
            UIElements.monsterHealthBar.style.width = `${(monsterStats.hp / monsterStats.maxHp) * 100}%`;
            UIElements.monsterActionBar.style.width = `${(monsterStats.actionProgress / 1000) * 100}%`;
        }
    }

    function updateAttributesUI(attributes, initialAttributes) {
        UIElements.assignablePoints.textContent = attributes.assignablePoints;
        UIElements.strengthValue.textContent = attributes.strength;
        UIElements.agilityValue.textContent = attributes.agility;
        UIElements.constitutionValue.textContent = attributes.constitution;
        UIElements.intelligenceValue.textContent = attributes.intelligence;

        const hasPoints = attributes.assignablePoints > 0;
        UIElements.addPointBtns.forEach(btn => btn.disabled = !hasPoints);
        UIElements.maxPointBtns.forEach(btn => btn.disabled = !hasPoints);

        UIElements.removePointBtns.forEach(btn => {
            const stat = btn.dataset.stat;
            btn.disabled = attributes[stat] <= initialAttributes[stat];
        });

        let spentPoints = (attributes.strength - initialAttributes.strength) +
                          (attributes.agility - initialAttributes.agility) +
                          (attributes.constitution - initialAttributes.constitution) +
                          (attributes.intelligence - initialAttributes.intelligence);
        UIElements.resetAttributesBtn.style.display = spentPoints > 0 ? 'inline-block' : 'none';
    }

    function updateRevolvingOrbs(levelIndex) {
        const currentLevelData = window.GameSettings.CULTIVATION_DATA[levelIndex];
        const realmIndex = currentLevelData.realmIndex;
        const numberOfOrbs = realmIndex + 1;
        const animationDuration = 10; 

        UIElements.meditationContainer.querySelectorAll('.revolving-orb').forEach(orb => orb.remove());

        for (let i = 0; i < numberOfOrbs; i++) {
            const orb = document.createElement('div');
            orb.className = 'revolving-orb';
            const delay = -(animationDuration / numberOfOrbs) * i;
            orb.style.animationDelay = `${delay}s`;
            const orbColor = window.GameSettings.REALM_DEFINITIONS[i].color;
            orb.style.backgroundColor = orbColor;
            orb.style.boxShadow = `0 0 10px ${orbColor}, 0 0 20px ${orbColor}, 0 0 30px #fff`;
            UIElements.meditationContainer.appendChild(orb);
        }
    }

    function updateExpRateUI(expDetails) {
        // 更新主顯示為總修煉速度
        UIElements.expRate.textContent = expDetails.totalRate.toFixed(2);
    
        // 建立 tooltip 的 HTML 內容
        let tooltipHTML = '';
        tooltipHTML += `<p>基礎修煉: ${expDetails.baseGain.toFixed(2)}</p>`;
    
        // 根據加成值是否大於 0 來決定顯示顏色
        const createBonusLine = (label, value) => {
            if (value > 0) {
                return `<p>${label}: <span class="bonus-value">+${value.toFixed(2)}</span></p>`;
            }
            return ''; // 為了整潔，如果加成為0則不顯示
        };
    
        tooltipHTML += createBonusLine('溫度加成', expDetails.tempBonus);
        tooltipHTML += createBonusLine('濕度加成', expDetails.humidBonus);
        tooltipHTML += createBonusLine('靈獸加成', expDetails.chickenBonus); 
        tooltipHTML += createBonusLine('智力加成', expDetails.intBonus);
    
        // 更新 tooltip
        UIElements.expRateTooltip.innerHTML = tooltipHTML;
    }

    function showDamageIndicator(targetCard, damage) {
        const indicator = document.createElement('div');
        indicator.textContent = `-${damage}`;
        indicator.className = 'damage-indicator';
        UIElements.combatScreen.appendChild(indicator);
        const xOffset = (Math.random() - 0.5) * 40;
        indicator.style.left = `${targetCard.offsetLeft + targetCard.offsetWidth / 2 - indicator.offsetWidth / 2 + xOffset}px`;
        indicator.style.top = `${targetCard.offsetTop}px`;
        setTimeout(() => indicator.remove(), 900);
    }

    function showExperienceGainIndicator(amount, options = {}) {
        const { isPet = false, targetElement = null } = options;
        const indicator = document.createElement('div');
        indicator.textContent = `+${amount}`;
        indicator.className = 'exp-indicator';
    
        let container = UIElements.meditationContainer;
        if (targetElement && targetElement.closest('#farm-plot')) {
            container = UIElements.farmScreen;
        } else if (targetElement) {
            container = targetElement.parentElement;
        }
    
        container.appendChild(indicator);
        
        if (targetElement && targetElement.closest('#farm-plot')) {
            const newLeft = UIElements.farmPlot.offsetLeft + targetElement.offsetLeft + targetElement.offsetWidth / 2;
            const newTop = UIElements.farmPlot.offsetTop + targetElement.offsetTop;
            indicator.style.left = `${newLeft}px`;
            indicator.style.top = `${newTop}px`;
            indicator.style.transform = 'translateX(-50%)';
        } else if (targetElement) {
            indicator.style.left = `${targetElement.offsetLeft + targetElement.offsetWidth / 2}px`;
            indicator.style.top = `${targetElement.offsetTop}px`;
            indicator.style.transform = 'translateX(-50%)';
        } else if (isPet) {
            indicator.style.left = '85%'; 
            indicator.style.top = '65%';
            indicator.style.transform = 'translateX(-50%)';
            indicator.style.fontSize = '18px';
        } else {
            const xOffset = (Math.random() - 0.5) * 40;
            indicator.style.left = `calc(50% + ${xOffset}px)`;
            indicator.style.top = '20%';
            indicator.style.transform = 'translateX(-50%)';
        }

        setTimeout(() => indicator.remove(), 900);
    }

    function showFloatingText(text, targetElement) {
        const indicator = document.createElement('div');
        indicator.textContent = text;
        indicator.className = 'floating-text-indicator';
        
        const container = UIElements.farmScreen;
        container.appendChild(indicator);

        const newLeft = UIElements.farmPlot.offsetLeft + targetElement.offsetLeft + targetElement.offsetWidth / 2;
        const newTop = UIElements.farmPlot.offsetTop + targetElement.offsetTop;

        indicator.style.left = `${newLeft}px`;
        indicator.style.top = `${newTop}px`;
        indicator.style.transform = 'translateX(-50%)';

        setTimeout(() => indicator.remove(), 1400);
    }

    function playAttackAnimation(targetCard, type) {
        const effect = document.createElement('div');
        effect.className = type === 'slash' ? 'slash-effect' : 'impact-effect';
        UIElements.combatScreen.appendChild(effect);
        effect.style.left = `${targetCard.offsetLeft + targetCard.offsetWidth / 2 - effect.offsetWidth / 2}px`;
        effect.style.top = `${targetCard.offsetTop + targetCard.offsetHeight / 2 - effect.offsetHeight / 2}px`;
        setTimeout(() => effect.remove(), 350);
    }

    function playTribulationAnimation(isSuccess) {
        const effect = document.createElement('div');
        if (isSuccess) {
            effect.className = 'ascension-effect';
            UIElements.meditationContainer.appendChild(effect);
            setTimeout(() => effect.remove(), 1200);
        } else {
            effect.className = 'lightning-effect';
            const flashOverlay = document.createElement('div');
            flashOverlay.style.position = 'fixed';
            flashOverlay.style.top = '0';
            flashOverlay.style.left = '0';
            flashOverlay.style.width = '100vw';
            flashOverlay.style.height = '100vh';
            flashOverlay.style.zIndex = '999';
            flashOverlay.style.pointerEvents = 'none';
            flashOverlay.className = 'screen-flash-red';
            document.body.appendChild(flashOverlay);
            UIElements.meditationContainer.appendChild(effect);
            setTimeout(() => effect.remove(), 500);
            setTimeout(() => flashOverlay.remove(), 500);
        }
    }

    function logMessage(message, color = '#e0e0e0') {
        if (UIElements.combatLog.children.length > 100) {
            UIElements.combatLog.removeChild(UIElements.combatLog.lastChild);
        }
        const p = document.createElement('p');
        p.textContent = message;
        p.style.color = color;
        UIElements.combatLog.prepend(p);
    }

    function showCustomAlert(message) {
        UIElements.customAlertMessage.textContent = message;
        UIElements.customAlertOverlay.style.display = 'flex';
    }

    function hideCustomAlert() {
        UIElements.customAlertOverlay.style.display = 'none';
    }
    
    function switchGameView(view) {
        const isCombat = view === 'combat';
        UIElements.combatViewWrapper.style.display = isCombat ? 'flex' : 'none';
        UIElements.farmScreen.style.display = isCombat ? 'none' : 'flex';
        UIElements.switchCombatBtn.classList.toggle('active', isCombat);
        UIElements.switchFarmBtn.classList.toggle('active', !isCombat);
    }

    function syncFarmAnimals(farmAnimalsData) {
        const plot = UIElements.farmPlot;
        // 清空現有動物
        plot.innerHTML = '';
    
        farmAnimalsData.forEach((animalData, index) => {
            if (!animalData) return; // 跳過已移除的動物
            const animal = document.createElement('img');
            animal.className = 'farm-animal';
            animal.dataset.id = index; // 設定 ID 以便點擊時識別
    
            // 設定外觀和位置
            updateAnimalState(animal, animalData); 
    
            plot.appendChild(animal);
        });
    }

    function updateAnimalState(animalElement, animalData) {
        const { FARM_SETTINGS } = window.GameSettings;
        if (animalData.isDead) {
            animalElement.src = FARM_SETTINGS.chicken_dead_image;
            animalElement.alt = '骷髏';
            animalElement.classList.add('dead');
        } else {
            animalElement.src = FARM_SETTINGS.chicken_normal_image;
            animalElement.alt = '小雞';
            animalElement.classList.remove('dead');
        }
        // 設定位置
        animalElement.style.left = animalData.x;
        animalElement.style.top = animalData.y;
    }

    function showAnimalClickFeedback(animalElement) {
        const { FARM_SETTINGS } = window.GameSettings;
        animalElement.src = FARM_SETTINGS.chicken_clicked_image;
        setTimeout(() => {
            // 檢查動物是否在延遲期間死亡
            if (!animalElement.classList.contains('dead')) {
                animalElement.src = FARM_SETTINGS.chicken_normal_image;
            }
        }, 200);
    }

    window.UIManager = {
        UIElements,
        populateMonsterSelector,
        populateMusicSelector, // 匯出新函式
        translateWeatherCode,
        updateWeatherUI,
        updateCultivationUI,
        updateCharacterStatsUI,
        updateAttributesUI,
        updateRevolvingOrbs,
        updateExpRateUI,
        showDamageIndicator,
        showExperienceGainIndicator,
        showFloatingText, 
        playAttackAnimation,
        playTribulationAnimation,
        logMessage,
        showCustomAlert,
        hideCustomAlert,
        switchGameView,
        syncFarmAnimals,
        updateAnimalState,
        showAnimalClickFeedback
    };

})(window);

