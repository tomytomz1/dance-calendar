/**
 * Tests database connectivity. Run with: node scripts/test-db-connection.js
 * Loads .env from project root.
 */
const path = require("path");
const fs = require("fs");

// Load .env if it exists
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      process.env[key] = value;
    }
  });
}

async function testConnection() {
  console.log("Testing database connection...\n");

  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is not set in .env");
    console.log("\nTo fix:");
    console.log("1. Copy .env.example to .env");
    console.log("2. Add your Neon connection string to DATABASE_URL");
    process.exit(1);
  }

  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    console.log("SUCCESS: Database connection works.\n");
    process.exit(0);
  } catch (err) {
    console.error("FAILED: Could not connect to the database.\n");
    console.error("Error:", err.message || err);
    console.error("\nCommon causes:");
    console.error("1. Neon database is sleeping - Open https://console.neon.tech and click your project to wake it");
    console.error("2. Invalid DATABASE_URL - Check your .env matches the connection string from Neon Console");
    console.error("3. Network/firewall - VPN or corporate network may block the connection");
    console.error("\nAdd connect_timeout=10 to your DATABASE_URL for faster failure:");
    console.error('  DATABASE_URL="postgresql://...?sslmode=require&connect_timeout=10"');
    process.exit(1);
  }
}

testConnection();
