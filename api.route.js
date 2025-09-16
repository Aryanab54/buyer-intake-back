let route = require("express").Router();

route.use('/test',require('./src/test/test.route'))


module.exports = route;