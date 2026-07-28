# Adons Inlislite

Sistem tambahan (add-ons) untuk **Inlislite** — aplikasi perpustakaan. Menyediakan fitur-fitur yang tidak tersedia di Inlislite standar.

## ✨ Fitur

| Fitur | Deskripsi |
|-------|-----------|
| **Stock Opname** | Scan barcode buku untuk stock opname perpustakaan |
| **Barcode Scanner** | Scan barcode via kamera HP (memerlukan HTTPS) |
| **Buku Rusak** | Laporan dan tracking buku rusak |
| **Rent Computer** | Manajemen peminjaman komputer perpustakaan |
| **OPAC** | Online Public Access Catalog |

## 🏗️ Arsitektur

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Browser   │────▶│    Nginx     │────▶│    Backend       │
│  (Frontend) │◀────│  (SSL/Proxy) │◀────│  (Express.js)    │
└─────────────┘     └──────────────┘     └────────┬────────┘
                         :443                      │
                                          ┌────────┴────────┐
                                          │                 │
                                    ┌─────▼─────┐   ┌──────▼──────┐
                                    │  MySQL     │   │  Inlislite  │
                                    │  (Docker)  │   │  DB (LAN)   │
                                    │  :3306     │   │  :3309      │
                                    └───────────┘   └─────────────┘
```

## 📁 Struktur Project

```
adons-inlislite/
├── backend/          # Express.js API server
│   ├── src/
│   │   ├── config/   # Database configuration
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── services/
│   ├── migrations/   # SQL migration files
│   ├── Dockerfile
│   └── package.json
├── frontend/         # React + Vite (admin dashboard)
│   ├── src/
│   └── package.json
├── opac/             # React + Vite (public catalog)
├── mobile/           # React Native / Expo
├── nginx/            # Nginx reverse proxy config
│   ├── nginx.conf
│   ├── ssl/          # SSL certificates (gitignored)
│   └── Dockerfile
├── docker-compose.yml
├── init_database.sql # Database schema
├── deploy.sh         # Auto-deploy script untuk Ubuntu
└── .env.example      # Template environment variables
```

## 🚀 Quick Start (Production - Ubuntu Server)

### Prasyarat
- Ubuntu 20.04+ / 22.04+
- Akses root / sudo
- Git terinstall
- Koneksi ke jaringan lokal (untuk akses DB Inlislite)

### Deploy Otomatis

```bash
# 1. Clone repository
git clone https://github.com/sipecandutidur/adons-inlislite.git
cd adons-inlislite

# 2. Jalankan deploy script
chmod +x deploy.sh
sudo ./deploy.sh
```

Script akan otomatis:
- ✅ Install Docker & Docker Compose
- ✅ Setup environment variables
- ✅ Generate SSL certificate (self-signed)
- ✅ Build & start semua services

### Deploy Manual

```bash
# 1. Clone & masuk ke directory
git clone https://github.com/sipecandutidur/adons-inlislite.git
cd adons-inlislite

# 2. Setup environment
cp .env.example .env
nano .env   # Isi password database

# 3. Setup SSL (self-signed)
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/privkey.pem \
    -out nginx/ssl/fullchain.pem \
    -subj "/CN=localhost"

# 4. Build & start
docker compose up -d --build

# 5. Cek status
docker compose ps
docker compose logs -f
```

## 💻 Development (Windows/Mac)

### Prasyarat
- Node.js 18+
- Docker Desktop (untuk MySQL)
- Git

### Setup

```bash
# 1. Clone repository
git clone https://github.com/sipecandutidur/adons-inlislite.git
cd adons-inlislite

# 2. Start MySQL via Docker
docker compose up mysql -d

# 3. Setup Backend
cd backend
cp .env.example .env
nano .env    # Isi password database
npm install
npm run dev  # Start dengan nodemon (hot-reload)

# 4. Setup Frontend (terminal baru)
cd frontend
cp .env.example .env
npm install
npm run dev  # Start Vite dev server di port 5173
```

### Akses Development
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- MySQL: localhost:3306

## ⚙️ Environment Variables

### Root `.env` (Docker Compose)

| Variable | Default | Deskripsi |
|----------|---------|-----------|
| `DB_APP_PASSWORD` | `semak` | Password MySQL (app database) |
| `DB_APP_NAME` | `alternative_inlislite` | Nama database app |
| `DB_INLISLITE_HOST` | `192.168.35.8` | Host database Inlislite |
| `DB_INLISLITE_PORT` | `3309` | Port database Inlislite |
| `DB_INLISLITE_USER` | - | Username database Inlislite |
| `DB_INLISLITE_PASSWORD` | - | Password database Inlislite |
| `DB_INLISLITE_NAME` | `inlislite_v31_depok` | Nama database Inlislite |

### Backend `.env`

| Variable | Default | Deskripsi |
|----------|---------|-----------|
| `PORT` | `3000` | Port backend server |
| `TZ` | `Asia/Jakarta` | Timezone |
| `FRONTEND_DIST_PATH` | `../frontend/dist` | Path ke frontend build |
| `ALLOWED_ORIGINS` | (auto-detect) | CORS origins tambahan |

## 🔧 Useful Commands

```bash
# Docker
docker compose up -d              # Start semua services
docker compose down               # Stop semua services
docker compose logs -f backend    # Lihat log backend
docker compose restart backend    # Restart backend saja
docker compose up -d --build      # Rebuild setelah update code

# Database
docker compose exec mysql mysql -u root -p   # Akses MySQL CLI

# Update dari GitHub
cd /opt/adons-inlislite
git pull
docker compose up -d --build
```

## 📋 API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/catalogs/:barcode` | Get katalog by barcode |
| GET | `/api/locations` | Get semua lokasi |
| GET | `/api/status-buku` | Get status buku |
| POST | `/api/stock-opname/sessions` | Buat sesi stock opname |
| GET | `/api/stock-opname/sessions` | List semua sesi |
| PATCH | `/api/stock-opname/sessions/:id` | Update sesi |
| POST | `/api/stock-opname/sessions/:id/items` | Tambah item scan |
| GET | `/api/broken-books` | List buku rusak |
| POST | `/api/broken-books` | Lapor buku rusak |
| GET | `/api/rent-computer` | List peminjaman komputer |

## 📄 License

ISC © indrakhucuy
