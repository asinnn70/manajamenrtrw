import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'db-config.json');

export interface DbConfig {
  url: string; // This will be the Supabase Connection String
  authToken: string; // Not strictly needed for 'postgres' but kept for compatibility
}

function getInitialConfig(): DbConfig {
  const envUrl = process.env.SUPABASE_DB_URL || process.env.TURSO_DATABASE_URL;
  const envToken = process.env.SUPABASE_ANON_KEY || process.env.TURSO_AUTH_TOKEN;

  if (envUrl) {
    console.log("DB_LOG: Using database configuration from environment variables");
    console.log("DB_LOG: URL starts with:", envUrl.substring(0, 20) + "...");
    return { url: envUrl, authToken: envToken || '' };
  }

  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      console.log("DB_LOG: Using database configuration from db-config.json");
      return config;
    } catch (e) {
      console.error("DB_LOG_ERROR: Failed to read db-config.json", e);
    }
  }

  console.log("DB_LOG: No database configuration found, using defaults");
  return {
    url: "",
    authToken: "",
  };
}

function cleanConnectionString(url: string): string {
  if (!url) return url;
  // Remove accidental brackets around password that users often copy from documentation
  // e.g., postgres://user:[pass]@host -> postgres://user:pass@host
  return url.replace(/:\[(.*?)\]@/, ':$1@');
}

let currentConfig = getInitialConfig();
let sql = currentConfig.url ? postgres(cleanConnectionString(currentConfig.url), { 
  ssl: { rejectUnauthorized: false },
  connect_timeout: 5,
  max: 1,
  idle_timeout: 3,
}) : null;

// Compatibility layer to convert SQLite/libSQL style '?' to Postgres '$1'
function convertSql(query: string): string {
  let index = 1;
  return query.replace(/\?/g, () => `$${index++}`);
}

export const db = {
  execute: async (stmt: any) => {
    if (!sql) throw new Error("Database not configured. Please set Supabase Connection String in Settings.");
    
    let query = typeof stmt === 'string' ? stmt : stmt.sql;
    let args = typeof stmt === 'string' ? [] : (stmt.args || []);
    
    // Auto-append RETURNING * for INSERT/UPDATE to get IDs easily
    const isInsert = query.trim().toUpperCase().startsWith('INSERT');
    const isUpdate = query.trim().toUpperCase().startsWith('UPDATE');
    const isDelete = query.trim().toUpperCase().startsWith('DELETE');
    
    let finalQuery = convertSql(query);
    if ((isInsert || isUpdate || isDelete) && !finalQuery.toUpperCase().includes('RETURNING')) {
      finalQuery += ' RETURNING *';
    }

    try {
      const cleanedUrl = cleanConnectionString(currentConfig.url);
      const port = cleanedUrl.split(':').pop()?.split('/')[0];
      console.log(`DB_LOG: Executing query on port ${port}: ${finalQuery.substring(0, 50)}...`);
      
      const result = await sql.unsafe(finalQuery, args);
      console.log(`DB_LOG: Query successful, rows: ${result.length}`);
      
      return {
        rows: result.map(row => ({ ...row })),
        rowsAffected: result.count,
        lastInsertRowid: (isInsert && result.length > 0) ? (result[0].id || result[0].ID) : null
      };
    } catch (err: any) {
      console.error("DB_LOG_ERROR: Database execution error:", err);
      // Re-throw with more context if it's a connection error
      if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.message.includes('timeout')) {
        let extraHint = "";
        const url = currentConfig.url;
        
        if (url.includes(':5432')) {
          extraHint = " PENTING: Port 5432 diblokir. Ganti ke port 6543 DAN gunakan host dari tab 'Transaction Pooler' di Supabase.";
        } else if (url.includes(':6543') && url.includes('db.') && url.includes('.supabase.co')) {
          extraHint = " SALAH HOST: Anda menggunakan port 6543 dengan host 'db.*'. Anda HARUS menggunakan host dari tab 'Transaction Pooler' (contoh: *.pooler.supabase.com).";
        }
        
        const msg = `Database Connection Error: ${err.message}.${extraHint} (Code: ${err.code})`;
        console.error("DB_LOG_ERROR:", msg);
        throw new Error(msg);
      }
      throw err;
    }
  },
  batch: async (stmts: any[], mode?: any) => {
    if (!sql) throw new Error("Database not configured");
    
    const results = [];
    // Simple sequential execution for batch compatibility
    for (const stmt of stmts) {
      results.push(await db.execute(stmt));
    }
    return results;
  },
  close: async () => {
    if (sql) await sql.end();
  }
};

export async function updateDbConfig(config: DbConfig) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch (e) {
    console.warn("DB_LOG_WARN: Could not persist database config to file (expected on Vercel).", e);
  }
  
  currentConfig = config;
  
  if (sql) {
    try {
      console.log("DB_LOG: Closing existing database connection...");
      await sql.end({ timeout: 2 });
    } catch (e) {
      console.error("DB_LOG_ERROR: Error closing old connection:", e);
    }
  }

  const cleanedUrl = cleanConnectionString(config.url);
  console.log(`DB_LOG: Setting new connection URL (port: ${cleanedUrl.split(':').pop()?.split('/')[0]})`);
  
  sql = config.url ? postgres(cleanedUrl, { 
    ssl: { rejectUnauthorized: false },
    connect_timeout: 5,
    max: 1,
    idle_timeout: 3,
  }) : null;
}

export function getDbConfig(): DbConfig {
  return currentConfig;
}

let isInitialized = false;
export async function initDb() {
  if (!sql) return;
  if (isInitialized) return;

  try {
    console.log("DB_LOG: Initializing database tables in a single batch...");
    
    // Combine all table creations into one big query to save time/roundtrips
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS residents (
        id SERIAL PRIMARY KEY,
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
      );

      CREATE TABLE IF NOT EXISTS announcements (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        content TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS letters (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        resident TEXT NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        content TEXT
      );

      CREATE TABLE IF NOT EXISTS mutations (
        id SERIAL PRIMARY KEY,
        residentId INTEGER NOT NULL REFERENCES residents(id),
        type TEXT NOT NULL,
        date TEXT NOT NULL,
        details TEXT
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        date TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        residentId INTEGER NOT NULL REFERENCES residents(id),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        date TEXT NOT NULL,
        status TEXT DEFAULT 'Menunggu'
      );
    `);

    // Seed data if empty
    const countResult = await sql`SELECT count(*) FROM residents`;
    const count = parseInt(countResult[0].count);

    if (count === 0) {
      console.log('DB_LOG: Seeding initial data...');
      const seedData = [
        { name: "Warga 1", nik: "0000-1", address: "Jl. Mawar No. 10", rt: "01", rw: "05", status: "Tetap", phone: "081234567890", gender: "Laki-laki", maritalStatus: "Menikah" },
        { name: "Warga 2", nik: "0000-2", address: "Jl. Melati No. 5", rt: "02", rw: "05", status: "Tetap", phone: "081234567891", gender: "Perempuan", maritalStatus: "Menikah" },
        { name: "Warga 3", nik: "0000-3", address: "Jl. Anggrek No. 3", rt: "01", rw: "05", status: "Kontrak", phone: "081234567892", gender: "Laki-laki", maritalStatus: "Lajang" },
        { name: "Warga 4", nik: "0000-4", address: "Jl. Kamboja No. 12", rt: "03", rw: "05", status: "Tetap", phone: "081234567893", gender: "Perempuan", maritalStatus: "Janda" },
        { name: "Warga 5", nik: "0000-5", address: "Jl. Kenanga No. 8", rt: "02", rw: "05", status: "Kost", phone: "081234567894", gender: "Laki-laki", maritalStatus: "Lajang" },
      ];

      for (const resident of seedData) {
        await sql`
          INSERT INTO residents (name, nik, address, rt, rw, status, phone, gender, maritalStatus)
          VALUES (${resident.name}, ${resident.nik}, ${resident.address}, ${resident.rt}, ${resident.rw}, ${resident.status}, ${resident.phone}, ${resident.gender}, ${resident.maritalStatus})
        `;
      }
    }

    isInitialized = true;
    console.log("DB_LOG: Database tables initialized successfully");
  } catch (error) {
    console.error("DB_LOG_ERROR: Database initialization failed:", error);
    throw error;
  }
}
