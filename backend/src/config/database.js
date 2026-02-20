const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Configuration for Inlislite database with timezone handling
const dbInlisliteConfig = {
    host: process.env.DB_INLISLITE_HOST,
    user: process.env.DB_INLISLITE_USER,
    password: process.env.DB_INLISLITE_PASSWORD,
    database: process.env.DB_INLISLITE_NAME,
    port: process.env.DB_INLISLITE_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+07:00', // UTC+7 for Indonesia (WIB)
    dateStrings: false, // Return dates as Date objects, not strings
    // Set timezone on connection
    connectAttributes: {
        program_name: 'inlislite-app'
    }
};

// Configuration for App database with timezone handling
const dbAppConfig = {
    host: process.env.DB_APP_HOST,
    user: process.env.DB_APP_USER,
    password: process.env.DB_APP_PASSWORD,
    database: process.env.DB_APP_NAME,
    port: process.env.DB_APP_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+07:00', // UTC+7 for Indonesia (WIB)
    dateStrings: false, // Return dates as Date objects, not strings
    connectAttributes: {
        program_name: 'inlislite-app'
    }
};

// Create pools
const dbInlislite = mysql.createPool(dbInlisliteConfig);
const dbApp = mysql.createPool(dbAppConfig);

// Set timezone for each connection when acquired from pool
dbInlislite.on('connection', (connection) => {
    connection.query("SET time_zone = '+07:00'");
});

dbApp.on('connection', (connection) => {
    connection.query("SET time_zone = '+07:00'");
});

module.exports = {
    dbInlislite,
    dbApp
};
