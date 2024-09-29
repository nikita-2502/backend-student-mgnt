const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const {
  verifyToken
} = require('../middlewares/verifyToken');

router.post('/register', userController.userSignup);
router.post('/login', userController.userLogin);
router.get('/get/userData/:admin_code', userController.getUserDataByUserCode);
router.get('/get/allUser', userController.getUserData);
router.delete('/delete/userById', userController.deleteUserData);
router.put('/update/userData', userController.editUserData);

module.exports = router;
