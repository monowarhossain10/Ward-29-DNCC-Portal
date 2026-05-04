// Add admin users to local database
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function addAdmins() {
  console.log('🚀 Adding admin users to local database...');
  
  try {
    const dbPath = path.join(process.cwd(), 'ward29.db');
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    const admins = [
      { email: 'admin@ward29.com', password: 'Admin123!', role: 'SuperAdmin' },
      { email: 'editor@ward29.com', password: 'Editor123!', role: 'Editor' },
      { email: 'viewer@ward29.com', password: 'Viewer123!', role: 'Viewer' }
    ];
    
    for (const admin of admins) {
      // Check if admin already exists
      const existing = await db.get('SELECT * FROM admins WHERE email = ?', [admin.email]);
      
      if (!existing) {
        await db.run(
          'INSERT INTO admins (email, password, role) VALUES (?, ?, ?)',
          [admin.email, admin.password, admin.role]
        );
        console.log(`✅ Created admin user: ${admin.email} (${admin.role})`);
      } else {
        console.log(`ℹ️  Admin user already exists: ${admin.email} (${admin.role})`);
      }
    }
    
    console.log('\n✨ Admin users setup completed!');
    console.log('\n📝 Test credentials:');
    console.log('🔐 Super Admin: admin@ward29.com / Admin123!');
    console.log('🔐 Editor: editor@ward29.com / Editor123!');
    console.log('🔐 Viewer: viewer@ward29.com / Viewer123!');
    
    await db.close();
    
  } catch (error) {
    console.error('❌ Error adding admin users:', error);
  }
}

addAdmins();
