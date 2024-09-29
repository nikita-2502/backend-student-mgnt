'use strict';

require('../models/transaction');
const { final } = require('pino');
const {
    pino,
    connect,
} = require('./../lib/utils');
const logger = pino({
    level: 'debug'
});

const getReportData = async (payload) => {
    const transactionData = await getTransactionData(payload);
    const bundleReceivedData = await getBundlesReceivedData(payload);
    const ticketNotScannedData = await getTicketsNotScannedData(payload);
    const bundleActivatedData = await getBundlesActivatedData(payload);
    const updatedTransactionData = await getTransactionAmountCalculated(transactionData);
    const finalRes = {
        transactionData: updatedTransactionData,
        bundleReceivedData: bundleReceivedData,
        ticketNotScannedData: ticketNotScannedData,
        bundleActivatedData: bundleActivatedData
    };
    return finalRes;
}

const getTransactionData = async (payload) => {
    return new Promise(async (resolve, reject) => {
        (async () => {
            try {
                logger.debug('getTransactionReportData()');

                const transactionDataModel = db.model('transactions');
                let aggregatePipeline = [{
                    '$match': {
                        '$and': [{
                            'deleted': false
                        },
                        {
                            'ts_created_date': {
                                '$gte': payload.start_date
                            }
                        },
                        {
                            'ts_created_date': {
                                '$lte': payload.end_date
                            }
                        }
                        ]
                    }
                },
                {
                    '$sort': {
                        '_id': 1
                    }
                }
                ];

                const response = await transactionDataModel.aggregate(aggregatePipeline);
                resolve(response);
            } catch (error) {
                logger.warn(`Error while getTransactionReportData(). Error = %j %s`, error, error);
                reject(error);
            }
        })()
    });

};

const getBundlesReceivedData = async (payload) => {
    return new Promise(async (resolve, reject) => {
        (async () => {
            try {
                logger.debug('getBundlesReceivedData()');

                const bundleDataModel = db.model('bundles');
                let aggregatePipeline = [{
                    '$match': {
                        '$and': [{
                            'deleted': false
                        },
                        {
                            'is_return': false
                        },
                        {
                            'date': {
                                '$gte': payload.start_date
                            }
                        },
                        {
                            'date': {
                                '$lte': payload.end_date
                            }
                        }
                        ]
                    }
                },
                {
                    '$sort': {
                        'bundle_id': 1
                    }
                }
                ];

                const response = await bundleDataModel.aggregate(aggregatePipeline);
                resolve(response);
            } catch (error) {
                logger.warn(`Error while getBundlesReceivedData(). Error = %j %s`, error, error);
                reject(error);
            }
        })()
    });
};

const getTicketsNotScannedData = async (payload) => {
    return new Promise(async (resolve, reject) => {
        (async () => {
            try {
                logger.debug('getTicketsNotScannedData()');

                const ticketsDataModel = db.model('tickets');
                let aggregatePipeline = [{
                    '$match': {
                        '$and': [{
                            'deleted': false
                        },
                        {
                            'is_sold': false
                        },
                        {
                            'date': {
                                '$gte': payload.start_date
                            }
                        },
                        {
                            'date': {
                                '$lte': payload.end_date
                            }
                        }
                        ]
                    }
                },
                {
                    '$sort': {
                        '_id': 1
                    }
                }
                ];

                const response = await ticketsDataModel.aggregate(aggregatePipeline);
                resolve(response);
            } catch (error) {
                logger.warn(`Error while getTicketsNotScannedData(). Error = %j %s`, error, error);
                reject(error);
            }
        })()
    });
};

const getBundlesActivatedData = async (payload) => {
    return new Promise(async (resolve, reject) => {
        (async () => {
            try {
                logger.debug('getBundlesActivatedData()');

                const bundleDataModel = db.model('bundles');
                let aggregatePipeline = [{
                    '$match': {
                        '$and': [{
                            'deleted': false
                        },
                        {
                            'active': true
                        },
                        {
                            'date': {
                                '$gte': payload.start_date
                            }
                        },
                        {
                            'date': {
                                '$lte': payload.end_date
                            }
                        }
                        ]
                    }
                },
                {
                    '$sort': {
                        'bundle_id': 1
                    }
                }
                ];

                const response = await bundleDataModel.aggregate(aggregatePipeline);
                console.log('response--->', response);
                resolve(response);
            } catch (error) {
                logger.warn(`Error while getBundlesActivatedData(). Error = %j %s`, error, error);
                reject(error);
            }
        })()
    });

};

const getTransactionAmountCalculated = async (transactionData) => {
    let scratchOffData = {
        type: 'ScratchOff',
        amount: 0
    };
    let onlineData = {
        type: 'OnLine',
        amount: 0
    };;
    let lotteryPayoutData = {
        type: 'LotteryPayout',
        amount: 0
    };;
    transactionData.forEach(element => {
        element.transaction_data.forEach(ele => {
            if (ele.type == 'ScratchOff') {
                scratchOffData.amount += ele.amount;
            } else if (ele.type == 'OnLine') {
                onlineData.amount += ele.amount;
            } else if (ele.type == 'LotteryPayout') {
                lotteryPayoutData.amount += ele.amount;
            }
        });
    });

    const finalRes = {
        scratchOffData: scratchOffData,
        onlineData: onlineData,
        totallotteryPayoutAmoulotteryPayoutDatantAmount: lotteryPayoutData
    }
    return finalRes;
}


module.exports = {
    getReportData,
};