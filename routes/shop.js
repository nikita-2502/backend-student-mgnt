const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shop');
const {
    verifyToken
} = require('../middlewares/verifyToken');

router.post('/add/shop_data', shopController.addShopData);
router.get('/get/shop/:shop_code', shopController.getShopDataByShopCode);
router.get('/get/shopByAdminId/:admin_id', shopController.getShopDataByAdminId);
router.get('/getAll/shop_data', shopController.getAllShopData);
router.delete('/delete/shop_data', shopController.deleteShopData);
router.put('/update/shop_data', shopController.editShopData);
router.post('/shop/login', shopController.shopLogin);

module.exports = router;
