#!/bin/bash
# ==========================================
# Adons Inlislite - Deploy Script for Ubuntu
# ==========================================
# Script ini akan:
# 1. Install Docker & Docker Compose (jika belum)
# 2. Clone repo dari GitHub
# 3. Setup environment variables
# 4. Buat directory data MySQL di HOST
# 5. Generate self-signed SSL certificate
# 6. Build & start semua services
# ==========================================
# Usage:
#   chmod +x deploy.sh
#   sudo ./deploy.sh
# ==========================================

set -e

# Warna output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE} Adons Inlislite - Ubuntu Deploy Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ========================================
# 1. Check if running as root
# ========================================
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Jalankan script ini dengan sudo!${NC}"
    echo "   sudo ./deploy.sh"
    exit 1
fi

# ========================================
# 2. Install Docker (jika belum)
# ========================================
echo -e "${YELLOW}📦 Mengecek Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}📦 Menginstall Docker...${NC}"
    apt-get update
    apt-get install -y ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    echo -e "${GREEN}✅ Docker berhasil diinstall${NC}"
else
    echo -e "${GREEN}✅ Docker sudah terinstall $(docker --version)${NC}"
fi

# ========================================
# 3. Setup project directory
# ========================================
INSTALL_DIR="/opt/adons-inlislite"
REPO_URL="https://github.com/sipecandutidur/adons-inlislite.git"

echo ""
echo -e "${YELLOW}📁 Setup project directory...${NC}"

if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}   Directory $INSTALL_DIR sudah ada, pulling latest...${NC}"
    cd "$INSTALL_DIR"
    git pull origin main || git pull origin master
else
    echo -e "${YELLOW}   Cloning dari GitHub...${NC}"
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

echo -e "${GREEN}✅ Project directory ready: $INSTALL_DIR${NC}"

# ========================================
# 4. Setup MySQL data directory di HOST
# ========================================
echo ""
echo -e "${YELLOW}🗄️  Setup MySQL data directory...${NC}"

MYSQL_DATA="/var/lib/adons-inlislite/mysql"
if [ ! -d "$MYSQL_DATA" ]; then
    mkdir -p "$MYSQL_DATA"
    # Set ownership agar MySQL container bisa write
    chown -R 999:999 "$MYSQL_DATA"
    echo -e "${GREEN}✅ MySQL data directory dibuat: $MYSQL_DATA${NC}"
    echo -e "${YELLOW}   ℹ️  Data MySQL disimpan di HOST filesystem (aman dari docker down)${NC}"
else
    echo -e "${GREEN}✅ MySQL data directory sudah ada: $MYSQL_DATA${NC}"
fi

# ========================================
# 5. Setup environment variables
# ========================================
echo ""
echo -e "${YELLOW}⚙️  Setup environment variables...${NC}"

if [ ! -f "$INSTALL_DIR/.env" ]; then
    cp "$INSTALL_DIR/.env.example" "$INSTALL_DIR/.env"

    # Generate random passwords
    ROOT_PWD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 20)
    APP_PWD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 20)

    # Replace placeholder passwords in .env
    sed -i "s/GANTI_DENGAN_PASSWORD_KUAT_ROOT/$ROOT_PWD/" "$INSTALL_DIR/.env"
    sed -i "s/GANTI_DENGAN_PASSWORD_KUAT_APP/$APP_PWD/" "$INSTALL_DIR/.env"

    echo -e "${GREEN}✅ File .env dibuat dengan password acak yang kuat${NC}"
    echo ""
    echo -e "${RED}   ⚠️  PENTING: Edit file .env untuk mengisi:${NC}"
    echo -e "${RED}      - DB_INLISLITE_PASSWORD (password database Inlislite)${NC}"
    echo ""
    echo -e "${YELLOW}   Password yang di-generate:${NC}"
    echo -e "   MYSQL_ROOT_PASSWORD = $ROOT_PWD"
    echo -e "   DB_APP_PASSWORD     = $APP_PWD"
    echo ""
    echo -e "${YELLOW}   Simpan password ini di tempat aman!${NC}"
    echo ""
    echo -e "${YELLOW}   Edit .env sekarang:${NC}"
    echo -e "   nano $INSTALL_DIR/.env"
    echo ""
    read -p "   Tekan ENTER setelah selesai mengedit .env..."
else
    echo -e "${GREEN}✅ File .env sudah ada${NC}"
fi

# ========================================
# 6. Generate SSL certificates
# ========================================
echo ""
echo -e "${YELLOW}🔒 Setup SSL certificates...${NC}"

SSL_DIR="$INSTALL_DIR/nginx/ssl"
mkdir -p "$SSL_DIR"

if [ ! -f "$SSL_DIR/fullchain.pem" ]; then
    echo -e "${YELLOW}   Pilih metode SSL:${NC}"
    echo "   1) Self-signed certificate (untuk jaringan lokal / testing)"
    echo "   2) Manual (saya sudah punya certificate)"
    echo ""
    read -p "   Pilih [1/2]: " SSL_CHOICE

    case $SSL_CHOICE in
        1)
            echo -e "${YELLOW}   Generating self-signed certificate...${NC}"
            SERVER_IP=$(hostname -I | awk '{print $1}')
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                -keyout "$SSL_DIR/privkey.pem" \
                -out "$SSL_DIR/fullchain.pem" \
                -subj "/C=ID/ST=Jawa Barat/L=Depok/O=Perpustakaan/CN=$SERVER_IP" \
                -addext "subjectAltName=IP:$SERVER_IP,DNS:localhost"
            chmod 600 "$SSL_DIR/privkey.pem"
            chmod 644 "$SSL_DIR/fullchain.pem"
            echo -e "${GREEN}✅ Self-signed certificate dibuat untuk IP: $SERVER_IP${NC}"
            ;;
        2)
            echo -e "${YELLOW}   Letakkan certificate di:${NC}"
            echo "      $SSL_DIR/fullchain.pem"
            echo "      $SSL_DIR/privkey.pem"
            read -p "   Tekan ENTER setelah file certificate siap..."
            ;;
        *)
            echo -e "${RED}❌ Pilihan tidak valid${NC}"
            exit 1
            ;;
    esac
else
    echo -e "${GREEN}✅ SSL certificates sudah ada${NC}"
fi

# ========================================
# 7. Build & Start
# ========================================
echo ""
echo -e "${YELLOW}🚀 Building & starting services...${NC}"
echo -e "${YELLOW}   Proses build pertama kali bisa memakan waktu 5-10 menit...${NC}"
echo ""

docker compose down 2>/dev/null || true
docker compose up -d --build

# Wait for services to be ready
echo ""
echo -e "${YELLOW}⏳ Menunggu services ready...${NC}"
sleep 10

# Check service status
echo ""
echo -e "${YELLOW}📊 Status services:${NC}"
docker compose ps

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN} ✅ Deployment Berhasil!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

SERVER_IP=$(hostname -I | awk '{print $1}')

echo -e "  🌐 Admin Dashboard : ${BLUE}https://$SERVER_IP${NC}"
echo -e "  📚 OPAC (Publik)   : ${BLUE}https://$SERVER_IP/opac/${NC}"
echo -e "  📡 API             : ${BLUE}https://$SERVER_IP/api${NC}"
echo -e "  🗄️  MySQL Data      : ${BLUE}/var/lib/adons-inlislite/mysql${NC}"
echo ""
echo -e "  📋 Useful commands:"
echo -e "     docker compose logs -f          # Lihat logs"
echo -e "     docker compose restart backend  # Restart backend"
echo -e "     docker compose down             # Stop semua"
echo -e "     docker compose up -d --build    # Rebuild & start"
echo ""
echo -e "  🔐 Keamanan Database:"
echo -e "     • Data MySQL di HOST: /var/lib/adons-inlislite/mysql"
echo -e "     • MySQL port hanya 127.0.0.1 (tidak bisa diakses dari luar)"
echo -e "     • Backend pakai user 'adons_app' (bukan root)"
echo -e "     • Remote root login dinonaktifkan"
echo ""
echo -e "${YELLOW}  ⚠️  Jika menggunakan self-signed SSL, browser akan${NC}"
echo -e "${YELLOW}     menampilkan warning. Klik 'Advanced' → 'Accept Risk'.${NC}"
echo ""
