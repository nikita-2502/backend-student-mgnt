/* mongoDB schema configuration for users */
'use strict'

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require('mongoose-long')(mongoose);
const {
    autoIncrement
} = require('../lib/utils');
const { number } = require('joi');

const ClassSchema = new Schema(
    {
        classId: {
            type: Number,
            required: true
        },
        // subjects: [
        //     {
        //         subjectId: {
        //             type: Number,
        //             ref: 'subjects',
        //         },
        //         subject_name: {
        //             type: String
        //         }
        //     }
        // ],
        class_name: {
            type: String,
            required: true
        },

        classTeacher: {
            type: String,
            required: true
        },
        division: {
            type: String,
            required: true
        },
        noOfStd: {
            type: Number,
            required: true
        },
        students: {
            type: [Number],
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
    // .index(
    //     {
    //         class_name: 1
    //     },
    //     {
    //         unique: true
    //     });

ClassSchema.plugin(autoIncrement.plugin, {
    model: 'classes',
    field: 'classId',
    startAt: 1
});

module.exports = mongoose.model('classes', ClassSchema);