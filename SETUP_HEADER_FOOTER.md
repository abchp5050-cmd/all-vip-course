# হেডার এবং ফুটার কনফিগারেশন আপডেট করুন

Firestore-এ সঠিক হেডার এবং ফুটার কনফিগ সেট করতে নিচের স্ক্রিপ্ট ব্রাউজার কনসোলে রান করুন:

## স্টেপ ১: ব্রাউজার কনসোল খুলুন
- Chrome/Edge: `F12` বা `Ctrl+Shift+I` চাপুন, তারপর "Console" ট্যাবে যান
- Firefox: `F12` বা `Ctrl+Shift+K`

## স্টেপ ২: নিচের স্ক্রিপ্ট কপি করে কনসোলে পেস্ট করে Enter চাপুন

```javascript
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './lib/firebase';

// সঠিক হেডার কনফিগ
const headerConfig = {
  name: "Default Header",
  isActive: true,
  isPublished: true,
  content: {
    logo: {
      type: "text",
      text: "All Vip Courses",
      link: "/",
      alt: "All Vip Courses Logo"
    },
    navigation: [
      { id: "nav-home", label: "Home", type: "internal", url: "/", order: 0, isVisible: true, openInNewTab: false, children: [] },
      { id: "nav-courses", label: "Courses", type: "internal", url: "/courses", order: 1, isVisible: true, openInNewTab: false, children: [] },
      { id: "nav-community", label: "Community", type: "internal", url: "/community", order: 2, isVisible: true, openInNewTab: false, children: [] },
      { id: "nav-announcements", label: "Announcements", type: "internal", url: "/announcements", order: 3, isVisible: true, openInNewTab: false, children: [] }
    ],
    elements: {
      showSearch: true,
      showThemeToggle: true,
      showUserMenu: true,
      showInstallButton: true,
      customButtons: []
    },
    mobileMenu: {
      enabled: true,
      position: "left",
      showIcons: true
    }
  },
  styling: {
    layout: { height: "auto", maxWidth: "container", padding: { top: "0.75rem", bottom: "0.75rem", left: "1rem", right: "1rem" }, sticky: true, zIndex: 50 },
    colors: { background: "bg-card", text: "text-foreground", border: "border-border", hoverBackground: "hover:bg-accent", hoverText: "hover:text-accent-foreground" },
    typography: { logoFont: "font-bold", logoSize: "text-xl", navFont: "font-medium", navSize: "text-sm" },
    effects: { shadow: "shadow-sm", borderRadius: "rounded-none", animation: "fade-in" }
  },
  displayRules: {
    pages: { type: "all", pages: [] },
    userRoles: { type: "all", roles: [] },
    devices: { showOnMobile: true, showOnTablet: true, showOnDesktop: true }
  },
  version: 2,
  updatedAt: new Date()
};

// আপডেট করুন
await setDoc(doc(db, 'headerConfigs', 'default'), headerConfig);
console.log('✅ হেডার কনফিগ আপডেট হয়েছে!');
```

## অথবা সহজ উপায়:

আপনার প্রজেক্টে ইতিমধ্যে ডাইনামিক হেডার এবং ফুটার সেটআপ আছে। আপনি এখন:

### ১. অ্যাডমিন ড্যাশবোর্ডে লগইন করুন
- `/admin` পেজে যান

### ২. হেডার/ফুটার ম্যানেজমেন্ট সেকশনে যান
- সেখানে আপনি সরাসরি হেডার এবং ফুটারের মেনু, লোগো, স্টাইল এডিট করতে পারবেন

### ৩. নতুন মেনু আইটেম যোগ করুন
- "Community" এবং "Announcements" মেনু যোগ করুন
- URL এবং অর্ডার সেট করুন
- সেভ করুন

---

## বর্তমান স্থিতি:
✅ ডাইনামিক হেডার চালু আছে
✅ ডাইনামিক ফুটার চালু আছে
✅ Firestore থেকে কনফিগ লোড হচ্ছে
⚠️ Firestore-এ শুধু 3টি মেনু আইটেম আছে (4টি হওয়া উচিত)

## সমাধান:
যদি Firestore-এ কনফিগ না থাকে বা ভুল থাকে, তাহলে অ্যাপ্লিকেশন ডিফল্ট কনফিগ ব্যবহার করবে যেখানে সব মেনু লিংক আছে।
