// Seed the local database with realistic sample data
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function seedDatabase() {
  console.log('🌱 Seeding database with realistic data...');
  
  try {
    const dbPath = path.join(process.cwd(), 'ward29.db');
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Clear existing data
    await db.exec('DELETE FROM news');
    await db.exec('DELETE FROM events');
    await db.exec('DELETE FROM gallery');
    await db.exec('DELETE FROM council_members');
    await db.exec('DELETE FROM volunteers');
    await db.exec('DELETE FROM complaints');
    await db.exec('DELETE FROM voters');

    // Seed News
    console.log('📰 Seeding news...');
    const newsItems = [
      {
        title_en: 'Ward 29 Digital Platform Launch',
        title_bn: 'ওয়ার্ড ২৯ ডিজিটাল প্ল্যাটফর্ম উদ্বোধন',
        content_en: 'We are pleased to announce the official launch of Ward 29 Digital Platform. This initiative aims to provide citizens with easy access to various municipal services online.',
        content_bn: 'আমরা আনন্দের সাথে ঘোষণা করছি ওয়ার্ড ২৯ ডিজিটাল প্ল্যাটফর্মের আনুষ্ঠানিক উদ্বোধনের। এই উদ্যোগটি নাগরিকদের বিভিন্ন পৌরসভা পরিষেবা অনলাইনে সহজে অ্যাক্সেস করার সুযোগ প্রদান করবে।',
        image: 'https://images.unsplash.com/photo-1559028006-5a6997c69a38?auto=format&fit=crop&q=80&w=800'
      },
      {
        title_en: 'Clean Water Supply Project Completed',
        title_bn: 'বিশুদ্ধ জল সরবরাহ প্রকল্প সম্পন্ন',
        content_en: 'The clean water supply project in Mohammadpur area has been successfully completed, providing safe drinking water to over 10,000 residents.',
        content_bn: 'মোহাম্মদপুর এলাকায় বিশুদ্ধ জল সরবরাহ প্রকল্প সফলভাবে সম্পন্ন হয়েছে, যা ১০,০০০-এরও বেশি বাসিন্দাকে নিরাপদ পানীয় জল সরবরাহ করছে।',
        image: 'https://images.unsplash.com/photo-1548199963-7bbe5f1c1a0f?auto=format&fit=crop&q=80&w=800'
      },
      {
        title_en: 'Free Health Camp This Weekend',
        title_bn: 'এই সপ্তাহান্তে বিনামূল্যে স্বাস্থ্য ক্যাম্প',
        content_en: 'A free health camp will be organized this weekend at Ward 29 Community Center. Doctors will provide free check-ups and medicines.',
        content_bn: 'এই সপ্তাহান্তে ওয়ার্ড ২৯ কমিউনিটি সেন্টারে একটি বিনামূল্যে স্বাস্থ্য ক্যাম্প আয়োজন করা হবে। চিকিৎসকরা বিনামূল্যে স্বাস্থ্য পরীক্ষা এবং ওষুধ প্রদান করবেন।',
        image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800'
      }
    ];

    for (const news of newsItems) {
      await db.run(
        'INSERT INTO news (title_en, title_bn, content_en, content_bn, image) VALUES (?, ?, ?, ?, ?)',
        [news.title_en, news.title_bn, news.content_en, news.content_bn, news.image]
      );
    }

    // Seed Events
    console.log('📅 Seeding events...');
    const events = [
      {
        title_en: 'Community Meeting',
        title_bn: 'সম্প্রদায় সভা',
        description_en: 'Monthly community meeting to discuss local issues and development plans.',
        description_bn: 'স্থানীয় সমস্যা এবং উন্নয়ন পরিকল্পনা নিয়ে আলোচনা করার জন্য মাসিক সম্প্রদায় সভা।',
        event_date: '2026-05-15',
        location_en: 'Ward 29 Community Center',
        location_bn: 'ওয়ার্ড ২৯ কমিউনিটি সেন্টার',
        image: 'https://images.unsplash.com/photo-1540575167063-39a193420d26?auto=format&fit=crop&q=80&w=800'
      },
      {
        title_en: 'Blood Donation Camp',
        title_bn: 'রক্তদান ক্যাম্প',
        description_en: 'Join us for a noble cause. Donate blood and save lives.',
        description_bn: 'একটি মহৎ উদ্দেশ্যে আমাদের সাথে যোগ দিন। রক্ত দিন এবং জীবন বাঁচান।',
        event_date: '2026-05-20',
        location_en: 'Mohammadpur Central Park',
        location_bn: 'মোহাম্মদপুর সেন্ট্রাল পার্ক',
        image: 'https://images.unsplash.com/photo-1615461066159-fea096048d5d?auto=format&fit=crop&q=80&w=800'
      },
      {
        title_en: 'Tree Plantation Drive',
        title_bn: 'বৃক্ষরোপণ অভিযান',
        description_en: 'Let\'s make our ward greener. Join us for a tree plantation drive.',
        description_bn: 'আসুন আমাদের ওয়ার্ডকে সবুজ করি। বৃক্ষরোপণ অভিযানে আমাদের সাথে যোগ দিন।',
        event_date: '2026-05-25',
        location_en: 'Various Locations in Ward 29',
        location_bn: 'ওয়ার্ড ২৯-এর বিভিন্ন স্থানে',
        image: 'https://images.unsplash.com/photo-1548199963-7bbe5f1c1a0f?auto=format&fit=crop&q=80&w=800'
      }
    ];

    for (const event of events) {
      await db.run(
        'INSERT INTO events (title_en, title_bn, description_en, description_bn, event_date, location_en, location_bn, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [event.title_en, event.title_bn, event.description_en, event.description_bn, event.event_date, event.location_en, event.location_bn, event.image]
      );
    }

    // Seed Gallery
    console.log('🖼️ Seeding gallery...');
    const galleryItems = [
      {
        caption_en: 'Ward 29 Community Center',
        caption_bn: 'ওয়ার্ড ২৯ কমিউনিটি সেন্টার',
        image: 'https://images.unsplash.com/photo-1540575167063-39a193420d26?auto=format&fit=crop&q=80&w=800'
      },
      {
        caption_en: 'Clean Water Supply Project',
        caption_bn: 'বিশুদ্ধ জল সরবরাহ প্রকল্প',
        image: 'https://images.unsplash.com/photo-1548199963-7bbe5f1c1a0f?auto=format&fit=crop&q=80&w=800'
      },
      {
        caption_en: 'Tree Plantation Drive 2026',
        caption_bn: 'বৃক্ষরোপণ অভিযান ২০২৬',
        image: 'https://images.unsplash.com/photo-1615461066159-fea096048d5d?auto=format&fit=crop&q=80&w=800'
      },
      {
        caption_en: 'Health Camp for Citizens',
        caption_bn: 'নাগরিকদের জন্য স্বাস্থ্য ক্যাম্প',
        image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800'
      },
      {
        caption_en: 'Community Meeting Hall',
        caption_bn: 'সম্প্রদায় সভা হল',
        image: 'https://images.unsplash.com/photo-1559028006-5a6997c69a38?auto=format&fit=crop&q=80&w=800'
      },
      {
        caption_en: 'Street Lighting Project',
        caption_bn: 'রাস্তা আলোকসজ্জল প্রকল্প',
        image: 'https://images.unsplash.com/photo-1589331996425-909408690b2e?auto=format&fit=crop&q=80&w=800'
      }
    ];

    for (const item of galleryItems) {
      await db.run(
        'INSERT INTO gallery (caption_en, caption_bn, image) VALUES (?, ?, ?)',
        [item.caption_en, item.caption_bn, item.image]
      );
    }

    // Seed Council Members
    console.log('👥 Seeding council members...');
    const councilMembers = [
      {
        name_en: 'Karim Ahmed',
        name_bn: 'করিম আহমেদ',
        position_en: 'Senior Member',
        position_bn: 'সিনিয়র সদস্য',
        phone: '01711-234567',
        email: 'karim.ahmed@ward29.gov.bd',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400'
      },
      {
        name_en: 'Fatema Begum',
        name_bn: 'ফাতেমা বেগম',
        position_en: 'Women Affairs Coordinator',
        position_bn: 'নারী বিষয়ক সমন্বয়ক',
        phone: '01711-234568',
        email: 'fatema.begum@ward29.gov.bd',
        photo: 'https://images.unsplash.com/photo-1494790108755-2616b332c3ca?auto=format&fit=crop&q=80&w=400'
      },
      {
        name_en: 'Rahman Khan',
        name_bn: 'রহমান খান',
        position_en: 'Education Coordinator',
        position_bn: 'শিক্ষা সমন্বয়ক',
        phone: '01711-234569',
        email: 'rahman.khan@ward29.gov.bd',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400'
      },
      {
        name_en: 'Salma Akter',
        name_bn: 'সালমা আক্তার',
        position_en: 'Health Coordinator',
        position_bn: 'স্বাস্থ্য সমন্বয়ক',
        phone: '01711-234570',
        email: 'salma.akter@ward29.gov.bd',
        photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400'
      }
    ];

    for (const member of councilMembers) {
      await db.run(
        'INSERT INTO council_members (name_en, name_bn, position_en, position_bn, phone, email, photo) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [member.name_en, member.name_bn, member.position_en, member.position_bn, member.phone, member.email, member.photo]
      );
    }

    // Seed Volunteers
    console.log('🤝 Seeding volunteers...');
    const volunteers = [
      {
        name: 'Abdul Karim',
        phone: '01812-345678',
        email: 'abdul.karim@email.com',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
        status: 'approved'
      },
      {
        name: 'Rahima Begum',
        phone: '01812-345679',
        email: 'rahima.begum@email.com',
        photo: 'https://images.unsplash.com/photo-1494790108755-2616b332c3ca?auto=format&fit=crop&q=80&w=400',
        status: 'approved'
      },
      {
        name: 'Mohammad Ali',
        phone: '01812-345680',
        email: 'mohammad.ali@email.com',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
        status: 'pending'
      },
      {
        name: 'Fatema Khatun',
        phone: '01812-345681',
        email: 'fatema.khatun@email.com',
        photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400',
        status: 'approved'
      },
      {
        name: 'Habibur Rahman',
        phone: '01812-345682',
        email: 'habibur.rahman@email.com',
        photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
        status: 'pending'
      }
    ];

    for (const volunteer of volunteers) {
      await db.run(
        'INSERT INTO volunteers (name, phone, email, photo, status) VALUES (?, ?, ?, ?, ?)',
        [volunteer.name, volunteer.phone, volunteer.email, volunteer.photo, volunteer.status]
      );
    }

    // Seed Complaints
    console.log('📝 Seeding complaints...');
    const complaints = [
      {
        tracking_id: 'WRD29-2026-001',
        name: 'Ahmed Hassan',
        phone: '01711-123456',
        subject: 'Street Light Not Working',
        message: 'The street light at Road No. 12 has been not working for the past week. Please fix it as soon as possible.',
        status: 'resolved',
        admin_note: 'Fixed on 2026-05-01. Electrician visited and replaced the bulb.'
      },
      {
        tracking_id: 'WRD29-2026-002',
        name: 'Salma Akter',
        phone: '01711-123457',
        subject: 'Garbage Collection Issue',
        message: 'Garbage is not being collected regularly from our area. Please look into this matter.',
        status: 'in-progress',
        admin_note: 'Contacted waste management department. Collection schedule revised.'
      },
      {
        tracking_id: 'WRD29-2026-003',
        name: 'Karim Uddin',
        phone: '01711-123458',
        subject: 'Water Supply Problem',
        message: 'Low water pressure in our area for the last 3 days.',
        status: 'open',
        admin_note: ''
      },
      {
        tracking_id: 'WRD29-2026-004',
        name: 'Fatema Begum',
        phone: '01711-123459',
        subject: 'Road Repair Needed',
        message: 'The main road has several potholes that need immediate repair.',
        status: 'resolved',
        admin_note: 'Road repair completed on 2026-04-28.'
      },
      {
        tracking_id: 'WRD29-2026-005',
        name: 'Mohammad Ali',
        phone: '01711-123460',
        subject: 'Mosque Cleaning',
        message: 'Request for regular cleaning of the local mosque.',
        status: 'in-progress',
        admin_note: 'Cleaning schedule arranged - twice weekly.'
      }
    ];

    for (const complaint of complaints) {
      await db.run(
        'INSERT INTO complaints (tracking_id, name, phone, subject, message, status, admin_note) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [complaint.tracking_id, complaint.name, complaint.phone, complaint.subject, complaint.message, complaint.status, complaint.admin_note]
      );
    }

    // Seed Sample Voters
    console.log('🗳️ Seeding sample voters...');
    const voters = [
      {
        nid: '19901234567890123',
        dob: '1990-01-15',
        name_en: 'Ahmed Hassan',
        name_bn: 'আহমেদ হাসান',
        father_name: 'Abdul Karim',
        mother_name: 'Fatema Begum',
        address: 'House 12, Road 5, Mohammadpur, Dhaka',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
        serial_no: '001',
        polling_center_en: 'Mohammadpur Government Primary School',
        polling_center_bn: 'মোহাম্মদপুর সরকারি প্রাথমিক বিদ্যালয়',
        booth_no: '1'
      },
      {
        nid: '19852345678901234',
        dob: '1985-06-20',
        name_en: 'Salma Akter',
        name_bn: 'সালমা আক্তার',
        father_name: 'Mohammad Ali',
        mother_name: 'Rahima Begum',
        address: 'House 8, Road 3, Mohammadpur, Dhaka',
        photo: 'https://images.unsplash.com/photo-1494790108755-2616b332c3ca?auto=format&fit=crop&q=80&w=400',
        serial_no: '002',
        polling_center_en: 'Mohammadpur Government Primary School',
        polling_center_bn: 'মোহাম্মদপুর সরকারি প্রাথমিক বিদ্যালয়',
        booth_no: '2'
      },
      {
        nid: '19923456789012345',
        dob: '1992-11-10',
        name_en: 'Karim Uddin',
        name_bn: 'করিম উদ্দিন',
        father_name: 'Abdul Malek',
        mother_name: 'Ayesha Begum',
        address: 'House 15, Road 7, Mohammadpur, Dhaka',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
        serial_no: '003',
        polling_center_en: 'Mohammadpur Girls High School',
        polling_center_bn: 'মোহাম্মদপুর গার্লস হাই স্কুল',
        booth_no: '1'
      }
    ];

    for (const voter of voters) {
      await db.run(
        'INSERT INTO voters (nid, dob, name_en, name_bn, father_name, mother_name, address, photo, serial_no, polling_center_en, polling_center_bn, booth_no) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [voter.nid, voter.dob, voter.name_en, voter.name_bn, voter.father_name, voter.mother_name, voter.address, voter.photo, voter.serial_no, voter.polling_center_en, voter.polling_center_bn, voter.booth_no]
      );
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   📰 News: ${newsItems.length} items`);
    console.log(`   📅 Events: ${events.length} items`);
    console.log(`   🖼️ Gallery: ${galleryItems.length} items`);
    console.log(`   👥 Council Members: ${councilMembers.length} items`);
    console.log(`   🤝 Volunteers: ${volunteers.length} items`);
    console.log(`   📝 Complaints: ${complaints.length} items`);
    console.log(`   🗳️ Sample Voters: ${voters.length} items`);
    
    await db.close();
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

seedDatabase();
