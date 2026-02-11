const userRoutes = require('./user.routes');
const userService = require('./user.service');
const User = require('./user.model');

module.exports = {
  routes: userRoutes,
  service: userService,
  model: User
};
