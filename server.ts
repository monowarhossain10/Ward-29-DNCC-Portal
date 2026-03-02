import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("ward29.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS voters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nid TEXT UNIQUE,
    dob TEXT,
    name_en TEXT,
    name_bn TEXT,
    serial_no TEXT,
    polling_center_en TEXT,
    polling_center_bn TEXT,
    booth_no TEXT
  );

  CREATE TABLE IF NOT EXISTS volunteers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT,
    email TEXT,
    photo TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tracking_id TEXT UNIQUE,
    name TEXT,
    phone TEXT,
    subject TEXT,
    message TEXT,
    status TEXT DEFAULT 'Open',
    admin_note TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_en TEXT,
    title_bn TEXT,
    content_en TEXT,
    content_bn TEXT,
    image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caption_en TEXT,
    caption_bn TEXT,
    image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed some mock data if empty
const voterCount = db.prepare("SELECT COUNT(*) as count FROM voters").get() as { count: number };
if (voterCount.count === 0) {
  const insertVoter = db.prepare(`
    INSERT INTO voters (nid, dob, name_en, name_bn, serial_no, polling_center_en, polling_center_bn, booth_no)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertVoter.run("1234567890", "1990-01-01", "John Doe", "জন ডো", "452", "Mohammadpur Govt. High School", "মোহাম্মদপুর সরকারি উচ্চ বিদ্যালয়", "04");
  insertVoter.run("0987654321", "1985-05-15", "Jane Smith", "জেন স্মিথ", "128", "Kishalaya School", "কিশলয় স্কুল", "02");
}

// Seed default admin
const adminCount = db.prepare("SELECT COUNT(*) as count FROM admins").get() as { count: number };
if (adminCount.count === 0) {
  db.prepare("INSERT INTO admins (username, password, role) VALUES (?, ?, ?)").run("admin", "admin123", "SuperAdmin");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.post("/api/voter/verify", async (req, res) => {
    const { nid, dob } = req.body;
    const apiKey = process.env.PORICHOI_API_KEY;

    if (!apiKey) {
      // Fallback to local search if API key is missing (for demo/dev)
      const voter = db.prepare("SELECT * FROM voters WHERE nid = ? AND dob = ?").get(nid, dob);
      if (voter) {
        return res.json(voter);
      }
      return res.status(400).json({ error: "PORICHOI_API_KEY is not configured and voter not found in local DB." });
    }

    try {
      // Porichoi API Call (v2 Autofill)
      const response = await fetch("https://api.porichoi.bd.com/api/v2/verifications/autofill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey
        },
        body: JSON.stringify({ nid, dob })
      });

      const data = await response.json();

      if (data.status === "success") {
        const person = data.data.person;
        // Map Porichoi data to our voter schema
        // Note: Porichoi doesn't provide polling center, so we'll assign a default or look it up
        const voterInfo = {
          nid: person.nid,
          dob: person.dob,
          name_en: person.nameEn,
          name_bn: person.name,
          serial_no: "N/A", // Not in Porichoi
          polling_center_en: "Ward 29 Community Center", // Default for the ward
          polling_center_bn: "ওয়ার্ড ২৯ কমিউনিটি সেন্টার",
          booth_no: "01",
          address: person.presentAddress
        };

        // Optionally save to local DB for future searches
        try {
          db.prepare(`
            INSERT OR REPLACE INTO voters (nid, dob, name_en, name_bn, serial_no, polling_center_en, polling_center_bn, booth_no)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(voterInfo.nid, voterInfo.dob, voterInfo.name_en, voterInfo.name_bn, voterInfo.serial_no, voterInfo.polling_center_en, voterInfo.polling_center_bn, voterInfo.booth_no);
        } catch (e) {
          console.error("Failed to cache voter info", e);
        }

        res.json(voterInfo);
      } else {
        res.status(400).json({ error: data.message || "Verification failed" });
      }
    } catch (error) {
      console.error("Porichoi API Error:", error);
      res.status(500).json({ error: "External verification service error" });
    }
  });

  app.get("/api/voter/search", (req, res) => {
    const { nid, dob } = req.query;
    const voter = db.prepare("SELECT * FROM voters WHERE nid = ? AND dob = ?").get(nid, dob);
    if (voter) {
      res.json(voter);
    } else {
      res.status(404).json({ error: "Voter not found" });
    }
  });

  // Admin Auth
  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    const admin = db.prepare("SELECT id, username, role FROM admins WHERE username = ? AND password = ?").get(username, password);
    if (admin) {
      res.json(admin);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/admin/users", (req, res) => {
    const admins = db.prepare("SELECT id, username, role, created_at FROM admins").all();
    res.json(admins);
  });

  app.post("/api/admin/users", (req, res) => {
    const { username, password, role } = req.body;
    try {
      db.prepare("INSERT INTO admins (username, password, role) VALUES (?, ?, ?)").run(username, password, role);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.delete("/api/admin/users/:id", (req, res) => {
    db.prepare("DELETE FROM admins WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/volunteers/register", (req, res) => {
    const { name, phone, email, photo } = req.body;
    try {
      const result = db.prepare("INSERT INTO volunteers (name, phone, email, photo) VALUES (?, ?, ?, ?)").run(name, phone, email, photo);
      res.json({ id: result.lastInsertRowid, status: 'pending' });
    } catch (error) {
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.get("/api/volunteers", (req, res) => {
    const volunteers = db.prepare("SELECT id, name, phone, email, status, created_at FROM volunteers ORDER BY created_at DESC").all();
    res.json(volunteers);
  });

  app.post("/api/volunteers/approve", (req, res) => {
    const { id } = req.body;
    db.prepare("UPDATE volunteers SET status = 'approved' WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.post("/api/complaints", (req, res) => {
    const { name, phone, subject, message } = req.body;
    const tracking_id = "W29-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      db.prepare("INSERT INTO complaints (tracking_id, name, phone, subject, message) VALUES (?, ?, ?, ?, ?)").run(tracking_id, name, phone, subject, message);
      res.json({ tracking_id });
    } catch (error) {
      res.status(500).json({ error: "Submission failed" });
    }
  });

  app.get("/api/complaints/track/:id", (req, res) => {
    const complaint = db.prepare("SELECT * FROM complaints WHERE tracking_id = ?").get(req.params.id);
    if (complaint) {
      res.json(complaint);
    } else {
      res.status(404).json({ error: "Complaint not found" });
    }
  });

  app.get("/api/admin/complaints", (req, res) => {
    const complaints = db.prepare("SELECT * FROM complaints ORDER BY created_at DESC").all();
    res.json(complaints);
  });

  app.post("/api/admin/complaints/update", (req, res) => {
    const { id, status, admin_note } = req.body;
    db.prepare("UPDATE complaints SET status = ?, admin_note = ? WHERE id = ?").run(status, admin_note, id);
    res.json({ success: true });
  });

  app.get("/api/news", (req, res) => {
    const news = db.prepare("SELECT * FROM news ORDER BY created_at DESC").all();
    res.json(news);
  });

  app.post("/api/admin/news", (req, res) => {
    const { title_en, title_bn, content_en, content_bn, image } = req.body;
    db.prepare("INSERT INTO news (title_en, title_bn, content_en, content_bn, image) VALUES (?, ?, ?, ?, ?)").run(title_en, title_bn, content_en, content_bn, image);
    res.json({ success: true });
  });

  app.delete("/api/admin/news/:id", (req, res) => {
    db.prepare("DELETE FROM news WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/gallery", (req, res) => {
    const gallery = db.prepare("SELECT * FROM gallery ORDER BY created_at DESC").all();
    res.json(gallery);
  });

  app.post("/api/admin/gallery", (req, res) => {
    const { caption_en, caption_bn, image } = req.body;
    db.prepare("INSERT INTO gallery (caption_en, caption_bn, image) VALUES (?, ?, ?)").run(caption_en, caption_bn, image);
    res.json({ success: true });
  });

  app.delete("/api/admin/gallery/:id", (req, res) => {
    db.prepare("DELETE FROM gallery WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
