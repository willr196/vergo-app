# VERGO App: From Code to App Stores

A complete step-by-step guide to getting your app published on Google Play and Apple App Store.

---

## Overview & Timeline

| Phase | Duration | Cost |
|-------|----------|------|
| 1. Local Setup & Testing | 1-2 days | Free |
| 2. API Connection | 1 day | Free |
| 3. EAS Build Setup | 1 day | Free tier available |
| 4. Android Release | 1-3 days | £20 one-time |
| 5. iOS Release | 3-7 days | £79/year |
| **Total** | **1-2 weeks** | **~£100** |

---

## Phase 1: Local Setup & Testing

### 1.1 Install Dependencies

```bash
# Unzip and enter project
unzip vergo-app.zip
cd vergo-app

# Install dependencies
npm install

# Install Expo CLI globally (if not already)
npm install -g expo-cli eas-cli
```

### 1.2 Configure Environment

```bash
# Create environment file
cp .env.example .env

# Edit with your API URL
nano .env
```

```env
EXPO_PUBLIC_API_URL=https://your-api-domain.com/api
```

### 1.3 Test on Device

```bash
# Start development server
npm start
```

1. Download **Expo Go** app on your phone
2. Scan the QR code shown in terminal
3. Test all screens and features

### 1.4 Test on Emulator (Optional)

```bash
# Android (requires Android Studio)
npm run android

# iOS (requires macOS + Xcode)
npm run ios
```

### 1.5 Testing Checklist

- [ ] Welcome screen loads
- [ ] Can switch between job seeker / client
- [ ] Login form validates correctly
- [ ] Registration works
- [ ] Job list loads from API
- [ ] Job filters work
- [ ] Can view job details
- [ ] Application flow completes
- [ ] Profile displays correctly
- [ ] Logout works

---

## Phase 2: Connect Your Backend API

### 2.1 Update API Base URL

Edit `src/api/client.ts`:

```typescript
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.vergo.events/api';
```

### 2.2 Verify API Endpoints Match

Your Express backend should have these endpoints:

```
# Auth
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/client/login
POST   /api/auth/client/register
POST   /api/auth/refresh
GET    /api/auth/me
PUT    /api/auth/profile

# Jobs
GET    /api/jobs
GET    /api/jobs/:id
GET    /api/jobs/cities
POST   /api/jobs (client)
PUT    /api/jobs/:id (client)

# Applications
POST   /api/applications
GET    /api/applications/me
GET    /api/applications/:id
PUT    /api/applications/:id/withdraw
GET    /api/applications/check/:jobId
```

### 2.3 CORS Configuration

Ensure your backend allows mobile app requests:

```javascript
// In your Express app
app.use(cors({
  origin: true, // Allow all origins for mobile
  credentials: true,
}));
```

### 2.4 Test API Connection

Run the app and verify:
- Login/register works
- Jobs load from your database
- Applications submit correctly

---

## Phase 3: EAS Build Setup

EAS (Expo Application Services) handles building and signing your app.

### 3.1 Create Expo Account

1. Go to https://expo.dev
2. Sign up for free account
3. Verify email

### 3.2 Login to EAS

```bash
eas login
# Enter your Expo credentials
```

### 3.3 Configure Project

```bash
eas build:configure
```

This creates `eas.json`. Update it:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 3.4 Update app.json

```json
{
  "expo": {
    "name": "VERGO Events",
    "slug": "vergo-events",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#0a0a0a"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.vergoevents.app",
      "buildNumber": "1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0a0a0a"
      },
      "package": "com.vergoevents.app",
      "versionCode": 1
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

### 3.5 Create App Icons

You'll need proper app icons:

| Platform | Size | File |
|----------|------|------|
| iOS | 1024x1024px | `assets/icon.png` |
| Android Adaptive | 1024x1024px | `assets/adaptive-icon.png` |
| Splash | 1284x2778px | `assets/splash-icon.png` |

Use https://easyappicon.com or Figma to generate all sizes.

---

## Phase 4: Android Release (Google Play)

### 4.1 Create Google Play Developer Account

1. Go to https://play.google.com/console
2. Pay £20 one-time registration fee
3. Complete identity verification (can take 24-48 hours)

### 4.2 Create App in Play Console

1. Click "Create app"
2. Enter app name: "VERGO Events"
3. Select "App" (not game)
4. Select "Free"
5. Complete declarations

### 4.3 Build Android App Bundle

```bash
# Build production AAB
eas build --platform android --profile production
```

This takes 10-20 minutes. You'll get a download link when complete.

### 4.4 Prepare Store Listing

In Play Console, complete:

**Main store listing:**
- App name: VERGO Events
- Short description (80 chars): "Find premium event work in London"
- Full description (4000 chars): Describe app features
- App icon: 512x512px
- Feature graphic: 1024x500px
- Screenshots: At least 2 phone screenshots

**Content rating:**
- Complete questionnaire (takes 5 mins)
- Usually rated "Everyone"

**Privacy policy:**
- Create privacy policy page on your website
- Add URL to Play Console

**Target audience:**
- Select 18+ (employment app)

### 4.5 Upload App Bundle

1. Go to "Production" → "Create new release"
2. Upload the `.aab` file from EAS
3. Add release notes
4. Save and review

### 4.6 Submit for Review

1. Complete all required sections (checkmarks turn green)
2. Click "Send for review"
3. Wait 1-3 days for approval

### 4.7 Common Rejection Reasons

- Missing privacy policy
- Broken login (test account needed)
- Crashes on launch
- Incomplete store listing

---

## Phase 5: iOS Release (Apple App Store)

### 5.1 Apple Developer Account

1. Go to https://developer.apple.com
2. Enroll in Apple Developer Program
3. Pay £79/year
4. Identity verification (can take 24-48 hours)

**Note:** You need a Mac for some steps, or use your friend's Mac.

### 5.2 Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+"
3. Enter:
   - Platform: iOS
   - Name: VERGO Events
   - Primary language: English (UK)
   - Bundle ID: com.vergoevents.app
   - SKU: vergo-events-001

### 5.3 Build iOS App

```bash
# Build for App Store
eas build --platform ios --profile production
```

First time will prompt you to:
1. Log into Apple Developer account
2. Create/select distribution certificate
3. Create/select provisioning profile

EAS handles this automatically.

### 5.4 Prepare App Store Listing

**Required assets:**
- 6.7" screenshots (1290x2796px) - iPhone 15 Pro Max
- 6.5" screenshots (1284x2778px) - iPhone 14 Plus
- 5.5" screenshots (1242x2208px) - iPhone 8 Plus
- App icon (automatically from build)

**Required info:**
- Description
- Keywords (100 chars, comma-separated)
- Support URL
- Privacy policy URL
- Category: Business or Lifestyle

### 5.5 Upload Build

Option A - Using EAS Submit:
```bash
eas submit --platform ios
```

Option B - Using Transporter (Mac):
1. Download Transporter from Mac App Store
2. Drag `.ipa` file into Transporter
3. Click "Deliver"

### 5.6 Submit for Review

1. Select build in App Store Connect
2. Answer export compliance (usually "No" for encryption)
3. Answer content rights questions
4. Add contact info for review team
5. Provide demo account credentials:
   ```
   Email: demo@vergo.events
   Password: DemoPass123!
   ```
6. Click "Submit for Review"

### 5.7 Review Timeline

- Usually 24-48 hours
- Can take up to 7 days
- You'll get email when approved/rejected

### 5.8 Common iOS Rejection Reasons

1. **Missing demo account** - Always provide test credentials
2. **Broken functionality** - Test thoroughly before submit
3. **Incomplete metadata** - Fill all required fields
4. **Privacy issues** - Explain data collection
5. **Login with Apple** - Required if you have social login (you don't, so you're fine)

---

## Phase 6: Post-Launch

### 6.1 Monitor Crashes

Set up error tracking:

```bash
npm install sentry-expo
```

### 6.2 Push Notifications (Optional)

To enable push notifications, you'll need:

1. Firebase project (for Android)
2. Apple Push Notification service key (for iOS)
3. Server-side notification sending

### 6.3 App Updates

When you need to update:

```bash
# Increment version in app.json
# version: "1.0.1"
# android.versionCode: 2
# ios.buildNumber: "2"

# Build new version
eas build --platform all --profile production

# Submit
eas submit --platform all
```

### 6.4 OTA Updates (Minor Changes)

For small JS-only changes, use EAS Update:

```bash
eas update --branch production --message "Bug fixes"
```

Users get the update without going through app store review!

---

## Quick Reference: Complete Command Sequence

```bash
# 1. Setup
unzip vergo-app.zip && cd vergo-app
npm install
cp .env.example .env
# Edit .env with your API URL

# 2. Test locally
npm start

# 3. Setup EAS
eas login
eas build:configure

# 4. Build for stores
eas build --platform android --profile production
eas build --platform ios --profile production

# 5. Submit to stores
eas submit --platform android
eas submit --platform ios
```

---

## Costs Summary

| Item | Cost | Frequency |
|------|------|-----------|
| Google Play Developer | £20 | One-time |
| Apple Developer Program | £79 | Yearly |
| EAS Build (free tier) | £0 | 30 builds/month |
| EAS Build (production) | £15/month | Optional |
| **Total Year 1** | **~£100** | |
| **Total Year 2+** | **~£79** | |

---

## Checklist Before Submission

### Android
- [ ] Privacy policy URL added
- [ ] Content rating completed
- [ ] Store listing complete (description, screenshots)
- [ ] App tested on real device
- [ ] Demo account created for testing

### iOS
- [ ] Apple Developer account active
- [ ] Privacy policy URL added
- [ ] App Store listing complete
- [ ] All screenshot sizes provided
- [ ] Demo account credentials ready
- [ ] App tested on real device

---

## Need Help?

- **Expo Docs**: https://docs.expo.dev
- **EAS Build**: https://docs.expo.dev/build/introduction
- **Play Console Help**: https://support.google.com/googleplay/android-developer
- **App Store Help**: https://developer.apple.com/help/app-store-connect

---

**Good luck with your launch! 🚀**
