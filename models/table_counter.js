/* mongoDB schema configuration for users */
'use strict'

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require('mongoose-long')(mongoose);
const SchemaTypes = mongoose.Schema.Types;
const {
    autoIncrement
} = require('../lib/utils');

const TableCounterSchema = new Schema({
    table_id: {
        type: Number,
        required: true
    },
    table_code: {
        type: String,
        required: false
    },
    bundle_code: {
        type: String,
        ref: 'bundles',
        default: null
    },
    game_code: {
        type: String,
        ref: 'lottery_games',
        default: null
    },
    is_available: {
        type: Boolean,
        default: true
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
    table_code: 1,
    table_id: 1
}, {
    unique: true
});

TableCounterSchema.plugin(autoIncrement.plugin, {
    model: 'table_counter',
    field: 'table_id',
    startAt: 1
});

module.exports = mongoose.model('table_counters', TableCounterSchema);