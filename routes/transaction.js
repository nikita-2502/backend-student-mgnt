const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction');
const {
    verifyToken
} = require('../middlewares/verifyToken');

router.post('/save_transaction', transactionController.addTransactionData);
router.get('/get/transaction_data/:transaction_id', verifyToken, transactionController.getTransactionDataById);
router.get('/getAll/transaction_data', verifyToken, transactionController.getAllTransactionData);
router.delete('/delete/transaction_data', verifyToken, transactionController.deleteTransactionData);
router.put('/update/transaction_data', verifyToken, transactionController.editTransactionData);

module.exports = router;
