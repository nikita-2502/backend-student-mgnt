const express = require('express');
const router = express.Router();
const lotteryGameController = require('../controllers/lottery_game');
const {
    verifyToken
} = require('../middlewares/verifyToken');

router.post('/add/lottery_game', lotteryGameController.addLotteryGame);
router.get('/get/lottery_game/:game_code', lotteryGameController.getLotteryGameDataByGameCode);
router.get('/getAll/lottery_game', lotteryGameController.getAllLotteryGameData);
router.delete('/delete/lottery_game', lotteryGameController.deleteLotteryGameData);
router.put('/update/lottery_game', lotteryGameController.editLotteryGameData);
router.post('/active/lottery_game', lotteryGameController.activeLotteryGame);

module.exports = router;
