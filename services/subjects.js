'use strict';

const {
    pino,
    connect,
} = require('../lib/utils');
const logger = pino({
    level: 'debug'
});
const db = require('../models/schema')

const insertSubjectsData = async (reqPayload) => {
    try {
        logger.debug('insertSubjectsData() reqPayload: %j', reqPayload);


        const subjectsData = await db.subjectsSchema.find({
            subject_name: reqPayload.subject_name
        });
        if (subjectsData.length > 0) {
            return 'Subjects already exists';
        }
        const _subjectData = await db.subjectsSchema.insertMany(reqPayload);
        const finalRes = {
            data: _subjectData
        };
        return finalRes;
    } catch (error) {
        logger.warn(`Error while insertSubjectsData(). Error = %j %s`, error, error);
        throw error;
    }
};

const getSubjectsData = async (reqPayload) => {
    try {
        logger.debug('getSubjectsData() reqPayload: %j', reqPayload);
        let matchQuery = {
            $and: [
                { deleted: false },
                { active: true },
            ]
        };

        let sortData = { ts_last_update: -1, date: -1 };

        let aggregatePipeline = [
            { $match: matchQuery },
            {
                $lookup: {
                    from: 'classes',
                    localField: 'subjectId',
                    foreignField: 'subjects.subjectId',
                    as: 'classes',
                },
            },
            { $unwind: { path: '$classes', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    'classes.classId': '$classes.classId',
                    'classes.class_name': '$classes.class_name',
                    'class_sort': { $toLower: '$classes.class_name' },

                    'name_sort': { $toLower: '$subject_name' },
                    subject_name: 1,
                    date: 1,
                    ts_last_update: 1,
                },
            },
            { $sort: sortData },
        ];

        const _subjectsData = await db.subjectsSchema.aggregate(aggregatePipeline).exec();
        const finalRes = {
            data: _subjectsData,
        };
        return finalRes;
    } catch (error) {
        logger.warn(`Error while getSubjectsData(). Error = %j %s`, error, error);
        throw error;
    }
}

const getSubjectsCount = async (reqPayload) => {
    try {
        logger.debug('getSubjectsCount() reqPayload: %j', reqPayload);

        let matchQuery = {
            $and: [
                { deleted: false },
                { active: false },
            ]
        };

        let sortData = { ts_last_update: -1, date: -1 };
        if (reqPayload['sort']) {
            sortData = {};
            if (reqPayload['sort']['active'] == 'name') {
                sortData['name_sort'] = (reqPayload['sort']['direction'] == 'asc') ? 1 : -1;
            } else if (reqPayload['sort']['active'] == 'class') {
                sortData['class_sort'] = (reqPayload['sort']['direction'] == 'asc') ? 1 : -1;
            } else if (reqPayload['sort']['active'] == 'date') {
                sortData = {
                    ts_last_update: (reqPayload['sort']['direction'] == 'asc') ? 1 : -1,
                    date: (reqPayload['sort']['direction'] == 'asc') ? 1 : -1
                };
            } else {
                sortData = {
                    ts_last_update: (reqPayload['sort']['direction'] == 'asc') ? 1 : -1,
                    date: (reqPayload['sort']['direction'] == 'asc') ? 1 : -1
                };
            }
        }

        if (reqPayload && reqPayload['search']) {
            matchQuery['$or'] = [
                { 'subject_name': { $regex: reqPayload['search'], $options: 'i' } },
            ];
        }

        let aggregatePipeline = [
            { $match: matchQuery },
            {
                $lookup: {
                    from: 'classes',
                    localField: 'subjectId',
                    foreignField: 'subjects.subjectId',
                    as: 'classes',
                },
            },
            { $unwind: { path: '$classes', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    'classes.classId': '$classes.classId',
                    'classes.class_name': '$classes.class_name',
                    'class_sort': { $toLower: '$classes.class_name' },

                    'name_sort': { $toLower: '$subject_name' },
                    subject_name: 1,
                    date: 1,
                    ts_last_update: 1,
                },
            },
            { $sort: sortData },
        ];

        const _subjectsCount = await db.subjectsSchema.count(aggregatePipeline).exec();

        const finalRes = {
            data: _subjectsCount ? _subjectsCount : 0,
        };
        return finalRes;
    } catch (error) {
        logger.warn(`Error while getSubjectsCount(). Error = %j %s`, error, error);
        throw error;
    }
}

const getSubjectDataBySubjectId = async (subjectId) => {
    try {
        logger.debug('getSubjectDataBySubjectId() subjectId: %s', subjectId);
        const _subjectData = await db.subjectsSchema.find({
            subjectId: subjectId,
            deleted: false
        });
        const finalRes = {
            data: _subjectData,
        };
        return finalRes;
    } catch (error) {
        logger.warn(`Error while getSubjectDataBySubjectId(). Error = %j %s`, error, error);
        throw error;
    }
}

const editSubjectsData = async (reqPayload, subjectsId, userCode) => {
    try {
        logger.debug('editSubjectsData() reqPayload: %j, subjectsId: %s, userCode: %s', reqPayload, subjectsId, userCode);


        const subjectsData = await db.subjectsSchema.find({
            subjects_id: subjectsId,
            deleted: false,
            // status: 1,
            active: true,
        });
        if (subjectsData && subjectsData.length <= 0) {
            return subjectsData;
        }
        const response = await db.subjectsSchema.updateOne({
            subjects_id: subjectsId
        }, {
            $set: {
                subjects_name: reqPayload.subjects_name,
                subjects_code: reqPayload.subjects_code,
                subjects_type: reqPayload.subjects_type,
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
        logger.warn(`Error while editSubjectsData(). Error = %j %s`, error, error);
        throw error;
    }
};

const returnSubjectsData = async (subjectsCode, userCode) => {
    try {
        logger.debug('returnSubjectsData() subjectsCode: %s, userCode: %s', subjectsCode, userCode);


        const subjectsData = await db.subjectsSchema.find({
            subjects_code: subjectsCode,
            deleted: false,
            is_return: false
        });
        if (subjectsData && subjectsData.length <= 0) {
            return subjectsData;
        }
        const response = await db.subjectsSchema.findOneAndUpdate({
            subjects_code: subjectsCode
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
        // console.log('returnSubjectsData--->', response);
        return response;
    } catch (error) {
        logger.warn(`Error while returnSubjectsData(). Error = %j %s`, error, error);
        throw error;
    }
};

const soldOutSubjectsData = async (subjectsCode, userCode) => {
    try {
        logger.debug('returnSubjectsData() subjectsCode: %s, userCode: %s', subjectsCode, userCode);


        const subjectsData = await db.subjectsSchema.find({
            subjects_code: subjectsCode,
            deleted: false,
            is_return: false
        });
        if (subjectsData && subjectsData.length <= 0) {
            return subjectsData;
        }
        return subjectsData;
    } catch (error) {
        logger.warn(`Error while returnSubjectsData(). Error = %j %s`, error, error);
        throw error;
    }
};

const deleteSubjectsData = async (subjectsId, userCode) => {
    try {
        logger.debug('deleteSubjectsData() subjectsId: %s userCode: %s', subjectsId, userCode);


        const subjectsData = await db.subjectsSchema.find({
            subjects_id: subjectsId,
            deleted: false,
            active: true,
        })
        if (subjectsData && subjectsData.length <= 0) {
            return subjectsData;
        }
        const response = await db.subjectsSchema.updateOne({
            subjects_id: subjectsId,
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
        logger.warn(`Error while deleteSubjectsData(). Error = %j %s`, error, error);
        throw error;
    }
};

const deleteSubjectsDataByGameCode = async (gameCode, userCode) => {
    try {
        logger.debug('deleteSubjectsData() gameCode: %s userCode: %s', gameCode, userCode);


        const subjectsData = await db.subjectsSchema.find({
            game_code: gameCode,
            deleted: false,
            active: true,
        })
        if (subjectsData && subjectsData.length <= 0) {
            return subjectsData;
        }
        const response = await db.subjectsSchema.updateOne({
            game_code: gameCode,
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
        logger.warn(`Error while deleteSubjectsData(). Error = %j %s`, error, error);
        throw error;
    }
};

const updateSubjectsTicketCountData = async (subjectsCode, userCode) => {
    try {
        logger.debug('editSubjectsData() subjectsId: %s, userCode: %s', subjectsCode, userCode);


        const subjectsData = await db.subjectsSchema.find({
            subjects_code: subjectsCode,
            deleted: false,
        });
        if (subjectsData && subjectsData.length <= 0) {
            return subjectsData;
        }
        let ticketSoldCount = subjectsData[0].ticket_remaining - 1;
        const response = await db.subjectsSchema.findOneAndUpdate({
            subjects_code: subjectsCode
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
        logger.warn(`Error while editSubjectsData(). Error = %j %s`, error, error);
        throw error;
    }
};

const getPipelineQuery = async (subjectsId) => {
    let aggregatePipeline = [];
    let sortSubjects = {
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

    if (subjectsId) {
        matchQuery['$and'].push({
            subjects_id: {
                $eq: subjectsId
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
            localField: 'subjects_code',
            foreignField: 'subjects_code',
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
    groupQuery["_id"] = "$subjects_code";
    groupQuery["subjects_id"] = {
        $first: "$subjects_id"
    };
    groupQuery["subjects_code"] = {
        $first: "$subjects_code"
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
            // subjects_code: "$tickets.subjects_code",
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
            subjects_id: 1,
            subjects_type: 1,
            subjects_name: 1,
            subjects_code: 1,
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
        $sort: sortSubjects
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
    insertSubjectsData,
    getSubjectsData,
    getSubjectsCount,
    getSubjectDataBySubjectId,
    editSubjectsData,
    deleteSubjectsData,
    updateSubjectsTicketCountData,
    returnSubjectsData,
    soldOutSubjectsData,
    deleteSubjectsDataByGameCode,
    // getSubjectsDataByGameCode
}