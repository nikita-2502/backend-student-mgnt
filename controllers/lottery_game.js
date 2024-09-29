const lotteryGameService = require('../services/lottery_game');
const bundleService = require('../services/subjects');
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
var formidable = require('formidable');
// const upload = require('../middlewares/upload');
const AWS = require('aws-sdk');
let multer = require('multer');
let multerS3 = require('multer-s3');
let aws = require('../lib/aws-config');
const s3 = new AWS.S3({
    accessKeyId: aws.config.accessKeyId,
    secretAccessKey: aws.config.aws.awsCredentials,
    Bucket: aws.config.aws.awsBucket,
    ACL: 'public-read'
});

// const lotteryGameSchema = Joi.object().keys({
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

const addLotteryGame = async (req, res) => {
    try {
        const userCode = req.headers.user_code;
        req.body.lotteryData['created_by'] = userCode;
        const payload = req.body.bundleData;
        const response = await lotteryGameService.insertLotteryGameData(req.body.lotteryData);
        const [bundlePayload, ticketPayload] = await generateBundlePayload(payload, userCode);
        if (Array.isArray(response) && response.length == 0) {
            // return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'Lottery game data added successfully', false));
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, response, true));
        }
        await addBundleData(req, res, bundlePayload, ticketPayload, response, userCode);
    } catch (error) {
        logger.warn(`Error while adding lottery game. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while adding lottery game', true));
    }
};

const addLotteryGameFileUplaod = async (req, res) => {
    try {
        const userCode = req.headers.user_code || 0;
        let fileName = 'gameLogo-' + Date.now() + '.png';
        let upload = await multer({
            storage: multerS3({
                s3: s3,
                bucket: aws.config.aws.awsBucket,
                key: function (req, file, cb) {
                    cb(null, 'icons/' + fileName);
                },
                acl: 'public-read',
                contentType: multerS3.AUTO_CONTENT_TYPE,
                metadata: function (req, file, cb) {
                    cb(null, {
                        fieldName: file.fieldname
                    });
                }
            })
        }).single('file');

        try {
            upload(req, res, async function (err) {
                if (err) {
                    // console.log('err---->', err);
                    return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(err, httpStatusCode.StatusCodes.OK, 'error at @upload_game_logo', true));
                } else {
                    const lotteryData = await lotteryGameService.getLotteryGameDataByCode(req.body['game_code']);
                    // console.log('data----->', lotteryData);
                    if (lotteryData && lotteryData.length > 0) {
                        if (res && res.req && res.req.file && res.req.file.location) {
                            console.log('filename---->', fileName);
                            var params = {
                                Bucket: aws.config.aws.awsBucket,
                                Delete: { // required
                                    Objects: [ // required
                                        {
                                            Key: 'icons/' + fileName // required
                                        }
                                    ]
                                }
                            };
                            s3.deleteObjects(params, function (err1, data) {
                                if (data) {
                                    console.log("File deleted successfully");
                                } else {
                                    console.log("Check if you have sufficient permissions : " + err1);
                                }
                            });
                        }
                        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'Game already exists!', true));
                    } else {
                        if (res && res.req && res.req.file && res.req.file.location) {
                            const json = {
                                imageUrl: res.req.file.location,
                                imageName: fileName,
                                orignalImageName: res.req.file.originalname,
                                key: res.req.file.key,
                                bucketName: res.req.file.bucket,
                            };
                            console.log('res.req.file--->', res.req.file);
                            req.body['created_by'] = userCode;
                            req.body['game_logo'] = json;
                            const response = await lotteryGameService.insertLotteryGameData(req.body);
                            if (Array.isArray(response) && response.length > 0) {
                                return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'Lottery game data added successfully', false));
                            } else {
                                return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, response, false));
                            }
                        } else {
                            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(err, httpStatusCode.StatusCodes.OK, 'Error at upload game logo', true));
                        }
                    }
                }
            });
            //  if (!uploadValue) {
            //                 return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'Kindly select a file to upload..!!', true));
            // }

        } catch (e) {
            console.log('error at @upload_game_logo', e);
        }
        // return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, '', true));
    } catch (error) {
        logger.warn(`Error while adding lottery game. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while adding lottery game', true));
    }
};

const getAllLotteryGameData = async (req, res) => {
    try {
        const response = await lotteryGameService.getLotteryGameData();
        if (response && response.length <= 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No game exist..!', true));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'Data fetched successfully', false));
    } catch (error) {
        logger.warn(`Error while fetch data. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while fetch data', true));
    }
};

const getLotteryGameDataByGameCode = async (req, res) => {
    try {
        const gameCode = req.params.game_code;
        const response = await lotteryGameService.getLotteryGameDataByCode(gameCode);
        if (response && response.length <= 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No data exist..!', true));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response[0], httpStatusCode.StatusCodes.OK, 'Data fetched successfully', false));
    } catch (error) {
        logger.warn(`Error while fetch data. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while fetch data', true));
    }
};

const editLotteryGameData = async (req, res) => {
    try {
        const userCode = Number(req.headers.user_code);
        const gameId = Number(req.body.gameId);
        const response = await lotteryGameService.editLotteryGameData(req.body, gameId, userCode);
        if (response && response.length <= 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No data exist..!', true));
        }
        if (response.nModified === 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No game detail updated', false));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'Game detail updated successfully', false));
    } catch (error) {
        logger.warn(`Error while update game. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while update game detail', true));
    }
};

const deleteLotteryGameData = async (req, res) => {
    try {
        const gameId = Number(req.query.gameId);
        const userCode = Number(req.headers.user_code);
        const response = await lotteryGameService.deleteLotteryGameData(gameId, userCode);
        if (response && response.length <= 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No detail deleted', true));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'Game detail deleted successfully', false));
    } catch (error) {
        logger.warn(`Error while delete game detail. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while delete game detail', true));
    }
};

const activeLotteryGame = async (req, res) => {
    try {
        const userCode = Number(req.headers.user_code);
        const gameCode = Number(req.body.game_code);
        const response = await lotteryGameService.activeLotteryGameData(req.body, gameCode, userCode);
        if (response && response.length <= 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No data exist..!', true));
        }
        if (response.nModified === 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No game is activated', true));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'Game activated successfully', false));
    } catch (error) {
        logger.warn(`Error while update game. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while activating game', true));
    }
};

const addBundleData = async (req, res, bundlePayload, ticketPayload, response, userCode) => {
    try {
        // console.log('response--->', response);
        const bundleArr = [];
        for (let index = 0; index < bundlePayload.length; index++) {
            const bundleResponse = await bundleService.insertBundleData(bundlePayload[index]);
            // console.log('bundleResponse--->', bundleResponse);
            if (Array.isArray(bundleResponse) && bundleResponse.length === 0) {
                bundleArr.push(bundleResponse)
            }
        }
        // console.log('bundleArr---->', bundleArr);
        if (Array.isArray(bundleArr) && bundleArr.length > 0) {
            const ticketResponse = await ticketService.insertTicketData(ticketPayload);
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'Lottery game data added successfully', false));
        } else if (Array.isArray(bundleArr) && bundleArr.length === 0) {
            const gameId = Number(response[0].game_id);
            const deleteGameResponse = await lotteryGameService.deleteLotteryGameData(gameId, userCode);
            const deleteBundleResponse = await bundleService.deleteBundleDataByGameCode(response[0].game_code, userCode);
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'Game already exists', true));
        }
    } catch (error) {
        logger.warn(`Error while adding data. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while adding data', true));
    }
};

const generateBundlePayload = async (payload, userCode) => {
    const bundleBody = [];
    const ticketBody = [];
    for (let i = 0; i < payload.length; i++) {
        const ticketCount = payload[i].ticket_count;
        let bundleObj = {};
        bundleObj['game_code'] = payload[i].game_code;
        bundleObj['bundle_code'] = payload[i].bundle_code;
        bundleObj['ticket_count'] = payload[i].ticket_count;
        bundleObj['created_by'] = userCode;
        for (let j = 0; j < ticketCount; j++) {
            let ticketObj = {};
            let ticketCode = parseInt(payload[i].ticket_last_code) - j;
            ticketObj['game_id'] = payload[i].game_id;
            ticketObj['game_code'] = payload[i].game_code;
            ticketObj['bundle_code'] = payload[i].bundle_code;
            ticketObj['ticket_code'] = ticketCode;
            ticketObj['created_by'] = userCode;
            ticketBody.push(ticketObj);
        }
        bundleBody.push(bundleObj);
    }
    return [bundleBody, ticketBody];
};

module.exports = {
    addLotteryGame,
    getAllLotteryGameData,
    editLotteryGameData,
    deleteLotteryGameData,
    getLotteryGameDataByGameCode,
    addLotteryGameFileUplaod,
    activeLotteryGame,
    addBundleData,
}