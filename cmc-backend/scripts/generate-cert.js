import { execSync } from 'child_process';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const certsDir = join(__dirname, '..', 'certs');
const keyPath = join(certsDir, 'server-key.pem');
const certPath = join(certsDir, 'server-cert.pem');

// Create certs directory if it doesn't exist
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
  console.log('✅ Created certs directory');
}

console.log('🔐 Generating self-signed SSL certificate...\n');

try {
  // Generate private key and certificate
  execSync(`openssl req -x509 -newkey rsa:4096 -nodes \
    -keyout "${keyPath}" \
    -out "${certPath}" \
    -days 365 \
    -subj "/C=US/ST=State/L=City/O=Organization/OU=Department/CN=localhost"`, 
    { stdio: 'inherit' }
  );

  console.log('\n✅ SSL certificate generated successfully!');
  console.log(`📁 Key:  ${keyPath}`);
  console.log(`📁 Cert: ${certPath}`);
  console.log('\n⚠️  This is a self-signed certificate for development/testing.');
  console.log('⚠️  For production, use a certificate from a trusted CA.\n');
  console.log('💡 To use HTTPS, set USE_HTTPS=true in your .env file\n');
} catch (error) {
  console.error('❌ Failed to generate certificate:', error.message);
  console.error('\n💡 Make sure OpenSSL is installed on your system.');
  process.exit(1);
}