'use strict';

const {
    pino,
    connect,
    bcrypt
} = require('../lib/utils');
const logger = pino({
    level: 'debug'
});
const db = require('./../models/schema');

const insertStudentData = async (reqPayload) => {
    try {
        logger.debug('insertStudentData() reqPayload: %j', reqPayload);

        const studentData = await db.studentsSchema.find({
            // username: reqPayload.username,
            email: reqPayload.email
        });
        if (studentData.length > 0) {
            return 'Student already exists';
        }
        const _studentData = await db.studentsSchema.insertMany(reqPayload);
        const finalRes = {
            data: _studentData
        };
        return finalRes;
    } catch (error) {
        logger.warn(`Error while insertStudentData(). Error = %j %s`, error, error);
        throw error;
    }
}

const studentLogin = async (reqPayload) => {
    try {
        logger.debug('studentLogin() reqPayload: %j', reqPayload);

        const studentData = await db.studentsSchema.find({
            student_code: reqPayload.student_code
        });
        if (studentData.length === 0) {
            return 'Student not exists, Please register !';
        }
        if (reqPayload.secret_code !== studentData[0].secret_code) {
            return 'The student code is invalid';
        }
        return studentData;
    } catch (error) {
        logger.warn(`Error while studentLogin(). Error = %j %s`, error, error);
        throw error;
    }
}

const getStudentsData = async (reqPayload) => {
    try {
        logger.debug('getStudentsData() reqPayload: %j', reqPayload);
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
                    { 'first_name': { $regex: reqPayload.filterData, $options: 'i' } },
                    { 'last_name': { $regex: reqPayload.filterData, $options: 'i' } },
                    { 'email': { $regex: reqPayload.filterData, $options: 'i' } }
                ]
            })
        }

        // sorting
        if (reqPayload && reqPayload.columnSorted && reqPayload.direction) {
            if (reqPayload.columnSorted === 'first_name') {
                if (reqPayload.direction === 'asc') {
                    sortData = { fname_sort: 1 };
                } else if (reqPayload.direction === 'desc') {
                    sortData = { fname_sort: -1 };
                }
            }
            else if (reqPayload.columnSorted === 'last_name') {
                if (reqPayload.direction === 'asc') {
                    sortData = { lname_sort: 1 };
                } else if (reqPayload.direction === 'desc') {
                    sortData = { lname_sort: -1 };
                }
            }
            else if (reqPayload.columnSorted === 'email') {
                if (reqPayload.direction === 'asc') {
                    sortData = { email_sort: 1 };
                } else if (reqPayload.direction === 'desc') {
                    sortData = { email_sort: -1 };
                }
            }
            else if (reqPayload.columnSorted === 'dob') {
                if (reqPayload.direction === 'asc') {
                    sortData = { dob: 1 };
                } else if (reqPayload.direction === 'desc') {
                    sortData = { dob: -1 };
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

        let countData = await db.studentsSchema.count(matchQuery ).exec();

        let aggregatePipeline = [
            { $match: matchQuery },
            {
                $lookup: {
                    from: 'classes',
                    localField: 'classId',
                    foreignField: 'classId',
                    as: 'classes',
                },
            },
            { $unwind: { path: '$classes', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    'classes.classId': '$classes.classId',
                    'classes.class_name': '$classes.class_name',
                    'class_sort': { $toLower: '$classes.class_name' },

                    'fname_sort': { $toLower: '$first_name' },
                    'lname_sort': { $toLower: '$last_name' },
                    'email_sort': { $toLower: '$email' },
                    studentId: 1,
                    first_name: 1,
                    last_name: 1,
                    username: 1,
                    dob: 1,
                    gender: 1,
                    sport: 1,
                    email: 1,
                    date: 1,
                    ts_last_update: 1,
                },
            },
            { $sort: sortData },
            { $skip: skip },
            { $limit: perPage },
        ];

        const _studentsData = await db.studentsSchema.aggregate(aggregatePipeline).exec();

        const finalRes = {
            data: _studentsData,
            count: countData
        };
        return finalRes;
    } catch (error) {
        logger.warn(`Error while getStudentsData(). Error = %j %s`, error, error);
        throw error;
    }
}

const getStudentOld = async (reqPayload) => {
    let studentIdArr = [];
    let studentData;
    try {
        logger.debug('getStudentsData() reqPayload: %j', reqPayload);

        const classData = await db.classesSchema.find({ 'deleted': false });

        if (classData && classData.length > 0) {
            for (let i = 0; i < classData.length; i++) {
                const element = classData[i].students;
                if (element && element.length > 0) {
                    studentIdArr = [...studentIdArr, ...element];
                }
            }
        }

        if (!reqPayload) {
            studentData = await db.studentsSchema.find({ 'studentId': { $nin: studentIdArr }, 'deleted': false });

        } else {
            studentData = await db.studentsSchema.find({ $or: [{ 'studentId': { $nin: studentIdArr } }, { 'studentId': { $in: reqPayload } }], 'deleted': false });
        }

        let hasNextPage = true;

        const finalRes = {
            data: studentData,
            count: 999999,
            isNextPage: hasNextPage
        };
        return finalRes;
    } catch (error) {
        logger.warn(`Error while getStudentsData(). Error = %j %s`, error, error);
        throw error;
    }
}

const getStudent = async (reqPayload, classId) => {
    let studentIdArr = [];
    let studentData;
    let matchQuery;
    try {
        logger.debug('getStudentsData() reqPayload: %j', reqPayload);

        if (classId) {
            matchQuery = {
                $and: [
                    { deleted: false },
                    { 'classId': { $ne: classId } },
                ]
            };
        } else {
            matchQuery = {
                'deleted': false
            }
        }

        const classData = await db.classesSchema.find(matchQuery);

        if (classData && classData.length > 0) {
            for (let i = 0; i < classData.length; i++) {
                const element = classData[i].students;
                if (element && element.length > 0) {
                    studentIdArr = [...studentIdArr, ...element];
                }
            }
        }

        studentData = await db.studentsSchema.find({ 'studentId': { $nin: studentIdArr }, 'deleted': false });

        let hasNextPage = true;

        const finalRes = {
            data: studentData,
            count: 999999,
            isNextPage: hasNextPage
        };
        return finalRes;
    } catch (error) {
        logger.warn(`Error while getStudentsData(). Error = %j %s`, error, error);
        throw error;
    }
}

const getStudentsCount = async (reqPayload) => {
    try {
        logger.debug('getStudentsCount() reqPayload: %j', reqPayload);

        let matchQuery = {
            $and: [
                { deleted: false },
                { active: false },
            ]
        };

        let sortData = { ts_last_update: -1, date: -1 };
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
                { 'first_name': { $regex: reqPayload['search'], $options: 'i' } },
                { 'last_name': { $regex: reqPayload['search'], $options: 'i' } },
            ];
        }

        let aggregatePipeline = [
            { $match: matchQuery },
            {
                $lookup: {
                    from: 'classes',
                    localField: 'classId',
                    foreignField: 'classId',
                    as: 'classes',
                },
            },
            { $unwind: { path: '$classes', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    'classes.classId': '$classes.classId',
                    'classes.class_name': '$classes.class_name',
                    'class_sort': { $toLower: '$classes.class_name' },

                    'name_sort': { $toLower: '$first_name' },
                    studentId: 1,
                    first_name: 1,
                    last_name: 1,
                    username: 1,
                    email: 1,
                    date: 1,
                    ts_last_update: 1,
                },
            },
            { $sort: sortData },
        ];

        const _studentsCount = await db.studentsSchema.count(aggregatePipeline).exec();

        const finalRes = {
            data: _studentsCount ? _studentsCount : 0,
        };
        return finalRes;
    } catch (error) {
        logger.warn(`Error while getStudentsCount(). Error = %j %s`, error, error);
        throw error;
    }
}

const getStudentDataByStudentId = async (studentId) => {
    try {
        logger.debug('getStudentDataByStudentId() studentId: %s', studentId);
        let aggregatePipeline = [
            {
                $match: {
                    studentId: studentId,
                    deleted: false
                }
            },
            {
                $lookup: {
                    from: 'classes',
                    localField: 'classId',
                    foreignField: 'classId',
                    as: 'classes',
                },
            },
            { $unwind: { path: '$classes', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    'classes.classId': '$classes.classId',
                    'classes.class_name': '$classes.class_name',
                    studentId: 1,
                    first_name: 1,
                    last_name: 1,
                    sport: 1,
                    gender: 1,
                    dob: 1,
                    username: 1,
                    email: 1,
                    date: 1,
                    ts_last_update: 1,
                },
            },
            { $sort: { first_name: 1 } },
        ];
        const _studentsData = await db.studentsSchema.aggregate(aggregatePipeline).exec();
        const finalRes = {
            data: _studentsData,
        };
        return finalRes;
    } catch (error) {
        logger.warn(`Error while getStudentDataByStudentId(). Error = %j %s`, error, error);
        throw error;
    }
}

const editStudentData = async (reqPayload, studentId, userCode) => {
    try {
        logger.debug('editStudentData() reqPayload: %j, studentId: %s, userCode: %s', reqPayload, studentId, userCode);

        const studentData = await db.studentsSchema.find({
            studentId: studentId,
            deleted: false,
        })
        // console.log('studentData: ', studentData);
        if (!studentData || (studentData && studentData.length <= 0)) {
            return [];
        }

        const _studentData = await db.studentsSchema.findOneAndUpdate(
            {
                studentId: studentId,
                deleted: false,
            },
            {
                $set: {
                    first_name: reqPayload.first_name,
                    last_name: reqPayload.last_name,
                    email: reqPayload.email,
                    gender: reqPayload.gender,
                    sport: reqPayload.sport,
                    dob: reqPayload.dob,
                    classId: reqPayload.classId,
                    updatedBy: userCode,
                    ts_last_update: new Date().getTime()
                }
            },
            {
                upsert: false,
                new: true,
            });
        const finalRes = {
            data: [_studentData],
        };
        return finalRes;
    } catch (error) {
        logger.warn(`Error while editStudentData(). Error = %j %s`, error, error);
        throw error;
    }
}

const deleteStudentData = async (studentId, userCode) => {
    try {
        logger.debug('deleteStudentData() studentId: %s userCode: %s', studentId, userCode);
        const studentData = await db.studentsSchema.find({
            studentId: studentId,
            deleted: false,
            active: true,
        });
        if (!studentData || (studentData && studentData.length <= 0)) {
            return [];
        }
        const response = await db.studentsSchema.updateOne(
            {
                studentId: studentId
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
        return response;
    } catch (error) {
        logger.warn(`Error while deleteStudentData(). Error = %j %s`, error, error);
        throw error;
    }
}

module.exports = {
    insertStudentData,
    studentLogin,
    getStudentsData,
    getStudentsCount,
    getStudentDataByStudentId,
    editStudentData,
    deleteStudentData,
    getStudent,
    getStudentOld
}