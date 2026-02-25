import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'rtrw.db');
const db = new Database(dbPath);

export function initDb() {
  // Create Residents Table
  db.exec(`
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
    const columns = db.prepare("PRAGMA table_info(residents)").all() as any[];
    const hasGender = columns.some(c => c.name === 'gender');
    const hasFamilyRelationship = columns.some(c => c.name === 'familyRelationship');
    const hasFamilyCardNumber = columns.some(c => c.name === 'familyCardNumber');
    
    if (!hasGender) {
      db.exec("ALTER TABLE residents ADD COLUMN gender TEXT DEFAULT 'Laki-laki'");
      db.exec("ALTER TABLE residents ADD COLUMN maritalStatus TEXT DEFAULT 'Lajang'");
    }
    
    if (!hasFamilyRelationship) {
      db.exec("ALTER TABLE residents ADD COLUMN familyRelationship TEXT DEFAULT 'Kepala Keluarga'");
    }

    if (!hasFamilyCardNumber) {
      db.exec("ALTER TABLE residents ADD COLUMN familyCardNumber TEXT");
    }
  } catch (error) {
    console.error("Migration failed:", error);
  }

  // Create Announcements Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      content TEXT NOT NULL
    )
  `);

  // Create Letters Table
  db.exec(`
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
    const columns = db.prepare("PRAGMA table_info(letters)").all() as any[];
    const hasContent = columns.some(c => c.name === 'content');
    
    if (!hasContent) {
      db.exec("ALTER TABLE letters ADD COLUMN content TEXT");
    }
  } catch (error) {
    console.error("Migration for letters failed:", error);
  }

  // Create Mutations Table
  db.exec(`
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
  db.exec(`
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
  db.exec(`
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
  const count = db.prepare('SELECT count(*) as count FROM residents').get() as { count: number };
  if (count.count === 0) {
    const insert = db.prepare(`
      INSERT INTO residents (name, nik, address, rt, rw, status, phone, gender, maritalStatus)
      VALUES (@name, @nik, @address, @rt, @rw, @status, @phone, @gender, @maritalStatus)
    `);

    const seedData = [
      { name: "Warga 1", nik: "0000-1", address: "Jl. Mawar No. 10", rt: "01", rw: "05", status: "Tetap", phone: "081234567890", gender: "Laki-laki", maritalStatus: "Menikah" },
      { name: "Warga 2", nik: "0000-2", address: "Jl. Melati No. 5", rt: "02", rw: "05", status: "Tetap", phone: "081234567891", gender: "Perempuan", maritalStatus: "Menikah" },
      { name: "Warga 3", nik: "0000-3", address: "Jl. Anggrek No. 3", rt: "01", rw: "05", status: "Kontrak", phone: "081234567892", gender: "Laki-laki", maritalStatus: "Lajang" },
      { name: "Warga 4", nik: "0000-4", address: "Jl. Kamboja No. 12", rt: "03", rw: "05", status: "Tetap", phone: "081234567893", gender: "Perempuan", maritalStatus: "Janda" },
      { name: "Warga 5", nik: "0000-5", address: "Jl. Kenanga No. 8", rt: "02", rw: "05", status: "Kost", phone: "081234567894", gender: "Laki-laki", maritalStatus: "Lajang" },
    ];

    seedData.forEach(resident => insert.run(resident));
    console.log('Database seeded with initial data');
  }
}

export default db;
