const express = require('express');
const router = express.Router();
const opsController = require('../controllers/opsController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/analytics', requireAuth, opsController.getAnalytics);
router.get('/audit-logs', requireAuth, requireRole(['admin']), opsController.getAuditLogs);
router.post('/fleet/events', requireAuth, requireRole(['admin', 'operator']), opsController.addFleetEvent);
router.get('/live-traffic', opsController.liveTraffic);
router.get('/weather', opsController.weatherAt);

module.exports = router;
