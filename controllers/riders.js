"use strict";

/**
 * Created by sandberg on 18/11/2018.
 */
const fs = require('fs');
const path = require('path');
const csvjson = require('csvjson');
const currencies = require('./currencies');
const numeral = require('numeral');
const skilltree = require('./rider_skilltrees');

const options = {
  delimiter: ',', // optional
  quote: '"' // optional
};

let riderNames = [];
let riderInfo = {};
let riderOverlay;

function init() {
  let riderinfo;

  // parse skilltree file to be ready for rider data parsing
  skilltree.init();

  // Basic rider info
  const data = fs.readFileSync(path.join(__dirname, '../datafiles/Rider.csv'), {encoding: 'utf8'});
  riderinfo = csvjson.toObject(data, options);
  // remove first column, contains the column type
  riderinfo.shift();
  riderOverlay = fs.readFileSync(path.join(__dirname, '../datafiles_overlay/Rider.json'), {encoding: 'utf8'});
  riderOverlay = JSON.parse(riderOverlay);
  riderinfo.forEach(formatRider);
}

function formatRider(rider) {
  if (riderOverlay.hasOwnProperty(rider.identifier)) {
    let overlay = riderOverlay[rider.identifier];
    for (let [key, value] of Object.entries(overlay)) {
      rider[key] = value;
    }
  }

  if (rider.canHire === '1') {
    let riderElement = {};
    riderElement.id = rider.identifier;
    riderElement.name = rider.name;
    riderElement.coregame = (rider.inBundle === '1');
    riderElement.tier = rider.tierNumber;
    riderElement.xpCurrency = currencies.getCurrency(rider.currencyToExchangeXP, 2);
    riderElement.costPerXP = Number(rider.currencyCostPerXP);
    riderElement.defensive = rider.isDefensive === "1";
    const levelInfo = readLevelInfo(rider.upgradeCSVFileName);
    riderElement.levels = levelInfo;
    let shardSum = levelInfo.reduce(countShards, {});
    shardSum = formatShardSum(shardSum);
    riderElement.shardSum = shardSum;
    let gpSum = levelInfo.reduce((sumValue, level) => {
      return sumValue + level.xpRequired;
    }, 0);
    riderElement.gpSum = numeral(gpSum).format('0,0');
    let skillSum = levelInfo.reduce((sumValue, level) => {
      return sumValue + level.skillPoints;
    }, 0);
    riderElement.skillSum = skillSum;
    riderElement.skills = skilltree.buildSkillTree(rider.rootSkillIdentifier);
    riderNames.push({id: riderElement.id, name: riderElement.name, defensive: riderElement.defensive, coregame: riderElement.coregame});
    riderInfo[riderElement.id] = riderElement;
  }
}

function countShards(sumValue, level) {
  let newSum = Object.assign({}, sumValue);
  if(newSum.hasOwnProperty(level.currency)) {
    newSum[level.currency] = newSum[level.currency] + level.shardCost;
  } else {
    newSum[level.currency] = level.shardCost;
  }
  return newSum;
}

function formatShardSum(shardSum) {
  let newSum = [];
  for (let [key, value] of Object.entries(shardSum)) {
    newSum.push(`${value} ${currencies.getCurrency(key, value)}`);
  }
  return newSum;
}

function readLevelInfo(infofile) {
  const data = fs.readFileSync(path.join(__dirname, `../datafiles/${infofile}`), {encoding: 'utf8'});
  const riderUpgrade = csvjson.toObject(data, options);

  // remove first column, contains the column type
  riderUpgrade.shift();
  let riderLevels = riderUpgrade.map((level) => {
    let levelInfo = {};
    levelInfo.level =  Number(level.level);
    levelInfo.xpRequired = Number(level.upgradeXP);
    levelInfo.skillPoints = Number(level.skillPointsGain);
    let cost = level.upgradeCost.split(':');
    let value = Number(cost[1]);
    let currency = currencies.getCurrency(cost[0], value);
    levelInfo.displayCost = value + " " + currency;
    levelInfo.shardCost = value;
    levelInfo.displayCurrency = currencies.getCurrency(cost[0], 2);
    levelInfo.currency = cost[0];
    return levelInfo;
  });

  return riderLevels;
}

function getRiderNames() {
  return riderNames;
}

function getRiderInfo(id) {
  if (riderInfo.hasOwnProperty(id)) {
    return riderInfo[id];
  } else {
    return null;
  }
}

module.exports = {
  init: init,
  getRiderNames: getRiderNames,
  getRiderInfo: getRiderInfo
};
