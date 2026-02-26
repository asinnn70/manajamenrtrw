import { createClient, Client } from '@libsql/client';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'db-config.json');

export interface DbConfig {
  url: string;
  authToken: string;
}

function getInitialConfig(): DbConfig {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    } catch (e) {
      console.error("Failed to read db-config.json", e);
    }
  }
  return {
    url: process.env.TURSO_DATABASE_URL || "libsql://dbrtrw-vercel-icfg-gitcn1w4pfupzkiukiwvtlpt.aws-us-east-1.turso.io",
    authToken: process.env.TURSO_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzE5ODU3NjAsImlkIjoiMDE5YzkyOTQtZjEwMS03ZTkxLWI4MWUtYjJlOWU2MWEzMjIwIiwicmlkIjoiZjU3NWQ3ZjMtODU5My00OTFjLWJmYjAtODMyOTkzMjczOTkwIn0.2fAcsvtrzxk9A4aM7qyo67KQXvC8JseauBbKO2nV72kz4dnmjfq28dqz5KlmJFTlw0NXgQ0j_ioLESUVops2Aw",
  };
}

let currentConfig = getInitialConfig();
let client = createClient(currentConfig);

export const db = {
  execute: (stmt: any) => client.execute(stmt),
  batch: (stmts: any[], mode?: any) => client.batch(stmts, mode),
  transaction: (mode?: any) => client.transaction(mode),
  close: () => client.close(),
};

export function updateDbConfig(config: DbConfig) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch (e) {
    console.warn("Warning: Could not persist database config to file. This is expected on read-only environments like Vercel.", e);
    // We still update the in-memory config so the current process uses the new settings
  }
  currentConfig = config;
  client = createClient(currentConfig);
}

export function getDbConfig(): DbConfig {
  return currentConfig;
}

export async function initDb() {
  // Create Residents Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS residents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      nik TEXT NOT NULL UNIQUE,
      address TEXT NOT NULL,
      rt TEXT NOT NULL,
      rw TEXT NOT NULL,
      status TEXT NOT NULL,
      phone TEXT,
      gender TEXT DEFAULT 'Laki-laki',
      maritalStatus TEXT DEFAULT 'Lajang',
      familyRelationship TEXT DEFAULT 'Kepala Keluarga',
      familyCardNumber TEXT
    )
  `);

  // Migration for existing tables
  try {
    const columnsResult = await db.execute("PRAGMA table_info(residents)");
    const columns = columnsResult.rows;
    const hasGender = columns.some(c => c.name === 'gender');
    const hasFamilyRelationship = columns.some(c => c.name === 'familyRelationship');
    const hasFamilyCardNumber = columns.some(c => c.name === 'familyCardNumber');
    
    if (!hasGender) {
      await db.execute("ALTER TABLE residents ADD COLUMN gender TEXT DEFAULT 'Laki-laki'");
      await db.execute("ALTER TABLE residents ADD COLUMN maritalStatus TEXT DEFAULT 'Lajang'");
    }
    
    if (!hasFamilyRelationship) {
      await db.execute("ALTER TABLE residents ADD COLUMN familyRelationship TEXT DEFAULT 'Kepala Keluarga'");
    }

    if (!hasFamilyCardNumber) {
      await db.execute("ALTER TABLE residents ADD COLUMN familyCardNumber TEXT");
    }
  } catch (error) {
    console.error("Migration failed:", error);
  }

  // Create Announcements Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      content TEXT NOT NULL
    )
  `);

  // Create Letters Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS letters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      resident TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      content TEXT
    )
  `);

  // Migration for existing tables
  try {
    const columnsResult = await db.execute("PRAGMA table_info(letters)");
    const columns = columnsResult.rows;
    const hasContent = columns.some(c => c.name === 'content');
    
    if (!hasContent) {
      await db.execute("ALTER TABLE letters ADD COLUMN content TEXT");
    }
  } catch (error) {
    console.error("Migration for letters failed:", error);
  }

  // Create Mutations Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS mutations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      residentId INTEGER NOT NULL,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      details TEXT,
      FOREIGN KEY (residentId) REFERENCES residents (id)
    )
  `);

  // Create Transactions Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL
    )
  `);

  // Create Reports Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      residentId INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'Menunggu',
      FOREIGN KEY (residentId) REFERENCES residents (id)
    )
  `);

  // Seed data if empty
  const countResult = await db.execute('SELECT count(*) as count FROM residents');
  const row = countResult.rows[0];
  let count = 0;
  if (row) {
    const rawCount = row.count || row[0];
    count = typeof rawCount === 'bigint' ? Number(rawCount) : Number(rawCount || 0);
  }

  if (count === 0) {
    const seedData = [
      { name: "Warga 1", nik: "0000-1", address: "Jl. Mawar No. 10", rt: "01", rw: "05", status: "Tetap", phone: "081234567890", gender: "Laki-laki", maritalStatus: "Menikah" },
      { name: "Warga 2", nik: "0000-2", address: "Jl. Melati No. 5", rt: "02", rw: "05", status: "Tetap", phone: "081234567891", gender: "Perempuan", maritalStatus: "Menikah" },
      { name: "Warga 3", nik: "0000-3", address: "Jl. Anggrek No. 3", rt: "01", rw: "05", status: "Kontrak", phone: "081234567892", gender: "Laki-laki", maritalStatus: "Lajang" },
      { name: "Warga 4", nik: "0000-4", address: "Jl. Kamboja No. 12", rt: "03", rw: "05", status: "Tetap", phone: "081234567893", gender: "Perempuan", maritalStatus: "Janda" },
      { name: "Warga 5", nik: "0000-5", address: "Jl. Kenanga No. 8", rt: "02", rw: "05", status: "Kost", phone: "081234567894", gender: "Laki-laki", maritalStatus: "Lajang" },
    ];

    for (const resident of seedData) {
      await db.execute({
        sql: `INSERT INTO residents (name, nik, address, rt, rw, status, phone, gender, maritalStatus)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [resident.name, resident.nik, resident.address, resident.rt, resident.rw, resident.status, resident.phone, resident.gender, resident.maritalStatus]
      });
    }
    console.log('Database seeded with initial data');
  }
}
