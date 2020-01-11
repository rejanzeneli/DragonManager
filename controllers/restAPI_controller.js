"use strict";

/**
 * Created by sandberg on 28/09/2017.
 */

const breeding = require('./breeding');
const dragons = require('./dragons');
const buildings = require('./building');
const riders = require('./riders');

function init() {
}

function listDragons(req, res) {
  const dragoninfo = dragons.listDragons(false);
  res.json(dragoninfo);
}

function listTiers(req, res) {
  const tierinfo = dragons.listTier();
  res.json(tierinfo);
}

function listParents(req, res) {
  const parent = req.params.name;
  const backbreeds = req.params.backbreeds !== "false";
  const parentInfo = breeding.findParents(parent, backbreeds);
  res.json(parentInfo);
}

function listChildren(req, res) {
  const child = req.params.name;
  const childInfo = breeding.findChildren(child);
  res.json(childInfo);
}

function listDragonInfo(req, res) {
  const dragon = req.params.name;
  const dragonInfo = dragons.findDragon(dragon);
  res.json(dragonInfo);
}

function storeUserData(req, res) {
  let userdata = req.body;

  for (let [key, value] of Object.entries(userdata)) {
    req.session[key] = value;
  }
  res.json({status: true});
}

function getRiderInfo(req, res) {
  if (req.query.hasOwnProperty('id')) {
    const riderInfo = riders.getRiderInfo(req.query.id);
    res.json({riderinfo: riderInfo});
  } else {
    res.json({riderinfo: null});
  }
}

function buildingCost(req, res) {
  let cost = buildings.getBuildingCost(req.params.id, Number(req.params.minlevel), Number(req.params.maxlevel), Number(req.params.reduction));
  res.json(cost);
}

function dragonCost(req, res) {
  let cost = dragons.getDragonCost(req.params.id, Number(req.params.minlevel), Number(req.params.maxlevel));
  res.json(cost);
}

module.exports = {
  init: init,
  listDragons: listDragons,
  listTiers: listTiers,
  listParents: listParents,
  listChildren: listChildren,
  listDragonInfo: listDragonInfo,
  buildingCost: buildingCost,
  dragonCost: dragonCost,
  storeUserData: storeUserData,
  getRiderInfo: getRiderInfo
};
