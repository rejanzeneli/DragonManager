const express = require('express');
const router = express.Router();
const restapi_controller = require('../controllers/restAPI_controller');

function init() {
}

// Breeding paths
router.get('/dragons/list', restapi_controller.listDragons);
router.get('/dragons/tiers', restapi_controller.listTiers);
router.get('/dragons/parent/:name/:backbreeds', restapi_controller.listParents);
router.get('/dragons/child/:name', restapi_controller.listChildren);
router.get('/dragons/parent/:name/:backbreeds', restapi_controller.listParents);
router.get('/dragons/info/:name', restapi_controller.listDragonInfo);

// Building paths
router.get('/buildings/cost/:id/:minlevel/:maxlevel/:reduction', restapi_controller.buildingCost);

// Dragons paths
router.get('/dragons/cost/:id/:minlevel/:maxlevel', restapi_controller.dragonCost);

// Riders
router.get('/rider', restapi_controller.getRiderInfo);

// user data
router.post('/userdata', restapi_controller.storeUserData);

// health-check
router.get('/health-check', (req, res) => res.sendStatus(200));

module.exports = {
  init: init,
  router: router
};
