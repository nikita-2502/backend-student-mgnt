'use strict';

const {
    pino,
    connect,
    bcrypt
} = require('./../lib/utils');
const logger = pino({
    level: 'debug'
});
const db = require('./../models/schema');

const insertUserData = async (reqPayload) => {
    try {
        logger.debug('insertUserData() reqPayload: %j', reqPayload);


        const user = await db.usersSchema.find({
            $or: [
                {
                    email: reqPayload.email
                },
                // {
                //     username: reqPayload.username
                // }
            ]
        });
        if (user.length > 0) {
            return 'User already exists';
        }
        const response = await db.usersSchema.insertMany(reqPayload);
        return response;
    } catch (error) {
        logger.warn(`Error while insertUserData(). Error = %j %s`, error, error);
        throw error;
    }
}

const userLogin = async (reqPayload) => {
    try {
        logger.debug('userLogin() reqPayload: %j', reqPayload);
        const user = await db.usersSchema.find({
            $and: [
                {
                    email: { $exists: true }
                },
                {
                    email: { $eq: reqPayload.email }
                }
            ]
        })
        if (user.length === 0) {
            return 'User not exists, Please register !';
        }
        if (!bcrypt.compareSync(reqPayload.password, user[0].password)) {
            return 'The password is invalid';
        }
        if (!user[0].isAdmin) {
            return 'User is not admin';
        }
        const finalRes = {
            data: user,
        };
        return finalRes;
    } catch (error) {
        logger.warn(`Error while userLogin(). Error = %j %s`, error, error);
        throw error;
    }
}

const getUsersData = async () => {
    try {
        logger.debug('getUsersData()');


        const responseCount = await db.usersSchema.find({
            deleted: false,
            // status: 1,
            active: true,
        }).count({});
        if (responseCount < 0) {
            return responseCount;
        }
        const response = await db.usersSchema.find({
            deleted: false,
            // status: 1,
            active: true,
        }).sort({
            _id: -1,
        });
        const finalRes = {
            userData: response,
            totalCount: responseCount
        };
        return finalRes;
    } catch (error) {
        logger.warn(`Error while getUsersData(). Error = %j %s`, error, error);
        throw error;
    }
}

const getUserDataByUserCode = async (adminCode) => {
    try {
        logger.debug('getUserDataByUserCode() adminCode: %s', adminCode);


        const response = await db.usersSchema.find({
            admin_code: adminCode,
            deleted: false,
            // status: 1,
            active: true,
        });
        return response;
    } catch (error) {
        logger.warn(`Error while getUserDataByUserCode(). Error = %j %s`, error, error);
        throw error;
    }
}

const editUserData = async (reqPayload, admin_code) => {
    try {
        logger.debug('editUserData() reqPayload: %j, userId: %s, admin_code: %s', reqPayload, admin_code);


        const userData = await db.usersSchema.find({
            admin_code: admin_code,
            deleted: false,
            // status: 1,
            active: true,
        })
        if (userData && userData.length <= 0) {
            return userData;
        }
        const response = await db.usersSchema.updateOne({
            admin_code: admin_code
        }, {
            $set: {
                first_name: reqPayload.first_name,
                last_name: reqPayload.last_name,
                email: reqPayload.email,
                full_address: reqPayload.full_address,
                phone_number: reqPayload.phone_number,
                // gender: reqPayload.gender,
                // dob: reqPayload.dob,
                // updated_by: admin_code,
                ts_last_update: new Date().getTime()
            }
        }, {
            upsert: true,
            new: true,
        });
        return response;
    } catch (error) {
        logger.warn(`Error while editUserData(). Error = %j %s`, error, error);
        throw error;
    }
}


const deleteUserData = async (userId, userCode) => {
    try {
        logger.debug('deleteUserData() userId: %s userCode: %s', userId, userCode);


        const userData = await db.usersSchema.find({
            userId: userId,
            deleted: false,
            // status: 1,
            active: true,
        })
        if (userData && userData.length <= 0) {
            return userData;
        }
        const response = await db.usersSchema.updateOne({
            userId: userId
        }, {
            $set: {
                deleted: true,
                deleted_by: userCode,
                status: 0,
                active: false,
                ts_deleted_date: new Date().getTime()
            }
        }, {
            upsert: true,
            new: true,
        });
        return response;
    } catch (error) {
        logger.warn(`Error while deleteUserData(). Error = %j %s`, error, error);
        throw error;
    }
}

module.exports = {
    insertUserData,
    userLogin,
    getUsersData,
    getUserDataByUserCode,
    editUserData,
    deleteUserData
}