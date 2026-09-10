const request = require('supertest');
const app = require('../app');

let userId;
let token;

beforeEach(async () => {
  const email = `trends${Date.now()}@example.com`;
  const registerRes = await request(app)
    .post('/users')
    .send({ name: 'Trends User', email, password: 'password123' });
  userId = registerRes.body.user._id;

  const loginRes = await request(app)
    .post('/users/login')
    .send({ email, password: 'password123' });
  token = loginRes.body.token;
});

describe('GET /summary/trends', () => {
  it('should return monthly breakdown of income and expenses', async () => {
    await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId, type: 'income', category: 'salary', amount: 50000, date: '2025-01-10' });
    await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId, type: 'expense', category: 'rent', amount: 15000, date: '2025-01-15' });
    await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId, type: 'expense', category: 'food', amount: 5000, date: '2025-02-10' });

    const res = await request(app)
      .get('/summary/trends')
      .set('Authorization', `Bearer ${token}`)
      .query({ userId });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('monthly');
    expect(res.body.monthly.length).toBe(2);
  });
});