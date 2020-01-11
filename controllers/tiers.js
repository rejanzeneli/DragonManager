"use strict";

/**
 * Created by sandberg on 22/03/2018.
 */
const fs = require('fs');
const path = require('path');
const csvjson = require('csvjson');
const rgbHex = require('rgb-hex');
const icongen = require('./icongenerator');

let tierInfo = {};
let seasonTier;

function init(publicPath) {
  readTierParameters();
  icongen.generate(tierInfo, publicPath);
}

function readTierParameters() {
  let tierColors = {};
  let tierNames = {};

  const options = {
    delimiter: ',', // optional
    quote: '"' // optional
  };

  const data = fs.readFileSync(path.join(__dirname, '../datafiles/DragonTier.csv'), {encoding: 'utf8'});
  let dragonTiers = csvjson.toObject(data, options);
  // remove first column, contains the column type
  dragonTiers.shift();

  dragonTiers.forEach((tier) => {
    const tierNumber = Number(tier.identifier);
    const rgb = tier.color.split('~');
    let hexvalue = rgbHex(Number(rgb[0]), Number(rgb[1]), Number(rgb[2]));
    tierColors[tierNumber] = hexvalue;
    tierNames[tierNumber] = tier.name;
  });

  let tierLength = Object.keys(tierNames).length;
  seasonTier = tierLength;
  tierNames[tierLength] = "Evolving Dragons";
  tierColors[tierLength] = "cccccc";

  for(let index in tierColors) {
    let color = "000000";
    if (tierColors.hasOwnProperty(index)) {
      color = tierColors[index];
    }
    let name = 'UNKNOWN';
    if(tierNames.hasOwnProperty(index)) {
      name = tierNames[index];
    }
    tierInfo[index] = {color: color, name: name};
  }
}

function getTierName(tierNumber) {
  if (tierInfo.hasOwnProperty(tierNumber)) {
    return tierInfo[tierNumber].name;
  }
  return 'UNKNOWN';
}

function getTierColor(tierNumber) {
  if (tierInfo.hasOwnProperty(tierNumber)) {
    return tierInfo[tierNumber].color;
  }
  return null;
}

function getSeasonTier() {
  return seasonTier;
}

module.exports = {
  init: init,
  getTierName: getTierName,
  getTierColor: getTierColor,
  getSeasonTier: getSeasonTier
};
