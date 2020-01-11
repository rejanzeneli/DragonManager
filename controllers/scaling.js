"use strict";
const fs = require('fs');
const path = require('path');
const csvjson = require('csvjson');

const tierInfo = require('./tiers');

/**
 * Created by sandberg on 30/10/2017.
 */
let tierScaling = {};
let buildingScaling = {};

const options = {
  delimiter: ',', // optional
  quote: '"' // optional
};

function init() {
  // Tier scaling
  let data = fs.readFileSync(path.join(__dirname, '../datafiles/TierBasedDiscounting.csv'), {encoding: 'utf8'});
  let discountdata = csvjson.toObject(data, options);
  discountdata.shift();
  discountdata.forEach((tier) => {
    tier.tierName = tierInfo.getTierName(tier.tierNumber);
    tierScaling[tier.tierNumber] = tier;
  });

  // Building scaling
  data = fs.readFileSync(path.join(__dirname, '../datafiles/BuildingLevelBasedDiscounting.csv'), {encoding: 'utf8'});
  let buildingdata = csvjson.toObject(data, options);
  buildingdata.shift();
  buildingdata.forEach((level) => {
    buildingScaling[level.level] = level;
  })
}

function breedingTierDiscount(tier) {
  let scaling = 1.0;
  if (tierScaling.hasOwnProperty(tier)) {
    scaling = Number(tierScaling[tier].breedingCost) / 100;
  }
  return scaling;
}

function buildingTimeDiscount(level) {
  if (buildingScaling.hasOwnProperty(level)) {
    level = buildingScaling[level];
    if (level.hasOwnProperty('towerConstructionTime')) {
      let discount = Number(level.towerConstructionTime);
      discount = discount / 100.0;
      return discount;
    }
  }
  return 1.0;
}

function buildingRssDiscount(level) {
  if (buildingScaling.hasOwnProperty(level)) {
    level = buildingScaling[level];
    if (level.hasOwnProperty('towerConstructionCost')) {
      let discount = Number(level.towerConstructionCost);
      discount = discount / 100.0;
      return discount;
    }
  }
  return 1.0;
}

function dragonIncubationDiscount(tier) {
  let scaling = 1.0;
  if (tierScaling.hasOwnProperty(tier)) {
    scaling = Number(tierScaling[tier].incubatingTime) / 100;
  }
  return scaling;
}

function dragonXpDiscount(tier) {
  let scaling = 1.0;
  if (tierScaling.hasOwnProperty(tier)) {
    scaling = Number(tierScaling[tier].dragonTrainingXP) / 100;
  }
  return scaling;
}

function dragonTrainingDiscount(tier) {
  let scaling = 1.0;
  if (tierScaling.hasOwnProperty(tier)) {
    scaling = Number(tierScaling[tier].dragonTrainingCost) / 100;
  }
  return scaling;
}

module.exports = {
  init: init,
  buildingTimeDiscount: buildingTimeDiscount,
  buildingRssDiscount: buildingRssDiscount,
  dragonIncubationDiscount: dragonIncubationDiscount,
  dragonXpDiscount: dragonXpDiscount,
  dragonTrainingDiscount: dragonTrainingDiscount,
  breedingTierDiscount: breedingTierDiscount
};
