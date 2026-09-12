const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

let userId;
let token;

beforeEach(async () => {
    const email = `test${Date.now()}@example.com`;
    
    const registerRes = await request(app)
        .post('/users')
        .send({
        name: 'Test User',
        email,
        password: 'password123'
        });
    
    const loginRes = await request(app)
        .post('/users/login')
        .send({
        email,
        password: 'password123'
        });
    
    token = loginRes.body.token;
    userId = registerRes.body.user._id;
});

describe('POST /transactions', () => {
    it('should create a transaction and return 201', async () => {
      const res = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId,
          type: 'expense',
          category: 'food',
          amount: 500,
          date: '2025-01-15'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('transaction');
      expect(res.body.transaction).toHaveProperty('type', 'expense');
      expect(res.body.transaction).toHaveProperty('amount', 500);
    });
  
    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId, type: 'expense' });
      expect(res.statusCode).toBe(400);
    });
  
    it('should return 400 if type is not income or expense', async () => {
      const res = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId,
          type: 'invalid',
          category: 'food',
          amount: 500,
          date: '2025-01-15'
        });
      expect(res.statusCode).toBe(400);
    });

    it('should auto-categorize when category is omitted', async () => {
        const res = await request(app)
          .post('/transactions')
          .set('Authorization', `Bearer ${token}`)
          .send({ userId, type: 'expense', description: 'Starbucks latte', amount: 250, date: '2025-02-01' });
      
        expect(res.statusCode).toBe(201);
        expect(res.body.transaction.category).toBe('food');
    });
      
    it('should keep a manually provided category', async () => {
        const res = await request(app)
            .post('/transactions')
            .set('Authorization', `Bearer ${token}`)
            .send({ userId, type: 'expense', description: 'Starbucks latte', category: 'coffee', amount: 250, date: '2025-02-01' });
        
        expect(res.statusCode).toBe(201);
        expect(res.body.transaction.category).toBe('coffee');
    });

    it('should return 400 when date is invalid', async () => {
      const res = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId, type: 'expense', category: 'food', amount: 500, date: 'not-a-date' });
      expect(res.statusCode).toBe(400);
    });
});

describe('GET /transactions', () => {
    it('should return all transactions for a user', async () => {
      await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId,
          type: 'income',
          category: 'salary',
          amount: 50000,
          date: '2025-01-01'
        });
  
      const res = await request(app).get(`/transactions?userId=${userId}`).set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.transactions)).toBe(true);
      expect(res.body.transactions.length).toBe(1);
    });
});

describe('GET /transactions/:id', () => {
    it('should return a single transaction', async () => {
      const createRes = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId,
          type: 'expense',
          category: 'rent',
          amount: 15000,
          date: '2025-01-01'
        });
  
      const id = createRes.body.transaction._id;
      const res = await request(app).get(`/transactions/${id}`).set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.transaction).toHaveProperty('category', 'rent');
    });
  
    it('should return 404 if transaction not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/transactions/${fakeId}`).set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(404);
    });

    it('should return 400 for a malformed transaction id', async () => {
      const res = await request(app).get('/transactions/not-a-valid-id').set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(400);
    });

    it('should return 404 when accessing another user\'s transaction', async () => {
      const createRes = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'expense', category: 'rent', amount: 5000, date: '2025-01-01' });

      const intruderEmail = `intruder${Date.now()}@example.com`;
      await request(app).post('/users').send({ name: 'Intruder', email: intruderEmail, password: 'password123' });
      const loginRes = await request(app).post('/users/login').send({ email: intruderEmail, password: 'password123' });
      const intruderToken = loginRes.body.token;

      const res = await request(app)
        .get(`/transactions/${createRes.body.transaction._id}`)
        .set('Authorization', `Bearer ${intruderToken}`);
      expect(res.statusCode).toBe(404);
    });
});

describe('PATCH /transactions/:id', () => {
    it('should update a transaction', async () => {
      const createRes = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId,
          type: 'expense',
          category: 'food',
          amount: 500,
          date: '2025-01-15'
        });
  
      const id = createRes.body.transaction._id;
      const res = await request(app)
        .patch(`/transactions/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 750 });
      expect(res.statusCode).toBe(200);
      expect(res.body.transaction).toHaveProperty('amount', 750);
    });

    it('should return 404 when updating another user\'s transaction', async () => {
      const createRes = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'expense', category: 'food', amount: 500, date: '2025-01-15' });

      const intruderEmail = `intruder${Date.now()}-patch@example.com`;
      await request(app).post('/users').send({ name: 'Intruder', email: intruderEmail, password: 'password123' });
      const loginRes = await request(app).post('/users/login').send({ email: intruderEmail, password: 'password123' });
      const intruderToken = loginRes.body.token;

      const res = await request(app)
        .patch(`/transactions/${createRes.body.transaction._id}`)
        .set('Authorization', `Bearer ${intruderToken}`)
        .send({ amount: 999 });
      expect(res.statusCode).toBe(404);
    });

    it('should ignore a spoofed userId in the update body', async () => {
      const createRes = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'expense', category: 'food', amount: 500, date: '2025-01-15' });

      const otherId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/transactions/${createRes.body.transaction._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 750, userId: otherId.toString() });
      expect(res.statusCode).toBe(200);
      expect(res.body.transaction.userId).toBe(new mongoose.Types.ObjectId(userId).toString());
    });
});

describe('DELETE /transactions/:id', () => {
    it('should delete a transaction', async () => {
      const createRes = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId,
          type: 'expense',
          category: 'food',
          amount: 500,
          date: '2025-01-15'
        });
  
      const id = createRes.body.transaction._id;
      const res = await request(app).delete(`/transactions/${id}`).set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
  
      const getRes = await request(app).get(`/transactions/${id}`).set('Authorization', `Bearer ${token}`);
      expect(getRes.statusCode).toBe(404);
    });

    it('should return 404 when deleting another user\'s transaction', async () => {
      const createRes = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'expense', category: 'food', amount: 500, date: '2025-01-15' });

      const intruderEmail = `intruder${Date.now()}-del@example.com`;
      await request(app).post('/users').send({ name: 'Intruder', email: intruderEmail, password: 'password123' });
      const loginRes = await request(app).post('/users/login').send({ email: intruderEmail, password: 'password123' });
      const intruderToken = loginRes.body.token;

      const res = await request(app)
        .delete(`/transactions/${createRes.body.transaction._id}`)
        .set('Authorization', `Bearer ${intruderToken}`);
      expect(res.statusCode).toBe(404);
    });
});

describe('GET /transactions (filters)', () => {
    beforeEach(async () => {
      // create transactions in different categories and dates
      await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId,
          type: 'expense',
          category: 'food',
          amount: 500,
          date: '2025-01-15'
        });
      await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId,
          type: 'expense',
          category: 'rent',
          amount: 15000,
          date: '2025-01-05'
        });
    });
  
    it('should filter transactions by category', async () => {
      const res = await request(app)
        .get('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .query({ userId, category: 'food' });
      expect(res.statusCode).toBe(200);
      expect(res.body.transactions.length).toBe(1);
      expect(res.body.transactions[0].category).toBe('food');
    });
  
    it('should filter transactions by date range', async () => {
      const res = await request(app)
        .get('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .query({ userId, startDate: '2025-01-10', endDate: '2025-01-20' });
      expect(res.statusCode).toBe(200);
      expect(res.body.transactions.length).toBe(1);
      expect(res.body.transactions[0].category).toBe('food');
    });
});