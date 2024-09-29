'use strict';

require('../models/shop');
const {
    pino,
    connect,
    bcrypt
} = require('./../lib/utils');
const logger = pino({
    level: 'debug'
});

const insertShopData = async (reqPayload) => {
    try {
        logger.debug('insertShopData() reqPayload: %j', reqPayload);

        const shopDataModel = db.model('shops');
        const shopData = await shopDataModel.find({
            shop_code: reqPayload.shop_code
        });
        if (shopData.length > 0) {
            return 'Shop already exists';
        }
        const response = await shopDataModel.insertMany(reqPayload);
        return response;
    } catch (error) {
        logger.warn(`Error while insertShopData(). Error = %j %s`, error, error);
        throw error;
    }
};

const shopLogin = async (reqPayload) => {
    try {
        logger.debug('shopLogin() reqPayload: %j', reqPayload);

        const shopDataModel = db.model('shops');
        const shopData = await shopDataModel.find({
            shop_code: reqPayload.shop_code
        })
        if (shopData.length === 0) {
            return 'Shop not exists, Please register !';
        }
        if (!bcrypt.compareSync(reqPayload.password, shopData[0].password)) {
            return 'The password is invalid';
        }
        const aggregareQuery = await getPipelineQuery(shopData[0].shop_code, null);
        const response = await shopDataModel.aggregate(aggregareQuery);
        const finalRes = {
            shopData: response,
            // totalCount: responseCount
        };
        return response;
    } catch (error) {
        logger.warn(`Error while shopLogin(). Error = %j %s`, error, error);
        throw error;
    }
};


const getShopData = async () => {
    try {
        logger.debug('getShopData()');

        const shopDataModel = db.model('shops');
        const aggregareQuery = await getPipelineQuery(null, null);
        let aggregatecount = aggregareQuery.concat([{
            $count: "total_data",
        },]);
        const responseCount = await shopDataModel.aggregate(aggregatecount);
        if (responseCount < 0) {
            return responseCount;
        }
        const response = await shopDataModel.aggregate(aggregareQuery);
        const finalRes = {
            shopData: response,
            totalCount: responseCount
        };
        return finalRes;
    } catch (error) {
        logger.warn(`Error while getShopData(). Error = %j %s`, error, error);
        throw error;
    }
}

const getShopDataByCode = async (shopCode) => {
    try {
        logger.debug('getShopDataByCode() shopCode: %s', shopCode);

        const shopDataModel = db.model('shops');
        const aggregareQuery = await getPipelineQuery(shopCode, null);
        const response = await shopDataModel.aggregate(aggregareQuery);
        return response;
    } catch (error) {
        logger.warn(`Error while getShopDataByCode(). Error = %j %s`, error, error);
        throw error;
    }
};

const getShopDataByAdminId = async (adminId) => {
    try {
        logger.debug('getShopDataByCode() adminId: %s', adminId);

        const shopDataModel = db.model('shops');
        const aggregareQuery = await getPipelineQuery(null, adminId);
        const response = await shopDataModel.aggregate(aggregareQuery);
        return response;
    } catch (error) {
        logger.warn(`Error while getShopDataByCode(). Error = %j %s`, error, error);
        throw error;
    }
};

const editShopData = async (reqPayload, shopCode) => {
    try {
        logger.debug('editShopData() reqPayload: %j, shopCode: %s', reqPayload, shopCode);

        const shopDataModel = db.model('shops');
        const shopData = await shopDataModel.find({
            shop_code: shopCode,
            deleted: false,
            // status: 1,
            // active: true,
        });
        if (shopData && shopData.length <= 0) {
            return shopData;
        }
        const response = await shopDataModel.updateOne({
            shop_code: shopCode,
        }, {
            $set: {
                shop_name: reqPayload.shop_name,
                full_address: reqPayload.full_address,
                sales_commission: reqPayload.sales_commission,
                paid_out_commission: reqPayload.paid_out_commission,
                email: reqPayload.email,
                phone_number: reqPayload.phone_number,
                ts_last_update: new Date().getTime()
            }
        }, {
            upsert: true,
            new: true,
        });
        return response;
    } catch (error) {
        logger.warn(`Error while editShopData(). Error = %j %s`, error, error);
        throw error;
    }
};


const deleteShopData = async (shopCode, userCode) => {
    try {
        logger.debug('deleteShopData() shopCode: %s userCode: %s', shopCode, userCode);

        const shopDataModel = db.model('shops');
        const shopData = await shopDataModel.find({
            shop_code: shopCode,
            deleted: false,
            // active: true,
        })
        if (shopData && shopData.length <= 0) {
            return 'No Data Exist..!';
        }
        const response = await shopDataModel.updateOne({
            shop_code: shopCode,
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
        logger.warn(`Error while deleteShopData(). Error = %j %s`, error, error);
        throw error;
    }
};

const getPipelineQuery = async (shopCode, adminId) => {
    let aggregatePipeline = [];
    let sortShop = {
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

    if (shopCode) {
        matchQuery['$and'].push({
            shop_code: {
                $eq: shopCode
            }
        });
    }

    if (adminId) {
        matchQuery['$and'].push({
            admin_id: {
                $eq: adminId
            }
        });
    }
    aggregatePipeline.push({
        $match: matchQuery
    });

    aggregatePipeline.push({
        $lookup: {
            from: 'employees',
            let: {
                shopId: '$shop_id'
            },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [{
                                $eq: ['$shop_id', '$$shopId']
                            }]
                        }
                    },
                },
                {
                    $group: {
                        '_id': '$emp_code',
                        emp_id: {
                            $first: '$emp_id'
                        },
                        first_name: {
                            $first: '$first_name'
                        },
                        last_name: {
                            $first: '$last_name'
                        },
                        emp_code: {
                            $first: '$emp_code'
                        },
                        secret_code: {
                            $first: '$secret_code'
                        },
                        active: {
                            $first: '$active'
                        },
                        mobile_phone: {
                            $first: '$mobile_phone'
                        },
                        date: {
                            $first: '$date'
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        emp_id: 1,
                        // employeeData: 1,
                        first_name: 1,
                        last_name: 1,
                        emp_code: 1,
                        secret_code: 1,
                        active: 1,
                        mobile_phone: 1,
                        date: 1
                    }
                }
            ],
            as: 'employees'
        }
    },
        {
            $unwind: {
                path: "$employees",
                preserveNullAndEmptyArrays: true
            }
        }
    );

    aggregatePipeline.push({
        $lookup: {
            from: 'lottery_games',
            let: {
                shopCode: '$shop_code'
            },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [{
                                $eq: ['$shop_code', '$$shopCode']
                            }]
                        }
                    }
                }, {
                    $group: {
                        '_id': '$game_code',
                        game_code: {
                            $first: '$game_code'
                        },
                        game_name: {
                            $first: '$game_name'
                        },
                        game_type: {
                            $first: '$game_type'
                        },
                        game_cost: {
                            $first: '$game_cost'
                        },
                        game_id: {
                            $first: '$game_id'
                        },
                        date: {
                            $first: '$date'
                        }
                    }
                }, {
                    $project: {
                        _id: 0,
                        game_code: 1,
                        // employeeData: 1,
                        game_name: 1,
                        game_type: 1,
                        game_cost: 1,
                        game_id: 1,
                        date: 1
                    }
                }
            ],
            as: 'lottery_games'
        }
    },
        // {
        //     $unwind: {
        //         path: "$lottery_games",
        //         // preserveNullAndEmptyArrays: true
        //     }
        // }
    );


    // aggregatePipeline.push({
    //     $unwind: {
    //         path: "$bundles",
    //         preserveNullAndEmptyArrays: true
    //     }
    // });

    // aggregatePipeline.push({
    //     $lookup: {
    //         from: 'employees',
    //         localField: 'shop_code',
    //         foreignField: 'shop_code',
    //         as: 'employees'
    //     },
    // });
    // aggregatePipeline.push({
    //     $unwind: {
    //         path: "$employees",
    //         preserveNullAndEmptyArrays: true
    //     }
    // });

    // aggregatePipeline.push({
    //     $lookup: {
    //         from: 'lottery_games',
    //         localField: 'shop_code',
    //         foreignField: 'shop_code',
    //         as: 'lottery_games'
    //     },
    // });
    // aggregatePipeline.push({
    //     $unwind: {
    //         path: "$lottery_games",
    //         preserveNullAndEmptyArrays: true
    //     }
    // });


    const groupQuery = {};
    groupQuery["_id"] = "$shop_code";
    groupQuery["shop_id"] = {
        $first: "$shop_id"
    };
    groupQuery["active"] = {
        $first: "$active"
    };
    groupQuery["date"] = {
        $first: "$date"
    };
    groupQuery["shop_name"] = {
        $first: "$shop_name"
    };
    groupQuery["shop_code"] = {
        $first: "$shop_code"
    };
    groupQuery["full_address"] = {
        $first: "$full_address"
    };
    groupQuery["phone_number"] = {
        $first: "$phone_number"
    };
    groupQuery["email"] = {
        $first: "$email"
    };
    groupQuery["sales_commission"] = {
        $first: "$sales_commission"
    };
    groupQuery["paid_out_commission"] = {
        $first: "$paid_out_commission"
    };

    // groupQuery["employees"] = {
    //     $push: {
    //         emp_id: "$employees.emp_id",
    //         first_name: "$employees.first_name",
    //         last_name: "$employees.last_name",
    //         emp_code: "$employees.emp_code",
    //         secret_code: "$employees.secret_code",
    //         active: "$employees.active",
    //         mobile_phone: "$employees.mobile_phone",
    //         date: "$employees.date"
    //     }
    // };

    groupQuery['employees'] = { $push: "$employees" };

    // groupQuery["lottery_games"] = {
    //     $push: {
    //         game_id: "$lottery_games.game_id",
    //         game_cost: "$lottery_games.game_cost",
    //         game_type: "$lottery_games.game_type",
    //         game_code: "$lottery_games.game_code",
    //         game_name: "$lottery_games.game_name"
    //     }
    // };

    // aggregatePipeline.push({
    //     $group: groupQuery
    // });

    aggregatePipeline.push({
        $project: {
            _id: 0,
            shop_id: 1,
            shop_code: 1,
            full_address: 1,
            phone_number: 1,
            email: 1,
            shop_name: 1,
            sales_commission: 1,
            paid_out_commission: 1,
            date: 1,
            active: 1,
            employees: 1,
            lottery_games: 1,
        },
    });
    aggregatePipeline.push({
        $sort: sortShop
    });

    return aggregatePipeline;
};

module.exports = {
    insertShopData,
    getShopData,
    getShopDataByCode,
    editShopData,
    deleteShopData,
    shopLogin,
    getShopDataByAdminId
}