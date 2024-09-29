'use strict';

const util = require('util');
const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './Uploads');
  },
  filename: function (req, file, cb) {
      cb(null, file.originalname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const maxSize = 1 * 20000 * 20000;

const uploadFiles = multer({
  storage: storage,
  limits: {
    fileSize: maxSize
  }
}).array('game_logo');

const uploadFilesMiddleware = util.promisify(uploadFiles);

module.exports = uploadFilesMiddleware;