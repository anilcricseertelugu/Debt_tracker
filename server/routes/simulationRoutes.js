const express = require('express');
const router = express.Router();
const controller = require('../controllers/simulatorController');
const { optionalProtect } = require('../middleware/authMiddleware');

router.post('/init', optionalProtect, controller.initSimulation);
router.post('/next', optionalProtect, controller.processNextStage);
router.get('/current', optionalProtect, controller.getSimulationSession);

module.exports = router;
