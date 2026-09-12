const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

let userId;
let token;

beforeEach(async () => {
  const email = `budget${Date.now()}@example.com`;
  const registerRes = await request(app)
    .post('/users')
    .send({ name: 'Budget User', email, password: 'password123' });
  userId = registerRes.body.user._id;

  const loginRes = await request(app)
    .post('/users/login')
    .send({ email, password: 'password123' });
  token = loginRes.body.token;
});

describe('POST /budgets', () => {
  it('should create a budget and return 201', async () => {
    const res = await request(app)
      .post('/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId,
        month: '2025-01',
        monthlyGoal: 30000,
        savingsTarget: 10000
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('budget');
    expect(res.body.budget).toHaveProperty('monthlyGoal', 30000);
    expect(res.body.budget).toHaveProperty('savingsTarget', 10000);
  });

  it('should return 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId, month: '2025-01' });
    expect(res.statusCode).toBe(400);
  });

  it('should return 400 if monthlyGoal is negative', async () => {
    const res = await request(app)
      .post('/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId,
        month: '2025-01',
        monthlyGoal: -100,
        savingsTarget: 10000
      });
    expect(res.statusCode).toBe(400);
  });

  it('should return 400 when month format is invalid', async () => {
    const res = await request(app)
      .post('/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId,
        month: 'January 2025',
        monthlyGoal: 30000,
        savingsTarget: 10000
      });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /budgets', () => {
  it('should return all budgets for a user', async () => {
    await request(app)
      .post('/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId,
        month: '2025-01',
        monthlyGoal: 30000,
        savingsTarget: 10000
      });

    const res = await request(app)
      .get('/budgets')
      .set('Authorization', `Bearer ${token}`)
      .query({ userId });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.budgets)).toBe(true);
    expect(res.body.budgets.length).toBe(1);
  });
});

describe('PATCH /budgets/:id', () => {
  it('should update a budget', async () => {
    const createRes = await request(app)
      .post('/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId,
        month: '2025-01',
        monthlyGoal: 30000,
        savingsTarget: 10000
      });

    const id = createRes.body.budget._id;
    const res = await request(app)
      .patch(`/budgets/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ monthlyGoal: 25000 });
    expect(res.statusCode).toBe(200);
    expect(res.body.budget).toHaveProperty('monthlyGoal', 25000);
  });

  it('should return 404 when updating another user\'s budget', async () => {
    const createRes = await request(app)
      .post('/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId, month: '2025-01', monthlyGoal: 30000, savingsTarget: 10000 });

    const intruderEmail = `intruder${Date.now()}-budget@example.com`;
    await request(app).post('/users').send({ name: 'Intruder', email: intruderEmail, password: 'password123' });
    const loginRes = await request(app).post('/users/login').send({ email: intruderEmail, password: 'password123' });
    const intruderToken = loginRes.body.token;

    const res = await request(app)
      .patch(`/budgets/${createRes.body.budget._id}`)
      .set('Authorization', `Bearer ${intruderToken}`)
      .send({ monthlyGoal: 9999 });
    expect(res.statusCode).toBe(404);
  });

  it('should ignore a spoofed userId in the update body', async () => {
    const createRes = await request(app)
      .post('/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId, month: '2025-01', monthlyGoal: 30000, savingsTarget: 10000 });

    const otherId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .patch(`/budgets/${createRes.body.budget._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ monthlyGoal: 123, userId: otherId });
    expect(res.statusCode).toBe(200);
    expect(res.body.budget.userId).toBe(userId);
  });
});