# Firestore Database Schema

## Collections

### 1. categories
Main course categories that can be displayed on homepage
```
{
  id: auto-generated,
  title: string,
  description: string,
  icon: string (icon name or URL),
  showOnHomepage: boolean,
  order: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 2. subcategories
Subcategories under each main category
```
{
  id: auto-generated,
  categoryId: string (reference to parent category),
  title: string,
  description: string,
  order: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 3. courses
Course information (existing collection, add new fields)
```
{
  id: auto-generated,
  title: string,
  description: string,
  price: number,
  categoryId: string,
  subcategoryId: string (optional),
  telegramGroupLink: string (tg:// format, secure),
  ... (existing fields)
}
```

### 4. enrollments
User course enrollments with approval status
```
{
  id: auto-generated,
  userId: string,
  courseId: string,
  status: string (PENDING | APPROVED | REJECTED),
  paymentInfo: {
    phoneNumber: string,
    transactionId: string,
    amount: number
  },
  telegramJoinedAt: timestamp (null initially),
  createdAt: timestamp,
  updatedAt: timestamp,
  rejectionReason: string (optional),
  approvedBy: string (admin userId, optional)
}
```

### 5. settings
Site-wide settings
```
{
  id: "site-settings",
  siteName: string,
  ... (existing fields)
}
```
