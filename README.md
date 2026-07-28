# Adons Inlislite

Sistem tambahan (add-ons) untuk **Inlislite** — aplikasi perpustakaan. Menyediakan fitur-fitur yang tidak tersedia di Inlislite standar.

## ✨ Fitur

| Fitur | Deskripsi |
|-------|-----------|
| **Stock Opname** | Scan barcode buku untuk stock opname perpustakaan |
| **Barcode Scanner** | Scan barcode via kamera HP (memerlukan HTTPS) |
| **Buku Rusak** | Laporan dan tracking buku rusak |
| **Rent Computer** | Manajemen peminjaman komputer perpustakaan |
| **OPAC** | Online Public Access Catalog (akses publik) |

## 🏗️ Arsitektur

```
                        ┌──────────────────────────────┐
                        │         Nginx (:443)         │
                        │     Reverse Proxy + SSL      │
                        ├──────────────────────────────┤
    Browser ──HTTPS──▶  │  /       → Frontend (Admin)  │
                        │  /opac/  → OPAC (Publik)     │
                        │  /api/   → Backend API       │
                        │  /socket.io/ → WebSocket     │
                        └──────────────┬───────────────┘
                                       │
                              ┌────────▼────────┐
                              │   Backend       │
                              │  (Express.js)   │
                              │   :3000         │
                              └───────┬─────────┘
                                      │
                        ┌─────────────┴─────────────┐
                        │                           │
                  ┌─────▼─────┐              ┌──────▼──────┐
                  │  MySQL    │              │  Inlislite  │
                  │  (Docker) │              │  DB (LAN)   │
                  │           │              │  :3309      │
                  └─────┬─────┘              └─────────────┘
                        │
                  ┌─────▼─────────────────┐
                  │  HOST Filesystem      │
                  │  /var/lib/adons-      │
                  │   inlislite/mysql     │
                  │  (data aman di luar   │
                  │   Docker container)   │
                  └───────────────────────┘
```

## 📁 Struktur Project

```
adons-inlislite/
├── backend/              # Express.js API server
│   ├── src/
│   │   ├── config/       # Database configuration
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── services/
│   ├── migrations/       # SQL migration files
│   ├── Dockerfile        # Multi-stage build (Frontend + OPAC + Backend)
│   └── package.json
├── frontend/             # React + Vite (Admin Dashboard)
│   ├── src/
│   └── package.json
├── opac/                 # React + Vite (OPAC — akses publik)
│   ├── src/
│   └── package.json
├── mobile/               # React Native / Expo
├── nginx/                # Nginx reverse proxy
│   ├── nginx.conf        # Routing: /, /opac/, /api/, /socket.io/
│   ├── ssl/              # SSL certificates (gitignored)
│   └── Dockerfile
├── mysql/                # MySQL config
│   └── security.cnf      # Security hardening
├── docker-compose.yml    # Full-stack deployment
├── init_database.sql     # Database schema + security setup
├── deploy.sh             # Auto-deploy script untuk Ubuntu
├── .env.example          # Template environment variables
└── README.md
```

## 🔐 Keamanan Database

| Aspek | Detail |
|-------|--------|
| **Data di HOST** | MySQL data disimpan di `/var/lib/adons-inlislite/mysql` — **bukan** di dalam Docker container. `docker compose down` tidak akan menghapus data. |
| **Dedicated User** | Backend menggunakan user `adons_app` — **bukan** root. Hanya punya akses ke database `alternative_inlislite`. |
| **Root Dikunci** | Remote root login dinonaktifkan. Root hanya bisa diakses dari `localhost`. |
| **Port Tersembunyi** | MySQL port `3306` hanya bind ke `127.0.0.1` — tidak bisa diakses dari luar server. |
| **Password Otomatis** | `deploy.sh` generate password acak 20 karakter (alphanumeric). |
| **Healthcheck Aman** | Healthcheck menggunakan user tanpa password, bukan root. |
| **Security Config** | `local-infile=0`, `symbolic-links=0`, `skip-name-resolve` |

## 🚀 Quick Start (Production — Ubuntu Server)

### Prasyarat
- Ubuntu 20.04+ / 22.04+
- Akses root / sudo
- Git terinstall
- Koneksi ke jaringan lokal (untuk akses DB Inlislite di `192.168.35.8`)

### Deploy Otomatis (Recommended)

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
- ✅ Generate password database acak yang kuat
- ✅ Buat data directory di HOST filesystem
- ✅ Generate SSL certificate (self-signed)
- ✅ Build & start semua services

### Deploy Manual

```bash
# 1. Clone & masuk ke directory
git clone https://github.com/sipecandutidur/adons-inlislite.git
cd adons-inlislite

# 2. Setup environment
cp .env.example .env
nano .env   # Ganti semua password!

# 3. Buat data directory MySQL di HOST
sudo mkdir -p /var/lib/adons-inlislite/mysql
sudo chown 999:999 /var/lib/adons-inlislite/mysql

# 4. Setup SSL (self-signed)
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/privkey.pem \
    -out nginx/ssl/fullchain.pem \
    -subj "/CN=localhost"

# 5. Build & start
docker compose up -d --build

# 6. Cek status
docker compose ps
docker compose logs -f
```

### Akses Production

| Service | URL |
|---------|-----|
| Admin Dashboard | `https://<IP-SERVER>/` |
| OPAC (Publik) | `https://<IP-SERVER>/opac/` |
| API | `https://<IP-SERVER>/api/` |

## 💻 Development (Windows/Mac)

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

# 5. Setup OPAC (terminal baru, opsional)
cd opac
npm install
npm run dev  # Start Vite dev server di port 5174
```

### Akses Development
- Frontend: http://localhost:5173
- OPAC: http://localhost:5174
- Backend API: http://localhost:3000/api
- MySQL: localhost:3306

## ⚙️ Environment Variables

### Root `.env` (Docker Compose)

| Variable | Default | Deskripsi |
|----------|---------|-----------|
| `MYSQL_ROOT_PASSWORD` | *(wajib)* | Password root MySQL (hanya untuk admin darurat) |
| `DB_APP_USER` | `adons_app` | Username MySQL untuk aplikasi |
| `DB_APP_PASSWORD` | *(wajib)* | Password user aplikasi |
| `DB_APP_NAME` | `alternative_inlislite` | Nama database app |
| `MYSQL_DATA_PATH` | `/var/lib/adons-inlislite/mysql` | Path data MySQL di HOST |
| `DB_INLISLITE_HOST` | `192.168.35.8` | Host database Inlislite |
| `DB_INLISLITE_PORT` | `3309` | Port database Inlislite |
| `DB_INLISLITE_USER` | - | Username database Inlislite |
| `DB_INLISLITE_PASSWORD` | - | Password database Inlislite |
| `DB_INLISLITE_NAME` | `inlislite_v31_depok` | Nama database Inlislite |

## 🔧 Useful Commands

```bash
# Docker
docker compose up -d              # Start semua services
docker compose down               # Stop semua (data MySQL tetap aman)
docker compose logs -f backend    # Lihat log backend
docker compose restart backend    # Restart backend saja
docker compose up -d --build      # Rebuild setelah update code

# Database (akses MySQL CLI)
docker compose exec mysql mysql -u adons_app -p alternative_inlislite

# Backup database
docker compose exec mysql mysqldump -u root -p alternative_inlislite > backup_$(date +%Y%m%d).sql

# Restore database
docker compose exec -T mysql mysql -u root -p alternative_inlislite < backup.sql

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
