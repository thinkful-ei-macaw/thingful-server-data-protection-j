const express = require('express');
const AuthService = require('./auth-service');

const authRouter = express.Router();
const bodyParser = express.json();

// authRouter.route('/login').post(bodyParser, (req, res, next) => {
//   const { user_name, password } = req.body;
//   const userCreds = { user_name, password };

//   for (const [key, value] of Object.entries(userCreds)) {
//     if (value == null) {
//       return res
//         .status(400)
//         .json({ error: `Missing '${key}' in request body` });
//     }
//   }

//   AuthService.getUserWithUserName(req.app.get('db'), user_name)
//     .then(dbUser => {
//       if (!dbUser) {
//         return res
//           .status(400)
//           .json({ error: `Incorrect user_name or password` });
//       }
//       AuthService.comparePasswords(userCreds.password, dbUser.password).then(
//         passMatch => {
//           if (!passMatch) {
//             return res
//               .status(400)
//               .json({ error: `Incorrect user_name or password` });
//           }
//           const sub = dbUser.user_name;
//           const payload = { user_id: dbUser.id };
//           res.send({
//             authToken: AuthService.createJwt(sub, payload)
//           });
//         }
//       );
//     })
//     .catch(next);
// });

authRouter.route('/login').post(bodyParser, async (req, res, next) => {
  const { user_name, password } = req.body;
  const userCreds = { user_name, password };

  for (const [key, value] of Object.entries(userCreds)) {
    if (value == null) {
      return res
        .status(400)
        .json({ error: `Missing '${key}' in request body` });
    }
  }

  try {
    const dbUser = await AuthService.getUserWithUserName(
      req.app.get('db'),
      user_name
    );
    if (!dbUser) {
      return res.status(400).json({ error: `Incorrect user_name or password` });
    }
    const passMatch = await AuthService.comparePasswords(
      userCreds.password,
      dbUser.password
    );

    if (!passMatch) {
      return res.status(400).json({ error: `Incorrect user_name or password` });
    }
    const sub = dbUser.user_name;
    const payload = { user_id: dbUser.id };
    res.send({
      authToken: AuthService.createJwt(sub, payload)
    });
  } catch (e) {
    next(e);
  }
});

module.exports = authRouter;
