"use strict";

/**
 * Created by sandberg on 16/03/2018.
 */
const dragons = require('./dragons');
const breeding = require('./breeding');
const scaling = require('./scaling');

let researchEggs = [];

function init() {
  buildTiers();
}

function buildTiers() {
  let tiers = dragons.listTier();
  tiers.forEach(function (tier) {
    if (tier.length === 0) {
      return;
    }
    let tierName = tier[0].tierName;
    let tierColor = tier[0].tierColor;
    let tierEggs = [];
    tier.forEach(function (dragon) {
      let eggcombos = breeding.findParents(dragon.displayName, true, true);
      if (eggcombos.length > 0) {
        eggcombos.forEach(function (combo) {
          combo.eggs.forEach(function (egg) {
            if (egg.name === dragon.displayName) {
              let scaling1 = scaling.breedingTierDiscount(combo.parent1tier);
              let scaling2 = scaling.breedingTierDiscount(combo.parent2tier);
              let eggScaling = Math.max(scaling1, scaling2);
              let researchCombo = {};
              researchCombo.parent1 = combo.parent1;
              researchCombo.parent2 = combo.parent2;
              researchCombo.parentcolor1 = combo.parent1color;
              researchCombo.parentcolor2 = combo.parent2color;
              researchCombo.child = egg.name;
              researchCombo.prize = Math.ceil((2000.0 / egg.ratio) * egg.fragments * eggScaling);
              tierEggs.push(researchCombo);
            }
          });
        });
      }
    });
    tierEggs = filterBest(tierEggs);
    if (tierEggs.length > 0) {
      researchEggs.push({name: tierName, color: tierColor, eggs: tierEggs});
    }
  })
}

function filterBest(tier) {
  if (tier.length === 0) {
    return [];
  }
  let cheapest = tier[0].prize;

  tier.forEach(function (egg) {
    if (egg.prize < cheapest) {
      cheapest = egg.prize;
    }
  });
  let result = tier.filter(function (item) {
    return item.prize <= (cheapest * 1.1);
  });
  result = result.sort(function (a, b) {
    return a.prize - b.prize;
  }).slice(0, 10);
  return result;
}

function getResearchEggs() {
  return researchEggs;
}

module.exports = {
  init: init,
  getResearchEggs: getResearchEggs,
};
