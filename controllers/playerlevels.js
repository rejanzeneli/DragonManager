"use strict";
const fs = require('fs');
const path = require('path');
const csvjson = require('csvjson');

const numeral = require('numeral');
const currencies = require('./currencies');

/**
 * Created by sandberg on 30/10/2017.
 */
let levels = {};

const options = {
  delimiter: ',', // optional
  quote: '"' // optional
};

function init() {
  const data = fs.readFileSync(path.join(__dirname, '../datafiles/Level.csv'), {encoding: 'utf8'});
  let leveldata = csvjson.toObject(data, options);
  leveldata.shift();
  leveldata.shift();
  let lastXP = 0;
  leveldata.forEach((level) => {
    level.maxRssTransfer = mapRssTransfers(level);
    level.xpSum = Number(level.requiredXp);
    let xp = Number(level.requiredXp) - lastXP;
    lastXP = Number(level.requiredXp);
    level.requiredXp = xp;
    levels[level.identifier] = level;
  })
}

function mapRssTransfers(level) {
  let maxRss = level.maxCurrencyPerGiftTransfer.split('|');
  let rssTypes = [];

  maxRss.forEach((type, index) => {
    if (!type.startsWith('ruby')) {
      type = type.split(':');
      rssTypes.push(type);
    }
  });

  let maxRssDisplay = '';
  rssTypes.forEach((data) => {
    let count = data[1];
    maxRssDisplay += `${numeral(count).format('0,0')} ${currencies.getCurrency(data[0], count)}\n`;
  });
  return maxRssDisplay;
}

function getLevelData() {
  return levels;
}

function getLevelFromXp(xp) {
  let playerlevel = 1;
  for (let level in levels) {
    level = levels[level];
    if(xp < level.xpSum) {
      playerlevel = level.identifier;
      break;
    }
  }
  return playerlevel;
}

module.exports = {
  init: init,
  getLevelData: getLevelData,
  getLevelFromXp: getLevelFromXp
};
