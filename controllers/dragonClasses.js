"use strict";

/**
 * Created by sandberg on 08/06/2018.
 */
const fs = require('fs');
const path = require('path');
const csvjson = require('csvjson');

let dragonClasses = {};
let dragonDamage = {};

const options = {
  delimiter: ',', // optional
  quote: '"' // optional
};

function init() {
  fetchClasses();
}

function fetchClasses() {
  const data = fs.readFileSync(path.join(__dirname, '../datafiles/DragonClass.csv'), {encoding: 'utf8'});
  let classInfo = csvjson.toObject(data, options);
  // remove first column, contains the column type
  classInfo.shift();

  classInfo.forEach((classType) => {
    if (classType.hasOwnProperty('identifier') && classType.hasOwnProperty('displayName')) {
      dragonClasses[classType.identifier] = classType;
      dragonDamage[classType.displayName] = Number(classType.classMultiplier);
    }
  });
}

function getClass(identifier) {
  if (dragonClasses.hasOwnProperty(identifier)) {
    return dragonClasses[identifier].displayName;
  }
  return "N/A";
}

function getDamage(displayName) {
  if (dragonDamage.hasOwnProperty(displayName)) {
    return dragonDamage[displayName];
  }
  return 0;
}

module.exports = {
  init: init,
  getClass: getClass,
  getDamage: getDamage
};
