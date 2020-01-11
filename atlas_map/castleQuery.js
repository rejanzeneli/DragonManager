"use strict";

const request = require('request');
const fetch = require('node-fetch');
const regionQuery = require('./castleMap');
let castleOwners = null;

const ATLAS_REFRESH = process.env.ATLAS_REFRESH || 60*60*1000;

let ranks = [];
let castles = {};

function init() {
  fetchAtlasWorld();
}

function fetchAtlasWorld() {
  request('https://509-dot-pgdragonsong.appspot.com/ext/dragonsong/world/macro_view/get_metadata?realm_name=Celestial_Haven&k_id=1', { json: true }, (err, res, body) => {
    if (err) {
      setTimeout(fetchAtlasWorld, Number(ATLAS_REFRESH));
      return console.log(err);
    }
    ranks = [];
    castles = {};
    castleOwners = body;
    buildAtlasRanks();
    buildCastleList();
    renameAtlasCastles();
    setTimeout(fetchAtlasWorld, Number(ATLAS_REFRESH));
  });
}

function buildAtlasRanks() {
  for (let team in castleOwners.metadata.teams) {
    if (castleOwners.metadata.teams.hasOwnProperty(team)) {
      const teaminfo = castleOwners.metadata.teams[team];
      if (teaminfo.power_rank === 0) {
        teaminfo.power_rank = Object.keys(castleOwners.metadata.teams).length;
      }
      const teamrank = {team: team, atlas_rank: teaminfo.rank, influence: teaminfo.infl, power_rank: teaminfo.power_rank};
      ranks.push(teamrank);
    }
  }

  ranks.sort(function(a, b) {
    return a.power_rank - b.power_rank;
  });
}

function buildCastleList() {
  for (let continent in castleOwners.metadata.conts) {
    if (castleOwners.metadata.conts.hasOwnProperty(continent)) {
      const team = castleOwners.metadata.conts[continent];
      if (team !== null) {
        const teamname = team.toLowerCase();
        if (!castles.hasOwnProperty(teamname)) {
          castles[teamname] = [];
        }
        castles[teamname].push({team: team, continent: continent});
      }
    }
  }
}

function renameAtlasCastles() {
  for (let team in castles) {
    if (castles.hasOwnProperty(team)) {
      let teamcastles = castles[team];
      teamcastles.forEach((castle) => {
        castle.originalContinent = castle.continent;
        const regionInfo = castle.continent.split('-');
        if (regionInfo.length === 2) {
          let regionName = regionInfo[0];
          let castleIndex = regionInfo[1];

          let region = regionQuery.getRegionName(regionName, castleIndex);
          castle.continent = `${region.name}-${castleIndex}`;
          castle.x = region.coordX;
          castle.y = region.coordY;
          castle.z = region.coordZ;
          castle.element = region.element;
          castle.level = region.level;
          castle.nmlConnection = region.nmlConnection;
          castle.neutralConnection = region.neutralConnection;
        }
      });
    }
  }
}

function getRanks() {
  return ranks;
}

async function query(team, fetchNames = false) {
  let result = [];
  let realTeam = team;
  team = team.toLowerCase();
  if (castles.hasOwnProperty(team)) {
    result = castles[team];
  }
  if (fetchNames) {
    let names = await fetchCastleNames(realTeam);
    if (names !== null) {
      result.forEach((castle) => {
        let continent = castle.originalContinent;
        names.some((name) => {
          if(name.cid.includes(continent)) {
            castle.name = name.name;
          }
        });
      });
    }
  }
  return result;
}

function fetchCastleNames(team) {
  return new Promise((resolve, reject) => {
    const url = `https://509-dot-pgdragonsong.appspot.com/ext/dragonsong/world/season/get_vp_holdings_for_team?team=${team}`;
    fetch(url).then(res => {
        res.json().then((json) => {
          if (json.hasOwnProperty('holdings')) {
            let castles = json.holdings;
            resolve(castles);
          } else {
            resolve(null);
          }
        }, (error) => {
          resolve(null);
        });
      });
  });
}

module.exports = {
  init: init,
  query: query,
  getRanks:getRanks,
};
