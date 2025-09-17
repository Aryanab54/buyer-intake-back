let route = require("express").Router();

route.use('/buyers',require('./src/buyers/buyers.route'))
route.use('/user',require('./src/user/user.route'))
route.use('/auth',require('./src/auth/auth.route'))

if (process.env.NODE_ENV === 'development') {
  route.use('/dev', require('./dev-login'));
}


module.exports = route;