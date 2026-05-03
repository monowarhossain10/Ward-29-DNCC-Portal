import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { initializeDatabase } from "./src/lib/database.js";
import apiRoutes from "./src/api/routes.js";
import fs from 'fs';

async function seedCouncilor() {
  try {
    const db = await initializeDatabase();
    
    // Check if councilor profile exists
    const existing = await db.get('SELECT * FROM councilor_profile WHERE id = 1');
    
    if (!existing) {
      console.log("Seeding default councilor profile...");
      await db.run(`
        INSERT OR REPLACE INTO councilor_profile (
          id, name_en, name_bn, career_en, career_bn, 
          education_en, education_bn, social_service_en, social_service_bn,
          message_en, message_bn, photo, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        1,
        "Hafeez Md Ismail Hossain",
        "হাফেজ মোঃ ইসমাইল হোসাইন",
        "Dedicated Social Worker & Politician with a vision for digital transformation of Ward 29.",
        "ওয়ার্ড ২৯-এর ডিজিটাল রূপান্তরের স্বপ্নদ্রষ্টা, নিষ্ঠাবান সমাজসেবক ও রাজনীতিবিদ।",
        "Post Graduate in Social Sciences",
        "স্নাতকোত্তর, সামাজিক বিজ্ঞান",
        "Founder of multiple youth development clubs and active participant in community welfare programs since 2005.",
        "একাধিক যুব উন্নয়ন ক্লাবের প্রতিষ্ঠাতা এবং ২০০৫ সাল থেকে সক্রিয়ভাবে জনকল্যাণমূলক কাজে নিয়োজিত।",
        "Welcome to Ward 29 digital portal. Our goal is to make civic services accessible to everyone efficiently.",
        "ওয়ার্ড ২৯ ডিজিটাল পোর্টালে আপনাকে স্বাগতম। আমাদের লক্ষ্য হলো নাগরিক সেবা সবার কাছে সহজে পৌঁছে দেওয়া।",
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400",
        new Date().toISOString()
      ]);
    }
  } catch (err) {
    console.error("Seeding Error:", err);
  }
}

async function startServer() {
  await seedCouncilor();
  
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use('/public', express.static(path.join(process.cwd(), 'public')));

  // API Routes
  app.use('/api', apiRoutes);

  // Voter verification endpoint using local database
  app.post("/api/voter/verify", async (req, res) => {
    const { nid, dob } = req.body;
    console.log(`[Verify] NID: ${nid}, DOB: ${dob}`);
    
    try {
      if (!nid || !dob) {
        return res.status(400).json({ error: "NID and DOB are required." });
      }

      const db = await initializeDatabase();
      const voter = await db.get(
        'SELECT * FROM voters WHERE nid = ? AND dob = ?', 
        [nid, dob]
      );
      
      if (voter) {
        console.log(`[Verify] Found in database: ${voter.id}`);
        return res.json(voter);
      }

      console.log(`[Verify] Not found in database`);
      return res.status(404).json({ 
        error: "Voter not found in Ward 29 database." 
      });
      
    } catch (err: any) {
      console.error("[Verify] Critical Error:", err);
      res.status(500).json({ 
        error: "Internal server error during verification.",
        message: err?.message || String(err)
      });
    }
  });

  // Councilor profile endpoint
  app.get("/api/councilor", async (req, res) => {
    try {
      const db = await initializeDatabase();
      const councilor = await db.get('SELECT * FROM councilor_profile WHERE id = 1');
      
      if (councilor) {
        res.json(councilor);
      } else {
        res.status(404).json({ error: "Not found" });
      }
    } catch (err) {
      console.error("[Councilor] Error:", err);
      res.status(500).json({ error: "Internal error" });
    }
  });

  // Health check for DB
  app.get("/api/health", async (req, res) => {
    try {
      const db = await initializeDatabase();
      await db.get('SELECT 1');
      res.json({ status: "ok", database: "connected" });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err?.message });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Local Database Server running on http://localhost:${PORT}`);
    console.log(`📁 Uploads directory: ${uploadsDir}`);
    console.log(`🗄️  Database: SQLite (ward29.db)`);
  });
}

startServer().catch(console.error);
