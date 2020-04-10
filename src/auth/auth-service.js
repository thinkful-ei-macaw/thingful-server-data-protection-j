const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

const AuthService = {
  // allows us to check if the user exists in the database
  getUserWithUserName(db, user_name) {
    return db('thingful_users').where({ user_name }).first();
  },
  // compare password with a given hash via bcrypt
  comparePasswords(password, hash) {
    return bcrypt.compare(password, hash);
  },
  // create json web token
  createJwt(subject, payload) {
    return jwt.sign(payload, config.JWT_SECRET, {
      subject,
      algorithm: 'HS256'
    });
  },
  // verify a jwt by comparing with current secret and algo
  verifyJwt(token) {
    return jwt.verify(token, config.JWT_SECRET, {
      algorithms: ['HS256']
    });
  },
  // parse the token from the client back into a format we can
  // read, split on : due to separation of user:password
  parseBasicToken(token) {
    return Buffer.from(token, 'base64').toString().split(':');
  }
};

module.exports = AuthService;
