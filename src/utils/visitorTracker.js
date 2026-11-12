import { doc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase.js';

/**
 * Returns today's date formatted as YYYY-MM-DD in Bangladesh Time (Asia/Dhaka).
 * E.g., '2026-11-13'
 */
export function getDhakaDateString(date = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch (err) {
    // Fallback if Intl or Asia/Dhaka is unavailable
    const d = new Date(date.getTime() + (6 * 60 + date.getTimezoneOffset()) * 60 * 1000);
    return d.toISOString().split('T')[0];
  }
}

/**
 * Ultra-lightweight, zero-lag daily visitor & page view tracker.
 *
 * Deduping Strategy:
 * - Checks localStorage('vip_visited_date') against Dhaka today's date.
 * - If not today: updates localStorage & sessionStorage, increments uniqueVisitors + pageViews on site_analytics/{todayStr}
 *   and totalVisitors + totalPageViews on site_analytics/lifetime.
 * - If already visited today: checks sessionStorage('vip_session_counted'). Only once per new browser tab session,
 *   increments pageViews on site_analytics/{todayStr} and totalPageViews on site_analytics/lifetime.
 * - No writes on route changes, protecting Firestore free tier quota.
 */
export async function trackDailyVisitor() {
  if (typeof window === 'undefined') return;

  try {
    const todayStr = getDhakaDateString();
    let storedDate = null;
    let sessionCounted = null;

    try {
      storedDate = localStorage.getItem('vip_visited_date');
      sessionCounted = sessionStorage.getItem('vip_session_counted');
    } catch (storageError) {
      // Storage access may be restricted in strict privacy / sandboxed modes
    }

    // 1. First visit of the day for this browser/device
    if (storedDate !== todayStr) {
      try {
        localStorage.setItem('vip_visited_date', todayStr);
        sessionStorage.setItem('vip_session_counted', '1');
      } catch (storageError) {
        // Continue silently
      }

      const todayDocRef = doc(db, 'site_analytics', todayStr);
      const lifetimeDocRef = doc(db, 'site_analytics', 'lifetime');

      await Promise.all([
        setDoc(
          todayDocRef,
          {
            uniqueVisitors: increment(1),
            pageViews: increment(1),
            date: todayStr,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ),
        setDoc(
          lifetimeDocRef,
          {
            totalVisitors: increment(1),
            totalPageViews: increment(1),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ),
      ]);
      return;
    }

    // 2. Already visited today, but new browser tab session
    if (!sessionCounted) {
      try {
        sessionStorage.setItem('vip_session_counted', '1');
      } catch (storageError) {
        // Continue silently
      }

      const todayDocRef = doc(db, 'site_analytics', todayStr);
      const lifetimeDocRef = doc(db, 'site_analytics', 'lifetime');

      await Promise.all([
        setDoc(
          todayDocRef,
          {
            pageViews: increment(1),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ),
        setDoc(
          lifetimeDocRef,
          {
            totalPageViews: increment(1),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ),
      ]);
    }
  } catch (err) {
    // Silent catch so network drops, ad-blockers or quota limits never throw console errors
  }
}

/**
 * Initializes tracking non-blockingly using requestIdleCallback or setTimeout
 * to ensure initial page render speed is never impacted.
 */
export function initVisitorTracker() {
  if (typeof window === 'undefined') return;

  const runTracking = () => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(
        () => {
          trackDailyVisitor().catch(() => {});
        },
        { timeout: 3000 }
      );
    } else {
      setTimeout(() => {
        trackDailyVisitor().catch(() => {});
      }, 1500);
    }
  };

  if (document.readyState === 'complete') {
    runTracking();
  } else {
    window.addEventListener('load', runTracking, { once: true });
  }
}

export default initVisitorTracker;
