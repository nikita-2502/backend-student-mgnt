const subjectsService = require('../services/subjects');
const ticketService = require('../services/tickets');
const tableService = require('../services/classes');
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

const subjectsSchema = Joi.object().keys({
    subject_name: Joi.string().min(3).max(30).required(),
});

const addSubjectsData = async (req, res) => {
    try {
        const joiValidate = await subjectsSchema.validate(req.body);
        if (joiValidate && joiValidate.length != -1) {
            const response = await subjectsService.insertSubjectsData(req.body);
            if (response && response.data && response.data.length > 0) {
                return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'Data added successfully', false));
            }
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, response, true));
        } else {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'Invalid body', true));
        }
    } catch (error) {
        logger.warn(`Error while adding data. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while adding data', true));
    }
};

const getAllSubjectsData = async (req, res) => {
    try {
        const reqPayload = req.query.payload ? JSON.parse(req.query.payload) : null;
        const response = await subjectsService.getSubjectsData(reqPayload);
        if (response && response.length <= 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No data exist..!', true));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'Data fetched successfully', false));
    } catch (error) {
        logger.warn(`Error while fetch data. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while fetch data', true));
    }
};

const getSubjectsCount = async (req, res) => {
    try {
        const reqPayload = JSON.parse(req.query.payload);
        const response = await studentService.getSubjectsCount(reqPayload);
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'Student count fetched successfully', false));
    } catch (error) {
        logger.warn(`Error while fetch student data. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while fetch student data', true))
    }
}

const getSubjectDataById = async (req, res) => {
    try {
        const subjectId = Number(req.params.subject_id);
        const response = await subjectsService.getSubjectDataBySubjectId(subjectId);
        if (response && response.data && response.data.length > 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'Data fetched successfully', false));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No data exist..!', true));
    } catch (error) {
        logger.warn(`Error while fetch data. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while fetch data', true));
    }
};

const editSubjectsData = async (req, res) => {
    try {
        const userCode = req.headers.user_id;
        const subjectsId = Number(req.body.subjectsId);
        const response = await subjectsService.editSubjectsData(req.body, subjectsId, userCode);
        if (response && response.length <= 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No data exist..!', true));
        }
        if (response.nModified === 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No data updated', false));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'Data updated successfully', false));
    } catch (error) {
        logger.warn(`Error while update data. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while update data', true));
    }
};

const deleteSubjectsData = async (req, res) => {
    try {
        const subjectsId = Number(req.query.subjectsId);
        const userCode = Number(req.headers.user_id);
        const response = await subjectsService.deleteSubjectsData(subjectsId, userCode);
        if (response && response.length <= 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No data deleted', true));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'Data deleted successfully', false));
    } catch (error) {
        logger.warn(`Error while delete data. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while delete data', true));
    }
};

module.exports = {
    addSubjectsData,
    getAllSubjectsData,
    getSubjectsCount,
    editSubjectsData,
    deleteSubjectsData,
    getSubjectDataById,
};