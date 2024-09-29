const studentService = require('../services/student');
const httpStatusCode = require('http-status-codes');
const {
    responseGenerators,
    bcrypt,
    generateToken,
    pino
} = require('../lib/utils');
const logger = pino({
    level: 'debug'
});
const BaseJoi = require('joi');
const Extension = require('@hapi/joi-date');
const Joi = BaseJoi.extend(Extension);

const studentSchema = Joi.object().keys({
    first_name: Joi.string().min(3).max(30).required(),
    last_name: Joi.string().min(3).max(30).required(),
    sport: Joi.string().required(),
    gender: Joi.string().required().allow('male', 'female'),
    dob: Joi.number().required(),
    // username: Joi.string().min(3).max(30).required(),
    // password: Joi.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s).{6,12}$/).required(),
    email: Joi.string().min(3).max(30).regex(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/).required(),
    // classId: Joi.number().required(),
});

const addStudent = async (req, res) => {
    try {
        const joiValidate = await studentSchema.validate(req.body);
        if (joiValidate && joiValidate.length != -1) {
            const response = await studentService.insertStudentData(req.body);
            if (response && response.data && response.data.length > 0) {
                return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'Student registered successfully', false));
            }
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, response, true));
        } else {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'Invalid body', true));
        }
    } catch (error) {
        logger.warn(`Error while registering student. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while student signup', true));
    }
};

const studentLogin = async (req, res) => {
    try {
        const response = await studentService.studentLogin(req.body);
        if (Array.isArray(response) && response.length > 0) {
            // const token = generateToken(response[0], response[0].student_id);
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'Student logged in successfully', false));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, response, false));
    } catch (error) {
        logger.warn(`Error while logging student. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while student login', true));
    }
}

const getStudentData = async (req, res) => {
    try {
        // console.log('req.query: ', req.query);
        const filterData = req.query ? req.query : null;
        // const reqPayload = req.query.payload ? JSON.parse(req.query.payload) : null;
        const response = await studentService.getStudentsData(filterData);
        if (response && response.length <= 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No student exist..!', false));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'Student data fetched successfully', false));
    } catch (error) {
        logger.warn(`Error while fetch student data. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while fetch student data', true))
    }
}

const getStudent = async (req, res) => {
    try {
        const myArray = req.query.studentId.split(",");

        const numberArray = [];
        for (let i = 0; i < myArray.length; i++) {
            numberArray.push(Number(myArray[i]));
        }
        const classId = req.query.classId ? Number(req.query.classId): null;
        
        // const reqPayload = req.query.payload ? JSON.parse(req.query.payload) : null;
        // const reqPayload = req.query.studentId ? req.query.studentId : null;
        const response = await studentService.getStudent(numberArray, classId);
        if (response && response.length <= 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No student exist..!', false));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'Student data fetched successfully', false));

    } catch (error) {
        logger.warn(`Error while fetch student data. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while fetch student data', true))
    }
}

const getStudentsCount = async (req, res) => {
    try {
        const reqPayload = JSON.parse(req.query.payload);
        const response = await studentService.getStudentsCount(reqPayload);
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'Student count fetched successfully', false));
    } catch (error) {
        logger.warn(`Error while fetch student data. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while fetch student data', true))
    }
}

const getStudentDataByStudentId = async (req, res) => {
    try {
        const studentId = Number(req.params.studentId);
        const response = await studentService.getStudentDataByStudentId(studentId);
        if (response && response.data && response.data.length > 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'Student data fetched successfully', false))
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No student exist..!', false))
    } catch (error) {
        logger.warn(`Error while fetch student data. Error: %j %s`, error, error)
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while fetch student data', true))
    }
}

const editStudentData = async (req, res) => {
    try {
        const userCode = Number(req.headers.user_id);
        const studentId = req.body.studentId;
        const response = await studentService.editStudentData(req.body, studentId, userCode);
        // console.log('response: ', response);
        if (response && response.data && response.data.length > 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'Student detail updated successfully', false));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No student exist..!', true));
    } catch (error) {
        logger.warn(`Error while update student. Error: %j %s`, error, error)
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while update student detail', true));
    }
}

const deleteStudentData = async (req, res) => {
    try {
        const studentId = req.query.studentId;
        const userCode = Number(req.headers.user_id);
        const response = await studentService.deleteStudentData(studentId, userCode);
        if (response && response.length <= 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No student detail deleted', true))
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'Student detail deleted successfully', false))
    } catch (error) {
        logger.warn(`Error while delete student detail. Error: %j %s`, error, error)
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while delete student detail', true))
    }
}

module.exports = {
    addStudent,
    studentLogin,
    getStudentData,
    getStudentsCount,
    editStudentData,
    deleteStudentData,
    getStudentDataByStudentId,
    getStudent
}