// Admin User Creation Script
// Run this script to create admin users for testing
// Usage: node create-admin.js

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function createAdminUser(email, password, role = 'Editor') {
  try {
    console.log(`Creating admin user: ${email}`);
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Store user role in Firestore
    await setDoc(doc(db, 'admins', email), {
      uid: user.uid,
      email: email,
      role: role,
      created_at: new Date().toISOString(),
      active: true
    });
    
    console.log(`✅ Admin user created successfully: ${email} with role: ${role}`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👤 Role: ${role}`);
    
  } catch (error) {
    console.error(`❌ Error creating admin user:`, error.message);
    if (error.code === 'auth/email-already-in-use') {
      console.log(`ℹ️  User ${email} already exists. You can reset the password in Firebase Console.`);
    }
  }
}

// Create sample admin users
async function createSampleAdmins() {
  console.log('🚀 Creating sample admin users...\n');
  
  // Super Admin
  await createAdminUser('admin@ward29.com', 'Admin123!', 'SuperAdmin');
  
  // Editor
  await createAdminUser('editor@ward29.com', 'Editor123!', 'Editor');
  
  // Viewer
  await createAdminUser('viewer@ward29.com', 'Viewer123!', 'Viewer');
  
  console.log('\n✨ Admin user creation completed!');
  console.log('📝 You can now use these credentials to test the admin login.');
  console.log('🔐 Remember to change passwords in production!');
}

createSampleAdmins().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
