const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

/**
 * Cloud Function: Auto-delete pending registrations after processing
 * 
 * This function automatically deletes documents from the 'pending_registrations'
 * collection when their status changes to 'approved', 'rejected', or 'failed'.
 * 
 * This prevents storing sensitive data (passwords, telegram IDs) longer than necessary.
 * 
 * Trigger: Firestore document update in 'pending_registrations' collection
 */
exports.cleanupPendingRegistrations = functions.firestore
    .document('pending_registrations/{registrationId}')
    .onUpdate(async (change, context) => {
        const newData = change.after.data();
        const registrationId = context.params.registrationId;

        // Check if status has changed to a final state
        const finalStatuses = ['approved', 'rejected', 'failed'];

        if (finalStatuses.includes(newData.status)) {
            try {
                // Delete the document to remove sensitive data
                await change.after.ref.delete();

                console.log(`✅ Deleted pending registration: ${registrationId} (status: ${newData.status})`);

                return {
                    success: true,
                    message: `Registration ${registrationId} cleaned up successfully`
                };
            } catch (error) {
                console.error(`❌ Error deleting pending registration ${registrationId}:`, error);
                throw new functions.https.HttpsError('internal', 'Failed to cleanup registration');
            }
        }

        // If status is still 'pending', do nothing
        return null;
    });

/**
 * Cloud Function: Cleanup expired pending registrations
 * 
 * This function runs every hour and deletes any pending registrations
 * that have exceeded their expiration time (10 minutes by default).
 * 
 * This is a safety net in case registrations are abandoned.
 * 
 * Trigger: Scheduled (runs every hour)
 */
exports.cleanupExpiredRegistrations = functions.pubsub
    .schedule('every 1 hours')
    .onRun(async (context) => {
        const now = admin.firestore.Timestamp.now();

        try {
            // Query for expired registrations
            const expiredQuery = await db.collection('pending_registrations')
                .where('expiresAt', '<=', now.toDate())
                .get();

            if (expiredQuery.empty) {
                console.log('✅ No expired registrations to cleanup');
                return null;
            }

            // Delete all expired registrations in batch
            const batch = db.batch();
            let count = 0;

            expiredQuery.forEach((doc) => {
                batch.delete(doc.ref);
                count++;
            });

            await batch.commit();

            console.log(`✅ Cleaned up ${count} expired registration(s)`);

            return {
                success: true,
                deletedCount: count
            };
        } catch (error) {
            console.error('❌ Error cleaning up expired registrations:', error);
            throw new functions.https.HttpsError('internal', 'Failed to cleanup expired registrations');
        }
    });
