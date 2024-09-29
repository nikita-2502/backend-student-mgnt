'use strict';

require('../models/lottery_game');
const {
    pino,
    connect,
} = require('./../lib/utils');
const logger = pino({
    level: 'debug'
});

const insertLotteryGameData = async (reqPayload) => {
    try {
        logger.debug('insertLotteryGameData() reqPayload: %j', reqPayload);

        const gameDataModel = db.model('lottery_games');
        const gameData = await gameDataModel.find({
            game_code: reqPayload.game_code
        });
        if (gameData.length > 0) {
            return 'Game already exists';
        }
        const response = await gameDataModel.insertMany(reqPayload);
        return response;
    } catch (error) {
        logger.warn(`Error while insertLotteryGameData(). Error = %j %s`, error, error);
        throw error;
    }
}


const getLotteryGameData = async () => {
    try {
        logger.debug('getLotteryGameData()');

        const gameDataModel = db.model('lottery_games');
        const aggregareQuery = await getPipelineQuery(null);

        let aggregatecount = aggregareQuery.concat([{
            $count: 'total_data',
        },]);
        const responseCount = await gameDataModel.aggregate(aggregatecount);
        if (responseCount < 0) {
            return responseCount;
        }
        const response = await gameDataModel.aggregate(aggregareQuery);

        const finalRes = {
            gameData: response,
            totalCount: responseCount
        };
        return finalRes;
    } catch (error) {
        logger.warn(`Error while getLotteryGameData(). Error = %j %s`, error, error);
        throw error;
    }
}

const getLotteryGameDataByCode = async (gameCode) => {
    try {
        logger.debug('getLotteryGameDataByCode() gameCode: %s', gameCode);

        const gameDataModel = db.model('lottery_games');
        const aggregareQuery = await getPipelineQuery(gameCode);
        const response = await gameDataModel.aggregate(aggregareQuery);
        // const response = await gameDataModel.find({
        //     game_code: gameCode,
        //     deleted: false,
        //     // status: 1,
        //     active: true,
        // });
        return response;
    } catch (error) {
        logger.warn(`Error while getLotteryGameDataByCode(). Error = %j %s`, error, error);
        throw error;
    }
};

const editLotteryGameData = async (reqPayload, gameId, userCode) => {
    try {
        logger.debug('editLotteryGameData() reqPayload: %j, gameId: %s, userCode: %s', reqPayload, gameId, userCode);

        const gameDataModel = db.model('lottery_games');
        const gameData = await gameDataModel.find({
            game_id: gameId,
            deleted: false,
            // status: 1,
            active: true,
        });
        if (gameData && gameData.length <= 0) {
            return gameData;
        }
        const response = await gameDataModel.updateOne({
            game_id: gameId
        }, {
            $set: {
                game_name: reqPayload.game_name,
                game_type: reqPayload.game_type,
                game_cost: reqPayload.game_cost,
                game_code: reqPayload.game_code,
                updated_by: userCode,
                ts_last_update: new Date().getTime()
            }
        }, {
            upsert: true,
            new: true,
        });
        return response;
    } catch (error) {
        logger.warn(`Error while editLotteryGameData(). Error = %j %s`, error, error);
        throw error;
    }
};


const deleteLotteryGameData = async (gameId, userCode) => {
    try {
        logger.debug('deleteLotteryGameData() gameId: %s userCode: %s', gameId, userCode);

        const gameDataModel = db.model('lottery_games');
        const gameData = await gameDataModel.find({
            game_id: gameId,
            deleted: false,
            active: true,
        })
        if (gameData && gameData.length <= 0) {
            return gameData;
        }
        const response = await gameDataModel.updateOne({
            game_id: gameId,
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
        logger.warn(`Error while deleteLotteryGameData(). Error = %j %s`, error, error);
        throw error;
    }
};

const getPipelineQuery = async (gameCode) => {
    let aggregatePipeline = [];
    let sortLottery = {
        _id: 1
    };

    let matchQuery = {
        $and: [{
            deleted: false,
        },
            // {
            //     active: true
            // }
        ],
    };

    if (gameCode) {
        matchQuery['$and'].push({
            game_code: {
                $eq: gameCode
            }
        });
    }
    aggregatePipeline.push({
        $match: matchQuery
    });

    aggregatePipeline.push({
        $lookup: {
            from: 'bundles',
            let: {
                gameCode: '$game_code'
            },
            pipeline: [{
                $match: {
                    $expr: {
                        $and: [{
                            $eq: ['$game_code', '$$gameCode']
                        }]
                    }
                }
            },
            {
                $lookup: {
                    from: 'tickets',
                    let: {
                        bundleCode: '$bundle_code'
                    },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [{
                                    $eq: ['$deleted', false]
                                }]
                            }
                        }
                    },
                    {
                        $project: {
                            ticket_id: 1,
                            ticket_code: 1
                        }
                    }
                    ],
                    as: 'tickets'
                }
            }
            ],
            as: 'bundles'
        }
    });

    aggregatePipeline.push({
        $unwind: {
            path: '$bundles',
            preserveNullAndEmptyArrays: true
        }
    });


    const groupQuery = {};
    groupQuery['_id'] = '$game_code';
    groupQuery['game_id'] = {
        $first: '$game_id'
    };
    groupQuery['game_type'] = {
        $first: '$game_type'
    };
    groupQuery['active'] = {
        $first: '$active'
    };
    groupQuery['date'] = {
        $first: '$date'
    };
    groupQuery['game_cost'] = {
        $first: '$game_cost'
    };
    groupQuery['game_name'] = {
        $first: '$game_name'
    };
    groupQuery['game_code'] = {
        $first: '$game_code'
    };

    groupQuery['bundles'] = {
        $push: {
            bundle_id: '$bundles.bundle_id',
            ticket_count: '$bundles.ticket_count',
            bundle_code: '$bundles.bundle_code',
            active: '$bundles.active',
            ticket_remaining: '$bundles.ticket_remaining',
            tickets: '$bundles.tickets'
        }
    };

    // groupQuery['tickets'] = {
    //     $push: {
    //         is_sold: '$tickets.is_sold',
    //         ticket_code: '$tickets.ticket_code',
    //         ticket_id: '$tickets.ticket_id',
    //     }
    // };

    aggregatePipeline.push({
        $group: groupQuery
    });

    // aggregatePipeline.push({
    //     $lookup: {
    //         from: 'tickets',
    //         localField: 'bundles.bundle_code',
    //         foreignField: 'bundle_code',
    //         as: 'tickets'
    //     },
    // });
    // aggregatePipeline.push({
    //     $unwind: {
    //         path: '$tickets',
    //         preserveNullAndEmptyArrays: true
    //     }
    // });

    aggregatePipeline.push({
        $project: {
            _id: 0,
            game_id: 1,
            game_code: 1,
            game_name: 1,
            game_type: 1,
            game_id: 1,
            bundle_type: 1,
            date: 1,
            active: 1,
            game_cost: 1,
            bundles: 1,
            tickets: 1,

        },
    });
    aggregatePipeline.push({
        $sort: sortLottery
    });

    return aggregatePipeline;
};

const activeLotteryGameData = async (reqPayload, gameCode, userCode) => {
    try {
        logger.debug('activeLotteryGameData() gameCode: %s, userCode: %s', gameCode, userCode);

        const gameDataModel = db.model('lottery_games');
        const gameData = await gameDataModel.find({
            game_code: gameCode,
            deleted: false,
            active: false,
        });
        if (gameData && gameData.length <= 0) {
            return gameData;
        }
        const response = await gameDataModel.updateOne({
            game_code: gameCode,
        }, {
            $set: {
                active: true,
                updated_by: userCode,
                ts_last_update: new Date().getTime()
            }
        }, {
            upsert: true,
            new: true,
        });
        return response;
    } catch (error) {
        logger.warn(`Error while activeLotteryGameData(). Error = %j %s`, error, error);
        throw error;
    }
};

module.exports = {
    insertLotteryGameData,
    getLotteryGameData,
    getLotteryGameDataByCode,
    editLotteryGameData,
    deleteLotteryGameData,
    activeLotteryGameData
}