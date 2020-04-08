const AuthService = {
  // allows us to check if the user exists in the database
  getUserWithUserName(db, user_name) {
    return db('thingful_users').where({ user_name }).first();
  },
  // parse the token from the client back into a format we can
  // read, split on : due to separation of user:password
  parseBasicToken(token) {
    return Buffer.from(token, 'base64').toString().split(':');
  }
};

module.exports = AuthService;
