'use strict';

require('../models/transaction');
const {
    pino,
    connect,
} = require('./../lib/utils');
const logger = pino({
    level: 'debug'
});

const insertTransactionData = async (reqPayload) => {
    try {
        logger.debug('insertTransactionData() reqPayload: %j', reqPayload);

        const transactionDataModel = db.model('transactions');
        const response = await transactionDataModel.insertMany(reqPayload);
        return response;
    } catch (error) {
        logger.warn(`Error while insertTransactionData(). Error = %j %s`, error, error);
        throw error;
    }
};

const getBundleData = async () => {
    try {
        logger.debug('getBundleData()');

        const transactionDataModel = db.model('transactions');
        const aggregareQuery = await getPipelineQuery(null);
        let aggregatecount = aggregareQuery.concat([{
            $count: "total_data",
        },]);
        const responseCount = await transactionDataModel.aggregate(aggregatecount);
        if (responseCount < 0) {
            return responseCount;
        }
        const response = await transactionDataModel.aggregate(aggregareQuery);
        const finalRes = {
            bundleData: response,
            totalCount: responseCount
        };
        return finalRes;
    } catch (error) {
        logger.warn(`Error while getBundleData(). Error = %j %s`, error, error);
        throw error;
    }
};

const getBundleDataByCode = async (bundleId) => {
    try {
        logger.debug('getBundleDataByCode() bundleId: %s', bundleId);

        const transactionDataModel = db.model('transactions');
        const aggregareQuery = await getPipelineQuery(bundleId);
        const response = await transactionDataModel.aggregate(aggregareQuery);
        return response;
    } catch (error) {
        logger.warn(`Error while getBundleDataByCode(). Error = %j %s`, error, error);
        throw error;
    }
};

const editBundleData = async (reqPayload, bundleId, userCode) => {
    try {
        logger.debug('editBundleData() reqPayload: %j, bundleId: %s, userCode: %s', reqPayload, bundleId, userCode);

        const transactionDataModel = db.model('transactions');
        const bundleData = await transactionDataModel.find({
            bundle_id: bundleId,
            deleted: false,
            // status: 1,
            active: true,
        });
        if (bundleData && bundleData.length <= 0) {
            return bundleData;
        }
        const response = await transactionDataModel.updateOne({
            bundle_id: bundleId
        }, {
            $set: {
                bundle_name: reqPayload.bundle_name,
                bundle_code: reqPayload.bundle_code,
                bundle_type: reqPayload.bundle_type,
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
        logger.warn(`Error while editBundleData(). Error = %j %s`, error, error);
        throw error;
    }
};

const returnBundleData = async (bundleCode, userCode) => {
    try {
        logger.debug('returnBundleData() bundleCode: %s, userCode: %s', bundleCode, userCode);

        const transactionDataModel = db.model('transactions');
        const response = await transactionDataModel.findOneAndUpdate({
            bundle_code: bundleCode
        }, {
            $set: {
                is_return: true,
                updated_by: userCode,
                ts_last_update: new Date().getTime()
            }
        }, {
            upsert: true,
            new: true,
        });
        // console.log('returnBundleData--->', response);
        return response;
    } catch (error) {
        logger.warn(`Error while returnBundleData(). Error = %j %s`, error, error);
        throw error;
    }
};

const deleteBundleData = async (bundleId, userCode) => {
    try {
        logger.debug('deleteBundleData() bundleId: %s userCode: %s', bundleId, userCode);

        const transactionDataModel = db.model('transactions');
        const bundleData = await transactionDataModel.find({
            bundle_id: bundleId,
            deleted: false,
            active: true,
        })
        if (bundleData && bundleData.length <= 0) {
            return bundleData;
        }
        const response = await transactionDataModel.updateOne({
            bundle_id: bundleId,
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
        logger.warn(`Error while deleteBundleData(). Error = %j %s`, error, error);
        throw error;
    }
};

const updateBundleTicketCountData = async (bundleCode, userCode) => {
    try {
        logger.debug('editBundleData() bundleId: %s, userCode: %s', bundleCode, userCode);

        const transactionDataModel = db.model('transactions');
        const bundleData = await transactionDataModel.find({
            bundle_code: bundleCode,
            deleted: false,
        });
        if (bundleData && bundleData.length <= 0) {
            return bundleData;
        }
        let ticketSoldCount = bundleData[0].ticket_remaining - 1;
        const response = await transactionDataModel.findOneAndUpdate({
            bundle_code: bundleCode
        }, {
            $set: {
                ticket_remaining: ticketSoldCount,
                updated_by: userCode,
                ts_last_update: new Date().getTime()
            }
        }, {
            upsert: true,
            new: true,
        });
        return response;
    } catch (error) {
        logger.warn(`Error while editBundleData(). Error = %j %s`, error, error);
        throw error;
    }
};

const getPipelineQuery = async (bundleId) => {
    let aggregatePipeline = [];
    let sortBundle = {
        _id: 1
    };

    let matchQuery = {
        $and: [{
            deleted: false,
        },
        {
            active: true
        },
        {
            is_return: false
        }
        ],
    };

    if (bundleId) {
        matchQuery['$and'].push({
            bundle_id: {
                $eq: bundleId
            }
        });
    }
    aggregatePipeline.push({
        $match: matchQuery
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
        $unwind: {
            path: "$lottery_games",
            preserveNullAndEmptyArrays: true
        }
    });

    aggregatePipeline.push({
        $lookup: {
            from: 'tickets',
            localField: 'bundle_code',
            foreignField: 'bundle_code',
            as: 'tickets'
        },
    });
    aggregatePipeline.push({
        $unwind: {
            path: "$tickets",
            preserveNullAndEmptyArrays: true
        }
    });

    // aggregatePipeline.push({
    //     $match: {
    //         'tickets.deleted': {
    //             $eq: false
    //         }
    //     }
    // });

    const groupQuery = {};
    groupQuery["_id"] = "$bundle_code";
    groupQuery["bundle_id"] = {
        $first: "$bundle_id"
    };
    groupQuery["bundle_code"] = {
        $first: "$bundle_code"
    };
    groupQuery["game_code"] = {
        $first: "$game_code"
    };
    groupQuery["active"] = {
        $first: "$active"
    };
    groupQuery["date"] = {
        $first: "$date"
    };

    groupQuery["lottery_games"] = {
        $push: {
            game_name: "$lottery_games.game_name",
            game_code: "$lottery_games.game_code",
            game_type: "$lottery_games.game_type",
            game_cost: "$lottery_games.game_cost",
            game_id: "$lottery_games.game_id",
        }
    };

    groupQuery["tickets"] = {
        $push: {
            is_sold: "$tickets.is_sold",
            // game_code: "$tickets.game_code",
            // bundle_code: "$tickets.bundle_code",
            ticket_code: "$tickets.ticket_code",
            ticket_id: "$tickets.ticket_id",
        }
    };

    aggregatePipeline.push({
        $group: groupQuery
    });

    aggregatePipeline.push({
        $project: {
            _id: 0,
            bundle_id: 1,
            bundle_type: 1,
            bundle_name: 1,
            bundle_code: 1,
            game_code: 1,
            date: 1,
            active: 1,
            is_sold: 1,
            lottery_games: {
                $arrayElemAt: ["$lottery_games", 0]
            },
            tickets: 1,
            // 'lottery_games.game_id': 1,
            // 'lottery_games.game_code': 1,
            // 'lottery_games.game_cost': 1,
            // 'lottery_games.game_name': 1,
            // 'lottery_games.game_type': 1,
            // 'lottery_games.game_logo': 1,
            // tickets: 1
        },
    });
    aggregatePipeline.push({
        $sort: sortBundle
    });
    // if (req.query.search) {
    //     let searchValue = req.query["search"] || '';
    //     searchValue = searchValue.replace(/^\s+|\s+$/g, '');
    //     searchValue = searchValue.replace(/ +(?= )/g, '');
    //     matchquery['$or'] = [{
    //         'ticket_name': {
    //             "$regex": searchValue,
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
    insertTransactionData,
    getBundleData,
    getBundleDataByCode,
    editBundleData,
    deleteBundleData,
    updateBundleTicketCountData,
    returnBundleData,
    // getBundleDataByGameCode
}