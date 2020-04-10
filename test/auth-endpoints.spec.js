const knex = require('knex');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe('Auth Endpoints', () => {
  let db;

  const { testUsers } = helpers.makeThingsFixtures();
  const testUser = testUsers[0];

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('cleanup', () => helpers.cleanTables(db));

  afterEach('cleanup', () => helpers.cleanTables(db));

  describe('POST /api/auth/login', () => {
    beforeEach('insert users', () => helpers.seedUsers(db, testUsers));

    const requiredFields = ['user_name', 'password'];

    requiredFields.forEach((field) => {
      const loginCreds = {
        user_name: testUser.user_name,
        password: testUser.password
      };

      it(`responds with a 400 error when '${field}' is missing`, () => {
        delete loginCreds[field];

        return supertest(app)
          .post('/api/auth/login')
          .send(loginCreds)
          .expect(400, {
            error: `Missing '${field}' in request body`
          });
      });
    });

    it(`responds 400 'incorrect user_name or password' when bad user_name`, () => {
      const invalidUser = { user_name: 'not-a-user', password: 'not-a-user' };
      return supertest(app)
        .post('/api/auth/login')
        .send(invalidUser)
        .expect(400, {
          error: `Incorrect user_name or password`
        });
    });

    it(`responds 400 'incorrect user_name or password' when bad password`, () => {
      const invalidUser = { ...testUser, password: 'invalid-password' };
      return supertest(app)
        .post('/api/auth/login')
        .send(invalidUser)
        .expect(400, {
          error: `Incorrect user_name or password`
        });
    });

    it(`responds 200 and JWT auth token using secret when valid creds`, () => {
      const validCreds = {
        user_name: testUser.user_name,
        password: testUser.password
      };
      const expectedToken = jwt.sign(
        { user_id: testUser.id },
        process.env.JWT_SECRET,
        {
          subject: testUser.user_name,
          algorithm: 'HS256'
        }
      );
      return supertest(app)
        .post('/api/auth/login')
        .send(validCreds)
        .expect(200, {
          authToken: expectedToken
        });
    });
  });
});
