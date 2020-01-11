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
const building = require('./building');
const spells = require('./spells');
const achievements = require('./achievements');
const tiers = require('./tiers');
const dragonClasses = require('./dragonClasses');
const scaling = require('./scaling');

let dragonTiers = [];
let dragonDataDisplay = {};
let dragonDataDisplayNoSeason = {};
let dragonDataLevels = {};
let dragonNameMapping = {};
let dragonRarity = {};
let elementClasses = {};

const options = {
  delimiter: ',', // optional
  quote: '"' // optional
};

function init() {
  let dragons;

  dragonDataDisplay = {};
  dragonDataDisplayNoSeason = {};
  dragonDataLevels = {};

  const data = fs.readFileSync(path.join(__dirname, '../datafiles/Dragon.csv'), {encoding: 'utf8'});
  dragons = csvjson.toObject(data, options);
  // remove first column, contains the column type
  dragons.shift();

  // Read additional datafiles for decoding dragon data.
  readRarity();
  readElements();

  dragons.forEach((dragon) => {
    if (dragon.displayName.toLowerCase()=== 'placeholder') {
      return;
    }
    // Ignore summon dragons.
    if (dragon.canPlaceIntoPerch === '0' && dragon.defaultTierNumber !== "15" && dragon.isEvolveDragon !== "1") {
      return;
    }
    let name = dragon.upgradeCSVFileName;
    try {
      const data = fs.readFileSync(path.join(__dirname, `../datafiles/${name}`), {encoding: 'utf8'});
      const dragonUpgrade = csvjson.toObject(data, options);

      // remove first column, contains the column type
      dragonUpgrade.shift();

      dragonDataLevels[dragon.identifier] = dragonUpgrade;

      // remove unused stuff for saving data
      let displayDragon = Object.assign({}, dragon);
      dragonNameMapping[dragon.identifier] = {name: dragon.displayName};
      deleteUnused(displayDragon);

      // decode dragon fields
      addDiscounts(displayDragon, dragonUpgrade);
      mapClass(displayDragon);
      mapRarity(displayDragon);
      mapElement(displayDragon);
      mapTier(displayDragon);
      mapIncubationTime(displayDragon);
      mapFoodCost(dragonUpgrade);
      mapXpSums(dragonUpgrade);
      mapLevel(displayDragon, dragonUpgrade);
      mapHP(dragonUpgrade);
      mapPL(dragonUpgrade);
      mapRequirements(dragonUpgrade);
      mapDamage(dragonUpgrade, displayDragon.dragonClass);

      // get spelllevels
      displayDragon.spellLevels = spells.spellLevels(dragonUpgrade);
      // Store in an object for easier reference later, but with the displayname and ID
      dragonDataDisplay[dragon.displayName] = displayDragon;
    } catch (e) {
      console.log(`Missing upgradefile: ${name}`);
    }
  });
  // build data excluding season dragons, for breeding feature
  buildBreedData();
  buildTierTree();
}

function buildBreedData() {
  dragonDataDisplayNoSeason = Object.assign({}, dragonDataDisplay);
  let seasonDragons = [];
  // remove season dragons
  Object.keys(dragonDataDisplayNoSeason).forEach(function(key) {
    let dragon = dragonDataDisplayNoSeason[key];
    if (dragon.isEvolveDragon === "1" || dragon.isUnbreedableDragon === "1" || dragon.isShrineDragon === "1") {
      seasonDragons.push(key);
    }
  });
  seasonDragons.forEach((dragon => {
    delete dragonDataDisplayNoSeason[dragon];
  }));
}

function buildTierTree() {
  let seasonTier = tiers.getSeasonTier();

  for (let tier = 0 ; tier <= seasonTier ; tier++) {
    dragonTiers[tier] = [];
  }

  for (let dragon in dragonDataDisplay) {
    if (dragonDataDisplay.hasOwnProperty(dragon)) {
      dragon = dragonDataDisplay[dragon];

      let tiernumber = Number(dragon.defaultTierNumber);
      if (dragon.isEvolveDragon === "1") {
        tiernumber = seasonTier;
        dragon.seasonName = tiers.getTierName(tiernumber);
      }
      dragonTiers[tiernumber].push(dragon);
    }
  }
  // Reverse to get new tiers on top.
  dragonTiers.reverse();
  dragonTiers.forEach((tier) => {
    tier.reverse();
  });
}

function readRarity() {
  const data = fs.readFileSync(path.join(__dirname, '../datafiles/DragonRarityDescription.csv'), {encoding: 'utf8'});
  let classInfo = csvjson.toObject(data, options);
  // remove first column, contains the column type
  classInfo.shift();

  classInfo.forEach((classType) => {
    if (classType.hasOwnProperty('identifier') && classType.hasOwnProperty('displayName')) {
      dragonRarity[classType.identifier] = classType;
    }
  });
}

function readElements() {
  const data = fs.readFileSync(path.join(__dirname, '../datafiles/Element.csv'), {encoding: 'utf8'});
  let elementInfo = csvjson.toObject(data, options);
  // remove first column, contains the column type
  elementInfo.shift();

  elementInfo.forEach((elementType) => {
    if (elementType.hasOwnProperty('identifier') && elementType.hasOwnProperty('displayName')) {
      elementClasses[elementType.identifier] = elementType;
    }
  });
}

function deleteUnused(dragon) {
  delete dragon.inBundle;
  delete dragon.defaultSceneFile;
  delete dragon.stableHint;
  delete dragon.defaultDiscoveredImage;
  delete dragon.undiscoveredImage;
  delete dragon.defaultIconFilename;
  delete dragon.iconFilenameLocked;
  delete dragon.upgradeCSVFileName;
  delete dragon.fidgets;
  delete dragon.minRange;
  delete dragon.unlockAchievement;
  delete dragon.attackStartVal;
  delete dragon.sellBasePrice;
  delete dragon.unavailableSpellTypes;
  delete dragon.showcaseNodeLocation;
  delete dragon.isAttainable;
  delete dragon.sortPriority;
  delete dragon.incubationAchievementRequirement;
  delete dragon.researchMaxLevelIncrease;
  delete dragon.eggDisplaySceneFile;
  delete dragon.defaultAttackBoostRange;
  delete dragon.defaultHPBoostRange;
  delete dragon.canSell;
  delete dragon.canUpgrade;
  delete dragon.canBeSummoned;
  delete dragon.deathPenaltyPercentage;
  delete dragon.showInStable;
  delete dragon.limitedTimeOfferDragonActiveEvent;
  delete dragon.limitedTimeOfferDragonParentsInfoFile;
  delete dragon.canPlaceIntoPerch;
  delete dragon.h;
}

function addDiscounts(dragon, levels) {
  let defaultTier = 0;
  if (dragon.hasOwnProperty('defaultTierNumber')) {
    defaultTier = Number(dragon.defaultTierNumber);
  }
  // Scale incubation time
  if (dragon.hasOwnProperty('incubatingTime')) {
    dragon.scaleIncubating = scaling.dragonIncubationDiscount(defaultTier);
  }

  // scale xp/training cost pr level
  levels.forEach((level) => {
    let scaleTraining = 1.0;
    let scaleXp = 1.0;
    if (level.hasOwnProperty('tierNumber')) {
      let tier = Number(level.tierNumber);
      scaleTraining = scaling.dragonTrainingDiscount(tier);
      scaleXp = scaling.dragonXpDiscount(tier);
    } else {
      scaleTraining = scaling.dragonTrainingDiscount(defaultTier);
      scaleXp = scaling.dragonXpDiscount(defaultTier);
    }
    level.scaleTraining = scaleTraining;
    level.scaleXp = scaleXp;
  });
}

function mapClass(dragon) {
  let dragonClass = dragon.dragonClass;
  dragon.dragonClass = dragonClasses.getClass(dragonClass);
}

function mapRarity(dragon) {
  let rarity = dragon.defaultRarity;

  if (dragonRarity.hasOwnProperty(rarity)) {
    dragon.defaultRarity = dragonRarity[rarity].displayName;
  }
}

function mapElement(dragon) {
  let elementIdentifier = dragon.elementIdentifier;

  if (elementClasses.hasOwnProperty(elementIdentifier)) {
    dragon.elementIdentifier = elementClasses[elementIdentifier].displayName;
    dragon.elementIcon = elementClasses[elementIdentifier].icon;
  }
}

function mapTier(dragon) {
  let defaultTierNumber = Number(dragon.defaultTierNumber);

  let tiername = tiers.getTierName(defaultTierNumber);
  let tiercolor = tiers.getTierColor(defaultTierNumber);

  dragon.tierName = tiername;
  dragon.tierColor = tiercolor;

  dragonNameMapping[dragon.identifier].tierName = tiername;
  dragonNameMapping[dragon.identifier].tierColor = tiercolor;
  dragonNameMapping[dragon.identifier].tierNumber = defaultTierNumber;
}

function mapIncubationTime(dragon) {
  if (dragon.hasOwnProperty('incubatingTime')) {
    let scaling = 1.0;
    if (dragon.hasOwnProperty('scaleIncubating')) {
      scaling = dragon.scaleIncubating;
    }
    const incubationTime = Number(dragon.incubatingTime) * scaling;
    if (incubationTime > 0) {
      let ts = TimeSpan.fromSeconds(incubationTime);

      let minutes = ts.minutes;
      let hours = ts.hours;
      let days = ts.days;

      dragon.incubatingTime = `${days}d${hours}h${minutes}m`;
    } else {
      dragon.incubatingTime = `0d0h0m`;
    }
  }
}

function mapFoodCost(levels) {
  let lastStorageRequired = 1;
  let lastLevelRequired = 1;
  levels.forEach((level) => {
    formatFoodCost(level, 'upgradeCost', true);
    if (level.levelRequired < lastLevelRequired) {
      level.levelRequired = lastLevelRequired;
    } else {
      lastLevelRequired = level.levelRequired
    }

    if (level.storageRequired < lastStorageRequired) {
      level.storageRequired = lastStorageRequired;
    } else {
      lastStorageRequired = level.storageRequired
    }
  });
}

function mapHP(levels) {
  levels.forEach((level) => {
    level.HP = numeral(level.HP).format('0,0');
  });
}

function mapPL(levels) {
  levels.forEach((level) => {
    level.powerLevel = numeral(level.powerLevel).format('0,0');
  });
}

function mapLevel(info, levels) {
  let incubatorLevel = building.getIncubatorLevel(info.incubationBuildingLevelRequirement);
  levels.forEach((level) => {
    let storageLevel = building.getPlayerLevelFromStorage(level.storageRequired);
    level.levelRequired = Math.max(incubatorLevel, level.levelRequired, storageLevel);
  });
}

function mapDamage(levels, type) {
  let scale = 0;
  scale = dragonClasses.getDamage(type);
  levels.forEach((level) => {
    let attackpower = Math.floor(Number(level.attackPower) * scale);
    level.attackPower = numeral(attackpower).format('0,0');
  });
}

function mapRequirements(levels) {
  let requirements = false;
  levels.forEach((level) => {
    if (level.hasOwnProperty('achievementRequirements')) {
      let achievement = achievements.getAchievement(level.achievementRequirements);
      if (achievement !== '') {
        requirements = true;
      } else {
        achievement = '-';
      }
      level.achievementRequirements = achievement;
    }
  });
  // delete the column if no requirements were found
  if (requirements === false) {
    levels.forEach((level) => {
      delete level.achievementRequirements;
    });
  }
}

function mapXpSums(levels) {
  let xpSum = 0;

  let lastLevelXp = 0;
  levels.forEach((level) => {
    level.upgradeXP = Number(level.upgradeXP);
    if(level.hasOwnProperty('scaleXp')) {
      level.upgradeXP = Math.ceil(level.upgradeXP * level.scaleXp);
    }
    xpSum = lastLevelXp + xpSum;
    lastLevelXp = level.upgradeXP;
    level.xpSumNumber = xpSum;
    level.upgradeXP = numeral(level.upgradeXP).format('0,0');
    level.xpSum = numeral(level.xpSumNumber).format('0,0');
  });
}

function formatFoodCost(level, field, storeLevels = false) {
  let upgradeCost = '';
  if (level.hasOwnProperty(field)) {
    let allcosts = level[field].split('|');

    let maxLevel = 1;
    let maxStorage = 1;
    allcosts.forEach((currency) => {
      let cost = currency.split(':');
      currency = cost[0];
      let value = cost[1];
      if (currency === 'food') {
        if (level.hasOwnProperty('scaleTraining')) {
          value = Math.ceil(value * level.scaleTraining);
        }
      }
      let storage = building.getStorageLevel(currency, value);
      if (storage > maxStorage) {
        maxStorage = storage;
      }
      let lvl = building.getPlayerLevelFromDen(Number(level.requiredStableLevel));
      if (lvl > maxLevel) {
        maxLevel = lvl;
      }
      currency = currencies.getCurrency(currency, value);
      // Ignore food
      if (currency === 'food') {
        currency = '';
      }
      value = numeral(value).format('0,0');
      if (upgradeCost === '') {
        upgradeCost += `${value} ${currency}`;
      } else {
        upgradeCost += `  &  ${value} ${currency}`;
      }
    });
    if (storeLevels === true) {
      level.levelRequired = maxLevel;
      level.storageRequired = maxStorage;
    }
  }
  level[field] = upgradeCost;
}

function getTier(internalName) {
  let tier = {'red': '#FF0000'};

  if (dragonNameMapping.hasOwnProperty(internalName)) {
    tier = dragonNameMapping[internalName];
  }
  return tier;
}

function getFragments(name) {
  let fragments = 1;

  if (dragonDataDisplay.hasOwnProperty(name)) {
    if (dragonDataDisplay[name].hasOwnProperty('numberOfFragmentsNeeded') && (dragonDataDisplay[name].numberOfFragmentsNeeded !== "")) {
      fragments = Number(dragonDataDisplay[name].numberOfFragmentsNeeded);
    }
  }
  return fragments;
}

function listDragons(includeSeasonDragons = true) {
  if (includeSeasonDragons) {
    return dragonDataDisplay;
  }
  return dragonDataDisplayNoSeason;
}

function findDragon(id) {
  let name = dragonNameMapping[id];
  let info = null;
  let levels = null;
  if (name.hasOwnProperty('name')) {
    info = dragonDataDisplay[name.name];
    levels = dragonDataLevels[id];
  } else {
    console.log(`UNKNOWN: ${id}`);
  }
  return {info: info, levels: levels};
}

function listTiers() {
  return dragonTiers;
}

function getDragonCost(id, minLevel, maxLevel) {
  let cost = {rss: 0, xp: '0'};
  if (minLevel === maxLevel) {
    return cost;
  }

  let name = dragonNameMapping[id];
  let levels = null;
  if (name.hasOwnProperty('name')) {
    levels = dragonDataLevels[id];
    let startXp = 0;
    let endXp = 0;
    levels.forEach((level) => {
      let currentLevel = Number(level.level);
      if (minLevel === currentLevel) {
        startXp = level.xpSumNumber;
      } else if (maxLevel === currentLevel) {
        endXp = level.xpSumNumber;
      }
      if ((minLevel <= currentLevel) && (maxLevel >= currentLevel)) {
        let rssCost = stripRssCost(level.upgradeCost);
        cost.rss += rssCost;
      }
    });
    cost.xp = numeral(endXp - startXp).format('0,0');
    cost.rss = numeral(cost.rss).format('0,0');
  } else {
    console.log(`UNKNOWN: ${id}`);
  }
  return cost;
}

function stripRssCost(cost) {
  cost = cost.replace(/,/g, '');
  cost = Number(cost);
  if (isNaN(cost)) {
    return 0;
  }
  return cost;
}

module.exports = {
  init: init,
  listDragons: listDragons,
  findDragon: findDragon,
  listTier: listTiers,
  getTier: getTier,
  getFragments: getFragments,
  getDragonCost: getDragonCost
};
