"use strict";

/**
 * Created by sandberg on 12/10/2017.
 */

const fs = require('fs');
const path = require('path');
const csvjson = require('csvjson');
const texts = require('./texts');
const arrayDiff = require('simple-array-diff');
const capitalize = require('capitalize');

let spellData = {};
let spellTypes = {};
const spellColor = {red: "red", blue: "blue", passive: "yellow", white: "white"};
let resistData = {};
let secondSpellData = {};

const options = {
  delimiter: ',', // optional
  quote: '"' // optional
};

function init() {
  let spells, resists, spelltypes;
  let data = fs.readFileSync(path.join(__dirname, '../datafiles/SpellCommon.csv'), {encoding: 'utf8'});
  spells = csvjson.toObject(data, options);
  // remove first column, contains the column type
  spells.shift();
  spells.forEach((spell) => {
    spell.spellName = texts.getText(spell.spellNameIdentifier);
    spell.spellDescription = texts.getText(spell.spellDescriptionIdentifier);
    spellData[spell.identifier] = spell;
  });

  data = fs.readFileSync(path.join(__dirname, '../datafiles/ResistAbility.csv'), {encoding: 'utf8'});
  resists = csvjson.toObject(data, options);
  // remove first column, contains the column type
  resists.shift();
  resists.forEach((resist) => {
    resist.spellName = texts.getText(resist.spellNameIdentifier);
    resist.spellDescription = texts.getText(resist.spellDescriptionIdentifier);
    resistData[resist.identifier] = resist;
  });

  data = fs.readFileSync(path.join(__dirname, '../datafiles/SpellType.csv'), {encoding: 'utf8'});
  spelltypes = csvjson.toObject(data, options);
  // remove first column, contains the column type
  spelltypes.shift();
  spelltypes.forEach((spelltype) => {
    spellTypes[spelltype.identifier] = spelltype.spellTypeDescription;
  });

}

function getSpell(spell) {
  let spellInfo = {};
  if (spellData.hasOwnProperty(spell)) {
    let data = spellData[spell];
    let typecolor = [];
    let types = data.spellTypes;
    if (types.indexOf('|') !== -1) {
      types = types.split('|');
      types.forEach((type) => {
        let color = spellColor[type];
        typecolor.push(color);
      });
    } else {
      typecolor.push(spellColor[types]);
    }
    spellInfo = {name: data.spellName, description: data.spellDescription, typecolor: typecolor};
  } else if (resistData.hasOwnProperty(spell)) {
    let spelldata = resistData[spell];
    spellInfo = {name: spelldata.spellName, description: spelldata.spellDescription, typecolor: ['yellow']};
  }
  return spellInfo;
}

function getSpellLevelList(levels) {
  let lastlevel = [];
  let levellist = [];
  levels.forEach((level) => {
    let thislevel = level.abilities;
    if (thislevel !== '') {
      thislevel = thislevel.split('|');
      thislevel.forEach((spell, index) => {

        spell = spell.split(':');
        // Try to find second level spell if possible.
        let filename = capitalize.words(spell[0]);
        if (filename.indexOf('Spell') === -1) {
          filename += 'Spell';
        }
        // Exception rule for freeze
        if (filename === 'FreezeSpell') {
          filename = 'FreezeAttackSpell';
        }
        // Exception rule for summon
        if (filename === 'SummonAIDragonSpell') {
          filename = 'SummonAIBattleDragonSpell';
        }

        let realname = findSecondSpell(filename, spell[1]);
        if (realname !== null) {
          if (realname.identifier !== null) {
            spell = realname;
          } else {
            spell = {identifier: spell[0], ragePoints: realname.ragePoints};
          }
        } else {
          spell = {identifier: spell[0], ragePoints: 0}
        }
        thislevel[index] = spell;
      });
      // diff from last level
      let spelldiff = arrayDiff(lastlevel, thislevel, 'identifier');
      if (spelldiff.added.length > 0) {
        spelldiff.added.forEach((spell) => {
          let name = getSpell(spell.identifier);
          let levelinfo = {level: level.level, spell: name};
          levelinfo.spell.ragePoints = spell.ragePoints;
          levellist.push(levelinfo);
        });
      }
      lastlevel = thislevel;
    }
  });
  return levellist;
}

function findSecondSpell(filename, spellname) {
  // read and convert spells
  let spells, finalSpell = null;
  let secondSpells = {};

  if (secondSpellData.hasOwnProperty(filename)) {
    secondSpells = secondSpellData[filename];
  } else {
    try {
      let data = fs.readFileSync(path.join(__dirname, `../datafiles/${filename}.csv`), {encoding: 'utf8'});
      if (data !== null) {
        spells = csvjson.toObject(data, options);
        // remove first column, contains the column type
        spells.shift();
        spells.forEach((spelltype) => {
          let ragePoints = 0;
          if(spelltype.hasOwnProperty('ragePoints')) {
            ragePoints = Number(spelltype.ragePoints)/100;
          }
          secondSpells[spelltype.identifier] = {identifier: spelltype.commonIdentifier, ragePoints: ragePoints};
        });
      }
      secondSpellData[filename] = secondSpells;
    } catch (err) {
      console.log(err.message);
      secondSpellData[filename] = {};
    }
  }

  // Find the real name or null it if its empty
  if (secondSpells.hasOwnProperty(spellname)) {
    finalSpell = secondSpells[spellname];
    if (finalSpell.identifier === '' || finalSpell.identifier === undefined) {
      finalSpell = {identifier: null, ragePoints: finalSpell.ragePoints};
    }
  }

  return finalSpell;
}

module.exports = {
  init: init,
  spellName: getSpell,
  spellLevels: getSpellLevelList
};
