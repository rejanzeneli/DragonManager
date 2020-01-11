"use strict";

/**
 * Created by sandberg on 12/10/2017.
 */

const fs = require('fs');
const path = require('path');
const csvjson = require('csvjson');

let currencyData = {};

const options = {
  delimiter: ',', // optional
  quote: '"' // optional
};

function init() {
  let currencies;
  const data = fs.readFileSync(path.join(__dirname, '../datafiles/Currency.csv'), {encoding: 'utf8'});
  currencies = csvjson.toObject(data, options);
  // remove first column, contains the column type
  currencies.shift();
  currencies.forEach((currency) => {
    currencyData[currency.identifier] = currency;
  });
}

function getCurrency(code, count = 2) {
  if (currencyData.hasOwnProperty(code)) {
    let plural = (Number(count) > 1);
    if (plural) {
      return currencyData[code].displayPlural;
    } else {
      return currencyData[code].displaySingular;
    }
  }
  return "";
}

module.exports = {
  init: init,
  getCurrency: getCurrency
};
