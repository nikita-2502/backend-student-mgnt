const userService = require('../services/user');
const httpStatusCode = require('http-status-codes');
const { responseGenerators, bcrypt, generateToken, pino } = require('./../lib/utils');
const logger = pino({ level: 'debug' });
const BaseJoi = require('joi');
const Extension = require('@hapi/joi-date');
const Joi = BaseJoi.extend(Extension);

const userSchema = Joi.object().keys({
    // first_name: Joi.string().min(3).max(30).required(),
    // last_name: Joi.string().min(3).max(30).required(),
    // username: Joi.string().min(3).max(30).required(),
    password: Joi.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s).{6,12}$/).required(),
    email: Joi.string().min(3).max(30).regex(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/).required(),
});

const userSignup = async (req, res) => {
    try {
        console.log('body: ', req.body);
        const joiValidate = await userSchema.validate(req.body);
        if (joiValidate && joiValidate.length != -1) {
            req.body.password = bcrypt.hashSync(req.body.password, 10);
            const response = await userService.insertUserData(req.body);
            if (Array.isArray(response) && response.length > 0) {
                const token = generateToken(response[0], response[0].userId);
                return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'User registered successfully', false, token));
            }
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, response, true));
        } else {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'Invalid body', true));
        }
    } catch (error) {
        logger.warn(`Error while registering user. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while user signup', true));
    }
};

const userLogin = async (req, res) => {
    try {
        // console.log('body: ', req.body);
        const response = await userService.userLogin(req.body)
        console.log('response', response)
        if (response && response.data.length > 0) {
            const token = generateToken(response.data[0], response.data[0].userId)
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'User logged in successfully', false, token));
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, response, false))
    } catch (error) {
        logger.warn(`Error while loging user. Error: %j %s`, error, error)
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while user login', true))
    }
}

const getUserData = async (req, res) => {
    try {
        const response = await userService.getUsersData();
        if (response && response.length <= 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No user exist..!', false))
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'Users data fetched successfully', false));
    } catch (error) {
        logger.warn(`Error while fetch users data. Error: %j %s`, error, error);
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while fetch users data', true))
    }
}

const getUserDataByUserCode = async (req, res) => {
    try {
        const adminCode = req.params.admin_code;
        const response = await userService.getUserDataByUserCode(adminCode);
        if (response && response.length <= 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No user exist..!', false))
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators(response, httpStatusCode.StatusCodes.OK, 'User data fetched successfully', false))
    } catch (error) {
        logger.warn(`Error while fetch user data. Error: %j %s`, error, error)
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while fetch user data', true))
    }
}

const editUserData = async (req, res) => {
    try {
        const admin_code = req.body.admin_code;
        const response = await userService.editUserData(req.body, admin_code);
        if (response && response.length <= 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No user exist..!', false))
        }
        if (response.nModified === 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No user detail updated', false))
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'User detail updated successfully', false))
    } catch (error) {
        logger.warn(`Error while update user. Error: %j %s`, error, error)
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while update user detail', true))
    }
}

const deleteUserData = async (req, res) => {
    try {
        const userId = Number(req.query.userId);
        const userCode = Number(req.headers.user_code);
        const response = await userService.deleteUserData(userId, userCode);
        if (response && response.length <= 0) {
            return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'No user detail deleted', false))
        }
        return res.status(httpStatusCode.StatusCodes.OK).send(responseGenerators({}, httpStatusCode.StatusCodes.OK, 'User detail deleted successfully', false))
    } catch (error) {
        logger.warn(`Error while delete user detail. Error: %j %s`, error, error)
        return res.status(httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR).send(responseGenerators({}, httpStatusCode.StatusCodes.INTERNAL_SERVER_ERROR, 'Error while delete user detail', true))
    }
}

module.exports = {
    userSignup,
    userLogin,
    getUserData,
    editUserData,
    deleteUserData,
    getUserDataByUserCode
}