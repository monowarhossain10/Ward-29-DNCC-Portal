// Create local admin users in SQLite database
import { getDatabase } from './src/lib/database.js';

async function createLocalAdmins() {
  console.log('🚀 Creating local admin users...');
  
  try {
    const db = await getDatabase();
    
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
    
    console.log('\n✨ Local admin user creation completed!');
    console.log('\n📝 You can now use these credentials to test the admin login:');
    console.log('🔐 Super Admin: admin@ward29.com / Admin123!');
    console.log('🔐 Editor: editor@ward29.com / Editor123!');
    console.log('🔐 Viewer: viewer@ward29.com / Viewer123!');
    console.log('\n⚠️  Remember to change passwords in production!');
    
  } catch (error) {
    console.error('❌ Error creating local admin users:', error);
  }
}

createLocalAdmins();
