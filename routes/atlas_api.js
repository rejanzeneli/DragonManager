const express = require('express');
const router = express.Router();
const atlas_controller = require('../controllers/atlas_controller');

function init() {
}

// Atlas paths
router.get('/ranking', atlas_controller.getRankings);
router.get('/teams', atlas_controller.getTeams);
router.get('/castles/:team/:ownteam?', atlas_controller.getCastles);

module.exports = {
  init: init,
  router: router
};
