/* mongoDB schema configuration for users */
'use strict'

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require('mongoose-long')(mongoose);
const SchemaTypes = mongoose.Schema.Types;
const {
    autoIncrement
} = require('../lib/utils');

var TransactionSchema = new Schema({
    transaction_id: {
        type: Number,
        required: true
    },
    emp_code: {
        type: String,
        required: true
    },
    total_amount: {
        type: Number,
        required: true
    },
    transaction_data: {
        type: [Object],
        required: true
    },
    // transaction_type: {
    //     type: {
    //         type: String
    //     },
    //     amount: {
    //         type: String
    //     }
    // },
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
    ts_created_date: {
        type: Number,
        default: new Date().getTime()
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
    transaction_id: 1
}, {
    unique: true
});

TransactionSchema.plugin(autoIncrement.plugin, {
    model: 'transactions',
    field: 'transaction_id',
    startAt: 1
});

module.exports = mongoose.model('transactions', TransactionSchema);