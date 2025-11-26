const request = require('supertest');
const app = require('../src/app');

describe('Assign Task API', () => {
  it('creates an assignment with required fields and auto task_id', async () => {
    const res = await request(app).post('/api/assigntask').send({
      department: 'Maintenance',
      name: 'John Doe',
      task_description: 'Clean lobby'
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('task_id');
    expect(res.body.department).toBe('Maintenance');
    expect(res.body.name).toBe('John Doe');
    expect(res.body.task_description).toBe('Clean lobby');
  });
});
