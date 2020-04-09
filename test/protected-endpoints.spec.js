const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe('Protected endpoints', () => {
  let db;

  const { testThings, testUsers, testReviews } = helpers.makeThingsFixtures();

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

  beforeEach('insert things', () =>
    helpers.seedThingsTables(db, testUsers, testThings, testReviews)
  );

  // array of endpoints means we can use a forEach to loop over tests
  // the tests are very similar so this saves us lots of lines
  const protectedEndpoints = [
    {
      name: 'GET /api/things/:thing_id',
      path: '/api/things/1',
      method: supertest(app).get
    },
    {
      name: 'GET /api/things/:thing_id/reviews',
      path: '/api/things/1/reviews',
      method: supertest(app).get
    },
    {
      name: 'POST /api/reviews',
      path: '/api/reviews',
      method: supertest(app).post
    }
  ];

  protectedEndpoints.forEach((endpoint) => {
    describe(endpoint.name, () => {
      it(`responds with 401 'Missing basic token' when no basic token`, () => {
        return endpoint
          .method(endpoint.path)
          .expect(401, { error: `Missing basic token` });
      });
    });

    it(`responds 401 'Unauthorized request' when no credentials in token`, () => {
      const userMissingCreds = { user_name: '', password: '' };
      return endpoint
        .method(endpoint.path)
        .set('Authorization', helpers.makeAuthHeader(userMissingCreds))
        .expect(401, { error: 'Unauthorized request' });
    });

    it(`responds 401 'Unauthorized request' when invalid user`, () => {
      const userInvalid = { user_name: 'user-bad', password: 'guy' };
      return endpoint
        .method(endpoint.path)
        .set('Authorization', helpers.makeAuthHeader(userInvalid))
        .expect(401, { error: 'Unauthorized request' });
    });

    it(`responds 401 'Unauthorized request' when invalid pass`, () => {
      const userInvalidPassword = {
        user_name: testUsers[0].user_name,
        password: 'wrong'
      };
      return endpoint
        .method(endpoint.path)
        .set('Authorization', helpers.makeAuthHeader(userInvalidPassword))
        .expect(401, { error: 'Unauthorized request' });
    });
  });
});
