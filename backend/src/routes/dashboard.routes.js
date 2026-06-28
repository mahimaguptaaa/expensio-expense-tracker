const express = require('express');
const { getDashboard, getMonthlyReport } = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate);

router.get('/', getDashboard);
router.get('/report/:year/:month', getMonthlyReport);

module.exports = router;
