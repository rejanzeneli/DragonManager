"use strict";

/**
 * Created by sandberg on 21/11/2018.
 */
const fs = require('fs');
const path = require('path');
const csvjson = require('csvjson');
const util = require('util');

let riderGear = {};
let riderSkillTree = {};

const options = {
  delimiter: ',', // optional
  quote: '"' // optional
};

function init() {
  let skilltreeData;

  // buff info
  const buffdata = fs.readFileSync(path.join(__dirname, '../datafiles/Buff.csv'), {encoding: 'utf8'});
  let buffs = csvjson.toObject(buffdata, options);
  // remove first column, contains the column type
  buffs.shift();
  let buffinfo = {};
  buffs.forEach((buff) => {
    buff.descriptionFormat = buff.descriptionFormat.replace('+.1f', 's');
    buff.descriptionFormat = buff.descriptionFormat.replace('+g', 's');
    buffinfo[buff.identifier] = buff;
  });

  // Gear info / rider skills are seen as gear
  const geardata = fs.readFileSync(path.join(__dirname, '../datafiles/RiderGear.csv'), {encoding: 'utf8'});
  let gear = csvjson.toObject(geardata, options);
  // remove first column, contains the column type
  gear.shift();
  gear.forEach((gearinfo) => {
    // Ignore rider gear info
    if (gearinfo.slot === 'skill') {
      let info = {};
      info.name = gearinfo.displayName;
      info.skillStart = Number(gearinfo.buff1Base);
      info.skillIncrease = Number(gearinfo.buff1PerLvl);
      info.cost = Number(gearinfo.craftingCost.split(':')[1]);
      info.maxLevel = Number(gearinfo.maxLevel);
      info.tier = Number(gearinfo.tier);
      let bufftype = buffinfo[gearinfo.buff1Type].descriptionFormat;
      info.levels = [];
      for(let level = 0 ; level < info.maxLevel ; level++) {
        let number = info.skillStart + (level * info.skillIncrease);
        info.levels[level] = util.format(bufftype + ` (SkillPoints: ${info.cost})`, number.toFixed(1));
      }
      riderGear[gearinfo.identifier] = info;
    }
  });

  // Basic rider info
  const data = fs.readFileSync(path.join(__dirname, '../datafiles/RiderSkillTree.csv'), {encoding: 'utf8'});
  skilltreeData = csvjson.toObject(data, options);
  // remove first column, contains the column type
  skilltreeData.shift();
  skilltreeData.forEach(formatSkillTree);
}

function formatSkillTree(skill) {
  const [x, y] = skill.position.split('~');
  delete skill.position;
  skill.x = 4 * Number(x);
  skill.y = 0 - Number(y) + 8;
  let prerequisite = [];
  if (skill.prerequisiteIdentifiers !== "") {
    prerequisite = skill.prerequisiteIdentifiers.split('|');
  }
  skill.prerequisite = prerequisite;
  // read stats
  if (riderGear.hasOwnProperty(skill.riderGearIdentifier)) {
    let skillset = riderGear[skill.riderGearIdentifier];
    skill.levels = skillset;
  } else {
    skill.levels = [];
  }
  riderSkillTree[skill.identifier] = skill;
}

function buildSkillTree(rootnode) {
  let nodes = new Set();
  let edges = new Set();
  // take root
  // find all skills where root is prerequisite
  // store prequisites
  // find all skills where they are prerequisite
  // continue until nothing is found.
  nodes.add(rootnode);
  if (riderSkillTree.hasOwnProperty(rootnode)) {
    findPrerequisite(rootnode, nodes, edges);
  } else {
    console.error(rootnode);
  }
  edges = [... edges];
  edges.sort();
  let prev = ["", ""];
  edges = edges.concat().filter((i) => {
    if((i[0] !== prev[0]) || (i[1] !== prev[1])) {
      prev = i;
      return true;
    }
  });
  nodes = [... nodes];
  let finalNodes = [];
  nodes.forEach((node) => {
    let nodeinfo = riderSkillTree[node];
    finalNodes.push({name: node, label: nodeinfo.levels.name, skillX: nodeinfo.x, skillY: nodeinfo.y, levels: nodeinfo.levels});
  });
  return {nodes: finalNodes, edges: edges};
}

function findPrerequisite(root, nodes, edges) {
  for (let riderskill in riderSkillTree) {
    if (riderSkillTree.hasOwnProperty(riderskill)) {
      riderskill = riderSkillTree[riderskill];
      let prerequisite = riderskill.prerequisite;
      prerequisite.forEach((skill) =>{
        if (skill === root) {
          nodes.add(riderskill.identifier);
          // sort to make it unique
          let edge = [riderskill.identifier, skill];
          edge.sort();
          edges.add(edge);
          findPrerequisite(riderskill.identifier, nodes, edges);
        }
      });
    }
  }
}

function getSkillTree(identifier) {
  return {nodes: [], edges: []};
}

module.exports = {
  init: init,
  buildSkillTree: buildSkillTree,
  getSkillTree: getSkillTree
};
