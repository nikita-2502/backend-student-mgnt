const shopService = require('../services/shop');
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
var formidable = require('formidable')
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


const addShopData = async (req, res) => {
    try {
        req.body.password = bcrypt.hashSync(req.body.password, 10);
        req.body['created_by'] = req.body.admin_id;
        const response = await shopService.insertShopData(req.body);
        if (Array.isArray(response) && response.length > 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'Shop data added successfully', false));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, response, true));
    } catch (error) {
        logger.warn(`Error while adding shop. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while adding shop data', true));
    }
};

const addShopDataFileUplaod = async (req, res) => {
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
                    const lotteryData = await shopService.getShopDataByCode(req.body['game_code']);
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
                            const response = await shopService.insertShopDataData(req.body);
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
const shopLogin = async (req, res) => {
    try {
        const response = await shopService.shopLogin(req.body);
        // console.log('response--->', response);
        if (Array.isArray(response) && response.length > 0) {
            const token = await generateToken(response[0], response[0].shop_code);
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'Shop logged in successfully', false, token));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, response, true));
    } catch (error) {
        logger.warn(`Error while logging shop. Error: %j %s`, error, error)
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while shop login', true));
    }
};

const getAllShopData = async (req, res) => {
    try {
        const response = await shopService.getShopData();
        if (response && response.length <= 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No shop exist..!', true));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'Data fetched successfully', false));
    } catch (error) {
        logger.warn(`Error while fetch data. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while fetch data', true));
    }
};

const getShopDataByShopCode = async (req, res) => {
    try {
        const shopCode = req.params.shop_code;
        const response = await shopService.getShopDataByCode(shopCode);
        if (response && response.length <= 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No data exist..!', true));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response[0], httpStatusCode.StatusCodes.OK, 'Data fetched successfully', false));
    } catch (error) {
        logger.warn(`Error while fetch data. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while fetch data', true));
    }
};

const getShopDataByAdminId = async (req, res) => {
    try {
        const adminId = Number(req.params.admin_id);
        const response = await shopService.getShopDataByAdminId(adminId);
        if (response && response.length <= 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No data exist..!', true));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response[0], httpStatusCode.StatusCodes.OK, 'Data fetched successfully', false));
    } catch (error) {
        logger.warn(`Error while fetch data. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while fetch data', true));
    }
};

const editShopData = async (req, res) => {
    try {
        // const userCode = Number(req.headers.user_code);
        const shopCode = req.body.shop_code;
        const response = await shopService.editShopData(req.body, shopCode);
        if (response && response.length <= 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No data exist..!', true));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'Shop detail updated successfully', false));
    } catch (error) {
        logger.warn(`Error while update. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while update detail', true));
    }
};

const deleteShopData = async (req, res) => {
    try {
        const shopId = Number(req.query.shopId);
        const userCode = Number(req.headers.user_code);
        const response = await shopService.deleteShopData(shopId, userCode);
        if (response && response.length <= 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No detail deleted', true));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'Data deleted successfully', false));
    } catch (error) {
        logger.warn(`Error while delete. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while delete.', true));
    }
};


module.exports = {
    addShopData,
    getAllShopData,
    editShopData,
    deleteShopData,
    getShopDataByShopCode,
    getShopDataByAdminId,
    addShopDataFileUplaod,
    shopLogin,
}