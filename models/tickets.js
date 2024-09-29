/* mongoDB schema configuration for users */
'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require('mongoose-long')(mongoose);
const SchemaTypes = mongoose.Schema.Types;
const {
    autoIncrement
} = require('../lib/utils');

var TicketSchema = new Schema({
    ticket_id: {
        type: Number,
        required: true
    },
    // ticket_name: {
    //     type: String,
    //     // required: true
    // },
    ticket_code: {
        type: String,
        required: true
    },
    ticket_type: {
        type: String,
        // required: true
        default: ''
    },
    // game_id: {
    //     type: Number,
    //     ref: 'lottery_games',
    //     required: true
    //     // default: null
    // },
    game_code: {
        type: String,
        ref: 'lottery_games',
        required: true
        // default: null
    },
    // bundle_id: {
    //     type: Number,
    //     ref: 'bundles',
    //     required: true
    //     // default: null
    // },
    bundle_code: {
        type: String,
        ref: 'bundles',
        required: true
        // default: null
    },
    date: {
        type: Number,
        default: new Date().getTime()
    },
    active: {
        type: Boolean,
        default: true
    },
    is_sold: {
        type: Boolean,
        default: false
    },
    is_return: {
        type: Boolean,
        default: false
    },
    is_missing: {
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
    ticket_code: 1
}, {
    unique: false
});

TicketSchema.plugin(autoIncrement.plugin, {
    model: 'tickets',
    field: 'ticket_id',
    startAt: 1
});

module.exports = mongoose.model('tickets', TicketSchema);