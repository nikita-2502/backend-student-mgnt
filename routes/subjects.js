const express = require('express');
const router = express.Router();
const subjectsController = require('../controllers/subjects');
const {
    verifyToken
} = require('../middlewares/verifyToken');

router.post('/addSubjects', subjectsController.addSubjectsData);
router.get('/getSubjectById/:subject_id', subjectsController.getSubjectDataById);
router.get('/getAllSubjects', subjectsController.getAllSubjectsData);
router.delete('/deleteSubjects', subjectsController.deleteSubjectsData);
router.put('/updateSubjects', subjectsController.editSubjectsData);

module.exports = router;
