#!/bin/bash
# ==========================================
# Adons Inlislite - Deploy Script for Ubuntu
# ==========================================
# Menjalankan script ini akan:
# 1. Install Docker & Docker Compose (jika belum)
# 2. Clone repo dari GitHub
# 3. Setup environment variables
# 4. Generate self-signed SSL (atau gunakan Let's Encrypt)
# 5. Build & start semua services
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
    echo -e "${GREEN}✅ Docker sudah terinstall$(docker --version)${NC}"
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
# 4. Setup environment variables
# ========================================
echo ""
echo -e "${YELLOW}⚙️  Setup environment variables...${NC}"

if [ ! -f "$INSTALL_DIR/.env" ]; then
    cp "$INSTALL_DIR/.env.example" "$INSTALL_DIR/.env"
    echo -e "${YELLOW}   ⚠️  File .env dibuat dari template.${NC}"
    echo -e "${YELLOW}   ⚠️  Edit file ini dengan nilai yang benar:${NC}"
    echo -e "${YELLOW}      nano $INSTALL_DIR/.env${NC}"
    echo ""
    echo -e "${RED}   PENTING: Isi DB_INLISLITE_PASSWORD dan DB_APP_PASSWORD!${NC}"
    echo ""
    read -p "   Tekan ENTER setelah selesai mengedit .env..." 
else
    echo -e "${GREEN}✅ File .env sudah ada${NC}"
fi

# ========================================
# 5. Generate SSL certificates
# ========================================
echo ""
echo -e "${YELLOW}🔒 Setup SSL certificates...${NC}"

SSL_DIR="$INSTALL_DIR/nginx/ssl"
mkdir -p "$SSL_DIR"

if [ ! -f "$SSL_DIR/fullchain.pem" ]; then
    echo -e "${YELLOW}   Pilih metode SSL:${NC}"
    echo "   1) Self-signed certificate (untuk testing / jaringan lokal)"
    echo "   2) Manual (saya sudah punya certificate)"
    echo ""
    read -p "   Pilih [1/2]: " SSL_CHOICE

    case $SSL_CHOICE in
        1)
            echo -e "${YELLOW}   Generating self-signed certificate...${NC}"
            # Get server IP for SAN
            SERVER_IP=$(hostname -I | awk '{print $1}')
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                -keyout "$SSL_DIR/privkey.pem" \
                -out "$SSL_DIR/fullchain.pem" \
                -subj "/C=ID/ST=Jawa Barat/L=Depok/O=Perpustakaan/CN=$SERVER_IP" \
                -addext "subjectAltName=IP:$SERVER_IP,DNS:localhost"
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
# 6. Build & Start
# ========================================
echo ""
echo -e "${YELLOW}🚀 Building & starting services...${NC}"
echo ""

docker compose down 2>/dev/null || true
docker compose up -d --build

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN} ✅ Deployment Berhasil!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

echo -e "  🌐 Frontend:  ${BLUE}https://$SERVER_IP${NC}"
echo -e "  📡 API:       ${BLUE}https://$SERVER_IP/api${NC}"
echo -e "  🗄️  MySQL:     ${BLUE}localhost:3306${NC}"
echo ""
echo -e "  📋 Useful commands:"
echo -e "     docker compose logs -f          # Lihat logs"
echo -e "     docker compose restart backend  # Restart backend"
echo -e "     docker compose down             # Stop semua"
echo -e "     docker compose up -d --build    # Rebuild & start"
echo ""
echo -e "${YELLOW}  ⚠️  Jika menggunakan self-signed SSL, browser akan${NC}"
echo -e "${YELLOW}     menampilkan warning. Klik 'Advanced' → 'Accept Risk'.${NC}"
echo ""
