const appRoutes = require('./app');
const usersRoute = require('./users');
const lotteryGameRoute = require('./lottery_game');
const subjectsRoute = require('./subjects');
const ticketRoute = require('./tickets');
const classesRoute = require('./classes');
const shopRoute = require('./shop');
const studentRoute = require('./student');
const transactionRoute = require('./transaction');
const reportRouter = require('./reports');

module.exports = function (app) {
  app.use('/', appRoutes);
  app.use('/auth', usersRoute);
  app.use('/student', studentRoute);
  app.use('/classes', classesRoute);
  app.use('/subjects', subjectsRoute);
}
