const express = require('express');
const router = express.Router();
const classController = require('../controllers/classes');
const {
    verifyToken
} = require('../middlewares/verifyToken');

router.post('/addClass', classController.addClassesData);
router.get('/getClassData/:class_id', classController.getClassDataByClassId);
router.get('/getAllClasss', classController.getClassesData);
router.get('/getClasssCount', classController.getClassessCount);
router.delete('/deleteClassById', classController.deleteClassesData);
router.put('/updateClassData', classController.updateClassData);

module.exports = router;
