const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reports');
const {
    verifyToken
} = require('../middlewares/verifyToken');

router.post('/transaction_report', reportController.getTransactionReportData);

module.exports = router;
