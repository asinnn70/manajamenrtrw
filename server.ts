import express from "express";
import { createServer as createViteServer } from "vite";
import { initDb } from "./db/index";
import db from "./db/index";
import path from "path";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Database
  initDb();

  app.use(express.json());

  // API Routes
  app.get("/api/residents", (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM residents ORDER BY id DESC');
      const residents = stmt.all();
      res.json(residents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch residents" });
    }
  });

  app.get("/api/residents/:id/family", (req, res) => {
    try {
      const { id } = req.params;
      const resident = db.prepare('SELECT * FROM residents WHERE id = ?').get(id) as any;
      
      if (!resident) {
        return res.status(404).json({ error: "Resident not found" });
      }

      if (!resident.familyCardNumber) {
        return res.json([]);
      }

      const familyMembers = db.prepare('SELECT * FROM residents WHERE familyCardNumber = ? AND id != ?').all(resident.familyCardNumber, id);
      res.json(familyMembers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch family members" });
    }
  });

  app.post("/api/residents/:id/mutate", (req, res) => {
    try {
      const { id } = req.params;
      const { type, date, details } = req.body;
      
      const mutationStmt = db.prepare('INSERT INTO mutations (residentId, type, date, details) VALUES (?, ?, ?, ?)');
      const updateResidentStmt = db.prepare('UPDATE residents SET status = ? WHERE id = ?');
      
      const transaction = db.transaction(() => {
        mutationStmt.run(id, type, date, details);
        updateResidentStmt.run(type, id);
      });
      
      transaction();
      res.json({ message: "Resident status updated successfully" });
    } catch (error) {
      console.error("Mutation failed:", error);
      res.status(500).json({ error: "Failed to update resident status" });
    }
  });

  app.post("/api/residents", (req, res) => {
    try {
      const { name, nik, address, rt, rw, status, phone, gender, maritalStatus, familyRelationship, familyCardNumber } = req.body;
      const stmt = db.prepare(`
        INSERT INTO residents (name, nik, address, rt, rw, status, phone, gender, maritalStatus, familyRelationship, familyCardNumber)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(name, nik, address, rt, rw, status, phone, gender, maritalStatus, familyRelationship, familyCardNumber);
      res.json({ id: info.lastInsertRowid, ...req.body });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create resident" });
    }
  });

  app.put("/api/residents/:id", (req, res) => {
    try {
      const { id } = req.params;
      const { name, nik, address, rt, rw, status, phone, gender, maritalStatus, familyRelationship, familyCardNumber } = req.body;
      const stmt = db.prepare(`
        UPDATE residents 
        SET name = ?, nik = ?, address = ?, rt = ?, rw = ?, status = ?, phone = ?, gender = ?, maritalStatus = ?, familyRelationship = ?, familyCardNumber = ?
        WHERE id = ?
      `);
      const info = stmt.run(name, nik, address, rt, rw, status, phone, gender, maritalStatus, familyRelationship, familyCardNumber, id);
      
      if (info.changes > 0) {
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
  app.get("/api/announcements", (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM announcements ORDER BY id DESC');
      const announcements = stmt.all();
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  });

  app.post("/api/announcements", (req, res) => {
    try {
      const { title, date, content } = req.body;
      const stmt = db.prepare('INSERT INTO announcements (title, date, content) VALUES (?, ?, ?)');
      const info = stmt.run(title, date, content);
      res.json({ id: info.lastInsertRowid, ...req.body });
    } catch (error) {
      res.status(500).json({ error: "Failed to create announcement" });
    }
  });

  // Transactions Routes
  app.get("/api/transactions", (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM transactions ORDER BY date DESC, id DESC');
      const transactions = stmt.all();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", (req, res) => {
    try {
      const { type, amount, date, description, category } = req.body;
      const stmt = db.prepare('INSERT INTO transactions (type, amount, date, description, category) VALUES (?, ?, ?, ?, ?)');
      const info = stmt.run(type, amount, date, description, category);
      res.json({ id: info.lastInsertRowid, ...req.body });
    } catch (error) {
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  // Letters Routes
  app.get("/api/letters", (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM letters ORDER BY id DESC');
      const letters = stmt.all();
      res.json(letters);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch letters" });
    }
  });

  app.post("/api/letters", (req, res) => {
    try {
      const { type, resident, date, status, content } = req.body;
      const stmt = db.prepare('INSERT INTO letters (type, resident, date, status, content) VALUES (?, ?, ?, ?, ?)');
      const info = stmt.run(type, resident, date, status, content);
      res.json({ id: info.lastInsertRowid, ...req.body });
    } catch (error) {
      res.status(500).json({ error: "Failed to create letter" });
    }
  });

  app.patch("/api/letters/:id/status", (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const stmt = db.prepare('UPDATE letters SET status = ? WHERE id = ?');
      const info = stmt.run(status, id);
      
      if (info.changes > 0) {
        res.json({ message: "Letter status updated successfully" });
      } else {
        res.status(404).json({ error: "Letter not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to update letter status" });
    }
  });

  // Reports Route
  app.get("/api/reports", (req, res) => {
    try {
      const stmt = db.prepare(`
        SELECT reports.*, residents.name as residentName 
        FROM reports 
        JOIN residents ON reports.residentId = residents.id 
        ORDER BY reports.id DESC
      `);
      const reports = stmt.all();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  app.post("/api/reports", (req, res) => {
    try {
      const { residentId, title, description, date } = req.body;
      const stmt = db.prepare('INSERT INTO reports (residentId, title, description, date) VALUES (?, ?, ?, ?)');
      const info = stmt.run(residentId, title, description, date);
      res.json({ id: info.lastInsertRowid, ...req.body, status: 'Menunggu' });
    } catch (error) {
      res.status(500).json({ error: "Failed to create report" });
    }
  });

  app.patch("/api/reports/:id/status", (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const stmt = db.prepare('UPDATE reports SET status = ? WHERE id = ?');
      const info = stmt.run(status, id);
      
      if (info.changes > 0) {
        res.json({ message: "Report status updated successfully" });
      } else {
        res.status(404).json({ error: "Report not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to update report status" });
    }
  });

  // Export Route
  app.get("/api/reports/download", (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM residents');
      const residents = stmt.all() as any[];
      
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

  app.get("/api/db-status", (req, res) => {
    try {
      const residentCount = db.prepare('SELECT count(*) as count FROM residents').get() as { count: number };
      res.json({
        status: "Connected",
        type: "SQLite",
        residentCount: residentCount.count,
        location: "Local (rtrw.db)"
      });
    } catch (error) {
      res.status(500).json({ status: "Error", error: String(error) });
    }
  });

  app.get("/api/backup", (req, res) => {
    try {
      const dbPath = path.join(process.cwd(), 'rtrw.db');
      if (fs.existsSync(dbPath)) {
        res.download(dbPath, `rtrw_backup_${new Date().toISOString().split('T')[0]}.db`);
      } else {
        res.status(404).json({ error: "Database file not found" });
      }
    } catch (error) {
      console.error("Backup failed:", error);
      res.status(500).json({ error: "Backup failed" });
    }
  });

  app.post("/api/reset", (req, res) => {
    try {
      db.exec('DELETE FROM residents');
      // Reset auto-increment
      db.exec('DELETE FROM sqlite_sequence WHERE name="residents"');
      res.json({ message: "Database reset successfully" });
    } catch (error) {
      console.error("Reset failed:", error);
      res.status(500).json({ error: "Reset failed" });
    }
  });

  app.post("/api/residents/import", (req, res) => {
    try {
      const residents = req.body;
      if (!Array.isArray(residents)) {
        return res.status(400).json({ error: "Invalid data format. Expected an array." });
      }

      const insert = db.prepare(`
        INSERT INTO residents (name, nik, address, rt, rw, status, phone, gender, maritalStatus, familyRelationship, familyCardNumber)
        VALUES (@name, @nik, @address, @rt, @rw, @status, @phone, @gender, @maritalStatus, @familyRelationship, @familyCardNumber)
      `);

      const insertMany = db.transaction((data) => {
        for (const resident of data) insert.run(resident);
      });

      insertMany(residents);
      res.json({ message: `Successfully imported ${residents.length} residents` });
    } catch (error) {
      console.error("Import failed:", error);
      res.status(500).json({ error: "Import failed. Ensure NIK is unique." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving would go here
    app.use(express.static('dist'));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
