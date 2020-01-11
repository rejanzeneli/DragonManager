"use strict";

/**
 * Created by sandberg on 06/06/2018.
 */
const fs = require('fs');
const path = require('path');
const csvjson = require('csvjson');
const dragonClasses = require('./dragonClasses');

let dragonRuneInfo = {};
let buildingRuneInfo = {};
let runeRarityInfo = {};

const options = {
  delimiter: ',', // optional
  quote: '"' // optional
};

function init() {
  fetchRarities();
  fetchRunes();
}

function fetchRarities() {
  let runeRarities;
  const raritydata = fs.readFileSync(path.join(__dirname, '../datafiles/RuneRarityDescription.csv'), {encoding: 'utf8'});
  runeRarities = csvjson.toObject(raritydata, options);
  // remove first column, contains the column type
  runeRarities.shift();
  runeRarities.forEach((rarity) => {
    runeRarityInfo[rarity.identifier] = rarity.displayName;
    dragonRuneInfo[rarity.displayName] = [];
    buildingRuneInfo[rarity.displayName] = [];
  });
}

function fetchRunes() {
  let runes;
  const data = fs.readFileSync(path.join(__dirname, '../datafiles/Rune.csv'), {encoding: 'utf8'});
  runes = csvjson.toObject(data, options);
  // remove first column, contains the column type
  runes.shift();
  runes.forEach((rune) => {
    let formattedRune = formatRune(rune);
    if (formattedRune.type === "Dragon") {
      dragonRuneInfo[formattedRune.rarity].push(formattedRune);
    } else {
      buildingRuneInfo[formattedRune.rarity].push(formattedRune);
    }
  });
}

function formatRune(rune) {
  let formattedRune = {};
  formattedRune.rarity = runeRarityInfo[rune.rarityIndex];
  formattedRune.name = rune.runeName;

  // rune type
  if (rune.runeSlot === "normal") {
    formattedRune.slot = "Rune";
  } else {
    formattedRune.slot = "Glyph";
  }

  if (rune.runeType === "dragon") {
    formattedRune.type = "Dragon";
  } else {
    formattedRune.type = "Building";
  }

  // Restrictions for dragons
  formattedRune.restrictions = [];
  if (formattedRune.type === "Dragon") {
    if (rune.availableTypes !== "") {
      let restrictions = rune.availableTypes.split('|');
      restrictions.forEach((type) => {
        type = dragonClasses.getClass(type);
        formattedRune.restrictions.push(type);
      });
    } else {
      formattedRune.restrictions.push("All");
    }
  }

  // Abilities
  let description = rune.abilityTexts.split('|');
  formattedRune.description1 = description[0];
  if (description.length > 1) {
    formattedRune.description2 = description[1];
  }

  // Units
  let units = rune.abilityUnits.split('|');
  let enhance1 = rune.enhanceValues1.split('|');
  formattedRune.enhance1 = [];
  enhance1.forEach((enhance) => {
    let value = Number(enhance);
    if (units[0] === '%') {
      value = Number(value * 100).toFixed(2);
    }
    formattedRune.enhance1.push(`${value} ${units[0]}`);
  });
  if (units.length > 1) {
    let enhance2 = rune.enhanceValues2.split('|');
    formattedRune.enhance2 = [];
    enhance2.forEach((enhance) => {
      let value = Number(enhance);
      if (units[1] === '%') {
        value = Number(value * 100).toFixed(2);
      }
      formattedRune.enhance2.push(`${value} ${units[1]}`);
    });
  }

  // Costs
  formattedRune.costs = rune.enhanceCosts.split('|');

  return formattedRune;
}

function getDragonRunes() {
  return dragonRuneInfo;
}

function getBuildingRunes() {
  return buildingRuneInfo;
}

function getRarities() {
  return runeRarityInfo;
}

module.exports = {
  init: init,
  getRarities: getRarities,
  getDragonRunes: getDragonRunes,
  getBuildingRunes: getBuildingRunes
};
