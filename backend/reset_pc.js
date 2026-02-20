const { dbApp } = require('./src/config/database');

async function resetPC() {
    try {
        console.log('Resetting PC 9...');
        await dbApp.query("UPDATE computer_rentals SET status = 'completed', end_time = NOW() WHERE pc_number = 9 AND status = 'active'");
        console.log('✅ PC 9 Reset');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

resetPC();
