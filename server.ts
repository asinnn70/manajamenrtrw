import express from "express";
import { initDb, db, getDbConfig, updateDbConfig } from "./db/index";
import path from "path";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Database
  try {
    await initDb();
  } catch (err) {
    console.error("Database initialization failed:", err);
  }

  app.use(express.json());

  // API Routes
  app.get("/api/db-config", (req, res) => {
    res.json(getDbConfig());
  });

  app.post("/api/db-config", async (req, res) => {
    try {
      const { url, authToken } = req.body;
      if (!url || !authToken) {
        return res.status(400).json({ error: "URL and Auth Token are required" });
      }
      updateDbConfig({ url, authToken });
      // Re-initialize database tables if needed
      await initDb();
      res.json({ message: "Database configuration updated successfully" });
    } catch (error) {
      console.error("Failed to update DB config:", error);
      res.status(500).json({ error: "Failed to update database configuration" });
    }
  });

  app.get("/api/residents", async (req, res) => {
    try {
      const result = await db.execute('SELECT * FROM residents ORDER BY id DESC');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch residents" });
    }
  });

  app.get("/api/residents/:id/family", async (req, res) => {
    try {
      const { id } = req.params;
      const residentResult = await db.execute({
        sql: 'SELECT * FROM residents WHERE id = ?',
        args: [id]
      });
      const resident = residentResult.rows[0] as any;
      
      if (!resident) {
        return res.status(404).json({ error: "Resident not found" });
      }

      if (!resident.familyCardNumber) {
        return res.json([]);
      }

      const familyMembersResult = await db.execute({
        sql: 'SELECT * FROM residents WHERE familyCardNumber = ? AND id != ?',
        args: [resident.familyCardNumber, id]
      });
      res.json(familyMembersResult.rows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch family members" });
    }
  });

  app.post("/api/residents/:id/mutate", async (req, res) => {
    try {
      const { id } = req.params;
      const { type, date, details } = req.body;
      
      await db.batch([
        {
          sql: 'INSERT INTO mutations (residentId, type, date, details) VALUES (?, ?, ?, ?)',
          args: [id, type, date, details]
        },
        {
          sql: 'UPDATE residents SET status = ? WHERE id = ?',
          args: [type, id]
        }
      ], 'write');
      
      res.json({ message: "Resident status updated successfully" });
    } catch (error) {
      console.error("Mutation failed:", error);
      res.status(500).json({ error: "Failed to update resident status" });
    }
  });

  app.post("/api/residents", async (req, res) => {
    try {
      const { name, nik, address, rt, rw, status, phone, gender, maritalStatus, familyRelationship, familyCardNumber } = req.body;
      const result = await db.execute({
        sql: `
          INSERT INTO residents (name, nik, address, rt, rw, status, phone, gender, maritalStatus, familyRelationship, familyCardNumber)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [name, nik, address, rt, rw, status, phone, gender, maritalStatus, familyRelationship, familyCardNumber]
      });
      res.json({ id: result.lastInsertRowid, ...req.body });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create resident" });
    }
  });

  app.put("/api/residents/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, nik, address, rt, rw, status, phone, gender, maritalStatus, familyRelationship, familyCardNumber } = req.body;
      const result = await db.execute({
        sql: `
          UPDATE residents 
          SET name = ?, nik = ?, address = ?, rt = ?, rw = ?, status = ?, phone = ?, gender = ?, maritalStatus = ?, familyRelationship = ?, familyCardNumber = ?
          WHERE id = ?
        `,
        args: [name, nik, address, rt, rw, status, phone, gender, maritalStatus, familyRelationship, familyCardNumber, id]
      });
      
      if (result.rowsAffected > 0) {
        res.json({ message: "Resident updated successfully", id, ...req.body });
      } else {
        res.status(404).json({ error: "Resident not found" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update resident" });
    }
  });

  // Announcements Routes
  app.get("/api/announcements", async (req, res) => {
    try {
      const result = await db.execute('SELECT * FROM announcements ORDER BY id DESC');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  });

  app.post("/api/announcements", async (req, res) => {
    try {
      const { title, date, content } = req.body;
      const result = await db.execute({
        sql: 'INSERT INTO announcements (title, date, content) VALUES (?, ?, ?)',
        args: [title, date, content]
      });
      res.json({ id: result.lastInsertRowid, ...req.body });
    } catch (error) {
      res.status(500).json({ error: "Failed to create announcement" });
    }
  });

  // Transactions Routes
  app.get("/api/transactions", async (req, res) => {
    try {
      const result = await db.execute('SELECT * FROM transactions ORDER BY date DESC, id DESC');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const { type, amount, date, description, category } = req.body;
      const result = await db.execute({
        sql: 'INSERT INTO transactions (type, amount, date, description, category) VALUES (?, ?, ?, ?, ?)',
        args: [type, amount, date, description, category]
      });
      res.json({ id: result.lastInsertRowid, ...req.body });
    } catch (error) {
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  // Letters Routes
  app.get("/api/letters", async (req, res) => {
    try {
      const result = await db.execute('SELECT * FROM letters ORDER BY id DESC');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch letters" });
    }
  });

  app.post("/api/letters", async (req, res) => {
    try {
      const { type, resident, date, status, content } = req.body;
      const result = await db.execute({
        sql: 'INSERT INTO letters (type, resident, date, status, content) VALUES (?, ?, ?, ?, ?)',
        args: [type, resident, date, status, content]
      });
      res.json({ id: result.lastInsertRowid, ...req.body });
    } catch (error) {
      res.status(500).json({ error: "Failed to create letter" });
    }
  });

  app.patch("/api/letters/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = await db.execute({
        sql: 'UPDATE letters SET status = ? WHERE id = ?',
        args: [status, id]
      });
      
      if (result.rowsAffected > 0) {
        res.json({ message: "Letter status updated successfully" });
      } else {
        res.status(404).json({ error: "Letter not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to update letter status" });
    }
  });

  // Reports Route
  app.get("/api/reports", async (req, res) => {
    try {
      const result = await db.execute(`
        SELECT reports.*, residents.name as residentName 
        FROM reports 
        JOIN residents ON reports.residentId = residents.id 
        ORDER BY reports.id DESC
      `);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  app.post("/api/reports", async (req, res) => {
    try {
      const { residentId, title, description, date } = req.body;
      const result = await db.execute({
        sql: 'INSERT INTO reports (residentId, title, description, date) VALUES (?, ?, ?, ?)',
        args: [residentId, title, description, date]
      });
      res.json({ id: result.lastInsertRowid, ...req.body, status: 'Menunggu' });
    } catch (error) {
      res.status(500).json({ error: "Failed to create report" });
    }
  });

  app.patch("/api/reports/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = await db.execute({
        sql: 'UPDATE reports SET status = ? WHERE id = ?',
        args: [status, id]
      });
      
      if (result.rowsAffected > 0) {
        res.json({ message: "Report status updated successfully" });
      } else {
        res.status(404).json({ error: "Report not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to update report status" });
    }
  });

  // Export Route
  app.get("/api/reports/download", async (req, res) => {
    try {
      const result = await db.execute('SELECT * FROM residents');
      const residents = result.rows as any[];
      
      const csvHeader = "ID,Name,NIK,Address,RT,RW,Status,Phone,Gender,MaritalStatus,FamilyRelationship,FamilyCardNumber\n";
      const csvRows = residents.map(r => 
        `${r.id},"${r.name}","${r.nik}","${r.address}","${r.rt}","${r.rw}","${r.status}","${r.phone}","${r.gender}","${r.maritalStatus}","${r.familyRelationship}","${r.familyCardNumber}"`
      ).join("\n");
      
      const csvContent = csvHeader + csvRows;
      const filePath = path.join(process.cwd(), 'residents_report.csv');
      fs.writeFileSync(filePath, csvContent);
      
      res.download(filePath, `residents_report_${new Date().toISOString().split('T')[0]}.csv`, () => {
        fs.unlinkSync(filePath); // Delete file after download
      });
    } catch (error) {
      console.error("Report generation failed:", error);
      res.status(500).json({ error: "Report generation failed" });
    }
  });

  app.get("/api/db-status", async (req, res) => {
    try {
      console.log("Checking database status...");
      const result = await db.execute('SELECT count(*) as count FROM residents');
      console.log("Database query successful:", result.rows[0]);
      
      // Handle different possible return types for count
      let count = 0;
      const row = result.rows[0];
      if (row) {
        const rawCount = row.count || row[0];
        count = typeof rawCount === 'bigint' ? Number(rawCount) : Number(rawCount || 0);
      }

      res.json({
        status: "Connected",
        type: "Turso (libSQL)",
        residentCount: count,
        location: "Remote (Turso)"
      });
    } catch (error) {
      console.error("Database status check failed:", error);
      res.status(500).json({ 
        status: "Error", 
        error: String(error),
        message: "Gagal terhubung ke database Turso. Pastikan URL dan Token benar."
      });
    }
  });

  app.get("/api/backup", (req, res) => {
    // Backup is not supported for remote database in this way
    res.status(400).json({ error: "Backup is not supported for remote database" });
  });

  app.post("/api/reset", async (req, res) => {
    try {
      await db.execute('DELETE FROM residents');
      // Reset auto-increment
      await db.execute('DELETE FROM sqlite_sequence WHERE name="residents"');
      res.json({ message: "Database reset successfully" });
    } catch (error) {
      console.error("Reset failed:", error);
      res.status(500).json({ error: "Reset failed" });
    }
  });

  app.post("/api/residents/import", async (req, res) => {
    try {
      const residents = req.body;
      if (!Array.isArray(residents)) {
        return res.status(400).json({ error: "Invalid data format. Expected an array." });
      }

      const statements = residents.map(resident => ({
        sql: `
          INSERT INTO residents (name, nik, address, rt, rw, status, phone, gender, maritalStatus, familyRelationship, familyCardNumber)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [resident.name, resident.nik, resident.address, resident.rt, resident.rw, resident.status, resident.phone, resident.gender, resident.maritalStatus, resident.familyRelationship, resident.familyCardNumber]
      }));

      await db.batch(statements, 'write');

      res.json({ message: `Successfully imported ${residents.length} residents` });
    } catch (error) {
      console.error("Import failed:", error);
      res.status(500).json({ error: "Import failed. Ensure NIK is unique." });
    }
  });

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving would go here
    app.use(express.static('dist'));
  }

  if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

const appPromise = startServer();

export default appPromise;
