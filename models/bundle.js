/* mongoDB schema configuration for users */
'use strict'

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require('mongoose-long')(mongoose);
const SchemaTypes = mongoose.Schema.Types;
const {
    autoIncrement
} = require('../lib/utils');

var BundleSchema = new Schema({
    bundle_id: {
        type: Number,
        required: true
    },
    bundle_count: {
        type: Number,
        // required: true
    },
    ticket_count: {
        type: Number,
        required: true
    },
    bundle_code: {
        type: String,
        required: true
    },
    ticket_remaining: {
        type: Number
    },
    game_code: {
        type: String,
        ref: 'lottery_games',
        default: null
    },
    date: {
        type: Number,
        default: new Date().getTime()
    },
    active: {
        type: Boolean,
        default: true
    },
    is_return: {
        type: Boolean,
        default: false
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
    bundle_code: 1
}, {
    unique: false
});

BundleSchema.plugin(autoIncrement.plugin, {
    model: 'bundles',
    field: 'bundle_id',
    startAt: 1
});

module.exports = mongoose.model('bundles', BundleSchema);