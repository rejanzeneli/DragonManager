"use strict";

/**
 * Created by sandberg on 20/09/2017.
 */

const fs = require('fs');
const path = require('path');
const csvjson = require('csvjson');
const TimeSpan = require('timespan');
const numeral = require('numeral');
const currencies = require('./currencies');
const flavors = require('./flavors');
const tiers = require('./tiers');
const scaling = require('./scaling');

let buildingData = {};
let buildingLevels = {};
let rssRequirements = [];
let levelRequirement = {};
let denRequirement = {};
let castleRequirement = {};
let incubatorRequirement = {};
let builderRequirement = {};
let rssRateRequirement = {};


const options = {
  delimiter: ',', // optional
  quote: '"' // optional
};


function init() {
  let buildings = {};

  const data = fs.readFileSync(path.join(__dirname, '../datafiles/Building.csv'), {encoding: 'utf8'});
  let towerinfo = csvjson.toObject(data, options);
  // remove first column, contains the column type
  towerinfo.shift();

  towerinfo.forEach((tower) => {
    buildings[tower.identifier] = tower;
  });
  deleteUnusedTowers(buildings);

  for (let building in buildings) {
    if (buildings.hasOwnProperty(building)) {
      building = buildings[building];

      let name = building.upgradeCSVFileName;
      const data = fs.readFileSync(path.join(__dirname, `../datafiles/${name}`), {encoding: 'utf8'});
      const buildingUpgrade = csvjson.toObject(data, options);

      // remove first column, contains the column type
      buildingUpgrade.shift();

      // fetch requirement data
      fetchRequirementData(building, buildingUpgrade);
    }
  }

  for (let building in buildings) {
    if (buildings.hasOwnProperty(building)) {
      building = buildings[building];

      deleteUnusedBuildingInfo(building);
      findMinimumLevel(building);

      let description = flavors.getFlavor(building.displayDescriptionIdentifier);
      description.unshift(`MaxLevel: ${building.defaultMaxLevel}`);
      description.unshift(`Player level required to build: ${building.minimumPlayerLevel}`);
      building.description = description;

      let name = building.upgradeCSVFileName;
      const data = fs.readFileSync(path.join(__dirname, `../datafiles/${name}`), {encoding: 'utf8'});
      const buildingUpgrade = csvjson.toObject(data, options);

      // remove first column, contains the column type
      buildingUpgrade.shift();

      // remove unused stuff for saving data
      deleteUnusedLevelInfo(buildingUpgrade);
      applyScaling(buildingUpgrade);
      formatData(buildingUpgrade, building);
      buildingLevels[building.identifier] = buildingUpgrade;
      fetchSpecialData(building, buildingUpgrade);
      buildingData[building.identifier] = building;
    }
  }
  calculateStorageLevels(buildings);
}

function findMinimumLevel(building) {
  building.minimumPlayerLevel = 1;

  if(building.hasOwnProperty('unlockAchievement')) {
    let level = building.unlockAchievement;
    if (level !== null) {
      if (level.includes('level')) {
        let levelinfo = level.split('level');
        if (levelinfo.length > 1) {
          level = Number(levelinfo[1]);
          building.minimumPlayerLevel = level;
        }
      }
    }
  }
}

function applyScaling(levels) {
  levels.forEach((level) => {
    let rssScaling = scaling.buildingRssDiscount(level.level);
    let timeScaling = scaling.buildingTimeDiscount(level.level);
    level.rssScaling = rssScaling;
    level.timeScaling = timeScaling;
  });
}

function calculateStorageLevels(buildings) {
  for (let building in buildings) {
    if (buildings.hasOwnProperty(building)) {
      building = buildings[building];

      let levels = buildingLevels[building.identifier];
      let lastLevel = 1;
      let maxLevel = 1;
      levels.forEach((level) => {
        let upgradeCost = level.upgradeCostOriginal;

        let allcosts = upgradeCost.split('|');
        let scaling = level.rssScaling;

        allcosts.forEach((currency) => {
          let cost = currency.split(':');
          currency = cost[0];
          let value = Number(cost[1]);
          if (!currency.toLowerCase().includes('egg')) {
            value = Math.ceil(value * scaling);
          }
          let level = getStorageLevel(currency, value);
          if (level > maxLevel) {
            maxLevel = level;
          }
        });
        if (building.identifier !== 'storage') {
          level.storageRequired = maxLevel;
        }
        let levelRequirement = getPlayerLevelFromStorage(maxLevel);
        levelRequirement = Math.max(levelRequirement, level.levelRequired, building.minimumPlayerLevel);
        if (building.identifier !== 'stable' && building.identifier !== 'storage') {
          if (levelRequirement < lastLevel) {
            level.levelRequired = lastLevel;
          } else {
            lastLevel = levelRequirement;
            level.levelRequired = levelRequirement;
          }
        }
        if (level.hasOwnProperty('requiredBuilderLevel') && level.hasOwnProperty('levelRequired')) {
          let builderLevel = getPlayerLevelFromBuilder(level.requiredBuilderLevel);
          let playerLevel = Number(level.levelRequired);
          level.levelRequired = Math.max(builderLevel, playerLevel);
        }
      });
    }
  }
}

function fetchRequirementData(building, levels) {
  if (building.identifier === 'builder') {
    buildBuilderRequirements(levels);
  } else if (building.identifier === 'incubator') {
    buildIncubatorRequirements(levels);
  } else if (building.identifier === 'breedingGround') {
    buildCastleRequirements(levels);
  } else if (building.identifier === 'stable') {
    buildDenRequirements(levels);
  } else if (building.identifier === 'storage') {
    buildStorageRequirements(levels);
  }
}

function fetchSpecialData(building, levels) {
  if (building.identifier === 'storage') {
    buildStorageInfo(levels);
  } else if (building.identifier.includes('perch')) {
    buildPerchInfo(levels);
  } else if (building.identifier.includes('Totem')) {
    buildTotemRequirements(levels);
  } else if (building.identifier.includes('Farm')) {
    buildFarmInfo(levels);
  }
}

function buildTotemRequirements(levels) {
  levels.forEach((level) => {
    level.levelRequired = 1;
    level.damageReductionPercentage = level.damageReductionPercentage + "%";
  });
}

function buildBuilderRequirements(levels) {
  levels.forEach((level) => {
    builderRequirement[Number(level.level)] = Number(level.levelRequired);
  });
}

function buildFarmInfo(levels) {
  levels.forEach((level) => {
    let rssCap = level.harvestAmount.split(':');
    let rssType = currencies.getCurrency(rssCap[0]);
    let rssAmount = Number(rssCap[1]);
    let rssTimeHour = Number(level.harvestTimeInSeconds) / (60*60);
    let rssHourly = Math.floor(rssAmount / rssTimeHour);
    level.rssCap = `${rssAmount} ${rssType}`;
    level.rssHourly = rssHourly;
    level.rssProtected = Math.floor(rssAmount * 0.35);
    if (!rssRateRequirement.hasOwnProperty(rssCap[0])) {
      rssRateRequirement[rssCap[0]] = {};
    }
    rssRateRequirement[rssCap[0]][level.level] = rssHourly;
  });
}

function buildPerchInfo(levels) {
  levels.forEach((level) => {
    if (level.hasOwnProperty('maxTierCanPlace')) {
      let tier = level.maxTierCanPlace;
      level.maxTierCanPlace = tiers.getTierName(tier);
      level.maxTierCanPlaceColor = '#' + tiers.getTierColor(tier);
    }
    if(level.hasOwnProperty('attackPowerModifier')) {
      let modifier = level.attackPowerModifier;
      modifier = modifier.split('|');
      modifier.forEach((type) => {
        let percentage = type.split(':')[1];
        type = type.split(':')[0];
        level[type] = percentage + '%';
      });
    }
  });
}

function buildCastleRequirements(levels) {
  levels.forEach((level) => {
    castleRequirement[Number(level.level)] = Number(level.levelRequired);
  });
}

function buildIncubatorRequirements(levels) {
  levels.forEach((level) => {
    incubatorRequirement[Number(level.level)] = Number(level.levelRequired);
  });
}

function buildDenRequirements(levels) {
  for (let level in levels) {
    if (levels.hasOwnProperty(level)) {
      level = levels[level];
      denRequirement[Number(level.level)] = Number(level.levelRequired);
    }
  }
}

function buildStorageRequirements(levels) {
  for (let level in levels) {
    if (levels.hasOwnProperty(level)) {
      level = levels[level];
      levelRequirement[Number(level.level)] = Number(level.levelRequired);
    }
  }
}

function buildStorageInfo(levels) {
  for (let level in levels) {
    if (levels.hasOwnProperty(level)) {
      level = levels[level];

      levelRequirement[Number(level.level)] = Number(level.levelRequired);

      let maxStorageData = level.maxStorageData.split('|');
      let levelinfo = {level: Number(level.level)};
      maxStorageData.forEach((type, index) => {
        type = type.split(':');
        maxStorageData[index] = {};
        maxStorageData[index].data = type;
        levelinfo[type[0]] = Number(type[1]);
      });
      level.maxStorageData = maxStorageData;
      rssRequirements.push(levelinfo);
      let maxStorageDataDisplay = [];
      maxStorageData.forEach((data) => {
        let count = data.data[1];
        let line = `${numeral(count).format('0,0')} ${currencies.getCurrency(data.data[0], count)}`;
        maxStorageDataDisplay.push(line);
      });
      level.maxStorageDataDisplay = maxStorageDataDisplay;

      let minHourlyHarvestRate = level.minHourlyHarvestRate.split('|');
      let farmLevel = 1;
      minHourlyHarvestRate.forEach((type, index) => {
        type = type.split(':');

        let display = `${type[1]} ${currencies.getCurrency(type[0], type[1])}`;

        let farm = findFarmMillLevel(Number(type[1]), type[0]);
        farmLevel = Math.max(farm, farmLevel);

        minHourlyHarvestRate[index] = {};
        minHourlyHarvestRate[index].display = display;
        minHourlyHarvestRate[index].data = type;
      });
      level.minHourlyHarvestRate = minHourlyHarvestRate;
      level.minFarmlevel = farmLevel;

      let storageProtectionData = level.storageProtectionData.split('|');
      storageProtectionData.forEach((type, index) => {
        type = type.split(':');

        let display = `${type[1]} ${currencies.getCurrency(type[0], type[1])}`;
        storageProtectionData[index] = {};
        storageProtectionData[index].display = display;
        storageProtectionData[index].data = type;
      });
      level.storageProtectionData = storageProtectionData;
      let storageProtectionDataDisplay = [];
      storageProtectionData.forEach((data) => {
        let count = data.data[1];
        let line = `${numeral(count).format('0,0')} ${currencies.getCurrency(data.data[0], count)}`;
        storageProtectionDataDisplay.push(line);
      });
      level.storageProtectionDataDisplay = storageProtectionDataDisplay;
    }
  }
}

function findFarmMillLevel(amount, type) {
  let levels = rssRateRequirement[type];
  let farmlevel = 1;

  for (let level in levels) {
    if (levels.hasOwnProperty(level)) {
      let info = levels[level];
      if (info >= amount) {
        farmlevel = Number(level);
        return farmlevel;
      }
    }
  }
  return farmlevel;
}

function formatData(levels, building) {
  let scalingApplied = isScalingApplied(building);
  levels.forEach((level) => {
    formatCost(level, scalingApplied);
    formatBuildTime(level, scalingApplied);
    formatXP(level);
    formatAttack(level);
    formatSpecialAttack(level);
    formatHP(level);
  });
}

function formatCost(level, scalingApplied) {
  let upgradeCost = [];
  let originalCost = '';
  if (level.hasOwnProperty('upgradeCost')) {
    originalCost = level.upgradeCost;
    let allcosts = level.upgradeCost.split('|');

    allcosts.forEach((currency) => {
      let cost = currency.split(':');
      currency = cost[0];
      let value = cost[1];
      currency = currencies.getCurrency(currency, value);
      if (scalingApplied) {
        let discount = level.rssScaling;
        value = Number(value) * discount;
      }
      value = numeral(value).format('0,0');
      upgradeCost.push(`${value} ${currency}`);
    });
  }
  level.upgradeCostOriginal = originalCost;
  level.upgradeCost = upgradeCost;
}

function formatBuildTime(level, scalingApplied) {
  if (level.hasOwnProperty('upgradeTimeInSeconds')) {
    let discount = 1.0;
    if (scalingApplied) {
      discount = level.timeScaling;
    }
    let standardTime = Number(level.upgradeTimeInSeconds);
    let buildTime = Math.ceil(standardTime * discount);

    if (buildTime > 0) {
      let ts = TimeSpan.fromSeconds(buildTime);

      let minutes = ts.minutes;
      let hours = ts.hours;
      let days = ts.days;

      level.upgradeTimeInDays = `${days}:${hours}:${minutes}`;
    } else {
      level.upgradeTimeInDays = `0:0:0`;
    }
  }
}

function isScalingApplied(building) {
  if (building.hasOwnProperty('buildingClass')) {
    if (building.buildingClass !== 'economy') {
      return true;
    }
  }
  return false;
}

function formatXP(level) {
  if (level.hasOwnProperty('upgradeReward')) {
    let xp = level.upgradeReward.split(':');
    let value = xp[1];
    value = numeral(value).format('0,0');
    level.upgradeReward = `${value}`;
  }
}

function formatHP(level) {
  if (level.hasOwnProperty('HP')) {
    level.HP = numeral(level.HP).format('0,0');
  }
}

function formatAttack(level) {
  if (level.hasOwnProperty('attackPower') && level.hasOwnProperty('attacksPerSecond')) {
    let attackMultiplier = 1;
    if (level.hasOwnProperty('shotsPerAttack')) {
      attackMultiplier = Number(level.shotsPerAttack);
    }
    let attackPower = Number(level.attackPower);
    let attacksPerSecond = Number(level.attacksPerSecond);
    let attackValue = attackPower * attackMultiplier * attacksPerSecond;
    level.attackValue = Math.ceil(attackValue);
  }
}

function formatSpecialAttack(level) {
  if (level.hasOwnProperty('specialAttackPower')) {
    if (level.hasOwnProperty('shotsPerActiveProjectile')) {
      let attackPower = Number(level.specialAttackPower);
      let attacksPerProjectile = Number(level.shotsPerActiveProjectile);
      let attackValue = attackPower * attacksPerProjectile;
      level.specialAttackValue = Math.ceil(attackValue);
    } else {
      level.specialAttackValue = Number(level.specialAttackPower);
    }
  }
}

function deleteUnusedTowers(towers) {
  for (let building in towers) {
    if (towers.hasOwnProperty(building)) {
      let towerinfo = towers[building];
      if (towerinfo.canUpgrade === '0') {
        delete towers[building];
        continue;
      }
      if (towerinfo.baseDestroyedMultiplier === '0') {
        delete towers[building];
        continue;
      }
      if (towerinfo.identifier.includes('Tutorial')) {
        delete towers[building];
        continue;
      }
      if (towerinfo.identifier.includes('boat')) {
        delete towers[building];
        continue;
      }
      if (towerinfo.identifier.includes('decoy')) {
        delete towers[building];
        continue;
      }
      if (towerinfo.identifier.includes('wm')) {
        delete towers[building];
        continue;
      }
      if (towerinfo.identifier.includes('poacher')) {
        delete towers[building];
        continue;
      }
    }
  }
}

function deleteUnusedBuildingInfo(building) {
  delete building.achievementsMaxAmountIncrease;
  delete building.attackSoundEvent;
  delete building.attackStartVal;
  delete building.attackType;
  delete building.attackTypeSprite;
  delete building.augmentTypeIdentifiers;
  delete building.baseDestroyedMultiplier;
  delete building.battleBuildingGroup;
  delete building.battleBuildingRewardDistributionIdentifier;
  delete building.buildingAttribute;
  delete building.buildingCategory;
  delete building.buildingType;
  delete building.canMove;
  delete building.canUpgrade;
  delete building.customButtonText;
  delete building.canBuy;
  delete building.canDelete;
  delete building.compatibleReskins;
  delete building.dontShowHPBar;
  delete building.dragonsStrongAgainst;
  delete building.enableSupershotLayerForInfoView;
  delete building.explosionSoundEvent;
  delete building.extraAttackRadius;
  delete building.gridHeight;
  delete building.gridWidth;
  delete building.h;
  delete building.hpStartVal;
  delete building.inBundle;
  delete building.isAttackable;
  delete building.isAugmentable;
  delete building.isAutoTargetable;
  delete building.isScaffoldingHidden;
  delete building.lockedIconFileName;
  delete building.maxToNextIdle;
  delete building.maxTowersPerIsland;
  delete building.meaningfulDestroy;
  delete building.minToNextIdle;
  delete building.numIdleLoops;
  delete building.overlayAnimationScene;
  delete building.projectileHeightOffset;
  delete building.rangeStartVal;
  delete building.researchMaxLevelIncrease;
  delete building.researchRequirements;
  delete building.shouldFaceDragon;
  delete building.shouldLimitPerIsland;
  delete building.tacticalTypeSprite;
  delete building.targetPriority;
  delete building.vfxsOnDragon;
  delete building.videoTutorial;
  delete building.viewControllerClassName;
}

function deleteUnusedLevelInfo(levels) {

  for (let level in levels) {
    if (levels.hasOwnProperty(level)) {
      level = levels[level];

      delete level.achievementRequirements;
      delete level.activeAbilityBusyDuration;
      delete level.activeAbilityCost;
      delete level.activeAbilityDelay;
      delete level.activeAbilityEffects;
      delete level.activeAbilityProjectile;
      delete level.activeAbilityRange;
      delete level.attackDuration;
      delete level.attackEffects;
      delete level.attackRange;
      delete level.augmentInfoIdentifiers;
      delete level.augmentReward;
      delete level.augmentTimeInSeconds;
      delete level.augmentTotalToUpgrade;
      delete level.bonusLabel1;
      delete level.bonusLabel2;
      delete level.component;
      delete level.constructionSceneFile;
      delete level.customUpgradeSceneFile;
      delete level.destructionProbabilities;
      delete level.explosionSceneFile;
      delete level.finalDescructionDamage;
      delete level.h;
      delete level.heightAttackBonusPercentage;
      delete level.heightAttackBonusProjectileIdentifier;
      delete level.identifier;
      delete level.inBundle;
      delete level.lobOverlaySceneFilename;
      delete level.projectileHitNodeName;
      delete level.projectileIdentifier;
      delete level.sceneFile;
      delete level.showcaseNodeLocation;
    }
  }
}

function listBuildings() {
  return buildingData;
}

function getStorageLevel(rssType, rssAmount) {
  let levelRequirement = 0;

  rssAmount = Number(rssAmount);
  for (let level in rssRequirements) {
    if (rssRequirements.hasOwnProperty(level)) {
      level = rssRequirements[level];
      if (level.hasOwnProperty(rssType)) {
        if (rssAmount < level[rssType]) {
          levelRequirement = level.level;
          break;
        }
      }
    }
  }
  return levelRequirement;
}

function getPlayerLevelFromStorage(storageLevel) {
  let requiredLevel = 0;

  if (levelRequirement.hasOwnProperty(storageLevel)) {
    requiredLevel = levelRequirement[storageLevel];
  }
  if (requiredLevel === 0) {
    requiredLevel = 1;
  }
  return requiredLevel;
}

function getPlayerLevelFromDen(denLevel) {
  let requiredLevel = 0;

  if (denRequirement.hasOwnProperty(denLevel)) {
    requiredLevel = denRequirement[denLevel];
  }
  if (requiredLevel === 0) {
    requiredLevel = 1;
  }
  return requiredLevel;
}

function findBuilding(id) {
  let response = {building: null, levels: null};
  if (buildingData.hasOwnProperty(id)) {
    response.building = buildingData[id];
    response.levels = buildingLevels[id];
  }
  return response;
}

function getIncubatorLevel(level) {
  let playerlevel = 999;
  if (incubatorRequirement.hasOwnProperty(level)) {
    playerlevel = incubatorRequirement[level];
  }
  return playerlevel;
}

function getCastleLevel(level) {
  let playerlevel = 999;
  if (castleRequirement.hasOwnProperty(level)) {
    playerlevel = castleRequirement[level];
  }
  return playerlevel;
}

function getPlayerLevelFromBuilder(level) {
  let requiredLevel = 0;

  if (builderRequirement.hasOwnProperty(level)) {
    requiredLevel = builderRequirement[level];
  }
  if (requiredLevel === 0) {
    requiredLevel = 1;
  }
  return requiredLevel;
}

function getBuildingCost(tower, minLevel, maxLevel, reduction) {
  // skip from level, as we are already there.
  minLevel++;
  let cost = {rss: {}, time: ''};
  if (buildingLevels.hasOwnProperty(tower)) {
    let levels = buildingLevels[tower];
    let towerCost = {rss: {}, time: 0};
    cost = levels.reduce((accumulated, current) => {
      let level = Number(current.level);
      if (level >= minLevel && level <= maxLevel) {
        if (current.hasOwnProperty('upgradeTimeInSeconds')) {
          let scaling = current.timeScaling;
          accumulated.time += Number(current.upgradeTimeInSeconds) * scaling - (Number(current.upgradeTimeInSeconds) * reduction);
        }
        if (current.hasOwnProperty('upgradeCostOriginal')) {
          let currentCost = current['upgradeCostOriginal'].split(':');
          let value = Math.ceil(Number(currentCost[1]) * current.rssScaling);
          let type = currentCost[0];
          if (accumulated.rss.hasOwnProperty(type)) {
            accumulated.rss[type] = accumulated.rss[type] + Number(value);
          } else {
            accumulated.rss[type] = Number(value);
          }
        }
      }
      return accumulated;
    }, towerCost);
  } else {
    console.error('Unknown tower: ', tower);
  }
  cost.time = formatTotalTime(cost.time);
  cost.rss = formatTotalRss(cost.rss);
  return cost;
}

function formatTotalRss(rss) {
  let rssInfo = [];
  for (let rssType in rss) {
    if (!rssType.includes('egg')) {
      if(rss.hasOwnProperty(rssType)) {
        let rssValue = numeral(rss[rssType]).format('0,0');
        rssType = currencies.getCurrency(rssType);
        let rssString = `${rssValue} ${rssType}`;
        rssInfo.push(rssString);
      }
    }
  }
  return rssInfo;
}

function formatTotalTime(time) {
  let buildTime;

  if (time > 0) {
    let ts = TimeSpan.fromSeconds(time);

    let minutes = ts.minutes;
    let hours = ts.hours;
    let days = ts.days;

    buildTime = `${days}d:${hours}h:${minutes}m`;
  } else {
    buildTime = `0d:0h:0m`;
  }
  return buildTime;
}

module.exports = {
  init: init,
  listBuildings: listBuildings,
  findBuilding: findBuilding,
  getPlayerLevelFromDen: getPlayerLevelFromDen,
  getStorageLevel: getStorageLevel,
  getIncubatorLevel: getIncubatorLevel,
  getCastleLevel: getCastleLevel,
  getPlayerLevelFromStorage: getPlayerLevelFromStorage,
  getBuildingCost: getBuildingCost
};
