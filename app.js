const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cors = require('cors');


const app = express();

// app.options('*', cors({
//   origin: '*',
//   methods: 'POST, GET, PUT, DELETE, OPTIONS',
//   preflightContinue: true,
//   // optionsSuccessStatus: 200,
//   optionsSuccessStatus: 204,
//   // allowedHeaders: ['Origin, X-Requested-With, Content-Type, Accept, Authorization, token, orgName, user_code, File-Name'],
//   // exposedHeaders: ['Authorization, File-Name']
// }));

app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, '/public/favicon.ico')));

// Initialize database connection
const dbUtil = require('./lib/utils');
dbUtil.connect('College');

require('./routes')(app);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
