/* mongoDB schema configuration for users */
'use strict'

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require('mongoose-long')(mongoose);
const {
    autoIncrement
} = require('../lib/utils');

const SubjectsSchema = new Schema(
    {
        subjectId: {
            type: Number,
            required: true
        },
        subject_name: {
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
        createdBy: {
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
            subject_name: 1
        },
        {
            unique: true
        });

SubjectsSchema.plugin(autoIncrement.plugin, {
    model: 'subjects',
    field: 'subjectId',
    startAt: 1
});

module.exports = mongoose.model('subjects', SubjectsSchema);