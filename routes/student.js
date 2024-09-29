const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student');
const {
    verifyToken
} = require('../middlewares/verifyToken');

router.post('/addStudent', verifyToken, studentController.addStudent);
router.post('/loginStudent', verifyToken, studentController.studentLogin);
router.get('/getStudentData/:studentId', verifyToken, studentController.getStudentDataByStudentId);
router.get('/getAllStudents', verifyToken, studentController.getStudentData);
router.get('/getStudentsCount', verifyToken, studentController.getStudentsCount);
router.delete('/deleteStudentById', verifyToken, studentController.deleteStudentData);
router.put('/updateStudentData', verifyToken, studentController.editStudentData);
router.get('/getStudent', verifyToken, studentController.getStudent);

module.exports = router;
