/* mongoDB schema configuration for users */
'use strict'

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require('mongoose-long')(mongoose);
const {
    autoIncrement
} = require('../lib/utils');

const StudentSchema = new Schema(
    {
        studentId: {
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
        // username: {
        //     type: String,
        //     required: true,
        //     unique: true
        // },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: false
        },
        sport: {
            type: String,
            required: true
        },
        dob: {
            type: Number,
            required: true
        },
        gender: {
            type: String,
            required: true
        },
        date: {
            type: Number,
            default: new Date().getTime()
        },
        active: {
            type: Boolean,
            default: true
        },
        // classId: {
        //     type: Number,
        //     ref: 'classes',
        //     required: true
        // },
        deleted: {
            type: Boolean,
            default: false
        },
        deletedBy: {
            type: Number,
            ref: 'users',
        },
        updatedBy: {
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
    },
    {
        versionKey: false
    })
    .index(
        {
            email: 1,
            // username: 1,
            // classId: 1
        },
        {
            unique: true
        });

StudentSchema.plugin(autoIncrement.plugin, {
    model: 'students',
    field: 'studentId',
    startAt: 1
});

module.exports = mongoose.model('students', StudentSchema);