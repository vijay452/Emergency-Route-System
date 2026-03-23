const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Route endpoints
router.post('/route', routeController.findRoute);
router.post('/route/optimize', routeController.optimizeRoute);
router.get('/routes', routeController.getAllRoutes);
router.get('/traffic', routeController.getTrafficData);
router.post('/traffic/alert', requireAuth, requireRole(['admin', 'operator']), routeController.addTrafficAlert);
router.get('/statistics', routeController.getStatistics);

module.exports = router;
