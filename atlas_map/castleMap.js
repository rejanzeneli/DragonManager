"use strict";

const castles = require('./sapphire_league.json');

let nmlCastles = [];
let neutralCastles = [];

function init() {
  // build Neutral list
  buildNeutralList();
  // Build NML list
  buildNMLList();
}

function buildNMLList() {
  let castleInfo = null;
  castles.Regions.forEach((info) => {
    if (info.Material === 'No Mans Land') {
      info.Castles.forEach((castle) => {
        castleInfo = {
          castleId: castle.ID,
          x: info.Position.x / 2 + castle.Position.x / 2,
          y: info.Position.y / 2 + castle.Position.y / 2,
          z: info.Position.z / 2 + castle.Position.z / 2,
        };
        nmlCastles.push(castleInfo);
      });
    }
  });
}

function buildNeutralList() {
  let castleInfo = null;
  castles.Regions.forEach((info) => {
    if (info.Material.startsWith('N_')) {
      info.Castles.forEach((castle) => {
        castleInfo = {
          castleId: castle.ID,
          x: info.Position.x / 2 + castle.Position.x / 2,
          y: info.Position.y / 2 + castle.Position.y / 2,
          z: info.Position.z / 2 + castle.Position.z / 2,
        };
        neutralCastles.push(castleInfo);
      });
    }
  });
}

function nmlConnected(castleID) {

  let connected = castles.Links.some((link) => {
    if (castleID === link.EndCastle) {
      if (nmlSearch(link.StartCastle)) {
        return true;
      }
    } else if (castleID === link.StartCastle) {
      if (nmlSearch(link.EndCastle)) {
        return true;
      }
    }
  });
  return connected;
}

function nmlSearch(castleID) {
  let connected = nmlCastles.some((castleinfo) => {
    if (castleinfo.castleId === castleID) {
      return true;
    }
  });
  return connected;
}

function neutralConnected(castleID) {
  let connected = castles.Links.some((link) => {
    if (castleID === link.EndCastle) {
      if (neutralSearch(link.StartCastle)) {
        return true;
      }
    } else if (castleID === link.StartCastle) {
      if (neutralSearch(link.EndCastle)) {
        return true;
      }
    }
  });
  return connected;
}

function neutralSearch(castleID) {
  let connected = neutralCastles.some((castleinfo) => {
    if (castleinfo.castleId === castleID) {
      return true;
    }
  });
  return connected;
}
function getRegionName(region, index) {
  let regionInfo = null;
  castles.Regions.forEach((info) => {
    if (region === info.ID) {
      let castle = info.Castles[index];
      let material = info.Material.split(/(?=[A-Z])/);
      regionInfo = {
        name: info.Name,
        element: material[0],
        level: info.LevelOfCastlesWithin + 1,
        castleId: castle.ID,
        coordX: info.Position.x / 2 + castle.Position.x / 2,
        coordY: info.Position.y / 2 + castle.Position.y / 2,
        coordZ: info.Position.z / 2 + castle.Position.z / 2,
      };
    }
  });
  regionInfo.nmlConnection = nmlConnected(regionInfo.castleId);
  regionInfo.neutralConnection = neutralConnected(regionInfo.castleId);
  return regionInfo;
}

function getDistance(x1, x2, z1, z2) {
  let xs = x2 - x1;
  let zs = z2 - z1;

  xs *= xs;
  zs *= zs;

  return Math.sqrt(xs + zs);
}

function getNearestNml(x, z) {
  let minX = 0;
  let minZ = 0;
  let minDistance = 0;
  nmlCastles.forEach((castle) => {
    let distance = getDistance(x, castle.x, z, castle.z);
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
  return {distance: minDistance, x: minX, z: minZ};
}

function getNearestNeutral(x, z) {
  let minDistance = 0;
  let minX = 0;
  let minZ = 0;
  neutralCastles.forEach((castle) => {
    let distance = getDistance(x, castle.x, z, castle.z);
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
  return {distance: minDistance, x: minX, z: minZ};
}

module.exports = {
  init: init,
  getRegionName: getRegionName,
  getNearestNml: getNearestNml,
  getNearestNeutral: getNearestNeutral,
  getDistance: getDistance
};
