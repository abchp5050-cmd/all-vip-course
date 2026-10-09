// Firebase Cloud Messaging background message handler.
/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBcpwkIYw3EdSkcPlXwjNxIg0zYg_lsOf4",
  authDomain: "all-vip-2c6de.firebaseapp.com",
  projectId: "all-vip-2c6de",
  storageBucket: "all-vip-2c6de.firebasestorage.app",
  messagingSenderId: "449861479970",
  appId: "1:449861479970:web:167773229b6f2cfcb6247b",
  measurementId: "G-QQDGPW8SM2"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'All Vip Courses';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/placeholder-logo.png',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
