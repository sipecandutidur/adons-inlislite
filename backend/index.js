const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const os = require('os');
const { Server } = require('socket.io');
const { dbInlislite, dbApp } = require('./src/config/database');

dotenv.config();

const app = express();
const server = http.createServer(app);


// Auto-detect local IP addresses
const getLocalIPs = () => {
    const interfaces = os.networkInterfaces();
    const ips = [];
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                ips.push(iface.address);
            }
        }
    }
    return ips;
};

// Build allowed origins from .env + auto-detected IPs
const buildAllowedOrigins = () => {
    const origins = new Set();
    
    // Always allow localhost (http + https)
    origins.add('http://localhost');
    origins.add('http://localhost:5173');
    origins.add('http://localhost:3000');
    origins.add('http://127.0.0.1');
    origins.add('http://127.0.0.1:5173');
    origins.add('http://127.0.0.1:3000');
    origins.add('https://localhost');
    origins.add('https://localhost:5173');
    origins.add('https://localhost:3000');
    origins.add('https://127.0.0.1');
    origins.add('https://127.0.0.1:5173');
    origins.add('https://127.0.0.1:3000');
    
    // Add auto-detected local IPs (http + https)
    const localIPs = getLocalIPs();
    localIPs.forEach(ip => {
        origins.add(`http://${ip}`);
        origins.add(`http://${ip}:5173`);
        origins.add(`http://${ip}:3000`);
        origins.add(`https://${ip}`);
        origins.add(`https://${ip}:5173`);
        origins.add(`https://${ip}:3000`);
    });
    
    // Add custom origins from .env (comma-separated)
    if (process.env.ALLOWED_ORIGINS) {
        process.env.ALLOWED_ORIGINS.split(',').forEach(origin => {
            origins.add(origin.trim());
        });
    }
    
    return Array.from(origins);
};

const allowedOrigins = buildAllowedOrigins();
console.log('✅ Allowed CORS Origins:', allowedOrigins);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
    }
});
app.set('io', io);

const PORT = process.env.PORT || 3000;

// Konfigurasi CORS - izinkan origin spesifik (server internal)
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
}));
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

const path = require('path');
const FRONTEND_DIST = process.env.FRONTEND_DIST_PATH 
    ? path.resolve(process.env.FRONTEND_DIST_PATH) 
    : path.join(__dirname, '../frontend/dist');
const OPAC_DIST = process.env.OPAC_DIST_PATH 
    ? path.resolve(process.env.OPAC_DIST_PATH) 
    : path.join(__dirname, '../opac/dist');

// Serve OPAC static files di /opac
app.use('/opac', express.static(OPAC_DIST));

// OPAC SPA catch-all (semua route /opac/* → /opac/index.html)
app.get('/opac/*', (req, res) => {
    res.sendFile(path.join(OPAC_DIST, 'index.html'));
});

// Serve Frontend (Admin Dashboard) static files
app.use(express.static(FRONTEND_DIST));

// Catch-all: serve frontend for non-API, non-OPAC routes (SPA routing)
app.get('*', (req, res, next) => {
    // Don't serve index.html for API routes — return proper 404
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ success: false, message: 'API endpoint not found' });
    }
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
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

server.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server is running on port ${PORT} (accessible from all network interfaces)`);
    await testDbConnections();
});
