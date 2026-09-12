const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');

afterAll(async () => {
    await mongoose.connection.close();
});

describe('POST /users', () => {
    it('should register a new user and return 201', async() => {
        const res = await request(app)
            .post('/users')
            .send({
                name: 'Ankit',
                email: 'ankit@example.com',
                password: 'password234'
            });
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('user');
        expect(res.body.user).toHaveProperty('name', 'Ankit');
        expect(res.body.user).toHaveProperty('email', 'ankit@example.com');
    });

    it('should return 400 if required fields are missing', async() => {
        const res = await request(app)
            .post('/users')
            .send({name: 'Ankit'});
        expect(res.statusCode).toBe(400);
    });

    it('should return 409 if email already exist', async() => {
        await request(app)
            .post('/users')
            .send({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123'
            });
        const res = await request(app)
            .post('/users')
            .send({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123'
            });
        expect(res.statusCode).toBe(409);
    });
});