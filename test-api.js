// Simple test script for local API
import fetch from 'node-fetch';

async function testAPI() {
    console.log('🧪 Testing Local API...');
    
    try {
        // Test 1: Login
        console.log('\n1. Testing login...');
        const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: 'admin@ward29.com', 
                password: 'Admin123!' 
            })
        });
        
        if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            console.log('✅ Login successful!');
            console.log('User:', loginData.user.email);
            console.log('Role:', loginData.user.role);
            
            const token = loginData.token;
            
            // Test 2: Get News
            console.log('\n2. Testing get news...');
            const newsResponse = await fetch('http://localhost:3000/api/news');
            
            if (newsResponse.ok) {
                const news = await newsResponse.json();
                console.log('✅ Get news successful!');
                console.log('News count:', news.length);
                
                // Test 3: Add News
                console.log('\n3. Testing add news...');
                const addNewsResponse = await fetch('http://localhost:3000/api/news', {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        title_en: 'Test News',
                        title_bn: 'টেস্ট সংবাদ',
                        content_en: 'This is a test news content',
                        content_bn: 'এটি একটি টেস্ট সংবাদ সামগ্রী'
                    })
                });
                
                if (addNewsResponse.ok) {
                    const newNews = await addNewsResponse.json();
                    console.log('✅ Add news successful!');
                    console.log('News ID:', newNews.id);
                    
                    // Test 4: Delete News
                    console.log('\n4. Testing delete news...');
                    const deleteResponse = await fetch(`http://localhost:3000/api/news/${newNews.id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    if (deleteResponse.ok) {
                        console.log('✅ Delete news successful!');
                    } else {
                        console.log('❌ Delete news failed');
                    }
                } else {
                    console.log('❌ Add news failed');
                }
            } else {
                console.log('❌ Get news failed');
            }
        } else {
            console.log('❌ Login failed');
        }
        
        console.log('\n🎉 API testing completed!');
        
    } catch (error) {
        console.error('❌ API test error:', error.message);
    }
}

testAPI();
