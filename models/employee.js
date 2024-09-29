/* mongoDB schema configuration for users */
'use strict'

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require('mongoose-long')(mongoose);
const SchemaTypes = mongoose.Schema.Types;
const {
    autoIncrement
} = require('../lib/utils');

var EmployeeSchema = new Schema({
    emp_id: {
        type: Number,
        required: true
    },
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    emp_code: {
        type: String,
        required: true
    },
    secret_code: {
        type: String,
        required: true
    },
    shop_code: {
        type: String,
        required: true
    },
    phone_number: {
        type: String,
        required: true
    },
    shop_id: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        default: ''
    },
    status: {
        type: Number,
        default: 1
    },
    date: {
        type: Number,
        default: new Date().getTime()
    },
    active: {
        type: Boolean,
        default: false
    },
    device_token: {
        type: String,
        default: ''
    },
    deleted: {
        type: Boolean,
        default: false
    },
    deleted_by: {
        type: Number,
        ref: 'users',
    },
    updated_by: {
        type: Number,
        ref: 'users',
    },
    ts_deleted_date: {
        type: Number,
        default: null
    },
    ts_last_update: {
        type: Number,
        default: new Date().getTime()
    },
    timezone: {
        type: String
    },
}, {
    versionKey: false
}).index({
    emp_code: 1
}, {
    unique: true
});

EmployeeSchema.plugin(autoIncrement.plugin, {
    model: 'employees',
    field: 'emp_id',
    startAt: 1
});

module.exports = mongoose.model('employees', EmployeeSchema);