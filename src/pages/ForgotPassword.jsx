import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Loader2, AtSign, MessageCircle, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../services/firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import './Auth.css';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Enter username, 2: Enter code, 3: New password
    const [username, setUsername] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [resetId, setResetId] = useState(null);
    const [userId, setUserId] = useState(null);
    const navigate = useNavigate();

    const handleRequestReset = async (e) => {
        e.preventDefault();
        setError('');
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
            setUserId(userDoc.id);

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
                status: 'pending',
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
            });

            setResetId(docRef.id);
            setStep(2);
            setIsLoading(false);

        } catch (error) {
            console.error('Error requesting reset:', error);
            setError('Error al solicitar recuperación: ' + error.message);
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const resetQuery = query(
                collection(db, 'pending_password_resets'),
                where('__name__', '==', resetId)
            );
            const resetSnapshot = await getDocs(resetQuery);
            
            if (resetSnapshot.empty) {
                setError('Solicitud no encontrada');
                setIsLoading(false);
                return;
            }

            const resetData = resetSnapshot.docs[0].data();

            if (!resetData.verificationCode) {
                setError('Código aún no generado. Espera unos segundos.');
                setIsLoading(false);
                return;
            }

            if (resetData.verificationCode !== verificationCode) {
                setError('Código de verificación incorrecto');
                setIsLoading(false);
                return;
            }

            // Check if code expired
            const codeAge = Date.now() - resetData.codeGeneratedAt.toMillis();
            if (codeAge > 10 * 60 * 1000) {
                setError('El código ha expirado. Solicita uno nuevo.');
                setIsLoading(false);
                return;
            }

            setStep(3);
            setIsLoading(false);

        } catch (error) {
            console.error('Error verifying code:', error);
            setError('Error al verificar código: ' + error.message);
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');

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
            // Create password update request (bot will handle it)
            await addDoc(collection(db, 'pending_password_updates'), {
                userId: userId,
                newPassword: newPassword,
                resetId: resetId,
                createdAt: new Date()
            });

            // Navigate to login with success message
            navigate('/', { 
                state: { 
                    message: '¡Contraseña actualizada! Inicia sesión con tu nueva contraseña.' 
                } 
            });

        } catch (error) {
            console.error('Error resetting password:', error);
            setError('Error al actualizar contraseña: ' + error.message);
            setIsLoading(false);
        }
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
                        {step === 1 && 'Ingresa tu nombre de usuario'}
                        {step === 2 && 'Revisa tu Telegram'}
                        {step === 3 && 'Establece tu nueva contraseña'}
                    </p>
                </div>

                {/* Step 1: Enter Username */}
                {step === 1 && (
                    <form onSubmit={handleRequestReset} className="auth-form">
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
                                    Enviar Código
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* Step 2: Enter Verification Code */}
                {step === 2 && (
                    <form onSubmit={handleVerifyCode} className="auth-form">
                        <div style={{ 
                            background: 'rgba(99, 102, 241, 0.1)', 
                            padding: '1rem', 
                            borderRadius: '0.5rem',
                            marginBottom: '1rem',
                            textAlign: 'center'
                        }}>
                            <MessageCircle size={32} className="gradient-text" style={{ margin: '0 auto 0.5rem' }} />
                            <p style={{ fontSize: '0.9rem', color: '#aaa' }}>
                                Hemos enviado un código de 6 dígitos a tu Telegram
                            </p>
                        </div>

                        <div className="form-group">
                            <label>Código de Verificación</label>
                            <div className="input-wrapper">
                                <Lock size={20} className="input-icon" />
                                <input
                                    type="text"
                                    placeholder="123456"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    maxLength={6}
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
                                    Verificar Código
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* Step 3: Set New Password */}
                {step === 3 && (
                    <form onSubmit={handleResetPassword} className="auth-form">
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
                                    Actualizar Contraseña
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
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
