# 🕳️ KhaddaWaliParty

> **Road Pothole Tracker India** — A mobile-first, public (no-login) web application for reporting and tracking road potholes across India with zero friction.

[![PWA Ready](https://img.shields.io/badge/PWA-Installable-blue.svg)](https://khaddawaliparty.web.app)
[![Vite](https://img.shields.io/badge/Vite-6.x-purple.svg)](https://vitejs.dev)
[![Firebase](https://img.shields.io/badge/Firebase-v11-orange.svg)](https://firebase.google.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-teal.svg)](https://tailwindcss.com)

---

## 🌟 Features

- 🗺️ **Interactive Fullscreen Map**: Centered on India with sleek dark styling (CartoDB / OpenStreetMap / Mapbox).
- 📍 **One-Tap Geolocation**: High-accuracy GPS acquisition with visual radius confirmation.
- 📱 **Mobile-First Bottom Sheet**: Pull-to-dismiss drawer with camera capture, auto-coordinates, and landmark inputs.
- ⚡ **Client-Side Image Optimization**:
  - Automatically fixes EXIF orientation.
  - Re-encodes on Canvas to **100% strip EXIF/GPS device metadata** for reporter privacy.
  - Compresses to WebP/JPEG under **200 KB** before upload.
  - Generates lightweight **320px thumbnails** for instant map popups.
- 🛡️ **Zero-Spam & Server-Side Security**:
  - **Firebase Anonymous Auth**: Instant session for every visitor without sign-in barriers.
  - **Firebase App Check**: Enforced via reCAPTCHA v3 / Enterprise to block unauthorized bots.
  - **Locked Firestore Security Rules**: Public read-only; all writes strictly gated behind Cloud Functions.
  - **20-Meter Server Deduplication**: Nearby reports (<= 20m) automatically increment report counts instead of spawning duplicate pins.
  - **Rate Limiting**: Sliding/hourly window per UID and hashed client IP (5 reports/hr, 20 reports/day, 30 upvotes/day).
  - **Anti-Spam Honeypot & Dwell-Time Validation**: Automated spam bots trapped and rejected.
- ☕ **Chai Tip Support (₹20)**: Direct UPI deep-linking (`upi://pay?pa=...`) on mobile with desktop QR code fallback.
- 📶 **Offline PWA with Auto-Sync**: Reports submitted while offline are queued in IndexedDB and automatically synchronized once internet connectivity resumes.
- 🗣️ **Hinglish & English Microcopy**: Full bilingual toggle for seamless accessibility across India.

---

## 🏗️ Architecture & Pluggable Map Adapter

All map logic is decoupled behind `src/map/MapAdapter.js`. The default adapter is zero-cost and uses vector tiles. You can switch providers anytime via `.env`:

```env
# Switch map engine ('carto' | 'osm' | 'mapbox')
VITE_MAP_PROVIDER=carto
VITE_MAPBOX_ACCESS_TOKEN=
```

---

## 🚀 Quickstart & Local Development

### 1. Prerequisites
- Node.js >= 18
- Firebase CLI (`npm install -g firebase-tools`)
- Java JRE (for running the local Firebase Emulator Suite)

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install Cloud Functions dependencies
cd functions && npm install && cd ..
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Fill in your Firebase project credentials in `.env`.

### 4. Start Local Development Server
```bash
npm run dev
```
Visit `http://localhost:5173` in your browser or mobile viewport.

---

## 🧪 Running Firebase Emulator Suite Locally

You can run the entire backend (Auth, Firestore, Cloud Functions, Storage, Hosting) 100% locally:

```bash
# 1. Enable emulator mode in .env
VITE_USE_FIREBASE_EMULATOR=true

# 2. Start emulators
firebase emulators:start
```

Access the Firebase Emulator UI at `http://localhost:4000`.

---

## 🔒 Firebase Production Setup & Deployment

### Step 1: Create Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a project named `khaddawaliparty`.
3. Set your active project: `firebase use khaddawaliparty`.

### Step 2: Enable Anonymous Authentication
1. Go to **Authentication** > **Sign-in method**.
2. Click **Anonymous** and toggle **Enable**.

### Step 3: Enable App Check
1. Go to **App Check** in the Firebase Console.
2. Register your Web App with **reCAPTCHA v3** or **reCAPTCHA Enterprise**.
3. Copy your site key into `VITE_APP_CHECK_SITE_KEY` in `.env`.

### Step 4: Deploy Rules & Functions
```bash
# Deploy Firestore & Storage Security Rules
firebase deploy --only firestore:rules,storage

# Deploy Cloud Functions
firebase deploy --only functions

# Deploy Frontend to Firebase Hosting
npm run build
firebase deploy --only hosting
```

---

## 📊 Running Automated Tests

```bash
# Run unit tests for 20m Haversine deduplication, rate limits, and sanitization
npm run test:functions
```

---

## 💡 UPI Chai Tip Configuration

Set your personal or organization UPI ID in `.env`:
```env
VITE_UPI_ID=khaddawali@upi
VITE_UPI_PAYEE_NAME=KhaddaWaliParty
```
When users click **Tip Chai (₹20)**, mobile users trigger their native UPI app (GPay, PhonePe, Paytm, Cred), and desktop users see a generated QR code.

---

## 📜 License
MIT License. Built with ❤️ for better roads across India.
