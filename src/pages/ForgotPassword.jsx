import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Loader2, AtSign, MessageCircle, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, addDoc, query, where, getDocs, doc, onSnapshot } from 'firebase/firestore';
import './Auth.css';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Enter data, 2: Wait for confirmation
    const [username, setUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [resetId, setResetId] = useState(null);
    const navigate = useNavigate();

    // Listen for reset status changes
    useEffect(() => {
        if (!resetId) return;

        const unsubscribe = onSnapshot(doc(db, 'pending_password_resets', resetId), (doc) => {
            if (!doc.exists()) return;

            const data = doc.data();

            if (data.status === 'completed') {
                navigate('/', { 
                    state: { 
                        message: '¡Contraseña actualizada! Inicia sesión con tu nueva contraseña.' 
                    } 
                });
            } else if (data.status === 'cancelled') {
                setStep(1);
                setIsLoading(false);
                setResetId(null);
                setError('Cambio de contraseña cancelado desde Telegram');
            } else if (data.status === 'failed') {
                setStep(1);
                setIsLoading(false);
                setResetId(null);
                setError(data.error || 'Error al procesar el cambio de contraseña');
            } else if (data.status === 'expired') {
                setStep(1);
                setIsLoading(false);
                setResetId(null);
                setError('La solicitud ha expirado. Intenta de nuevo.');
            }
        });

        return () => unsubscribe();
    }, [resetId, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validations
        if (username.length < 3) {
            setError('El username debe tener al menos 3 caracteres');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (newPassword.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setIsLoading(true);

        try {
            // Find user by username
            const usersQuery = query(
                collection(db, 'users'),
                where('username', '==', username)
            );
            const usersSnapshot = await getDocs(usersQuery);

            if (usersSnapshot.empty) {
                setError('Usuario no encontrado');
                setIsLoading(false);
                return;
            }

            const userDoc = usersSnapshot.docs[0];

            // Find Telegram ID
            const telegramQuery = query(
                collection(db, 'telegram_users'),
                where('firebaseUid', '==', userDoc.id)
            );
            const telegramSnapshot = await getDocs(telegramQuery);

            if (telegramSnapshot.empty) {
                setError('Esta cuenta no tiene Telegram vinculado');
                setIsLoading(false);
                return;
            }

            const telegramData = telegramSnapshot.docs[0].data();

            // Create password reset request
            const docRef = await addDoc(collection(db, 'pending_password_resets'), {
                username: username,
                userId: userDoc.id,
                telegramId: telegramData.telegramId,
                newPassword: newPassword,
                status: 'pending',
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
            });

            setResetId(docRef.id);
            setStep(2);

        } catch (error) {
            console.error('Error requesting reset:', error);
            setError('Error al solicitar cambio: ' + error.message);
            setIsLoading(false);
        }
    };

    const cancelRequest = () => {
        setStep(1);
        setIsLoading(false);
        setResetId(null);
        setUsername('');
        setNewPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="auth-container">
            <div className="auth-background">
                <div className="gradient-orb orb-1"></div>
                <div className="gradient-orb orb-3"></div>
            </div>

            <motion.div
                className="auth-card glass"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="auth-header">
                    <KeyRound size={48} className="gradient-text" style={{ margin: '0 auto 1rem' }} />
                    <h1 className="gradient-text">Recuperar Contraseña</h1>
                    <p>
                        {step === 1 && 'Ingresa tu usuario y nueva contraseña'}
                        {step === 2 && 'Confirma el cambio en tu Telegram'}
                    </p>
                </div>

                {/* Step 1: Enter username and new password */}
                {step === 1 && (
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label>Nombre de Usuario</label>
                            <div className="input-wrapper">
                                <AtSign size={20} className="input-icon" />
                                <input
                                    type="text"
                                    placeholder="tu_usuario"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Nueva Contraseña</label>
                            <div className="input-wrapper">
                                <Lock size={20} className="input-icon" />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Confirmar Contraseña</label>
                            <div className="input-wrapper">
                                <Lock size={20} className="input-icon" />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                className="error-message"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                            >
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            className="auth-button"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="spinner" size={20} />
                            ) : (
                                <>
                                    Solicitar Cambio
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* Step 2: Wait for Telegram confirmation */}
                {step === 2 && (
                    <div className="auth-form">
                        <div style={{ 
                            background: 'rgba(99, 102, 241, 0.1)', 
                            padding: '1.5rem', 
                            borderRadius: '0.5rem',
                            textAlign: 'center'
                        }}>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                style={{ display: 'inline-block', marginBottom: '1rem' }}
                            >
                                <MessageCircle size={48} className="gradient-text" />
                            </motion.div>

                            <h3 style={{ marginBottom: '0.5rem' }}>📱 Confirma en tu Telegram</h3>
                            <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                Hemos enviado un mensaje a tu Telegram con botones de confirmación.
                            </p>
                            <p style={{ color: '#888', fontSize: '0.85rem' }}>
                                ⏰ La solicitud expira en 10 minutos
                            </p>
                        </div>

                        <button
                            onClick={cancelRequest}
                            className="auth-button"
                            style={{ 
                                marginTop: '1.5rem',
                                background: 'rgba(255,0,0,0.1)', 
                                border: '1px solid rgba(255,0,0,0.3)' 
                            }}
                        >
                            Cancelar
                        </button>
                    </div>
                )}

                <div className="auth-footer">
                    <p>
                        <button onClick={() => navigate('/')} className="text-link">
                            Volver al inicio de sesión
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
