"use strict";

/**
 * Created by sandberg on 28/09/2017.
 */
const map = require('../atlas_map/castleMap');
const castlequery = require('../atlas_map/castleQuery');

function init() {
  map.init();
  castlequery.init();
}

function getRankings(req, res) {
  const rankings = castlequery.getRanks();
  res.json(rankings);
}

function fetchTeam(value) {
  return value.team;
}

function getTeams(req, res) {
  let ranks = castlequery.getRanks();
  const teams = ranks.map(fetchTeam);
  res.json(teams);
}

async function getCastles(req, res) {
  const team = req.params.team;
  let castles = await castlequery.query(team, true);
  let ownCastles = null;
  if (req.params.ownteam !== undefined) {
    let ownTeam = req.params.ownteam;
    ownCastles = await castlequery.query(ownTeam);
  }
  castles.forEach((castle) => {
    let closestCastle = findNearestCastle(castle, ownCastles);
    castle.closestCastle = closestCastle;
  });

  res.json(castles);
}

function findNearestCastle(castle, ownCastles) {
  const x = castle.x;
  const z = castle.z;

  const neutralDistance = map.getNearestNeutral(x, z);
  const ownDistance = findNearestOwnCastle(x, z, ownCastles);
  if (ownDistance.distance < neutralDistance.distance) {
    return ownDistance;
  } else {
    return neutralDistance;
  }
}

function findNearestOwnCastle(x, z, ownCastles) {
  let minDistance = 99999999;
  let minX = 0;
  let minZ = 0;
  if (ownCastles) {
    ownCastles.forEach((castle) => {
      let distance = map.getDistance(x, castle.x, z, castle.z);
      if (minDistance > 0) {
        if (distance < minDistance) {
          minDistance = distance;
          minX = castle.x;
          minZ = castle.z;
        }
      } else {
        minDistance = distance;
        minX = castle.x;
        minZ = castle.z;
      }
    });
  }
  return {distance: minDistance, x: minX, z: minZ};
}

module.exports = {
  init: init,
  getRankings: getRankings,
  getTeams: getTeams,
  getCastles: getCastles,
};
