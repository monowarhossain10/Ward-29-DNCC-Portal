import express from 'express';
import { getDatabase } from '../lib/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { Request } from 'express';

const router = express.Router();

// Extend Request type to include file
interface AuthenticatedRequest extends Request {
  user?: any;
  file?: any;
}

// JWT Secret
const JWT_SECRET = 'ward29-secret-key';

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Authentication routes
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = await getDatabase();

    const admin = await db.get('SELECT * FROM admins WHERE email = ?', [email]);
    
    if (!admin || admin.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      user: { id: admin.id, email: admin.email, role: admin.role },
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// News routes
router.get('/news', async (req, res) => {
  try {
    const db = await getDatabase();
    const news = await db.all('SELECT * FROM news ORDER BY created_at DESC');
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

router.post('/news', authenticateToken, upload.single('image'), async (req: AuthenticatedRequest, res) => {
  try {
    const { title_en, title_bn, content_en, content_bn } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : (req.body.image || null);
    
    const db = await getDatabase();
    const result = await db.run(
      'INSERT INTO news (title_en, title_bn, content_en, content_bn, image) VALUES (?, ?, ?, ?, ?)',
      [title_en, title_bn, content_en, content_bn, image]
    );

    const newsItem = await db.get('SELECT * FROM news WHERE id = ?', [result.lastID]);
    res.json(newsItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create news' });
  }
});

router.put('/news/:id', authenticateToken, upload.single('image'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { title_en, title_bn, content_en, content_bn } = req.body;
    const db = await getDatabase();
    const current = await db.get('SELECT image FROM news WHERE id = ?', [id]);
    const image = req.file
      ? `/uploads/${req.file.filename}`
      : (req.body.image || req.body.existingImage || current?.image || null);

    await db.run(
      'UPDATE news SET title_en = ?, title_bn = ?, content_en = ?, content_bn = ?, image = ? WHERE id = ?',
      [title_en, title_bn, content_en, content_bn, image, id]
    );

    const newsItem = await db.get('SELECT * FROM news WHERE id = ?', [id]);
    res.json(newsItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update news' });
  }
});

router.delete('/news/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    await db.run('DELETE FROM news WHERE id = ?', [id]);
    res.json({ message: 'News deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete news' });
  }
});

// Volunteers routes
router.get('/volunteers', async (req, res) => {
  try {
    const db = await getDatabase();
    const volunteers = await db.all('SELECT * FROM volunteers ORDER BY created_at DESC');
    res.json(volunteers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch volunteers' });
  }
});

router.post('/volunteers', async (req, res) => {
  try {
    const { name, phone, email, photo } = req.body;
    const db = await getDatabase();
    const result = await db.run(
      'INSERT INTO volunteers (name, phone, email, photo) VALUES (?, ?, ?, ?)',
      [name, phone, email, photo]
    );

    const volunteer = await db.get('SELECT * FROM volunteers WHERE id = ?', [result.lastID]);
    res.json(volunteer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create volunteer' });
  }
});

router.put('/volunteers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const db = await getDatabase();
    await db.run('UPDATE volunteers SET status = ? WHERE id = ?', [status, id]);
    
    const volunteer = await db.get('SELECT * FROM volunteers WHERE id = ?', [id]);
    res.json(volunteer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update volunteer' });
  }
});

// Complaints routes
router.get('/complaints', async (req, res) => {
  try {
    const db = await getDatabase();
    const complaints = await db.all('SELECT * FROM complaints ORDER BY created_at DESC');
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

router.post('/complaints', async (req, res) => {
  try {
    const { name, phone, subject, message, status, admin_note } = req.body;
    const tracking_id = 'COMP' + Date.now();
    
    const db = await getDatabase();
    const result = await db.run(
      'INSERT INTO complaints (tracking_id, name, phone, subject, message, status, admin_note) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [tracking_id, name, phone, subject, message, status || 'Open', admin_note || null]
    );

    const complaint = await db.get('SELECT * FROM complaints WHERE id = ?', [result.lastID]);
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create complaint' });
  }
});

router.put('/complaints/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_note } = req.body;
    const db = await getDatabase();
    await db.run(
      'UPDATE complaints SET status = ?, admin_note = ? WHERE id = ?',
      [status, admin_note, id]
    );
    
    const complaint = await db.get('SELECT * FROM complaints WHERE id = ?', [id]);
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update complaint' });
  }
});

// Events routes
router.get('/events', async (req, res) => {
  try {
    const db = await getDatabase();
    const events = await db.all('SELECT * FROM events ORDER BY created_at DESC');
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.post('/events', authenticateToken, upload.single('image'), async (req: AuthenticatedRequest, res) => {
  try {
    const { title_en, title_bn, description_en, description_bn, event_date, location_en, location_bn } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : (req.body.image || null);
    
    const db = await getDatabase();
    const result = await db.run(
      'INSERT INTO events (title_en, title_bn, description_en, description_bn, event_date, location_en, location_bn, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title_en, title_bn, description_en, description_bn, event_date, location_en, location_bn, image]
    );

    const event = await db.get('SELECT * FROM events WHERE id = ?', [result.lastID]);
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

router.put('/events/:id', authenticateToken, upload.single('image'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { title_en, title_bn, description_en, description_bn, event_date, location_en, location_bn } = req.body;
    const db = await getDatabase();
    const current = await db.get('SELECT image FROM events WHERE id = ?', [id]);
    const image = req.file
      ? `/uploads/${req.file.filename}`
      : (req.body.image || current?.image || null);

    await db.run(
      'UPDATE events SET title_en = ?, title_bn = ?, description_en = ?, description_bn = ?, event_date = ?, location_en = ?, location_bn = ?, image = ? WHERE id = ?',
      [title_en, title_bn, description_en, description_bn, event_date, location_en, location_bn, image, id]
    );

    const event = await db.get('SELECT * FROM events WHERE id = ?', [id]);
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event' });
  }
});

router.delete('/events/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    await db.run('DELETE FROM events WHERE id = ?', [id]);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Gallery routes
router.get('/gallery', async (req, res) => {
  try {
    const db = await getDatabase();
    const gallery = await db.all('SELECT * FROM gallery ORDER BY created_at DESC');
    res.json(gallery);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch gallery' });
  }
});

router.post('/gallery', authenticateToken, upload.single('image'), async (req: AuthenticatedRequest, res) => {
  try {
    const { caption_en, caption_bn } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : (req.body.image || null);
    
    const db = await getDatabase();
    const result = await db.run(
      'INSERT INTO gallery (caption_en, caption_bn, image) VALUES (?, ?, ?)',
      [caption_en, caption_bn, image]
    );

    const galleryItem = await db.get('SELECT * FROM gallery WHERE id = ?', [result.lastID]);
    res.json(galleryItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create gallery item' });
  }
});

router.put('/gallery/:id', authenticateToken, upload.single('image'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { caption_en, caption_bn } = req.body;
    const db = await getDatabase();
    const current = await db.get('SELECT image FROM gallery WHERE id = ?', [id]);
    const image = req.file
      ? `/uploads/${req.file.filename}`
      : (req.body.image || current?.image || null);

    await db.run(
      'UPDATE gallery SET caption_en = ?, caption_bn = ?, image = ? WHERE id = ?',
      [caption_en, caption_bn, image, id]
    );

    const galleryItem = await db.get('SELECT * FROM gallery WHERE id = ?', [id]);
    res.json(galleryItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update gallery item' });
  }
});

router.delete('/gallery/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    await db.run('DELETE FROM gallery WHERE id = ?', [id]);
    res.json({ message: 'Gallery item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete gallery item' });
  }
});

// Voters routes
router.get('/voters', async (req, res) => {
  try {
    const db = await getDatabase();
    const voters = await db.all('SELECT * FROM voters ORDER BY name_en');
    res.json(voters);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch voters' });
  }
});

router.post('/voters', authenticateToken, async (req, res) => {
  try {
    const voterData = req.body;
    const db = await getDatabase();
    
    const columns = Object.keys(voterData).join(', ');
    const placeholders = Object.keys(voterData).map(() => '?').join(', ');
    const values = Object.values(voterData);
    
    const result = await db.run(
      `INSERT INTO voters (${columns}) VALUES (${placeholders})`,
      values
    );

    const voter = await db.get('SELECT * FROM voters WHERE id = ?', [result.lastID]);
    res.json(voter);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create voter' });
  }
});

router.put('/voters/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const voterData = req.body;
    const db = await getDatabase();

    const assignments = Object.keys(voterData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(voterData), id];

    await db.run(`UPDATE voters SET ${assignments} WHERE id = ?`, values);

    const voter = await db.get('SELECT * FROM voters WHERE id = ?', [id]);
    res.json(voter);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update voter' });
  }
});

router.delete('/voters/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    await db.run('DELETE FROM voters WHERE id = ?', [id]);
    res.json({ message: 'Voter deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete voter' });
  }
});

// Council members routes
router.get('/council-members', async (req, res) => {
  try {
    const db = await getDatabase();
    const members = await db.all('SELECT * FROM council_members ORDER BY created_at DESC');
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch council members' });
  }
});

router.post('/council-members', authenticateToken, async (req, res) => {
  try {
    const { name_en, name_bn, position_en, position_bn, phone, email, photo } = req.body;
    const db = await getDatabase();
    const result = await db.run(
      'INSERT INTO council_members (name_en, name_bn, position_en, position_bn, phone, email, photo) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name_en, name_bn, position_en, position_bn, phone, email, photo]
    );

    const member = await db.get('SELECT * FROM council_members WHERE id = ?', [result.lastID]);
    res.json(member);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create council member' });
  }
});

router.delete('/council-members/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    await db.run('DELETE FROM council_members WHERE id = ?', [id]);
    res.json({ message: 'Council member deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete council member' });
  }
});

router.put('/councilor', authenticateToken, async (req, res) => {
  try {
    const {
      name_en,
      name_bn,
      career_en,
      career_bn,
      education_en,
      education_bn,
      social_service_en,
      social_service_bn,
      photo,
      message_en,
      message_bn
    } = req.body;

    const db = await getDatabase();
    await db.run(
      `INSERT INTO councilor_profile (
        id, name_en, name_bn, career_en, career_bn, education_en, education_bn,
        social_service_en, social_service_bn, photo, message_en, message_bn, last_updated
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        name_en = excluded.name_en,
        name_bn = excluded.name_bn,
        career_en = excluded.career_en,
        career_bn = excluded.career_bn,
        education_en = excluded.education_en,
        education_bn = excluded.education_bn,
        social_service_en = excluded.social_service_en,
        social_service_bn = excluded.social_service_bn,
        photo = excluded.photo,
        message_en = excluded.message_en,
        message_bn = excluded.message_bn,
        last_updated = CURRENT_TIMESTAMP`,
      [
        name_en,
        name_bn,
        career_en,
        career_bn,
        education_en,
        education_bn,
        social_service_en,
        social_service_bn,
        photo,
        message_en,
        message_bn
      ]
    );

    const councilor = await db.get('SELECT * FROM councilor_profile WHERE id = 1');
    res.json(councilor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update councilor profile' });
  }
});

router.get('/admins', authenticateToken, async (req, res) => {
  try {
    const db = await getDatabase();
    const admins = await db.all('SELECT id, email, role, COALESCE(note, \'\') AS note, created_at FROM admins ORDER BY created_at DESC');
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin users' });
  }
});

router.post('/admins', authenticateToken, async (req, res) => {
  try {
    const { email, role, note, password } = req.body;
    if (!password || String(password).trim().length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    const db = await getDatabase();
    const result = await db.run(
      'INSERT INTO admins (email, password, role, note) VALUES (?, ?, ?, ?)',
      [email, password, role, note || '']
    );

    const admin = await db.get('SELECT id, email, role, COALESCE(note, \'\') AS note, created_at FROM admins WHERE id = ?', [result.lastID]);
    res.json(admin);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create admin user' });
  }
});

router.put('/admins/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, note, password } = req.body;
    const db = await getDatabase();
    if (password && String(password).trim().length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    if (password) {
      await db.run('UPDATE admins SET role = ?, note = ?, password = ? WHERE id = ?', [role, note || '', password, id]);
    } else {
      await db.run('UPDATE admins SET role = ?, note = ? WHERE id = ?', [role, note || '', id]);
    }

    const admin = await db.get('SELECT id, email, role, COALESCE(note, \'\') AS note, created_at FROM admins WHERE id = ?', [id]);
    res.json(admin);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update admin user' });
  }
});

router.delete('/admins/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    await db.run('DELETE FROM admins WHERE id = ?', [id]);
    res.json({ message: 'Admin user deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete admin user' });
  }
});

export default router;
