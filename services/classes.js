'use strict';

const {
    pino,
} = require('../lib/utils');
const logger = pino({
    level: 'debug'
});
const db = require('./../models/schema');

const insertClassData = async (reqPayload) => {
    let studentData;
    try {
        logger.debug('insertClassData() reqPayload: %j', reqPayload);

        // const classesData = await db.classesSchema.find({
        //     class_name: reqPayload.class_name,
        //     division: reqPayload.division,
        // });
        // if (classesData.length > 0) {
        //     return 'Class already exists';
        // }
        const _classessData = await db.classesSchema.insertMany(reqPayload);
        let studentIdArr = _classessData[0].students;
        studentData = await db.studentsSchema.find({ 'studentId': { $in: studentIdArr }, 'deleted': false }).lean();
        const classData = {
            ..._classessData[0]['_doc'],
            abc: studentData
        }

        const finalRes = {
            data: [classData]
        };
        return finalRes;
    } catch (error) {
        logger.warn(`Error while insertClassData(). Error = %j %s`, error, error);
        throw error;
    }
}

const getClassessData = async (reqPayload) => {
    try {
        logger.debug('getClassessData() reqPayload: %j', reqPayload);
        let matchQuery = {
            $and: [
                { deleted: false },
                { active: true },
            ]
        };

        let sortData = { ts_last_update: -1, date: -1 };

        // filtering
        if (reqPayload && reqPayload.filterData) {
            matchQuery.$and.push({
                $or: [
                    { 'class_name': { $regex: reqPayload.filterData, $options: 'i' } },
                    { 'classTeacher': { $regex: reqPayload.filterData, $options: 'i' } },
                    { 'division': { $regex: reqPayload.filterData, $options: 'i' } }
                ]
            })
        }

        // sorting
        if (reqPayload && reqPayload.columnSorted && reqPayload.direction) {
            if (reqPayload.columnSorted === 'class_name') {
                if (reqPayload.direction === 'asc') {
                    sortData = { name_sort: 1 };
                } else if (reqPayload.direction === 'desc') {
                    sortData = { name_sort: -1 };
                }
            }
            else if (reqPayload.columnSorted === 'division') {
                if (reqPayload.direction === 'asc') {
                    sortData = { division_sort: 1 };
                } else if (reqPayload.direction === 'desc') {
                    sortData = { division_sort: -1 };
                }
            }
            else if (reqPayload.columnSorted === 'classTeacher') {
                if (reqPayload.direction === 'asc') {
                    sortData = { classTeacher_sort: 1 };
                } else if (reqPayload.direction === 'desc') {
                    sortData = { classTeacher_sort: -1 };
                }
            }

        }

        // pagination
        let perPage;
        let skip;
        if (reqPayload && reqPayload.pageIndex && reqPayload.pageSize) {
            const page = parseInt(reqPayload.pageIndex) || 1;
            perPage = parseInt(reqPayload.pageSize) || 5;
            skip = (page - 1) * perPage;
        }

        let countData = await db.classesSchema.count(matchQuery).exec();

        let aggregatePipeline = [
            { $match: matchQuery },
            {
                $lookup: {
                    from: 'students',
                    localField: 'students',
                    foreignField: 'studentId',
                    as: 'abc',
                },
            },
            // { $unwind: { path: '$abc', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    // 'subjects.subjectId': '$subjects.subjectId',
                    // 'subjects.subject_name': '$subjects.subject_name',
                    abc: '$abc',

                    'name_sort': { $toLower: '$class_name' },
                    'division_sort': {$toLower: '$division'},
                    'classTeacher_sort': {$toLower: '$classTeacher'},
                    classId: 1,
                    subjects: 1,
                    class_name: 1,
                    division: 1,
                    classTeacher: 1,
                    noOfStd: 1,
                    students: 1,
                    date: 1,
                    ts_last_update: 1,
                },
            },
            { $sort: sortData },
            { $skip: skip },
            { $limit: perPage },
        ];

        const _classessData = await db.classesSchema.aggregate(aggregatePipeline).collation({locale: "en_US", numericOrdering: true}).exec();
        const finalRes = {
            data: _classessData,
            count: countData
        };
        return finalRes;
    } catch (error) {
        logger.warn(`Error while getClassessData(). Error = %j %s`, error, error);
        throw error;
    }
}

const getClassessCount = async (reqPayload) => {
    try {
        logger.debug('getClassessCount() reqPayload: %j', reqPayload);

        let matchQuery = {
            $and: [
                { deleted: false },
                { active: true },
            ]
        };

        let sortData = { class_name: 1 };
        if (reqPayload && reqPayload['sort']) {
            sortData = {};
            if (reqPayload['sort']['active'] == 'name') {
                sortData['name_sort'] = (reqPayload['sort']['direction'] == 'asc') ? 1 : -1;
            } else if (reqPayload['sort']['active'] == 'class') {
                sortData['class_sort'] = (reqPayload['sort']['direction'] == 'asc') ? 1 : -1;
            } else if (reqPayload['sort']['active'] == 'date') {
                sortData = {
                    ts_last_update: (reqPayload['sort']['direction'] == 'asc') ? 1 : -1,
                    date: (reqPayload['sort']['direction'] == 'asc') ? 1 : -1
                };
            } else {
                sortData = {
                    ts_last_update: (reqPayload['sort']['direction'] == 'asc') ? 1 : -1,
                    date: (reqPayload['sort']['direction'] == 'asc') ? 1 : -1
                };
            }
        }

        if (reqPayload && reqPayload['search']) {
            matchQuery['$or'] = [
                { 'class_name': { $regex: reqPayload['search'], $options: 'i' } },
            ];
        }

        let aggregatePipeline = [
            { $match: matchQuery },
            // {
            //     $lookup: {
            //         from: 'subjects',
            //         localField: 'subjects.subjectId',
            //         foreignField: 'subjectId',
            //         as: 'subjects',
            //     },
            // },
            // { $unwind: { path: '$subjects', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    // 'subjects.subjectId': '$subjects.subjectId',
                    // 'subjects.subject_name': '$subjects.subject_name',

                    'name_sort': { $toLower: '$class_name' },
                    classId: 1,
                    subjects: 1,
                    class_name: 1,
                    date: 1,
                    ts_last_update: 1,
                },
            },
            { $sort: sortData },
        ];

        const _classessCount = await db.classesSchema.count(aggregatePipeline).exec();

        const finalRes = {
            data: _classessCount ? _classessCount : 0,
        };
        return finalRes;
    } catch (error) {
        logger.warn(`Error while getClassessCount(). Error = %j %s`, error, error);
        throw error;
    }
}

const getClassDataByClassId = async (classId) => {
    try {
        logger.debug('getClassDataByClassId() classId: %s', classId);
        const _classData = await db.classesSchema.find({
            classId: classId,
            deleted: false
        });
        const finalRes = {
            data: _classData,
        };
        return finalRes;
    } catch (error) {
        logger.warn(`Error while getClassDataByClassId(). Error = %j %s`, error, error);
        throw error;
    }
}

const editClassesData = async (reqPayload, classId, userCode) => {
    try {
        logger.debug('editClassesData() reqPayload: %j, classId: %s, userCode: %s', reqPayload, classId, userCode);

        const classesData = await db.classesSchema.find({
            classId: classId,
            deleted: false,
        })
        if (!classesData || (classesData && classesData.length <= 0)) {
            return null;
        }

        const _classData = await db.classesSchema.findOneAndUpdate(
            {
                classId: classId,
                deleted: false,
            },
            {
                $set: {
                    class_name: reqPayload.class_name,
                    division: reqPayload.division,
                    classTeacher: reqPayload.classTeacher,
                    noOfStd: reqPayload.noOfStd,
                    students: reqPayload.students,
                    // subjects: reqPayload.subjects,
                    updatedBy: userCode,
                    ts_last_update: new Date().getTime()
                }
            },
            {
                upsert: false,
                new: true,
            });
        const finalRes = {
            data: [_classData],
        };
        console.log('finalRes: ', finalRes);
        return finalRes;
    } catch (error) {
        logger.warn(`Error while editClassesData(). Error = %j %s`, error, error);
        throw error;
    }
}

const deleteClassesData = async (classId, userCode) => {
    try {
        logger.debug('deleteClassesData() classId: %s userCode: %s', classId, userCode);
        const classesData = await db.classesSchema.find({
            classId: classId,
            deleted: false,
            active: true,
        });
        if (!classesData || (classesData && classesData.length <= 0)) {
            return null;
        }
        const _classData = await db.classesSchema.updateOne(
            {
                classId: classId
            },
            {
                $set: {
                    deleted: true,
                    deletedBy: userCode,
                    active: false,
                    ts_deleted_date: new Date().getTime()
                }
            },
            {
                upsert: false,
                new: true,
            });
        const finalRes = {
            data: _classData,
        };
        return finalRes;
    } catch (error) {
        logger.warn(`Error while deleteClassesData(). Error = %j %s`, error, error);
        throw error;
    }
}

module.exports = {
    insertClassData,
    getClassessData,
    getClassessCount,
    getClassDataByClassId,
    editClassesData,
    deleteClassesData
}