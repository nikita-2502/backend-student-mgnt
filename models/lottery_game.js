/* mongoDB schema configuration for users */
'use strict'

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require('mongoose-long')(mongoose);
const SchemaTypes = mongoose.Schema.Types;
const {
    autoIncrement
} = require('../lib/utils');

var LotteryGameSchema = new Schema({
    game_id: {
        type: Number,
        required: true
    },
    shop_code: {
        type: String,
        required: true
    },
    game_name: {
        type: String,
        required: true
    },
    game_code: {
        type: String,
        required: true
    },
    game_type: {
        type: String,
        required: true
    },
    game_cost: {
        type: Number,
        required: true
    },
    game_logo: {
        orignalImageName: {
            type: String,
            default: ''
        },
        imageUrl: {
            type: String,
            default: ''
        },
        imageName: {
            type: String,
            default: ''
        },
        key: {
            type: String,
            default: ''
        },
        bucketName: {
            type: String,
            default: ''
        }
    },
    date: {
        type: Number,
        default: new Date().getTime()
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
    game_code: 1,
}, {
    unique: true
});

LotteryGameSchema.plugin(autoIncrement.plugin, {
    model: 'lottery_games',
    field: 'game_id',
    startAt: 1
});

module.exports = mongoose.model('lottery_games', LotteryGameSchema);