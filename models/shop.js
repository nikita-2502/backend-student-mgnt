/* mongoDB schema configuration for users */
'use strict'

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require('mongoose-long')(mongoose);
const SchemaTypes = mongoose.Schema.Types;
const {
    autoIncrement
} = require('../lib/utils');

const ShopSchema = new Schema({
    shop_id: {
        type: Number,
        required: true
    },
    shop_name: {
        type: String,
        required: true
    },
    shop_code: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    admin_id: {
        type: Number,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    phone_number: {
        type: String,
        required: true
    },
    date: {
        type: Number,
        default: new Date().getTime()
    },
    sales_commission: {
       type: Number,
        default: ''
    },
    paid_out_commission: {
        type: Number,
        default: ''
    },
    secret_code: {
        type: String,
        default: ''
    },
    full_address: {
        address: {
            type: String,
            default: ''
        },
        state: {
            type: String,
            default: ''
        },
        city: {
            type: String,
            default: ''
        },
        zip: {
            type: String,
            default: ''
        }
    },
    active: {
        type: Boolean,
        default: true
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
    created_by: {
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
    shop_code: 1,
}, {
    unique: true
});

ShopSchema.plugin(autoIncrement.plugin, {
    model: 'shops',
    field: 'shop_id',
    startAt: 1
});

module.exports = mongoose.model('shops', ShopSchema);