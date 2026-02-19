// Jest setup file for backend tests
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create test database directory if it doesn't exist
const testDbDir = `${__dirname}/test-data`;
if (!fs.existsSync(testDbDir)) {
  fs.mkdirSync(testDbDir, { recursive: true });
}

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3002';
process.env.CORS_ORIGIN = '*';

// Clean up after all tests
afterAll(() => {
  // Clean up test database files
  if (fs.existsSync(testDbDir)) {
    fs.rmSync(testDbDir, { recursive: true, force: true });
  }
});