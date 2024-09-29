const ticketService = require('../services/tickets');
const bundleService = require('../services/subjects');
const tableService = require('../services/classes');
const httpStatusCode = require('http-status-codes');
const {
    responseGenerators,
    pino
} = require('./../lib/utils');
const logger = pino({
    level: 'debug'
});
const BaseJoi = require('joi');
const Extension = require('@hapi/joi-date');
const Joi = BaseJoi.extend(Extension);

// const TicketSchema = Joi.object().keys({
//     first_name: Joi.string().min(3).max(30).required(),
//     last_name: Joi.string().min(3).max(30).required(),
//     username: Joi.string().min(3).max(30).required(),
//     password: Joi.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s).{6,12}$/).required(),
//     email: Joi.string().email({
//         minDomainAtoms: 2
//     }).required(),
//     gender: Joi.string().required().valid(['Male', 'Female']),
//     dob: Joi.date().format('YYYY-MM-DD').options({ convert: true })
// });

const addTicketData = async (req, res) => {
    try {
        const userCode = req.headers.user_code || 0;
        req.body['created_by'] = userCode;
        req.body['ticket_remaining'] = ticket_count;
        const response = await ticketService.insertTicketData(req.body);
        if (Array.isArray(response) && response.length > 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'Data added successfully', false));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, response, false));
    } catch (error) {
        logger.warn(`Error while adding data. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while adding data', true));
    }
};

const getAllTicketData = async (req, res) => {
    try {
        const response = await ticketService.getTicketData();
        if (response && response.length <= 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No data exist..!', true));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'Data fetched successfully', false));
    } catch (error) {
        logger.warn(`Error while fetch data. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while fetch data', true));
    }
};

const getTicketDataById = async (req, res) => {
    try {
        const ticketId = Number(req.params.ticket_id);
        const response = await ticketService.getTicketDataByCode(ticketId);
        if (response && response.length <= 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No data exist..!', true));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'Data fetched successfully', false));
    } catch (error) {
        logger.warn(`Error while fetch data. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while fetch data', true));
    }
};

const getSoldTicketData = async (req, res) => {
    try {
        let ticketId = req.body.ticketId || null;
        let ticketSoldValue = req.body.is_sold || false;
        const response = await ticketService.getSoldTicketData(ticketId, ticketSoldValue);
        if (response && response.length <= 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No data exist..!', true));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'Data fetched successfully', false));
    } catch (error) {
        logger.warn(`Error while fetch data. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while fetch data', true));
    }
};

const editTicketData = async (req, res) => {
    try {
        const userCode = req.headers.user_code;
        const ticketId = Number(req.body.ticketId);
        const response = await ticketService.editTicketData(req.body, ticketId, userCode);
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

const soldTicketData = async (req, res) => {
    try {
        const userCode = req.headers.user_code;
        const ticketId = Number(req.body.ticketId);
        const [updatedValue, response] = await ticketService.soldTicketData(req.body, ticketId, userCode);
        if (updatedValue) {
            const bundleCode = response.bundle_code;
            const bundleResponse = await bundleService.updateBundleTicketCountData(bundleCode, userCode);
            if (bundleResponse && bundleResponse.ticket_remaining === 0) {
                let tableResponse = await tableService.unAssignTableCounterBundleFn(bundleCode, userCode);
                return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'Data updated successfully', false));
            } else {
                return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No data exist..!', true));
            }
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No data exist..!', true));
    } catch (error) {
        logger.warn(`Error while update data. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while update data', true));
    }
};

const deleteTicketData = async (req, res) => {
    try {
        const ticketId = Number(req.query.ticketId);
        const userCode = Number(req.headers.user_code);
        const response = await ticketService.deleteTicketData(ticketId, userCode);
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
    addTicketData,
    getAllTicketData,
    editTicketData,
    deleteTicketData,
    getTicketDataById,
    getSoldTicketData,
    soldTicketData,
}