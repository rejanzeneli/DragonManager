"use strict";

/**
 * Created by sandberg on 26/09/2017.
 */

const fs = require('fs');
const path = require('path');
const csvjson = require('csvjson');
const scaling = require('./scaling');

const backbreedLimit = process.env.BACKBREED_LIMIT || 50;

let parents = null;
let eggs = null;

const dragons = require('./dragons');

const options = {
  delimiter: ',', // optional
  quote: '"' // optional
};

function renameParents(parents) {
  parents.shift();
  parents.forEach((pair) => {
    let firstDragon = dragons.getTier(pair.firstDragonIdentifier);
    let secondDragon = dragons.getTier(pair.secondDragonIdentifier);
    pair.firstDragonIdentifier = firstDragon.name;
    pair.secondDragonIdentifier = secondDragon.name;
    pair.firstDragonTier = firstDragon.tierName;
    pair.secondDragonTier = secondDragon.tierName;
    pair.firstDragonColor = firstDragon.tierColor;
    pair.secondDragonColor = secondDragon.tierColor;
    pair.firstDragonTier = firstDragon.tierNumber;
    pair.secondDragonTier = secondDragon.tierNumber;
    // find eggs for this combo
    let deck = pair.possibleRawEggDistribution.split(':')[0];
    pair.eggs = findEggs(deck);
    pair.deck = deck;
  });
}

function findEggs(deck) {
  let children = null;
  for (let pair of eggs) {
    if (pair.identifier === deck) {
      children = pair.children;
      break;
    }
  }
  return children;
}

function renameEggs(eggs) {
  eggs.shift();
  eggs.forEach((deck) => {
    let results = deck.possibleOutcomeDistribution.split('|');
    let children = [];
    let probabilityRatio = 0;
    results.forEach((child) => {
      let probability = Number(child.split(':')[1]);
      probabilityRatio += probability;
      let name = child.split(':')[0];
      let egginfo = dragons.getTier(name);
      let fragments = dragons.getFragments(egginfo.name);
      children.push({name: egginfo.name, probability: probability, fragments: fragments, color: egginfo.tierColor});
    });
    children.forEach((egg) => {
      let ratio = (egg.probability / probabilityRatio) * 100;
      let percentage = ratio.toFixed(1);
      egg.ratio = ratio;
      egg.percentage = percentage;
    });
    deck.children = children;
  });
}

function init() {
  const parentsData = fs.readFileSync(path.join(__dirname, '../datafiles/DragonEgg.csv'), {encoding: 'utf8'});
  const decksData = fs.readFileSync(path.join(__dirname, '../datafiles/Deck.csv'), {encoding: 'utf8'});
  parents = csvjson.toObject(parentsData, options);
  eggs = csvjson.toObject(decksData, options);
  // remove first column, contains the column type
  renameEggs(eggs);
  renameParents(parents);
}

function findParents(eggSearch, backbreeds, tokenSearch = false) {
  let parentInfo = [];
  eggSearch = eggSearch.toLowerCase();
  parents.forEach((pair) => {
    if (pair.hasOwnProperty('eggs')) {
      if (pair.eggs !== null) {
        pair.eggs.forEach((egg) => {
          if (egg.name.toLowerCase() === eggSearch) {
            let includeSelf = false;
            if (!tokenSearch) {
              includeSelf = (pair.firstDragonIdentifier.toLowerCase() !== eggSearch) && (pair.secondDragonIdentifier.toLowerCase() !== eggSearch);
            } else {
              includeSelf = true;
            }
            if (includeSelf) {
              let eggs = [];
              pair.eggs.forEach((egginfo) => {
                eggs.push({name: egginfo.name, fragments: egginfo.fragments, ratio: egginfo.ratio, percentage: egginfo.percentage, eggColor: egginfo.color});
              });
              let firstscaling = scaling.breedingTierDiscount(pair.firstDragonTier);
              let secondscaling = scaling.breedingTierDiscount(pair.secondDragonTier);
              let tierScaling = Math.max(firstscaling, secondscaling);
              if (backbreeds) {
                if (Number(egg.ratio) > backbreedLimit) {
                  addParentInfo(parentInfo, {deck: pair.deck, scaling: tierScaling, parent1: pair.firstDragonIdentifier, parent1color: pair.firstDragonColor, parent1tier: pair.firstDragonTier, parent2: pair.secondDragonIdentifier, parent2color: pair.secondDragonColor,parent2tier: pair.secondDragonTier, eggs: eggs});
                }
              } else {
                addParentInfo(parentInfo, {deck: pair.deck, scaling: tierScaling, parent1: pair.firstDragonIdentifier, parent1color: pair.firstDragonColor,parent1tier: pair.firstDragonTier, parent2: pair.secondDragonIdentifier, parent2color: pair.secondDragonColor,parent2tier: pair.secondDragonTier, eggs: eggs});
              }
            }
          }
        });
      }
    } else {
      console.log('no eggs');
    }
  });
  return parentInfo;
}

function addParentInfo(parentinfo, newdeck) {
  let notExisting = true;
  parentinfo.forEach((deck) => {
    if(deck.deck === newdeck.deck) {
      notExisting = false;
    }
  });
  if (notExisting) {
    parentinfo.push(newdeck);
  }
}

function findChildren(parent) {
  let childInfo = [];
  parent = parent.toLowerCase();
  parents.forEach((pair) => {
    if ((pair.firstDragonIdentifier.toLowerCase() === parent) || (pair.secondDragonIdentifier.toLowerCase() === parent)) {
      let eggs = [];
      pair.eggs.forEach((egginfo) => {
        eggs.push({name: egginfo.name, fragments: egginfo.fragments, ratio: egginfo.ratio, percentage: egginfo.percentage, eggColor: egginfo.color});
      });
      childInfo.push({parent1: pair.firstDragonIdentifier, parent1color: pair.firstDragonColor, parent2: pair.secondDragonIdentifier, parent2color: pair.secondDragonColor, eggs: eggs});
    }
  });
  return childInfo;
}

module.exports = {
  init: init,
  findParents: findParents,
  findChildren: findChildren
};
