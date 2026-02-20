const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { dbInlislite, dbApp } = require('./src/config/database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
const catalogRoutes = require('./src/routes/catalogRoutes');
const locationRoutes = require('./src/routes/locationRoutes');
const statusBukuRoute = require('./src/routes/statusBukuRoute');
const stockOpnameRoutes = require('./src/routes/stockOpnameRoutes');
const brokenBookRoutes = require('./src/routes/brokenBookRoutes');
const membersRoutes = require('./src/routes/membersRoutes');
const collectionsRoutes = require('./src/routes/collectionsRoutes');

app.use('/api/catalogs', catalogRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/status-buku', statusBukuRoute);
app.use('/api/stock-opname', stockOpnameRoutes);
app.use('/api/broken-books', brokenBookRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/rent-computer', require('./src/routes/rentComputerRoutes'));

app.get('/', (req, res) => {
    res.send('Backend API is running');
});

// Function to test database connections
const testDbConnections = async () => {
    try {
        const connectionInlislite = await dbInlislite.getConnection();
        console.log('✅ Connected to Inlislite Database');
        connectionInlislite.release();
    } catch (error) {
        console.error('❌ Failed to connect to Inlislite Database:', error.message);
    }

    try {
        const connectionApp = await dbApp.getConnection();
        console.log('✅ Connected to App Database');
        connectionApp.release();
    } catch (error) {
        console.error('❌ Failed to connect to App Database:', error.message);
    }
};

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    await testDbConnections();
});
