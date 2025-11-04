# All Vip Course - Complete Setup Guide

## Firebase & ImgBB Setup Instructions

### Your Current Firebase Project
**Project Name:** easy-education-real
**Firebase Config:** Already configured in `/src/lib/firebase.js`

### Firebase Authentication
Your app uses Firebase Authentication with:
- Email & Password authentication
- Google Sign-In
- **Admin Login:** admin@gmail.com (any password) - automatically gets admin role

### Database Collections in Firestore

#### 1. **users** Collection
\`\`\`javascript
{
  id: "uid",
  name: "User Full Name",
  email: "user@example.com",
  institution: "School/University Name",
  phone: "01XXXXXXXXX",
  photoURL: "https://imgbb-link",
  role: "user" or "admin",
  banned: false,
  online: true,
  lastActive: timestamp,
  socialLinks: {
    facebook: "",
    linkedin: "",
    github: ""
  },
  createdAt: timestamp
}
\`\`\`

#### 2. **categories** Collection
\`\`\`javascript
{
  id: "auto-generated",
  title: "Programming",
  imageURL: "https://imgbb-link",
  description: "Learn programming from scratch",
  isPublished: true,
  order: 1,
  createdAt: timestamp
}
\`\`\`

#### 3. **subcategories** Collection
\`\`\`javascript
{
  id: "auto-generated",
  categoryId: "parent-category-id",
  title: "JavaScript Basics",
  description: "Master JavaScript fundamentals",
  order: 1,
  createdAt: timestamp
}
\`\`\`

#### 4. **courses** Collection
\`\`\`javascript
{
  id: "auto-generated",
  title: "Course Name",
  slug: "course-name",
  description: "Course description",
  thumbnailURL: "https://imgbb-link",
  categoryId: "category-id",
  subcategoryId: "subcategory-id",
  instructorId: "user-id",
  instructorName: "Instructor Name",
  price: 500,
  originalPrice: 1000,
  status: "running" | "ongoing" | "completed",
  publishStatus: "draft" | "published",
  tags: ["tag1", "tag2"],
  enrollmentCount: 0,
  rating: 4.5,
  students: 150,
  duration: "12 weeks",
  level: "beginner",
  telegramGroupLink: "https://t.me/groupname",
  createdAt: timestamp,
  updatedAt: timestamp
}
\`\`\`

#### 5. **payments** Collection
\`\`\`javascript
{
  id: "auto-generated",
  userId: "user-id",
  userName: "User Name",
  userEmail: "user@example.com",
  courses: [
    {
      id: "course-id",
      title: "Course Name",
      price: 500
    }
  ],
  totalAmount: 500,
  finalAmount: 500,
  paymentMethod: "bkash" | "nagad" | "bank",
  transactionId: "TXN123456",
  phoneNumber: "01XXXXXXXXX",
  status: "pending" | "approved" | "rejected",
  rejectionReason: "Invalid transaction",
  submittedAt: timestamp,
  reviewedAt: timestamp,
  reviewedBy: "admin-id"
}
\`\`\`

#### 6. **classes** Collection (Course Content)
\`\`\`javascript
{
  id: "auto-generated",
  courseId: "course-id",
  title: "Lesson 1: Introduction",
  description: "Learn the basics",
  videoURL: "https://youtube-or-cloudinary-link",
  duration: 45,
  order: 1,
  resources: ["https://resource-link"],
  createdAt: timestamp
}
\`\`\`

#### 7. **userProgress** Collection
\`\`\`javascript
{
  id: "auto-generated",
  userId: "user-id",
  courseId: "course-id",
  classId: "class-id",
  watched: true,
  watchedAt: timestamp
}
\`\`\`

#### 8. **votes** Collection
\`\`\`javascript
{
  id: "auto-generated",
  userId: "user-id",
  courseId: "course-id",
  vote: 1 or -1,
  createdAt: timestamp
}
\`\`\`

---

## Environment Variables Setup

### Create `.env.local` in your project root:

\`\`\`env
VITE_API_URL=http://localhost:5000
VITE_IMGBB_API_KEY=your_imgbb_api_key_here
\`\`\`

### For Backend (.env):
\`\`\`env
IMGBB_API_KEY=your_imgbb_api_key_here
NODE_ENV=development
PORT=5000
\`\`\`

---

## Getting Your ImgBB API Key

### Step 1: Go to ImgBB
- Visit: https://imgbb.com
- Click **Sign Up** or **Login**

### Step 2: Get Your API Key
- Go to Settings → **API**
- Copy your API Key (looks like: `abc123def456...`)

### Step 3: Add to Environment Variables
- Create `.env.local` file in project root
- Add: `VITE_IMGBB_API_KEY=your_key_here`
- Create `.env` file for backend
- Add: `IMGBB_API_KEY=your_key_here`

### Step 4: Restart Your Dev Server
\`\`\`bash
npm run dev
\`\`\`

---

## How to Add Category & Subcategory

### For Admin Only:
1. Login with: **admin@gmail.com** (password: anything)
2. Go to **Admin Panel**
3. Navigate to **Categories**
4. Click **Add Category**
5. Fill: Title, Image (uploads to ImgBB), Description
6. Click **Save**

### Add Subcategory:
1. In Admin Panel → Categories
2. Click on a category
3. Click **Add Subcategory**
4. Fill: Title, Description
5. Save

### Select Categories for Homepage:
1. Admin Panel → Website Settings
2. Check/uncheck which categories show on homepage
3. Save settings

---

## Course Management Flow

### Step 1: Admin Creates Course
- Admin Panel → **Courses**
- Click **Add Course**
- Fill: Title, Description, Price, Category, Subcategory, Thumbnail (ImgBB)
- Add Telegram Group Link (for telegram join button)
- Save as **Draft**

### Step 2: Course Shows in Admin Approval
- Admin Panel → **Payments** (shows pending approvals)
- Review course details
- Click **Approve** or **Reject**

### Step 3: User Purchases Course
- User clicks **Buy Now** on course card
- Goes to Checkout
- Enters: Payment Method, Phone, Transaction ID
- Submits payment request

### Step 4: Admin Approves Payment
- Admin Panel → **Payments**
- Reviews payment details
- Clicks **Approve**, **Reject**, or **Delete**
- User gets instant notification

### Step 5: User Accesses Course
- User sees course in **My Courses**
- Can click **"Join Telegram Group"** button
- Button links to secure telegram URL
- **Button disables after first click** (prevents sharing)

---

## Telegram Integration (Secure Link)

### How It Works:
1. Admin adds Telegram group link when creating course
2. User clicks "Join Group" button in approved course
3. System generates temporary signed URL
4. Link is hidden from inspect/browser
5. After first click, button disables

### To Use:
- Admin must provide Telegram group link when creating course
- Link format: `https://t.me/groupname` or `https://t.me/+linkcode`

---

## Running the Project

### Development:
\`\`\`bash
npm run dev
\`\`\`
This runs:
- Vite React Frontend: http://localhost:5173
- Express Backend: http://localhost:5000

### Testing Admin:
- Email: admin@gmail.com
- Password: any password

### Testing User Registration:
- Use any email
- Create password
- Fill registration form

---

## Database Security Rules (Firestore)

Set these rules in Firebase Console → Firestore → Rules:

\`\`\`javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read: if request.auth.uid == userId || request.auth.uid != null;
      allow write: if request.auth.uid == userId;
    }

    // Everyone can read published courses
    match /courses/{courseId} {
      allow read: if true;
      allow write: if request.auth.token.email == 'admin@gmail.com';
    }

    // Read categories
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if request.auth.token.email == 'admin@gmail.com';
    }

    // Users can only read/write their own payments
    match /payments/{paymentId} {
      allow read: if request.auth.uid == resource.data.userId || request.auth.token.email == 'admin@gmail.com';
      allow create: if request.auth.uid == request.resource.data.userId;
      allow write: if request.auth.token.email == 'admin@gmail.com';
    }
  }
}
\`\`\`

---

## Common Issues & Fixes

### Issue: Firebase not connecting
- Check if all env variables are set
- Make sure Firebase project is active
- Check internet connection

### Issue: Images not uploading
- Verify ImgBB API key is correct
- Check file size (max 32MB)
- Ensure image format is supported (JPEG, PNG, etc.)

### Issue: Payment not showing in admin
- Refresh admin panel
- Make sure user submitted payment correctly
- Check payment status filter

---

## Deployment

### Deploy to Vercel:
1. Push code to GitHub
2. Go to vercel.com
3. Import GitHub repository
4. Add Environment Variables:
   - `VITE_IMGBB_API_KEY`
   - `IMGBB_API_KEY`
5. Deploy

---

## Support
For any Firebase issues: firebase.google.com/support
For ImgBB: imgbb.com/faq
