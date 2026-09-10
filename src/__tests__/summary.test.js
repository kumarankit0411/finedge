const request = require('supertest');
const app = require('../app');
const Transaction = require('../models/transactionModel');

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

describe('GET /summary', () => {
    it('should return income, expenses, and balance', async () => {
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
  
      await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId,
          type: 'expense',
          category: 'food',
          amount: 5000,
          date: '2025-01-10'
        });
  
      const res = await request(app).get(`/summary?userId=${userId}`).set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('totalIncome', 50000);
      expect(res.body).toHaveProperty('totalExpenses', 20000);
      expect(res.body).toHaveProperty('balance', 30000);
    });
  
    it('should return 0 balance when no transactions', async () => {
      const res = await request(app).get(`/summary?userId=${userId}`).set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('totalIncome', 0);
      expect(res.body).toHaveProperty('totalExpenses', 0);
      expect(res.body).toHaveProperty('balance', 0);
    });
  
    it('should use the token user, not a query param', async () => {
        await request(app)
          .post('/transactions')
          .set('Authorization', `Bearer ${token}`)
          .send({ type: 'expense', category: 'rent', amount: 10000, date: '2025-01-05' });
      
        const res = await request(app)
          .get('/summary')
          .set('Authorization', `Bearer ${token}`);
      
        expect(res.statusCode).toBe(200);
        expect(res.body.totalExpenses).toBe(10000);
    });

    it('should not serve another user\'s summary via forged userId', async () => {
        const otherRes = await request(app).post('/users').send({ name: 'Other', email: `other${Date.now()}@test.com`, password: 'password123' });
        const otherUserId = otherRes.body.user._id;
        const otherLogin = await request(app).post('/users/login').send({ email: otherRes.body.user.email, password: 'password123' });
        const otherToken = otherLogin.body.token;
      
        await request(app).post('/transactions').set('Authorization', `Bearer ${otherToken}`)
          .send({ type: 'expense', category: 'rent', amount: 99999, date: '2025-01-05' });
      
        const res = await request(app).get(`/summary?userId=${otherUserId}`).set('Authorization', `Bearer ${token}`);
        expect(res.body.totalExpenses).toBe(0);
    });

    it('should serve cached summary without hitting the database', async () => {
        await request(app)
          .post('/transactions')
          .set('Authorization', `Bearer ${token}`)
          .send({ userId, type: 'income', category: 'salary', amount: 50000, date: '2025-01-01' });
        await request(app)
          .post('/transactions')
          .set('Authorization', `Bearer ${token}`)
          .send({ userId, type: 'expense', category: 'rent', amount: 15000, date: '2025-01-05' });
      
        const first = await request(app)
          .get('/summary')
          .set('Authorization', `Bearer ${token}`)
          .query({ userId });
        expect(first.body.totalIncome).toBe(50000);

        await Transaction.deleteMany({ userId });

        const second = await request(app)
          .get('/summary')
          .set('Authorization', `Bearer ${token}`)
          .query({ userId });
        expect(second.body.totalIncome).toBe(50000);
        expect(second.body.totalExpenses).toBe(15000);
    });
});
