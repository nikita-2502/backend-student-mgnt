const classesService = require('../services/classes');
const httpStatusCode = require('http-status-codes');
const {
    responseGenerators,
    pino
} = require('../lib/utils');
const logger = pino({
    level: 'debug'
});
const BaseJoi = require('joi');
const Extension = require('@hapi/joi-date');
const Joi = BaseJoi.extend(Extension);

const classesSchema = Joi.object().keys({
    class_name: Joi.string().required(),
    division: Joi.string().required(),
    classTeacher: Joi.string().required(),
    noOfStd: Joi.number().required(),
    students: Joi.array().required(),
    // subjects: Joi.optional(),
});

const addClassesData = async (req, res) => {
    try {
        const joiValidate = await classesSchema.validate(req.body);
        if (joiValidate && joiValidate.length != -1) {
            const response = await classesService.insertClassData(req.body);
            if (response && response.data && response.data.length > 0) {
                return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'Class added successfully', false));
            }
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, response, true));
        } else {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'Invalid body', true));
        }
    } catch (error) {
        console.log('error: ', error);
        logger.warn(`Error while inserting class. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while classes signup', true));
    }
};

const getClassesData = async (req, res) => {
    try {
        const filterData = req.query ? req.query : null;
        // const reqPayload = req.query.payload ? JSON.parse(req.query.payload) : null;
        const response = await classesService.getClassessData(filterData);

        if (response && response.length <= 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No classes exist..!', false));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'Classes data fetched successfully', false));
    } catch (error) {
        console.log('error: ', error);
        logger.warn(`Error while fetch classes data. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while fetch classes data', true))
    }
}

const getClassessCount = async (req, res) => {
    try {
        const reqPayload = req.query.payload ? JSON.parse(req.query.payload) : null;
        const response = await classesService.getClassessCount(reqPayload);
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'Classes count fetched successfully', false));
    } catch (error) {
        logger.warn(`Error while fetch classes data. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while fetch classes data', true))
    }
}

const getClassDataByClassId = async (req, res) => {
    try {
        const classId = req.params.class_id;
        const response = await classesService.getClassDataByClassId(classId);
        if (response && response.data && response.data.length > 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'Data fetched successfully', false))
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No data exist..!', false))
    } catch (error) {
        logger.warn(`Error while fetch classes data. Error: %j %s`, error, error)
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while fetch classes data', true))
    }
}

const updateClassData = async (req, res) => {
    try {
        const userCode = Number(req.headers.user_id);
        const classId = req.body.classId;
        const response = await classesService.editClassesData(req.body, classId, userCode);
        if (response && response.data && response.data.length > 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'Class detail updated successfully', false));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No class detail updated', true));
    } catch (error) {
        logger.warn(`Error while update class. Error: %j %s`, error, error)
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while update class detail', true));
    }
}

const deleteClassesData = async (req, res) => {
    try {
        const classesId = req.query.classId;
        const userCode = Number(req.headers.user_id) || 1;
        const response = await classesService.deleteClassesData(classesId, userCode);
        if (response && response.data && response.data.length > 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'Class deleted successfully', false))
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No class detail deleted', true))
    } catch (error) {
        logger.warn(`Error while delete classes detail. Error: %j %s`, error, error)
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while delete classes detail', true))
    }
}

module.exports = {
    addClassesData,
    getClassesData,
    getClassessCount,
    updateClassData,
    deleteClassesData,
    getClassDataByClassId
}