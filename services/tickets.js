'use strict';

require('../models/tickets');
const {
    pino,
    connect,
} = require('./../lib/utils');
const logger = pino({
    level: 'debug'
});

const insertTicketData = async (reqPayload) => {
    try {
        logger.debug('insertTicketData() reqPayload: %j', reqPayload);

        const ticketDataModel = db.model('tickets');
        const ticketData = await ticketDataModel.find({
            ticket_code: reqPayload.ticket_code
        });
        if (ticketData.length > 0) {
            return 'Ticket already exists';
        }
        const response = await ticketDataModel.insertMany(reqPayload);
        return response;
    } catch (error) {
        logger.warn(`Error while insertTicketData(). Error = %j %s`, error, error);
        throw error;
    }
};

const getTicketData = async () => {
    try {
        logger.debug('getTicketData()');

        const ticketDataModel = db.model('tickets');
        const aggregareQuery = await getPipelineQuery(null);
        let aggregatecount = aggregareQuery.concat([{
            $count: 'total_data',
        },]);
        // console.log('aggregareQuery--->', JSON.stringify(aggregareQuery))
        const responseCount = await ticketDataModel.aggregate(aggregatecount);
        if (responseCount < 0) {
            return responseCount;
        }
        const response = await ticketDataModel.aggregate(aggregareQuery);
        const finalRes = {
            ticketData: response,
            totalCount: responseCount
        };
        return finalRes;
    } catch (error) {
        logger.warn(`Error while getTicketData(). Error = %j %s`, error, error);
        throw error;
    }
};

const getTicketDataByCode = async (ticketId) => {
    try {
        logger.debug('getTicketDataByCode() ticketId: %s', ticketId);

        const ticketDataModel = db.model('tickets');
        const aggregareQuery = await getPipelineQuery(ticketId);
        // console.log('aggregareQuery--->', JSON.stringify(aggregareQuery))
        const response = await ticketDataModel.aggregate(aggregareQuery);
        return response;
    } catch (error) {
        logger.warn(`Error while getTicketDataByCode(). Error = %j %s`, error, error);
        throw error;
    }
};

const getSoldTicketData = async (ticketId, ticketSoldValue) => {
    try {
        logger.debug('getSoldTicketData() ticketId: %s ticketSoldValue: %s', ticketId, ticketSoldValue);

        const ticketDataModel = db.model('tickets');
        let aggregareQuery = await getPipelineQuery(ticketId);
        const matchQuery = [{
            '$match': {
                $and: [{
                    is_sold: ticketSoldValue,
                },
                ],
            }
        }];
        aggregareQuery = [...aggregareQuery, ...matchQuery];
        console.log('aggregareQuery--->', JSON.stringify(aggregareQuery));
        const response = await ticketDataModel.aggregate(aggregareQuery);
        return response;
    } catch (error) {
        logger.warn(`Error while getSoldTicketData(). Error = %j %s`, error, error);
        throw error;
    }
};

const editTicketData = async (reqPayload, ticketId, userCode) => {
    try {
        logger.debug('editTicketData() reqPayload: %j, ticketId: %s, userCode: %s', reqPayload, ticketId, userCode);

        const ticketDataModel = db.model('tickets');
        const ticketData = await ticketDataModel.find({
            ticket_id: ticketId,
            deleted: false,
            // status: 1,
            active: true,
        });
        if (ticketData && ticketData.length <= 0) {
            return ticketData;
        }
        const response = await ticketDataModel.updateOne({
            ticket_id: ticketId
        }, {
            $set: {
                ticket_name: reqPayload.ticket_name,
                ticket_code: reqPayload.ticket_code,
                ticket_type: reqPayload.ticket_type,
                game_id: reqPayload.game_id,
                updated_by: userCode,
                ts_last_update: new Date().getTime()
            }
        }, {
            upsert: true,
            new: true,
        });
        return response;
    } catch (error) {
        logger.warn(`Error while editTicketData(). Error = %j %s`, error, error);
        throw error;
    }
};

const soldTicketData = async (reqPayload, ticketId, userCode) => {
    try {
        logger.debug('soldTicketData() reqPayload: %j, ticketId: %s, userCode: %s', reqPayload, ticketId, userCode);

        const ticketDataModel = db.model('tickets');
        const ticketData = await ticketDataModel.find({
            ticket_id: ticketId,
            // bundle_code: reqPayload.bundeleCode,
            is_sold: false,
            deleted: false,
            // status: 1,
            active: true,
        });
        if (ticketData && ticketData.length <= 0) {
            return [false, 'No data exists..!'];
        }
        const response = await ticketDataModel.findOneAndUpdate({
            ticket_id: ticketId,

        }, {
            $set: {
                is_sold: reqPayload.is_sold,
                updated_by: userCode,
                ts_last_update: new Date().getTime()
            }
        }, {
            upsert: true,
            new: true,
        });
        return [true, response];
    } catch (error) {
        logger.warn(`Error while soldTicketData(). Error = %j %s`, error, error);
        throw error;
    }
};

const deleteTicketData = async (ticketId, userCode) => {
    try {
        logger.debug('deleteTicketData() ticketId: %s userCode: %s', ticketId, userCode);

        const ticketDataModel = db.model('tickets');
        const ticketData = await ticketDataModel.find({
            ticket_id: ticketId,
            deleted: false,
            active: true,
        })
        if (ticketData && ticketData.length <= 0) {
            return ticketData;
        }
        const response = await ticketDataModel.updateOne({
            ticket_id: ticketId,
        }, {
            $set: {
                deleted: true,
                deleted_by: userCode,
                active: false,
                ts_deleted_date: new Date().getTime()
            }
        }, {
            upsert: true,
            new: true,
        });
        return response;
    } catch (error) {
        logger.warn(`Error while deleteTicketData(). Error = %j %s`, error, error);
        throw error;
    }
};

const deleteTicketDataByBundleCode = async (bundleCode, userCode) => {
    try {
        logger.debug('deleteTicketData() bundleCode: %s userCode: %s', bundleCode, userCode);

        const ticketDataModel = db.model('tickets');
        const ticketData = await ticketDataModel.find({
            bundle_code: bundleCode,
            deleted: false,
            active: true,
        })
        if (ticketData && ticketData.length <= 0) {
            return ticketData;
        }
        const response = await ticketDataModel.updateMany({
            bundle_code: bundleCode,
        }, {
            $set: {
                deleted: true,
                deleted_by: userCode,
                active: false,
                ts_deleted_date: new Date().getTime()
            }
        }, {
            upsert: true,
            new: true,
        });
        return response;
    } catch (error) {
        logger.warn(`Error while deleteTicketData(). Error = %j %s`, error, error);
        throw error;
    }
};

const returnTicketData = async (bundleCode, userCode) => {
    try {
        logger.debug('returnTicketData() bundleCode: %s, userCode: %s', bundleCode, userCode);

        const ticketDataModel = db.model('tickets');
        const response = await ticketDataModel.updateMany(
            {
                bundle_code: bundleCode,
                is_sold: false,
                deleted: false
            },
            {
                $set: {
                    is_return: true,
                    updated_by: userCode,
                    ts_last_update: new Date().getTime()
                }
            },
            {
                upsert: true,
                new: true,
            });
        return response;
    } catch (error) {
        logger.warn(`Error while returnTicketData(). Error = %j %s`, error, error);
        throw error;
    }
};

const missedTicketData = async (bundleCode, userCode) => {
    try {
        logger.debug('missedTicketData() bundleCode: %s, userCode: %s', bundleCode, userCode);

        const ticketDataModel = db.model('tickets');
        const response = await ticketDataModel.updateMany(
            {
                bundle_code: bundleCode,
                is_sold: false,
                deleted: false
            },
            {
                $set: {
                    is_missing: true,
                    updated_by: userCode,
                    ts_last_update: new Date().getTime()
                }
            },
            {
                upsert: true,
                new: true,
            });
        return response;
    } catch (error) {
        logger.warn(`Error while missedTicketData(). Error = %j %s`, error, error);
        throw error;
    }
};
const getPipelineQuery = async (ticketId) => {
    let aggregatePipeline = [];
    let matchquery = {};
    let sortTicket = {
        _id: 1
    };

    var match = {
        $and: [{
            deleted: false
        },
        {
            active: true
        },
        {
            is_return: false
        }
        ],
    };

    if (ticketId) {
        match['$and'].push({
            ticket_id: {
                $eq: ticketId
            }
        });
    }
    aggregatePipeline.push({
        $match: match
    });

    aggregatePipeline.push({
        $lookup: {
            from: 'bundles',
            localField: 'bundle_code',
            foreignField: 'bundle_code',
            as: 'bundles'
        },
    });
    aggregatePipeline.push({
        $unwind: '$bundles'
    });

    aggregatePipeline.push({
        $lookup: {
            from: 'lottery_games',
            localField: 'game_code',
            foreignField: 'game_code',
            as: 'lottery_games'
        },
    });
    aggregatePipeline.push({
        $unwind: '$lottery_games'
    });

    aggregatePipeline.push({
        $project: {
            _id: 0,
            ticket_id: 1,
            ticket_type: 1,
            date: 1,
            active: 1,
            ticket_name: 1,
            ticket_code: 1,
            is_sold: 1,
            'lottery_games.game_id': 1,
            'lottery_games.game_code': 1,
            'lottery_games.game_cost': 1,
            'lottery_games.game_name': 1,
            'lottery_games.game_type': 1,
            'lottery_games.game_logo': 1,
            'bundles.bundle_id': 1,
            'bundles.bundle_type': 1,
            'bundles.bundle_code': 1,
            'bundles.bundle_name': 1,
            'bundles.active': 1,
        },
    });
    aggregatePipeline.push({
        $sort: sortTicket
    });
    // if (req.query.search) {
    //     let searchValue = req.query['search'] || '';
    //     searchValue = searchValue.replace(/^\s+|\s+$/g, '');
    //     searchValue = searchValue.replace(/ +(?= )/g, '');
    //     matchquery['$or'] = [{
    //         'ticket_name': {
    //             '$regex': searchValue,
    //             '$options': 'i'
    //         }
    //     }];
    //     aggregatePipeline.push({
    //         $match: matchquery
    //     });
    // }

    return aggregatePipeline;
};

module.exports = {
    insertTicketData,
    getTicketData,
    getTicketDataByCode,
    editTicketData,
    deleteTicketData,
    getSoldTicketData,
    soldTicketData,
    returnTicketData,
    missedTicketData,
    deleteTicketDataByBundleCode,
}