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

  const { enrollmentId, status, adminId, rejectionReason } = req.body;

  if (!enrollmentId || !status || !adminId) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: enrollmentId, status, adminId"
    });
  }

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: "Invalid status. Must be APPROVED or REJECTED"
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

    const updateData = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      approvedBy: adminId
    };

    if (status === 'REJECTED' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    await enrollmentRef.update(updateData);

    return res.status(200).json({
      success: true,
      message: `Enrollment ${status.toLowerCase()} successfully`
    });

  } catch (error) {
    console.error("Error updating enrollment status:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
}
