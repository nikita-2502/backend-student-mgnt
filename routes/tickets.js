const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/tickets');
const {
    verifyToken
} = require('../middlewares/verifyToken');

router.post('/add/ticket_data', verifyToken, ticketController.addTicketData);
router.get('/get/ticket_data/:ticket_id', verifyToken, ticketController.getTicketDataById);
router.get('/getAll/ticket_data', verifyToken, ticketController.getAllTicketData);
router.delete('/delete/ticket_data', verifyToken, ticketController.deleteTicketData);
router.put('/update/ticket_data', verifyToken, ticketController.editTicketData);
router.put('/sold/ticket', verifyToken, ticketController.soldTicketData);
router.post('/get/sold_ticket_data', verifyToken, ticketController.getSoldTicketData);

module.exports = router;
