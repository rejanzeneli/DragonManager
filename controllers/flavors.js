"use strict";

/**
 * Created by sandberg on 12/10/2017.
 */

const fs = require('fs');
const path = require('path');
const csvjson = require('csvjson');

let flavorData = {};

const options = {
  delimiter: ',', // optional
  quote: '"' // optional
};

function init() {
  let flavors;
  const data = fs.readFileSync(path.join(__dirname, '../datafiles/FlavorText.csv'), {encoding: 'utf8'}).replace(/\r\n/g, '\r').replace(/\n/g, ';');
  flavors = csvjson.toObject(data, options);
  // remove first column, contains the column type
  flavors.shift();
  flavors.forEach((flavor) => {
    let text = flavor.text.split(';');
    flavorData[flavor.identifier] = text;
  });
}

function getFlavor(code) {
  if (flavorData.hasOwnProperty(code)) {
    return flavorData[code].slice();
  }
  return "";
}

module.exports = {
  init: init,
  getFlavor: getFlavor
};
