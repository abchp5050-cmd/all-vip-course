import { initializeFirebaseAdmin, getFirestoreDb } from './firebase-admin-init.js';

const admin = initializeFirebaseAdmin();
const db = getFirestoreDb();

export default async function handler(req, res) {
  if (!db) {
    return res.status(503).json({
      success: false,
      error: "Firebase Admin SDK not configured. Please provide service account credentials."
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed"
    });
  }

  const { userId, courseId, enrollmentId } = req.body;

  if (!userId || !courseId || !enrollmentId) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: userId, courseId, enrollmentId"
    });
  }

  try {
    const enrollmentRef = db.collection('enrollments').doc(enrollmentId);
    const enrollmentDoc = await enrollmentRef.get();

    if (!enrollmentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Enrollment not found"
      });
    }

    const enrollment = enrollmentDoc.data();

    if (enrollment.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access"
      });
    }

    if (enrollment.status !== 'APPROVED') {
      return res.status(403).json({
        success: false,
        error: "Enrollment not approved yet"
      });
    }

    if (enrollment.courseId !== courseId) {
      return res.status(400).json({
        success: false,
        error: "Course ID mismatch"
      });
    }

    const courseDoc = await db.collection('courses').doc(courseId).get();
    
    if (!courseDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Course not found"
      });
    }

    const course = courseDoc.data();

    if (!course.telegramGroupLink) {
      return res.status(404).json({
        success: false,
        error: "Telegram group link not configured for this course"
      });
    }

    const telegramJoinedAt = enrollment.telegramJoinedAt;

    if (!telegramJoinedAt) {
      await enrollmentRef.update({
        telegramJoinedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return res.status(200).json({
      success: true,
      telegramLink: course.telegramGroupLink,
      alreadyJoined: !!telegramJoinedAt
    });

  } catch (error) {
    console.error("Error fetching Telegram link:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
}
