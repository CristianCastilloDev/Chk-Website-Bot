import {
    collection,
    getDocs,
    query,
    where,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// ========== STATISTICS FUNCTIONS ==========

/**
 * Get total count of users
 */
export const getUsersCount = async () => {
    try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        return snapshot.size;
    } catch (error) {
        console.error('Error getting users count:', error);
        return 0;
    }
};

/**
 * Get count of active users (logged in within last N days)
 */
export const getActiveUsersCount = async (days = 30) => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('lastLogin', '>=', cutoffTimestamp));
        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        console.error('Error getting active users count:', error);
        return 0;
    }
};

/**
 * Get total count of lives
 */
export const getLivesCount = async () => {
    try {
        const livesRef = collection(db, 'lives');
        const snapshot = await getDocs(livesRef);
        return snapshot.size;
    } catch (error) {
        console.error('Error getting lives count:', error);
        return 0;
    }
};

/**
 * Get count of available lives
 */
export const getAvailableLivesCount = async () => {
    try {
        const livesRef = collection(db, 'lives');
        const q = query(livesRef, where('status', '==', 'available'));
        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        console.error('Error getting available lives count:', error);
        return 0;
    }
};

/**
 * Get sales statistics for current month
 */
export const getMonthSales = async () => {
    try {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayTimestamp = Timestamp.fromDate(firstDay);

        const salesRef = collection(db, 'sales');
        const q = query(salesRef, where('timestamp', '>=', firstDayTimestamp));
        const snapshot = await getDocs(q);

        let total = 0;
        let amount = 0;

        snapshot.forEach((doc) => {
            total++;
            const data = doc.data();
            amount += data.amount || 0;
        });

        return { total, amount };
    } catch (error) {
        console.error('Error getting month sales:', error);
        return { total: 0, amount: 0 };
    }
};

/**
 * Get count of new users this month
 */
export const getNewUsersThisMonth = async () => {
    try {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayTimestamp = Timestamp.fromDate(firstDay);

        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('createdAt', '>=', firstDayTimestamp));
        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        console.error('Error getting new users count:', error);
        return 0;
    }
};

/**
 * Get count of premium users
 */
export const getPremiumUsersCount = async () => {
    try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);

        let premiumCount = 0;
        snapshot.forEach((doc) => {
            const data = doc.data();
            // Count users with non-free plan or active planExpiresAt
            if (data.plan && data.plan !== 'free') {
                premiumCount++;
            } else if (data.planExpiresAt) {
                const expiresAt = data.planExpiresAt.toDate();
                if (expiresAt > new Date()) {
                    premiumCount++;
                }
            }
        });

        return premiumCount;
    } catch (error) {
        console.error('Error getting premium users count:', error);
        return 0;
    }
};

/**
 * Get user's lives count
 */
export const getUserLivesCount = async (userId) => {
    try {
        const livesRef = collection(db, 'lives');
        const q = query(livesRef, where('userId', '==', userId));
        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        console.error('Error getting user lives count:', error);
        return 0;
    }
};

/**
 * Get comprehensive dashboard statistics
 */
export const getDashboardStats = async (isAdmin = false, userId = null) => {
    try {
        if (isAdmin) {
            // Admin statistics
            const [
                totalUsers,
                activeUsers,
                totalLives,
                availableLives,
                monthSales,
                newUsers,
                premiumUsers
            ] = await Promise.all([
                getUsersCount(),
                getActiveUsersCount(),
                getLivesCount(),
                getAvailableLivesCount(),
                getMonthSales(),
                getNewUsersThisMonth(),
                getPremiumUsersCount()
            ]);

            const conversionRate = totalUsers > 0
                ? ((premiumUsers / totalUsers) * 100).toFixed(1)
                : 0;

            return {
                totalUsers,
                activeUsers,
                totalLives,
                availableLives,
                salesCount: monthSales.total,
                salesAmount: monthSales.amount,
                newUsers,
                premiumUsers,
                conversionRate
            };
        } else if (userId) {
            // Client statistics
            const userLivesCount = await getUserLivesCount(userId);

            return {
                userLivesCount
            };
        }

        return {};
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        return {};
    }
};
