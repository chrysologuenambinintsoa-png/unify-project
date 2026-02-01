const fs = require('fs');
const path = require('path');

// Load .env file manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').replace(/^["']|["']$/g, '');
    process.env[key.trim()] = value;
  }
});

const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    console.log('Database URL:', process.env.DATABASE_URL.substring(0, 50) + '...');
    // Try to query the table directly
    const res = await prisma.loginHistory.count();
    console.log('✅ LoginHistory table exists! Current records:', res);
  } catch (e) {
    if (e.message.includes('P3018') || e.message.includes('does not exist')) {
      console.log('❌ LoginHistory table does NOT exist in database');
    } else {
      console.error('Error:', e.message || e);
    }
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
