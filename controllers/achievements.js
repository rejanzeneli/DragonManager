"use strict";

/**
 * Created by sandberg on 12/10/2017.
 */

const fs = require('fs');
const path = require('path');
const csvjson = require('csvjson');

let achievementData = {};

const options = {
  delimiter: ',', // optional
  quote: '"' // optional
};

function init() {
  let achievements;
  const data = fs.readFileSync(path.join(__dirname, '../datafiles/Achievement.csv'), {encoding: 'utf8'});
  achievements = csvjson.toObject(data, options);
  // remove first column, contains the column type
  achievements.shift();
  achievements.forEach((achievement) => {
    if (achievement.achievementDescription !== '') {
      achievementData[achievement.identifier] = achievement.achievementDescription;
    }
  });
}

/**
 * Fetch an achievement description
 * @param id of the archievement to receive a description for.
 * @returns {string}
 */
function getAchievement(id) {
  if (achievementData.hasOwnProperty(id)) {
    let description = achievementData[id];
    return description;
  }
  return "";
}

module.exports = {
  init: init,
  getAchievement: getAchievement
};
