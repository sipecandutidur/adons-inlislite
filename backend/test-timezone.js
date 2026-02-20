const { dbApp } = require('./src/config/database');

async function testTimezone() {
    try {
        console.log('🔍 Testing Database Timezone Configuration...\n');
        
        // Test 1: Check MySQL timezone
        const [timezoneResult] = await dbApp.query('SELECT @@session.time_zone as session_tz, @@global.time_zone as global_tz');
        console.log('1️⃣ MySQL Timezone Settings:');
        console.log('   Session timezone:', timezoneResult[0].session_tz);
        console.log('   Global timezone:', timezoneResult[0].global_tz);
        console.log('');
        
        // Test 2: Check current timestamp
        const [nowResult] = await dbApp.query('SELECT NOW() as `now_time`, CURRENT_TIMESTAMP as `current_ts`');
        console.log('2️⃣ Current Database Time:');
        console.log('   NOW():', nowResult[0].now_time);
        console.log('   CURRENT_TIMESTAMP:', nowResult[0].current_ts);
        console.log('');
        
        // Test 3: Check Node.js timezone
        console.log('3️⃣ Node.js Time:');
        console.log('   Current time:', new Date());
        console.log('   Timezone offset:', new Date().getTimezoneOffset(), 'minutes');
        console.log('   Expected offset for UTC+7: -420 minutes');
        console.log('');
        
        // Test 4: Insert and retrieve test data
        console.log('4️⃣ Testing Insert/Retrieve with Timestamp...');
        
        // Create test table if not exists
        await dbApp.query(`
            CREATE TABLE IF NOT EXISTS timezone_test (
                id INT AUTO_INCREMENT PRIMARY KEY,
                test_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                test_datetime DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Insert test data
        await dbApp.query('INSERT INTO timezone_test () VALUES ()');
        
        // Retrieve test data
        const [testResult] = await dbApp.query('SELECT * FROM timezone_test ORDER BY id DESC LIMIT 1');
        console.log('   Inserted timestamp:', testResult[0].test_timestamp);
        console.log('   Inserted datetime:', testResult[0].test_datetime);
        console.log('');
        
        // Clean up test table
        await dbApp.query('DROP TABLE IF EXISTS timezone_test');
        
        console.log('✅ Timezone test completed!');
        console.log('\n📝 Expected behavior:');
        console.log('   - Session timezone should be +07:00');
        console.log('   - NOW() should show current WIB time (UTC+7)');
        console.log('   - Node.js offset should be -420 minutes (7 hours ahead of UTC)');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error testing timezone:', error);
        process.exit(1);
    }
}

testTimezone();
