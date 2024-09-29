const transactionService = require('../services/transaction');
const ticketService = require('../services/tickets');
const httpStatusCode = require('http-status-codes');
const {
    responseGenerators,
    bcrypt,
    generateToken,
    pino
} = require('./../lib/utils');
const logger = pino({
    level: 'debug'
});
const BaseJoi = require('joi');
const Extension = require('@hapi/joi-date');
const Joi = BaseJoi.extend(Extension);

const addTransactionData = async (req, res) => {
    try {
        const userCode = req.headers.user_code;
        const payload = req.body;
        const [ticketPayload, ticketCodePayload] = await generateBundlePayload(payload, userCode);
        console.log('ticketCodePayload---->', ticketCodePayload);
        const transactionResponse = await transactionService.insertTransactionData(payload);
        // if (Array.isArray(bundleResponse) && bundleResponse.length > 0) {
        //     const ticketResponse = await ticketService.insertTicketData(ticketPayload);
        //     return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(bundleResponse, httpStatusCode.StatusCodes.OK, 'Data added successfully', false));
        // }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(transactionResponse, httpStatusCode.StatusCodes.OK, 'Data added successfully', true));
        // return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(transactionResponse, httpStatusCode.StatusCodes.OK, {}, true));
    } catch (error) {
        logger.warn(`Error while adding data. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while adding data', true));
    }
};

const getAllTransactionData = async (req, res) => {
    try {
        const response = await transactionService.getBundleData();
        if (response && response.length <= 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No data exist..!', true));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'Data fetched successfully', false));
    } catch (error) {
        logger.warn(`Error while fetch data. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while fetch data', true));
    }
};

const getTransactionDataById = async (req, res) => {
    try {
        const bundleId = Number(req.params.bundle_id);
        const response = await transactionService.getBundleDataByCode(bundleId);
        if (response && response.length <= 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No data exist..!', true));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response[0], httpStatusCode.StatusCodes.OK, 'Data fetched successfully', false));
    } catch (error) {
        logger.warn(`Error while fetch data. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while fetch data', true));
    }
};


const editTransactionData = async (req, res) => {
    try {
        const userCode = req.headers.user_code;
        const bundleId = Number(req.body.bundleId);
        const response = await transactionService.editBundleData(req.body, bundleId, userCode);
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

const deleteTransactionData = async (req, res) => {
    try {
        const bundleId = Number(req.query.bundleId);
        const userCode = Number(req.headers.user_code);
        const response = await transactionService.deleteBundleData(bundleId, userCode);
        if (response && response.length <= 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No data deleted', true));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'Data deleted successfully', false));
    } catch (error) {
        logger.warn(`Error while delete data. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while delete data', true));
    }
};


const generateBundlePayload = async (payload, userCode) => {
    const ticketData = [];
    const ticketBody = [];
    for (let index = 0; index < payload.transaction_data.length; index++) {
        const ticketCount = payload.transaction_data[index].quantity;
        ticketData.push(parseInt(payload.transaction_data[index].ticket_code));
        for (let i = 1; i < ticketCount; i++) {
            let ticketObj = {};
            let ticketCode = parseInt(payload.transaction_data[index].ticket_code) - 1;
            ticketObj['game_code'] = payload.transaction_data[index].game_code;
            ticketObj['bundle_code'] = payload.transaction_data[index].bundle_code;
            ticketObj['ticket_code'] = ticketCode;
            ticketData.push(ticketCode);
            ticketObj['created_by'] = userCode;
            ticketBody.push(ticketObj);
        }
    }
    return [ticketBody, ticketData];
};

module.exports = {
    addTransactionData,
    getAllTransactionData,
    editTransactionData,
    deleteTransactionData,
    getTransactionDataById,
    getAllTransactionData,
};