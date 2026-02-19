import request from 'supertest';
import app from '../server.js';
import { statements } from '../database.js';

describe('CMC Backend API', () => {
  let testCmcId;

  // Clean up before each test
  beforeEach(() => {
    // Clear all CMCs from test database
    const cmcs = statements.getAllCmcs.all();
    cmcs.forEach(cmc => {
      statements.deleteCmc.run(cmc.id);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.timestamp).toBe('number');
    });
  });

  describe('POST /api/cmcs', () => {
    it('should create a new CMC', async () => {
      const newCmc = {
        name: 'Test CMC',
        address: 'https://10.0.0.1',
        username: 'admin',
        password: 'password123',
        notes: 'Test notes'
      };

      const response = await request(app)
        .post('/api/cmcs')
        .send(newCmc)
        .expect(201);

      expect(response.body).toMatchObject({
        name: newCmc.name,
        address: newCmc.address,
        username: newCmc.username,
        password: newCmc.password,
        notes: newCmc.notes
      });
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('created_at');
      expect(response.body).toHaveProperty('updated_at');

      testCmcId = response.body.id;
    });

    it('should reject CMC without required fields', async () => {
      const invalidCmc = {
        name: 'Test CMC'
        // missing address, username, password
      };

      const response = await request(app)
        .post('/api/cmcs')
        .send(invalidCmc)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should reject CMC with invalid address format', async () => {
      const invalidCmc = {
        name: 'Test CMC',
        address: '10.0.0.1', // missing http:// or https://
        username: 'admin',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/cmcs')
        .send(invalidCmc)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('must start with http:// or https://');
    });
  });

  describe('GET /api/cmcs', () => {
    beforeEach(async () => {
      // Create test CMCs
      await request(app)
        .post('/api/cmcs')
        .send({
          name: 'CMC 1',
          address: 'https://10.0.0.1',
          username: 'admin',
          password: 'pass1'
        });

      await request(app)
        .post('/api/cmcs')
        .send({
          name: 'CMC 2',
          address: 'https://10.0.0.2',
          username: 'admin',
          password: 'pass2'
        });
    });

    it('should return all CMCs', async () => {
      const response = await request(app)
        .get('/api/cmcs')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('address');
    });

    it('should return CMCs sorted by name', async () => {
      const response = await request(app)
        .get('/api/cmcs')
        .expect(200);

      expect(response.body[0].name).toBe('CMC 1');
      expect(response.body[1].name).toBe('CMC 2');
    });
  });

  describe('GET /api/cmcs/:id', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/cmcs')
        .send({
          name: 'Test CMC',
          address: 'https://10.0.0.1',
          username: 'admin',
          password: 'password123'
        });
      testCmcId = response.body.id;
    });

    it('should return a single CMC by ID', async () => {
      const response = await request(app)
        .get(`/api/cmcs/${testCmcId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testCmcId);
      expect(response.body).toHaveProperty('name', 'Test CMC');
    });

    it('should return 404 for non-existent CMC', async () => {
      const response = await request(app)
        .get('/api/cmcs/nonexistent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'CMC not found');
    });
  });

  describe('PUT /api/cmcs/:id', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/cmcs')
        .send({
          name: 'Original CMC',
          address: 'https://10.0.0.1',
          username: 'admin',
          password: 'password123',
          notes: 'Original notes'
        });
      testCmcId = response.body.id;
    });

    it('should update an existing CMC', async () => {
      const updatedData = {
        name: 'Updated CMC',
        address: 'https://10.0.0.2',
        username: 'newadmin',
        password: 'newpassword',
        notes: 'Updated notes'
      };

      const response = await request(app)
        .put(`/api/cmcs/${testCmcId}`)
        .send(updatedData)
        .expect(200);

      expect(response.body).toMatchObject(updatedData);
      expect(response.body.id).toBe(testCmcId);
      expect(response.body.updated_at).toBeGreaterThan(response.body.created_at);
    });

    it('should return 404 when updating non-existent CMC', async () => {
      const response = await request(app)
        .put('/api/cmcs/nonexistent-id')
        .send({
          name: 'Updated',
          address: 'https://10.0.0.1',
          username: 'admin',
          password: 'password'
        })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'CMC not found');
    });

    it('should reject update with invalid data', async () => {
      const response = await request(app)
        .put(`/api/cmcs/${testCmcId}`)
        .send({
          name: 'Updated',
          address: 'invalid-address',
          username: 'admin',
          password: 'password'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/cmcs/:id', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/cmcs')
        .send({
          name: 'Test CMC',
          address: 'https://10.0.0.1',
          username: 'admin',
          password: 'password123'
        });
      testCmcId = response.body.id;
    });

    it('should delete a CMC', async () => {
      await request(app)
        .delete(`/api/cmcs/${testCmcId}`)
        .expect(204);

      // Verify it's deleted
      await request(app)
        .get(`/api/cmcs/${testCmcId}`)
        .expect(404);
    });

    it('should return 404 when deleting non-existent CMC', async () => {
      const response = await request(app)
        .delete('/api/cmcs/nonexistent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'CMC not found');
    });
  });
});