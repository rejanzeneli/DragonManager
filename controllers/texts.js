"use strict";

/**
 * Created by sandberg on 12/10/2017.
 */

const fs = require('fs');
const path = require('path');
const csvjson = require('csvjson');

let textData = {};

const options = {
  delimiter: ',', // optional
  quote: '"' // optional
};

function init() {
  let texts;
  const data = fs.readFileSync(path.join(__dirname, '../datafiles/FlavorText.csv'), {encoding: 'utf8'});
  texts = csvjson.toObject(data, options);
  // remove first column, contains the column type
  texts.shift();
  texts.forEach((text) => {
    if (text.identifier.includes('spell_')) {
      textData[text.identifier] = text;
    }
  });
}

function getText(text) {
  if (textData.hasOwnProperty(text)) {
    let textItem = textData[text];
    return textItem.text;
  }
  return "";
}

module.exports = {
  init: init,
  getText: getText
};
