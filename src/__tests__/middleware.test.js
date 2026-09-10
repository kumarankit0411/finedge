const express = require('express');
const request = require('supertest');
const app = require('../app');
const rateLimit = require('express-rate-limit');

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

describe('Logger Middleware', () => {
    it('should log request details', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      await request(app).get('/health');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
});

describe('Error Handler', () => {
    it('should return 404 for unhandled errors', async () => {
      const res = await request(app).get('/nonexistent-route');
      expect(res.statusCode).toBe(404);
    });
});

describe('Validator Middleware', () => {
    it('should return 400 for invalid transaction type', async () => {
      const res = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: userId,
          type: 'invalid',
          category: 'food',
          amount: 500,
          date: '2025-01-15'
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Type must be income or expense');
    });
});

describe('Rate Limiter', () => {
    it('should return 429 when limit is exceeded', async () => {
      // Create an isolated app with a low limit for testing
      const testApp = express();
      testApp.use(rateLimit({
        windowMs: 60 * 1000,
        max: 10,
        message: { message: 'Too many requests' }
      }));
      testApp.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
  
      for (let i = 0; i < 11; i++) {
        const res = await request(testApp).get('/health');
        if (i === 10) {
          expect(res.statusCode).toBe(429);
        } else {
          expect(res.statusCode).toBe(200);
        }
      }
    });
});

describe('CORS', () => {
    it('should set Access-Control-Allow-Origin header for an allowed origin', async () => {
        const res = await request(app)
          .get('/health')
          .set('Origin', 'http://localhost:3001');
        expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3001');
    });

    it('should reject a disallowed origin', async () => {
        const res = await request(app)
          .get('/health')
          .set('Origin', 'http://evil-site.com');
        expect(res.statusCode).toBe(500);
    });
});
  