import { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { createUserDocument, getUserDocument, getUserByUsername, updateUserDocument } from '../services/db';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            console.log('🔐 Auth state changed:', firebaseUser ? 'User logged in' : 'No user');
            if (firebaseUser) {
                try {
                    console.log('📄 Fetching user document for:', firebaseUser.uid);
                    const userDoc = await getUserDocument(firebaseUser.uid);
                    console.log('✅ User document loaded:', userDoc);

                    // Update lastLogin timestamp
                    await updateUserDocument(firebaseUser.uid, {
                        lastLogin: new Date()
                    });
                    console.log('⏰ Updated lastLogin timestamp');

                    setUser(userDoc);

                    // Redirect to dashboard if on public pages
                    if (['/', '/register'].includes(location.pathname)) {
                        navigate('/dashboard');
                    }
                } catch (error) {
                    console.error('❌ Error fetching user document:', error);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const register = async (userData) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                userData.email,
                userData.password
            );

            const userDoc = await createUserDocument(userCredential.user.uid, {
                username: userData.username,
                name: userData.name,
                email: userData.email,
                role: userData.role || 'free',
                credits: 10
            });

            setUser(userDoc);
            navigate('/dashboard');
            return { success: true };
        } catch (error) {
            console.error('Registration error:', error);
            let errorMessage = 'Registration failed';
            if (error.code === 'auth/email-already-in-use') errorMessage = 'Email already in use';
            else if (error.code === 'auth/weak-password') errorMessage = 'Password should be at least 6 characters';
            else if (error.code === 'auth/invalid-email') errorMessage = 'Invalid email address';
            return { success: false, error: errorMessage };
        }
    };

    const login = async (username, password) => {
        try {
            // First, get user by username to find their email
            const userDoc = await getUserByUsername(username);
            if (!userDoc) {
                return { success: false, error: 'Usuario no encontrado' };
            }

            // Now login with email
            const userCredential = await signInWithEmailAndPassword(auth, userDoc.email, password);
            const fullUserDoc = await getUserDocument(userCredential.user.uid);
            setUser(fullUserDoc);
            navigate('/dashboard');
            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = 'Credenciales inválidas';
            if (error.code === 'auth/user-not-found') errorMessage = 'Usuario no encontrado';
            else if (error.code === 'auth/wrong-password') errorMessage = 'Contraseña incorrecta';
            else if (error.code === 'auth/too-many-requests') errorMessage = 'Demasiados intentos. Intenta más tarde';
            return { success: false, error: errorMessage };
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Role checking functions
    const isAdmin = () => user?.role === 'admin' || user?.role === 'dev';
    const isDev = () => user?.role === 'dev';
    const isFree = () => user?.role === 'free';
    const isPremium = () => user?.role === 'premium';
    const isPro = () => user?.role === 'pro';
    const isClient = () => ['free', 'premium', 'pro'].includes(user?.role);
    const hasRole = (role) => user?.role === role;

    // Permission checking
    const hasAdminAccess = () => user?.role === 'admin' || user?.role === 'dev';
    const canBypassCredits = () => user?.role === 'dev' || user?.role === 'admin';
    const hasPaidPlan = () => ['premium', 'pro'].includes(user?.role);

    // Role display name
    const getRoleDisplayName = (role) => {
        const roleNames = {
            free: 'Free',
            premium: 'Premium',
            pro: 'Pro',
            admin: 'Admin',
            dev: 'Developer'
        };
        return roleNames[role] || 'Unknown';
    };

    const value = {
        user,
        login,
        register,
        logout,
        loading,
        isAuthenticated: !!user,
        isAdmin,
        isDev,
        isFree,
        isPremium,
        isPro,
        isClient,
        hasRole,
        hasAdminAccess,
        canBypassCredits,
        hasPaidPlan,
        getRoleDisplayName
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '1.5rem',
                color: 'var(--primary)'
            }}>
                Loading...
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return children;
};

export const AdminRoute = ({ children }) => {
    const { isAuthenticated, hasAdminAccess, loading } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    if (loading) return <div>Loading...</div>;

    if (!isAuthenticated) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    if (!hasAdminAccess()) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                gap: '1rem'
            }}>
                <h2>⛔ Unauthorized Access</h2>
                <p>You don't have permission to access this page.</p>
                <button
                    onClick={() => navigate('/dashboard')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'var(--gradient-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer'
                    }}
                >
                    Go to Dashboard
                </button>
            </div>
        );
    }

    return children;
};
