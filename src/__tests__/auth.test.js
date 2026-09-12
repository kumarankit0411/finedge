const request = require('supertest');
const app = require('../app');

describe('POST /users (registration)', () => {
    it('should hash the password before saving', async () => {
      const res = await request(app)
        .post('/users')
        .send({
          name: 'Auth User',
          email: 'auth@example.com',
          password: 'mypassword123'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.user).not.toHaveProperty('password');
    });
});

describe('POST /users/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/users')
        .send({
          name: 'Login User',
          email: 'login@example.com',
          password: 'password123'
        });
    });
  
    it('should return a JWT token on successful login', async () => {
      const res = await request(app)
        .post('/users/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });
  
    it('should return 401 for wrong password', async () => {
      const res = await request(app)
        .post('/users/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        });
      expect(res.statusCode).toBe(401);
    });
  
    it('should return 401 for non-existent email', async () => {
      const res = await request(app)
        .post('/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });
      expect(res.statusCode).toBe(401);
    });
});

describe('Protected routes', () => {
    let token;
  
    beforeEach(async () => {
      await request(app)
        .post('/users')
        .send({
          name: 'Protected User',
          email: 'protected@example.com',
          password: 'password123'
        });
  
      const res = await request(app)
        .post('/users/login')
        .send({
          email: 'protected@example.com',
          password: 'password123'
        });
      token = res.body.token;
    });
  
    it('should allow access with valid token', async () => {
      const res = await request(app)
        .get('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .query({ userId: 'someUserId' });
      expect(res.statusCode).not.toBe(401);
    });
  
    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/transactions')
        .query({ userId: 'someUserId' });
      expect(res.statusCode).toBe(401);
    });
  
    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/transactions')
        .set('Authorization', 'Bearer invalidtoken123')
        .query({ userId: 'someUserId' });
      expect(res.statusCode).toBe(401);
    });
});
  
  