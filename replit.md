# All Vip Course - Online Education Platform

## Overview

All Vip Course is a web-based online education platform built with React and Firebase. It enables users to browse courses, enroll through payment processing, and access course materials via Telegram groups. The platform includes an admin panel for managing courses, categories, and user enrollments with an approval workflow.

The application serves both free and paid educational content, with support for coupon codes, payment processing through RupantorPay (Bangladesh payment gateway), and secure Telegram group access upon enrollment approval.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- **React 18.2** with functional components and hooks
- **Vite 5.0** as the build tool and development server
- **React Router DOM 6.21** for client-side routing
- **Progressive Web App (PWA)** support with dynamic manifest generation

**UI Component Library**
- **Radix UI primitives** for accessible, unstyled components (Dialog, Dropdown, Select, Toast, Tabs, etc.)
- **Tailwind CSS** for styling with custom design tokens
- **Framer Motion** for animations
- **Lucide React** for icons
- **Custom component library** in `/components/ui` following shadcn/ui patterns

**Form Handling & Validation**
- **React Hook Form 7.60** for form state management
- **Zod 3.22** for schema validation
- **@hookform/resolvers** for integrating Zod with React Hook Form

**State Management Approach**
- Firebase Firestore real-time listeners for data synchronization
- Local component state with React hooks (useState, useEffect)
- Context API for authentication state
- No global state management library (Redux/Zustand) - relies on Firebase real-time updates

### Backend Architecture

**Server Setup**
- **Express.js 4.18** server serving both API endpoints and static React build
- **Node.js** runtime with ES modules (type: "module")
- Server handles both development (Vite dev server) and production (static files)

**API Endpoints Structure**
- `/api/create-payment` - Initiates RupantorPay payment session
- `/api/verify-payment` - Verifies payment status with RupantorPay
- `/api/payment-webhook` - Receives payment notifications from RupantorPay
- `/api/process-enrollment` - Processes manual enrollment and free enrollments
- `/api/upload-image` - Proxies image uploads to ImgBB API
- `/api/get-telegram-link` - Securely retrieves Telegram group links for approved enrollments
- `/api/update-enrollment-status` - Admin endpoint for approving/rejecting enrollments
- `/api/manifest.json` - Dynamic PWA manifest from Firestore settings

**Payment Processing Flow**
1. User initiates payment → `create-payment` API creates RupantorPay session
2. User completes payment on RupantorPay gateway
3. RupantorPay sends webhook → `payment-webhook` verifies and processes enrollment
4. Fallback: Frontend can call `verify-payment` and `process-enrollment` manually
5. Payment verification uses RupantorPay API to confirm transaction status
6. Upon successful payment, enrollment record created with "PENDING" status
7. Admin reviews and approves/rejects enrollment
8. Approved users can access secure Telegram group links

**Enrollment Approval Workflow**
- All enrollments start with "PENDING" status
- Admin reviews enrollment requests in admin panel
- Admin can approve or reject with optional reason
- Approved enrollments grant access to course Telegram groups
- Secure Telegram links generated with HMAC signatures for verification

### Data Storage

**Firebase Firestore Collections**

1. **users** - User profiles and authentication data
   - Fields: name, email, institution, phone, photoURL, role (user/admin), banned, online, lastActive, socialLinks
   - Admin user: `admin@gmail.com` automatically receives admin role

2. **categories** - Course categories displayed on homepage
   - Fields: title, imageURL, description, isPublished, order
   - Support for category ordering and visibility toggle

3. **subcategories** - Optional subcategories under main categories
   - Fields: categoryId, title, description, order

4. **courses** - Course information
   - Fields: title, description, price, categoryId, subcategoryId, telegramGroupLink (tg:// format), instructor details
   - Secure Telegram links stored but not exposed directly to clients

5. **enrollments** - User course enrollments with payment tracking
   - Fields: userId, courseId, transactionId, paymentMethod, status (PENDING/APPROVED/REJECTED), amount, createdAt
   - Links payments to users and courses
   - Tracks approval status and rejection reasons

6. **settings** - PWA configuration and app settings
   - Fields: type (pwa), appName, appShortName, appIcon192, appIcon512, themeColor, backgroundColor
   - Used for dynamic manifest generation

**Firebase Authentication**
- Email/Password authentication
- Google Sign-In provider
- Special admin login: `admin@gmail.com` (any password)
- User role management (user/admin)
- User online status tracking

**Firebase Admin SDK**
- Server-side operations requiring elevated privileges
- Used for: enrollment processing, Telegram link retrieval, status updates
- Initialized with service account credentials from environment variable
- Provides secure access to Firestore without client-side security rules bypass

### External Dependencies

**Payment Gateway**
- **RupantorPay** - Bangladesh payment gateway
- API Endpoints:
  - Payment creation: `https://payment.rupantorpay.com/api/payment/checkout`
  - Payment verification: `https://payment.rupantorpay.com/api/payment/verify-payment`
- Webhook integration for real-time payment notifications
- Supports multiple payment methods (mobile banking, cards, etc.)
- Requires `RUPANTORPAY_API_KEY` environment variable

**Image Hosting**
- **ImgBB API** - Free image hosting service
- Used for: course images, category images, user profile photos
- Upload endpoint: `https://api.imgbb.com/1/upload`
- Requires `IMGBB_API_KEY` environment variable
- Server-side proxy endpoint to protect API key

**Firebase Services**
- **Firebase Project**: `easy-education-real`
- **Firestore** - NoSQL database for all application data
- **Firebase Authentication** - User authentication and management
- **Firebase Admin SDK** - Server-side Firebase operations
- Client SDK initialized in `/src/lib/firebase.js`
- Admin SDK initialized in `/api/firebase-admin-init.js`
- Requires `FIREBASE_SERVICE_ACCOUNT_KEY` JSON for server operations

**Telegram Integration**
- Telegram groups used as course delivery mechanism
- Deep links format: `tg://` protocol for direct Telegram app opening
- Secure link generation with HMAC-SHA256 signatures
- Link expiration and verification utilities in `/lib/telegram.ts`
- Server-side link retrieval prevents direct exposure

**Third-Party UI Libraries**
- **Google Fonts** - "Hind Siliguri" font for Bangla language support
- **Radix UI** - Accessible component primitives (~15 packages)
- **Framer Motion** - Animation library
- **html2pdf.js** - PDF generation for certificates/receipts

**Development & Build Tools**
- **Vite** - Fast development server with HMR over WSS
- **Autoprefixer** - CSS vendor prefixing
- **TailwindCSS** - Utility-first CSS framework
- **PostCSS** - CSS processing

**Environment Variables Required**
```
RUPANTORPAY_API_KEY - RupantorPay merchant API key
IMGBB_API_KEY - ImgBB image hosting API key
FIREBASE_SERVICE_ACCOUNT_KEY - Firebase Admin SDK service account JSON
```

**Hosting Considerations**
- Configured for Replit deployment with specific Vite HMR settings
- WebSocket protocol (wss://) on port 443 for HMR
- CORS enabled for cross-origin requests
- Cache-Control headers set to prevent stale content