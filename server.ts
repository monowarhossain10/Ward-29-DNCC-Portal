import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import * as admin from "firebase-admin";
import { initializeApp, getApp, getApps, App } from "firebase-admin/app";
import { getFirestore, Firestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";
const firebaseConfig = JSON.parse(readFileSync(new URL("./firebase-applet-config.json", import.meta.url), "utf-8"));

// Initialize Firebase Admin
let app: App;
try {
  if (getApps().length === 0) {
    app = initializeApp({
      projectId: firebaseConfig.projectId,
    });
  } else {
    app = getApp();
  }
} catch (e: any) {
  console.error("Firebase Admin Initialization Error:", e);
  throw e;
}

// Named database support
let fs: Firestore;
try {
  const dbId = (firebaseConfig as any).firestoreDatabaseId;
  fs = getFirestore(app, dbId || undefined);
} catch (e: any) {
  console.error("Firestore Initialization Error:", e);
  fs = getFirestore(app); // Fallback to default
}

async function seedCouncilor() {
  try {
    const docRef = fs.collection('settings').doc('councilor');
    const doc = await docRef.get();
    if (!doc.exists) {
      console.log("Seeding default councilor profile...");
      await docRef.set({
        name_en: "Md. Monowar Hossain",
        name_bn: "মো: মনোয়ার হোসেন",
        career_en: "Dedicated Social Worker & Politician with a vision for digital transformation of Ward 29.",
        career_bn: "ওয়ার্ড ২৯-এর ডিজিটাল রূপান্তরের স্বপ্নদ্রষ্টা, নিষ্ঠাবান সমাজসেবক ও রাজনীতিবিদ।",
        education_en: "Post Graduate in Social Sciences",
        education_bn: "স্নাতকোত্তর, সামাজিক বিজ্ঞান",
        social_service_en: "Founder of multiple youth development clubs and active participant in community welfare programs since 2005.",
        social_service_bn: "একাধিক যুব উন্নয়ন ক্লাবের প্রতিষ্ঠাতা এবং ২০০৫ সাল থেকে সক্রিয়ভাবে জনকল্যাণমূলক কাজে নিয়োজিত।",
        message_en: "Welcome to Ward 29 digital portal. Our goal is to make civic services accessible to everyone efficiently.",
        message_bn: "ওয়ার্ড ২৯ ডিজিটাল পোর্টালে আপনাকে স্বাগতম। আমাদের লক্ষ্য হলো নাগরিক সেবা সবার কাছে সহজে পৌঁছে দেওয়া।",
        photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400",
        last_updated: new Date().toISOString()
      });
    }
  } catch (err) {
    console.error("Seeding Error:", err);
  }
}

async function startServer() {
  await seedCouncilor();
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.post("/api/voter/verify", async (req, res) => {
    const { nid, dob } = req.body;
    console.log(`[Verify] NID: ${nid}, DOB: ${dob}`);
    
    try {
      if (!nid || !dob) {
        return res.status(400).json({ error: "NID and DOB are required." });
      }

      // 1. Try Firestore search first
      const voterRef = fs.collection('voters');
      const q = voterRef.where('nid', '==', nid).where('dob', '==', dob);
      const snap = await q.get();
      
      if (!snap.empty) {
        const doc = snap.docs[0];
        console.log(`[Verify] Found in database: ${doc.id}`);
        return res.json({ id: doc.id, ...doc.data() });
      }

      console.log(`[Verify] Not found in database, checking Porichoi fallback...`);

      // 2. Fallback to Porichoi API if configured
      const apiKey = process.env.PORICHOI_API_KEY;
      if (!apiKey) {
        console.log(`[Verify] No PORICHOI_API_KEY found.`);
        return res.status(404).json({ 
          error: "Voter not found in Ward 29 locally and no external verification service is configured." 
        });
      }

      const response = await fetch("https://api.porichoi.bd.com/api/v2/verifications/autofill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey
        },
        body: JSON.stringify({ nid, dob })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Verify] Porichoi API error: ${response.status} ${errorText}`);
        return res.status(404).json({ error: "Voter details not found from verification service." });
      }

      const data = await response.json();
      console.log(`[Verify] Porichoi response:`, data.status);

      if (data.status === "success") {
        const person = data.data.person;
        const voterInfo = {
          nid: person.nid,
          dob: person.dob,
          name_en: person.nameEn,
          name_bn: person.nameBn,
          father_name: person.fatherName,
          mother_name: person.motherName,
          address: person.permanentAddress,
          photo: person.photo,
          serial_no: "N/A",
          polling_center_en: "Contact Ward Office",
          polling_center_bn: "ওয়ার্ড অফিসে যোগাযোগ করুন",
          booth_no: "N/A",
          created_at: FieldValue.serverTimestamp()
        };

        return res.json(voterInfo);
      } else {
        return res.status(404).json({ error: "Voter details not found from verification service." });
      }
    } catch (err: any) {
      console.error("[Verify] Critical Error:", err);
      res.status(500).json({ 
        error: "Internal server error during verification.",
        message: err?.message || String(err)
      });
    }
  });

  // Proxy for councilor profile (if not using direct client fetch)
  app.get("/api/councilor", async (req, res) => {
    try {
      const doc = await fs.collection('settings').doc('councilor').get();
      if (doc.exists) {
        res.json(doc.data());
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
      await fs.collection('test').doc('connection').get();
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
