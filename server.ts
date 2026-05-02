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
    father_name TEXT,
    mother_name TEXT,
    address TEXT,
    photo TEXT,
    serial_no TEXT,
    polling_center_en TEXT,
    polling_center_bn TEXT,
    booth_no TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_en TEXT,
    title_bn TEXT,
    description_en TEXT,
    description_bn TEXT,
    event_date TEXT,
    location_en TEXT,
    location_bn TEXT,
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

  CREATE TABLE IF NOT EXISTS councilor (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name_en TEXT,
    name_bn TEXT,
    career_en TEXT,
    career_bn TEXT,
    education_en TEXT,
    education_bn TEXT,
    social_service_en TEXT,
    social_service_bn TEXT,
    photo TEXT,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS council_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_en TEXT NOT NULL,
    name_bn TEXT NOT NULL,
    position_en TEXT NOT NULL,
    position_bn TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    photo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration: Add created_at to voters if missing
try {
  db.prepare("ALTER TABLE voters ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP").run();
} catch (e) {
  // Column likely already exists
}

// Seed default councilor if empty
const councilorExists = db.prepare("SELECT COUNT(*) as count FROM councilor").get() as { count: number };
if (councilorExists.count === 0) {
  db.prepare(`
    INSERT INTO councilor (id, name_en, name_bn, career_en, career_bn, education_en, education_bn, social_service_en, social_service_bn) 
    VALUES (1, 'Md. Councilor Name', 'মো: কাউন্সিলর নাম', 'Detailed political career...', 'বিস্তারিত রাজনৈতিক ক্যারিয়ার...', 'Graduate', 'স্নাতক', 'Active social worker', 'সক্রিয় সমাজকর্মী')
  `).run();
}

// Seed some mock data if empty
const voterCount = db.prepare("SELECT COUNT(*) as count FROM voters").get() as { count: number };
if (voterCount.count === 0) {
  const insertVoter = db.prepare(`
    INSERT INTO voters (nid, dob, name_en, name_bn, father_name, mother_name, address, serial_no, polling_center_en, polling_center_bn, booth_no)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertVoter.run("1234567890", "1990-01-01", "John Doe", "জন ডো", "Robert Doe", "Mary Doe", "Mohammadpur, Dhaka", "452", "Mohammadpur Govt. High School", "মোহাম্মদপুর সরকারি উচ্চ বিদ্যালয়", "04");
  insertVoter.run("0987654321", "1985-05-15", "Jane Smith", "জেন স্মিথ", "William Smith", "Sarah Smith", "Adabor, Dhaka", "128", "Kishalaya School", "কিশলয় স্কুল", "02");
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
    
    // 1. Always try local search first
    const localVoter = db.prepare("SELECT * FROM voters WHERE nid = ? AND dob = ?").get(nid, dob);
    if (localVoter) {
      return res.json(localVoter);
    }

    const apiKey = process.env.PORICHOI_API_KEY;
    if (!apiKey) {
      return res.status(404).json({ 
        error: "Voter not found in Ward 29 dataset and no verification service configured." 
      });
    }

    try {
      // 2. Call external API if not found locally
      const response = await fetch("https://api.porichoi.bd.com/api/v2/verifications/autofill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey
        },
        body: JSON.stringify({ nid, dob })
      });

      if (!response.ok) {
        throw new Error(`External service responded with ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "success") {
        const person = data.data.person;
        const voterInfo = {
          nid: person.nid,
          dob: person.dob,
          name_en: person.nameEn,
          name_bn: person.name,
          father_name: person.father,
          mother_name: person.mother,
          address: person.presentAddress,
          photo: person.photo,
          serial_no: "N/A",
          polling_center_en: "Ward 29 Community Center",
          polling_center_bn: "ওয়ার্ড ২৯ কমিউনিটি সেন্টার",
          booth_no: "01"
        };

        // Cache for future searches
        try {
          db.prepare(`
            INSERT OR REPLACE INTO voters (nid, dob, name_en, name_bn, father_name, mother_name, address, photo, serial_no, polling_center_en, polling_center_bn, booth_no)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            voterInfo.nid, 
            voterInfo.dob, 
            voterInfo.name_en, 
            voterInfo.name_bn, 
            voterInfo.father_name, 
            voterInfo.mother_name, 
            voterInfo.address, 
            voterInfo.photo,
            voterInfo.serial_no, 
            voterInfo.polling_center_en, 
            voterInfo.polling_center_bn, 
            voterInfo.booth_no
          );
        } catch (e) {
          console.error("Failed to cache voter info", e);
        }

        res.json(voterInfo);
      } else {
        res.status(400).json({ error: data.message || "Voter information not found in national database" });
      }
    } catch (error) {
      console.error("Voter Verification Error:", error);
      res.status(503).json({ 
        error: "National verification service is currently unavailable. Please try again later or contact Ward 29 office if you are a registered resident." 
      });
    }
  });

  app.post("/api/admin/voters/save", (req, res) => {
    const { nid, dob, name_en, name_bn, father_name, mother_name, address, photo, serial_no, polling_center_en, polling_center_bn, booth_no } = req.body;
    try {
      db.prepare(`
        INSERT OR REPLACE INTO voters (nid, dob, name_en, name_bn, father_name, mother_name, address, photo, serial_no, polling_center_en, polling_center_bn, booth_no)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(nid, dob, name_en, name_bn, father_name, mother_name, address, photo, serial_no, polling_center_en, polling_center_bn, booth_no);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save voter" });
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

  app.put("/api/admin/news/:id", (req, res) => {
    const { title_en, title_bn, content_en, content_bn, image } = req.body;
    try {
      db.prepare(`
        UPDATE news 
        SET title_en = ?, title_bn = ?, content_en = ?, content_bn = ?, image = ? 
        WHERE id = ?
      `).run(title_en, title_bn, content_en, content_bn, image, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to update news" });
    }
  });

  app.get("/api/events", (req, res) => {
    const events = db.prepare("SELECT * FROM events ORDER BY event_date ASC").all();
    res.json(events);
  });

  app.post("/api/admin/events", (req, res) => {
    const { title_en, title_bn, description_en, description_bn, event_date, location_en, location_bn, image } = req.body;
    db.prepare(`
      INSERT INTO events (title_en, title_bn, description_en, description_bn, event_date, location_en, location_bn, image) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title_en, title_bn, description_en, description_bn, event_date, location_en, location_bn, image);
    res.json({ success: true });
  });

  app.put("/api/admin/events/:id", (req, res) => {
    const { title_en, title_bn, description_en, description_bn, event_date, location_en, location_bn, image } = req.body;
    db.prepare(`
      UPDATE events 
      SET title_en = ?, title_bn = ?, description_en = ?, description_bn = ?, event_date = ?, location_en = ?, location_bn = ?, image = ? 
      WHERE id = ?
    `).run(title_en, title_bn, description_en, description_bn, event_date, location_en, location_bn, image, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/admin/events/:id", (req, res) => {
    db.prepare("DELETE FROM events WHERE id = ?").run(req.params.id);
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

  app.put("/api/admin/gallery/:id", (req, res) => {
    const { caption_en, caption_bn, image } = req.body;
    try {
      db.prepare(`
        UPDATE gallery 
        SET caption_en = ?, caption_bn = ?, image = ? 
        WHERE id = ?
      `).run(caption_en, caption_bn, image, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to update gallery item" });
    }
  });

  // Admin Councilor Profile
  app.get("/api/councilor", (req, res) => {
    const councilor = db.prepare("SELECT * FROM councilor WHERE id = 1").get();
    res.json(councilor);
  });

  // Council Members Management
  app.get("/api/admin/council-members", (req, res) => {
    const members = db.prepare("SELECT * FROM council_members ORDER BY id ASC").all();
    res.json(members);
  });

  app.post("/api/admin/council-members", (req, res) => {
    const { name_en, name_bn, position_en, position_bn, phone, email, photo } = req.body;
    try {
      db.prepare(`
        INSERT INTO council_members (name_en, name_bn, position_en, position_bn, phone, email, photo)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(name_en, name_bn, position_en, position_bn, phone, email, photo);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to add council member" });
    }
  });

  app.delete("/api/admin/council-members/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM council_members WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete council member" });
    }
  });

  // Enhanced Admin Searches
  app.get("/api/admin/search-volunteers", (req, res) => {
    const { query, phone, from, to } = req.query;
    let sql = "SELECT * FROM volunteers WHERE 1=1";
    const params: any[] = [];

    if (query) {
      sql += " AND name LIKE ?";
      params.push(`%${query}%`);
    }
    if (phone) {
      sql += " AND phone LIKE ?";
      params.push(`%${phone}%`);
    }
    if (from) {
      sql += " AND created_at >= ?";
      params.push(from);
    }
    if (to) {
      sql += " AND created_at <= ?";
      params.push(`${to} 23:59:59`);
    }

    sql += " ORDER BY created_at DESC";
    const results = db.prepare(sql).all(...params);
    res.json(results);
  });

  app.get("/api/admin/search-complaints", (req, res) => {
    const { query, phone, from, to, status } = req.query;
    let sql = "SELECT * FROM complaints WHERE 1=1";
    const params: any[] = [];

    if (query) {
      sql += " AND (subject_en LIKE ? OR subject_bn LIKE ? OR description_en LIKE ? OR description_bn LIKE ?)";
      params.push(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);
    }
    if (phone) {
      sql += " AND user_phone LIKE ?";
      params.push(`%${phone}%`);
    }
    if (status) {
      sql += " AND status = ?";
      params.push(status);
    }
    if (from) {
      sql += " AND created_at >= ?";
      params.push(from);
    }
    if (to) {
      sql += " AND created_at <= ?";
      params.push(`${to} 23:59:59`);
    }

    sql += " ORDER BY created_at DESC";
    const results = db.prepare(sql).all(...params);
    res.json(results);
  });

  app.post("/api/admin/councilor", (req, res) => {
    const { name_en, name_bn, career_en, career_bn, education_en, education_bn, social_service_en, social_service_bn, photo } = req.body;
    try {
      db.prepare(`
        UPDATE councilor 
        SET name_en = ?, name_bn = ?, career_en = ?, career_bn = ?, education_en = ?, education_bn = ?, social_service_en = ?, social_service_bn = ?, photo = ?, last_updated = CURRENT_TIMESTAMP
        WHERE id = 1
      `).run(name_en, name_bn, career_en, career_bn, education_en, education_bn, social_service_en, social_service_bn, photo);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update councilor profile" });
    }
  });

  // Admin Voter Management
  app.get("/api/admin/voters", (req, res) => {
    const voters = db.prepare("SELECT * FROM voters ORDER BY created_at DESC").all();
    res.json(voters);
  });

  app.post("/api/admin/voters", (req, res) => {
    const { nid, dob, name_en, name_bn, father_name, mother_name, address, serial_no, polling_center_en, polling_center_bn, booth_no, photo } = req.body;
    try {
      db.prepare(`
        INSERT INTO voters (nid, dob, name_en, name_bn, father_name, mother_name, address, serial_no, polling_center_en, polling_center_bn, booth_no, photo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(nid, dob, name_en, name_bn, father_name, mother_name, address, serial_no, polling_center_en, polling_center_bn, booth_no, photo);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to add voter" });
    }
  });

  app.put("/api/admin/voters/:id", (req, res) => {
    const { id } = req.params;
    const { nid, dob, name_en, name_bn, father_name, mother_name, address, serial_no, polling_center_en, polling_center_bn, booth_no, photo } = req.body;
    try {
      db.prepare(`
        UPDATE voters 
        SET nid = ?, dob = ?, name_en = ?, name_bn = ?, father_name = ?, mother_name = ?, address = ?, serial_no = ?, polling_center_en = ?, polling_center_bn = ?, booth_no = ?, photo = ?
        WHERE id = ?
      `).run(nid, dob, name_en, name_bn, father_name, mother_name, address, serial_no, polling_center_en, polling_center_bn, booth_no, photo, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update voter" });
    }
  });

  app.delete("/api/admin/voters/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM voters WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete voter" });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
