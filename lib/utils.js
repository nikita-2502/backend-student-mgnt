const mongoose = require('mongoose')
const logger = require('pino')({ level: 'debug' });
const jwt = require('jsonwebtoken')

module.exports = {

    pino: require('pino'),
    bcrypt: require("bcryptjs"),
    autoIncrement: require('mongoose-plugin-autoinc'),

    responseGenerators: function (responseData, responseStatusCode, responseStatusMsg, responseErrors, token) {
        const responseJson = {};
        responseJson['data'] = responseData.data ? responseData.data : [];
        responseJson['status'] = responseStatusCode;
        responseJson['message'] = responseStatusMsg;
        // errors
        if (responseErrors === undefined) {
            responseJson['error'] = [];
        } else {
            responseJson['error'] = responseErrors;
        }
        // token
        if (token && token !== undefined) {
            responseJson['token'] = token;
        }
        // count
        if (responseData.count && responseData.count !== undefined) {
            responseJson['count'] = responseData.count;
        }
        // isNextPage
        if (responseData.isNextPage && responseData.isNextPage !== undefined) {
            responseJson['isNextPage'] = responseData.isNextPage;
        }
        return responseJson;
    },

    connect: function (dbName) {
        mongoose.connect(`mongodb://localhost:27017/${dbName}`);
        // mongoose.connect(`mongodb+srv://nilesh:nilesh@development.i4lf4.mongodb.net/${dbName}`, {
        //     useNewUrlParser: true,
        //     useUnifiedTopology: true,
        //     useCreateIndex: true
        // });
        const db = mongoose.connection;
        db.on('error', console.error.bind(console, 'Error while connecting to database:'));
        db.once('open', function () {
            logger.debug('Db connected successfully');
        });
        return db;
    },

    generateToken: function (user, secretKey) {
        user.date = Date.now;
        return jwt.sign({ user: user }, secretKey.toString(), { expiresIn: '12h' });
    }

}
