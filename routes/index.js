const express = require('express');
const router = express.Router();
const dragonController = require('../controllers/dragons');
const buildingController = require('../controllers/building');
const playerlevels = require('../controllers/playerlevels');
const researchEggs = require('../controllers/researcheggs');
const runes = require('../controllers/runes');
const riders = require('../controllers/riders');

const env = {
  title: 'DRAGON MANAGER'
};

let backendUri = 'http://localhost:8888/api/v1';

function init() {
  backendUri = process.env.UI_BACKEND || backendUri;
  console.log(`Using backend: ${backendUri}`);
  env.uri = backendUri;
  env.sw_version = process.env.SW_VERSION || "UNKNOWN";
  env.data_version = process.env.DATA_VERSION || "UNKNOWN";
}

router.get('/', function (req, res) {
  env.title = "DRAGON MANAGER";
  renderPage('index', req, res);
});

router.get('/versioninfo', function (req, res) {
  env.title = "VERSION INFO";
  renderPage('versioninfo', req, res);
});

router.get('/levelinfo', function (req, res) {
  env.title = "PLAYER LEVEL INFO";
  env.playerlevels = playerlevels.getLevelData();
  renderPage('levelinfo', req, res);
});

router.get('/tokeninfo', function (req, res) {
  env.title = "TOKEN COMBINATIONS";
  env.research = researchEggs.getResearchEggs();
  renderPage('eggtokeninfo', req, res);
});

router.get('/dragonrunes', function (req, res) {
  env.title = 'DRAGON RUNES';
  env.runetitle = 'DRAGON RUNES';
  env.rarities = runes.getRarities();
  env.runes = runes.getDragonRunes();
  renderPage('runes', req, res);
});

router.get('/buildingrunes', function (req, res) {
  env.title = 'BUILDING RUNES';
  env.runetitle = 'BUILDING RUNES';
  env.rarities = runes.getRarities();
  env.runes = runes.getBuildingRunes();
  renderPage('runes', req, res);
});

router.get('/breeding', function (req, res) {
  let tiers = dragonController.listTier();
  let tierInfo = [];

  tiers.forEach(function (tier) {
    if (tier.length === 0) {
      return;
    }
    let tierNumber = Number(tier[0].defaultTierNumber);
    if ((tierNumber !== 0) && (! Object.prototype.hasOwnProperty.call(tier[0], 'seasonName'))) {
      let tierName = tier[0].tierName.toUpperCase();
      let tierColor = tier[0].tierColor;
      tierInfo.push({name: tierName, color: tierColor, tier: tierNumber});
    }
  });

  env.tiers = tierInfo;
  env.title = "BREEDING";
  let maxtier = req.session.maxtier || "99";
  env.maxtier = Number(maxtier);
  renderPage('breeding', req, res);
});

router.get('/dragons', function (req, res) {
  env.dragons = dragonController.listTier();
  env.title = "DRAGONS";
  renderPage('dragons', req, res);
});

router.get('/dragon/:id', function (req, res) {
  let id = req.params.id;
  env.dragon = dragonController.findDragon(id);
  env.title = env.dragon.info.displayName;
  renderPage('dragoninfo', req, res);
});

router.get('/buildings', function (req, res) {
  env.buildings = buildingController.listBuildings();
  env.title = "BUILDINGS";
  renderPage('buildings', req, res);
});

router.get('/building/:id', function (req, res) {
  let id = req.params.id;
  env.building = buildingController.findBuilding(id);
  // delete level 0 if presetn
  // if (env.building.levels[0].level === "0") {
  //   env.building.levels = env.building.levels.splice(1);
  // }
  env.title = env.building.building.displayName;
  renderPage('buildinginfo', req, res);
});

router.get('/riders', function (req, res) {
  env.title = "RIDERS (BETA)";
  env.riders = riders.getRiderNames();
  renderPage('riders', req, res);
});

router.get('/atlas_rankings', function (req, res) {
  env.title = "ATLAS RANKINGS";
  renderPage('atlas_rankings', req, res);
});

router.get('/atlas_castles', function (req, res) {
  env.title = "ATLAS CASTLES";
  renderPage('atlas_castles', req, res);
});

function renderPage(view, req, res) {
  res.render(view, env);
}

module.exports = {
  init: init,
  router: router
};
