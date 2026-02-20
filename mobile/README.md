# Library Mobile App

Mobile application untuk member perpustakaan menggunakan React Native + Expo.

## 🚀 Features

### ✅ Implemented

- **Authentication** - Login dengan nomor HP & password
- **Family Accounts** - Support multiple member dalam satu akun
- **Profile Management** - Manage profil dan linked members
- **MMKV Storage** - Fast local storage dengan encryption
- **Secure Storage** - Encrypted storage untuk auth tokens

### 🚧 Coming Soon

- **Catalog Browsing** - Browse dan search buku perpustakaan
- **Active Loans** - Lihat peminjaman aktif
- **Loan History** - Riwayat peminjaman
- **Self Renewal** - Perpanjangan mandiri
- **Member QR Code** - QR code untuk kartu member
- **News & Announcements** - Berita dan pengumuman perpustakaan

## 📦 Tech Stack

- **React Native** - Framework mobile
- **Expo** - Development platform
- **TypeScript** - Type safety
- **React Navigation** - Navigation
- **Zustand** - State management
- **React Query** - Data fetching & caching
- **MMKV** - Fast local storage
- **Expo SecureStore** - Encrypted storage
- **Axios** - HTTP client

## 🛠️ Setup

### Prerequisites

- Node.js 18+
- npm atau yarn
- Expo Go app (untuk testing di device)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# Run on Web
npm run web
```

## 📁 Project Structure

```
mobile/
├── src/
│   ├── config/
│   │   └── api.config.ts          # API endpoints configuration
│   ├── services/
│   │   ├── api.service.ts         # API service layer
│   │   ├── storage.service.ts     # MMKV storage service
│   │   └── secureStorage.service.ts # Secure storage service
│   ├── store/
│   │   └── authStore.ts           # Zustand auth store
│   ├── navigation/
│   │   ├── AppNavigator.tsx       # Main navigator
│   │   └── types.ts               # Navigation types
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── home/
│   │   │   └── HomeScreen.tsx
│   │   ├── catalog/
│   │   │   └── CatalogScreen.tsx
│   │   ├── loans/
│   │   │   └── LoansScreen.tsx
│   │   ├── profile/
│   │   │   └── ProfileScreen.tsx
│   │   └── LoadingScreen.tsx
│   └── components/                # Shared components (coming soon)
├── .env                           # Environment variables
├── .env.example                   # Environment variables template
├── App.tsx                        # App entry point
└── package.json
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and update values:

```env
API_BASE_URL=http://192.168.35.8:3000/api
STORAGE_ENCRYPTION_KEY=your-encryption-key
APP_NAME=Library Mobile App
APP_VERSION=1.0.0
```

### API Endpoints

API endpoints dikonfigurasi di `src/config/api.config.ts`:

- `/mobile/auth/*` - Authentication
- `/mobile/profile/*` - Profile & family accounts
- `/mobile/catalog/*` - Catalog browsing
- `/mobile/loans/*` - Loans management
- `/mobile/news/*` - News & announcements

## 📱 Testing

### Expo Go

1. Install Expo Go di smartphone Anda
2. Jalankan `npm start`
3. Scan QR code dengan Expo Go app

### Android Emulator

```bash
npm run android
```

### iOS Simulator (macOS only)

```bash
npm run ios
```

## 🔐 Security

- **Auth Tokens** disimpan di Expo SecureStore (encrypted)
- **Cache Data** disimpan di MMKV dengan encryption
- **API Calls** menggunakan JWT Bearer token
- **Password** tidak pernah disimpan (kecuali jika "Remember Me" diaktifkan)

## 📝 Development Notes

### State Management

- **Zustand** untuk global state (auth, user, profiles)
- **React Query** untuk server state (API data, caching)
- **MMKV** untuk persistent local state

### Storage Strategy

| Data Type        | Storage     | Why               |
| ---------------- | ----------- | ----------------- |
| Auth Token       | SecureStore | Encrypted, secure |
| User Preferences | MMKV        | Fast, synchronous |
| Active Profile   | MMKV        | Fast access       |
| Catalog Cache    | MMKV        | Fast reads        |
| Offline Loans    | MMKV        | Offline support   |

## 🚀 Next Steps

1. **Implement Catalog Screen** - Browse & search books
2. **Implement Loans Screen** - Active loans & history
3. **Implement Self Renewal** - Perpanjangan mandiri
4. **Implement Member Card** - QR code generation
5. **Implement News** - News & announcements
6. **Add Push Notifications** - Loan reminders
7. **Offline Mode** - Full offline support
8. **Biometric Auth** - Fingerprint/Face ID

## 📄 License

Private - Internal Use Only
