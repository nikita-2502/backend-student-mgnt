const reportService = require('../services/reports');
const ticketService = require('../services/tickets');
const httpStatusCode = require('http-status-codes');
const {
    responseGenerators,
    pino
} = require('./../lib/utils');
const logger = pino({
    level: 'debug'
});


const getTransactionReportData = async (req, res) => {
    try {
        const response = await reportService.getReportData(req.body);
        if (response && response.length <= 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No data exist..!', true));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'Report fetched successfully', false));
    } catch (error) {
        logger.warn(`Error while fetch data. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while fetch data', true));
    }
};


module.exports = {
    getTransactionReportData,
};