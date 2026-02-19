import { statements } from '../database.js';
import { randomBytes } from 'crypto';

describe('Database Operations', () => {
  let testCmcId;

  beforeEach(() => {
    // Clean up test data
    const cmcs = statements.getAllCmcs.all();
    cmcs.forEach(cmc => {
      statements.deleteCmc.run(cmc.id);
    });
  });

  describe('Create CMC', () => {
    it('should insert a new CMC', () => {
      testCmcId = randomBytes(8).toString('hex');
      const now = Date.now();

      statements.createCmc.run(
        testCmcId,
        'Test CMC',
        'https://10.0.0.1',
        'admin',
        'password123',
        'Test notes',
        now,
        now
      );

      const cmc = statements.getCmcById.get(testCmcId);
      expect(cmc).toBeDefined();
      expect(cmc.name).toBe('Test CMC');
      expect(cmc.address).toBe('https://10.0.0.1');
    });
  });

  describe('Read CMCs', () => {
    beforeEach(() => {
      const now = Date.now();
      
      // Insert test data
      const id1 = randomBytes(8).toString('hex');
      statements.createCmc.run(id1, 'CMC B', 'https://10.0.0.2', 'admin', 'pass', '', now, now);
      
      const id2 = randomBytes(8).toString('hex');
      statements.createCmc.run(id2, 'CMC A', 'https://10.0.0.1', 'admin', 'pass', '', now, now);
    });

    it('should retrieve all CMCs sorted by name', () => {
      const cmcs = statements.getAllCmcs.all();
      expect(cmcs).toHaveLength(2);
      expect(cmcs[0].name).toBe('CMC A');
      expect(cmcs[1].name).toBe('CMC B');
    });

    it('should retrieve single CMC by ID', () => {
      const allCmcs = statements.getAllCmcs.all();
      const cmc = statements.getCmcById.get(allCmcs[0].id);
      
      expect(cmc).toBeDefined();
      expect(cmc.id).toBe(allCmcs[0].id);
    });
  });

  describe('Update CMC', () => {
    beforeEach(() => {
      testCmcId = randomBytes(8).toString('hex');
      const now = Date.now();
      statements.createCmc.run(
        testCmcId,
        'Original',
        'https://10.0.0.1',
        'admin',
        'password',
        'Notes',
        now,
        now
      );
    });

    it('should update CMC fields', () => {
      const now = Date.now();
      statements.updateCmc.run(
        'Updated Name',
        'https://10.0.0.2',
        'newadmin',
        'newpassword',
        'New notes',
        now,
        testCmcId
      );

      const cmc = statements.getCmcById.get(testCmcId);
      expect(cmc.name).toBe('Updated Name');
      expect(cmc.address).toBe('https://10.0.0.2');
      expect(cmc.username).toBe('newadmin');
      expect(cmc.password).toBe('newpassword');
      expect(cmc.notes).toBe('New notes');
    });
  });

  describe('Delete CMC', () => {
    beforeEach(() => {
      testCmcId = randomBytes(8).toString('hex');
      const now = Date.now();
      statements.createCmc.run(
        testCmcId,
        'Test',
        'https://10.0.0.1',
        'admin',
        'password',
        '',
        now,
        now
      );
    });

    it('should delete a CMC', () => {
      statements.deleteCmc.run(testCmcId);
      const cmc = statements.getCmcById.get(testCmcId);
      expect(cmc).toBeUndefined();
    });
  });

  describe('Search CMCs', () => {
    beforeEach(() => {
      const now = Date.now();
      
      const id1 = randomBytes(8).toString('hex');
      statements.createCmc.run(id1, 'Production Server', 'https://10.0.0.1', 'admin', 'pass', 'Main server', now, now);
      
      const id2 = randomBytes(8).toString('hex');
      statements.createCmc.run(id2, 'Dev Server', 'https://10.0.0.2', 'admin', 'pass', 'Development', now, now);
    });

    it('should search by name', () => {
      const results = statements.searchCmcs.all('%Production%', '%', '%');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Production Server');
    });

    it('should search by address', () => {
      const results = statements.searchCmcs.all('%', '%10.0.0.2%', '%');
      expect(results).toHaveLength(1);
      expect(results[0].address).toBe('https://10.0.0.2');
    });

    it('should search by notes', () => {
      const results = statements.searchCmcs.all('%', '%', '%Development%');
      expect(results).toHaveLength(1);
      expect(results[0].notes).toBe('Development');
    });
  });
});