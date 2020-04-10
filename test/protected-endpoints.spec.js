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

  protectedEndpoints.forEach(endpoint => {
    describe(endpoint.name, () => {
      it(`responds with 401 'Missing bearer token' when no bearer token`, () => {
        return endpoint
          .method(endpoint.path)
          .expect(401, { error: `Missing bearer token` });
      });
    });

    it(`responds 401 'Unauthorized request' when invalid JWT secret`, () => {
      const validUser = testUsers[0];
      const invalidSecret = 'bad-secret';
      return endpoint
        .method(endpoint.path)
        .set('Authorization', helpers.makeAuthHeader(validUser, invalidSecret))
        .expect(401, { error: 'Unauthorized request' });
    });

    it(`responds 401 'Unauthorized request' when invalid sub in payload`, () => {
      const invalidUser = { user_name: 'not-a-user', id: 1 };
      return endpoint
        .method(endpoint.path)
        .set('Authorization', helpers.makeAuthHeader(invalidUser))
        .expect(401, { error: 'Unauthorized request' });
    });
  });
});
