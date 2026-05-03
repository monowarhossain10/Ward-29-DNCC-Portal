import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

let db: Database | null = null;

export async function initializeDatabase() {
  if (db) return db;

  const dbPath = path.join(process.cwd(), 'ward29.db');
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Create tables
  await createTables();
  
  console.log('Local database initialized successfully');
  return db;
}

async function createTables() {
  if (!db) throw new Error('Database not initialized');

  // Admin users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Viewer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // News table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_en TEXT NOT NULL,
      title_bn TEXT NOT NULL,
      content_en TEXT NOT NULL,
      content_bn TEXT NOT NULL,
      image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Volunteers table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS volunteers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      photo TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Complaints table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tracking_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'Open',
      admin_note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Events table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_en TEXT NOT NULL,
      title_bn TEXT NOT NULL,
      description_en TEXT,
      description_bn TEXT,
      event_date TEXT,
      location_en TEXT,
      location_bn TEXT,
      image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Gallery table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      caption_en TEXT NOT NULL,
      caption_bn TEXT NOT NULL,
      image TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Voters table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS voters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nid TEXT NOT NULL,
      dob TEXT NOT NULL,
      name_en TEXT NOT NULL,
      name_bn TEXT NOT NULL,
      father_name TEXT,
      mother_name TEXT,
      address TEXT,
      photo TEXT,
      serial_no TEXT,
      polling_center_en TEXT,
      polling_center_bn TEXT,
      booth_no TEXT
    )
  `);

  // Council members table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS council_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_en TEXT NOT NULL,
      name_bn TEXT NOT NULL,
      position_en TEXT NOT NULL,
      position_bn TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      photo TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Councilor profile table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS councilor_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name_en TEXT NOT NULL,
      name_bn TEXT NOT NULL,
      career_en TEXT,
      career_bn TEXT,
      education_en TEXT,
      education_bn TEXT,
      social_service_en TEXT,
      social_service_bn TEXT,
      photo TEXT,
      message_en TEXT,
      message_bn TEXT,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default admin user if not exists
  await db.exec(`
    INSERT OR IGNORE INTO admins (email, password, role) 
    VALUES ('admin@ward29.com', 'Admin123!', 'SuperAdmin')
  `);

  console.log('Database tables created successfully');
}

export async function getDatabase() {
  if (!db) {
    return await initializeDatabase();
  }
  return db;
}

// Close database connection
export async function closeDatabase() {
  if (db) {
    await db.close();
    db = null;
  }
}
