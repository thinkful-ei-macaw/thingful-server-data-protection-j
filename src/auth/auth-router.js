const express = require('express');

const authRouter = express.Router();
const bodyParser = express.json();

authRouter.route('/login').post(bodyParser, (req, res, next) => {
  res.send('OK');
});

module.exports = authRouter;
