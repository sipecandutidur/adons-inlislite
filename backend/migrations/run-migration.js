const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const runMigration = async () => {
    let connection;
    
    try {
        // Create connection to App database
        connection = await mysql.createConnection({
            host: process.env.DB_APP_HOST,
            user: process.env.DB_APP_USER,
            password: process.env.DB_APP_PASSWORD,
            database: process.env.DB_APP_NAME,
            port: process.env.DB_APP_PORT || 3306,
            multipleStatements: true,
            timezone: '+07:00'
        });
        
        console.log('✅ Connected to App Database');
        
        // Get all SQL files in migrations directory
        const files = await fs.readdir(__dirname);
        const sqlFiles = files.filter(file => file.endsWith('.sql')).sort();
        
        console.log(`📝 Found ${sqlFiles.length} migration file(s)`);
        
        // Run each migration file
        for (const file of sqlFiles) {
            console.log(`\n🔄 Running migration: ${file}`);
            const migrationPath = path.join(__dirname, file);
            const sql = await fs.readFile(migrationPath, 'utf8');
            
            await connection.query(sql);
            console.log(`✅ ${file} completed`);
        }
        
        console.log('\n✅ All migrations completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

runMigration();
