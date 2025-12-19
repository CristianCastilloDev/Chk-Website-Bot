import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, ArrowRight, Loader2, AtSign, MessageCircle, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, addDoc, doc, onSnapshot, query, where, limit, getDocs } from 'firebase/firestore';
import './Auth.css';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [telegramId, setTelegramId] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [registrationId, setRegistrationId] = useState(null);
    const navigate = useNavigate();

    // Listen for registration status changes
    useEffect(() => {
        if (!registrationId) return;

        const unsubscribe = onSnapshot(doc(db, 'pending_registrations', registrationId), (doc) => {
            if (!doc.exists()) return;

            const data = doc.data();

            if (data.status === 'approved') {
                setShowConfirmModal(false);
                setIsLoading(false);
                navigate('/', {
                    state: {
                        message: '¡Cuenta creada exitosamente! Inicia sesión con tus credenciales.'
                    }
                });
            } else if (data.status === 'rejected') {
                setShowConfirmModal(false);
                setIsLoading(false);
                setError('Registro cancelado desde Telegram');
            } else if (data.status === 'failed') {
                setShowConfirmModal(false);
                setIsLoading(false);

                // Provide user-friendly error message
                let errorMsg = data.error || 'Error al procesar el registro';

                // If error is about not starting conversation with bot, add instructions
                if (errorMsg.includes('not started conversation') || errorMsg.includes('send /start') || errorMsg.includes('Could not send Telegram message')) {
                    errorMsg = '⚠️ PASO REQUERIDO: Debes iniciar conversación con el bot primero\n\n' +
                        '📱 Sigue estos pasos:\n\n' +
                        '1️⃣ Abre Telegram en tu teléfono\n' +
                        '2️⃣ Busca nuestro bot o usa este enlace:\n' +
                        '   👉 https://t.me/ContinentalCHKBot\n\n' +
                        '3️⃣ Presiona el botón "START" o envía el comando /start\n\n' +
                        '4️⃣ Espera el mensaje de bienvenida del bot\n\n' +
                        '5️⃣ Vuelve aquí y haz clic en "Crear Cuenta" nuevamente\n\n' +
                        '💡 Esto es necesario para que el bot pueda enviarte la confirmación de registro.';
                }

                setError(errorMsg);
            }
        });

        return () => unsubscribe();
    }, [registrationId, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validations
        if (username.length < 3 || username.length > 20) {
            setError('El username debe tener entre 3 y 20 caracteres');
            return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            setError('El username solo puede contener letras, números y guiones bajos');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (!telegramId || !/^\d+$/.test(telegramId)) {
            setError('Telegram ID inválido (solo números)');
            return;
        }

        setIsLoading(true);

        try {
            // Check if username already exists
            const usernameQuery = query(
                collection(db, 'users'),
                where('username', '==', username),
                limit(1)
            );
            const usernameSnapshot = await getDocs(usernameQuery);

            if (!usernameSnapshot.empty) {
                setError('❌ Este nombre de usuario ya está en uso. Por favor elige otro.');
                setIsLoading(false);
                return;
            }

            // Check if Telegram ID is already linked
            const telegramQuery = query(
                collection(db, 'telegram_users'),
                where('telegramId', '==', telegramId),
                limit(1)
            );
            const telegramSnapshot = await getDocs(telegramQuery);

            if (!telegramSnapshot.empty) {
                setError('❌ Este Telegram ID ya está vinculado a otra cuenta.');
                setIsLoading(false);
                return;
            }

            // Check if there's already a pending registration for this username or telegram ID
            const pendingUsernameQuery = query(
                collection(db, 'pending_registrations'),
                where('username', '==', username),
                where('status', '==', 'pending'),
                limit(1)
            );
            const pendingUsernameSnapshot = await getDocs(pendingUsernameQuery);

            if (!pendingUsernameSnapshot.empty) {
                setError('⚠️ Ya existe un registro pendiente para este usuario. Por favor espera a que se procese o cancélalo primero.');
                setIsLoading(false);
                return;
            }

            const pendingTelegramQuery = query(
                collection(db, 'pending_registrations'),
                where('telegramId', '==', telegramId),
                where('status', '==', 'pending'),
                limit(1)
            );
            const pendingTelegramSnapshot = await getDocs(pendingTelegramQuery);

            if (!pendingTelegramSnapshot.empty) {
                setError('⚠️ Ya existe un registro pendiente para este Telegram ID. Por favor espera a que se procese.');
                setIsLoading(false);
                return;
            }

            // Create pending registration
            const docRef = await addDoc(collection(db, 'pending_registrations'), {
                username: username,
                password: password, // Will be hashed by bot
                telegramId: telegramId,
                status: 'pending',
                messageSent: false, // Bot will set to true when message is sent
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
            });

            setRegistrationId(docRef.id);
            setShowConfirmModal(true);

        } catch (error) {
            console.error('Error creating registration:', error);
            setError('Error al crear el registro: ' + error.message);
            setIsLoading(false);
        }
    };

    const cancelRegistration = () => {
        setShowConfirmModal(false);
        setIsLoading(false);
        setRegistrationId(null);
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
                    <h1 className="gradient-text">Crear Cuenta</h1>
                    <p>Regístrate con tu Telegram para comenzar</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Usuario</label>
                        <div className="input-wrapper">
                            <AtSign size={20} className="input-icon" />
                            <input
                                type="text"
                                placeholder="tu_usuario"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                disabled={isLoading}
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Contraseña</label>
                        <div className="input-wrapper">
                            <Lock size={20} className="input-icon" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                autoComplete="new-password"
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
                                autoComplete="new-password"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Telegram ID</label>
                        <div className="input-wrapper">
                            <MessageCircle size={20} className="input-icon" />
                            <input
                                type="text"
                                placeholder="1234567890"
                                value={telegramId}
                                onChange={(e) => setTelegramId(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.5rem' }}>
                            💡 Obtén tu ID: Envía <code>/start</code> al bot de Telegram
                        </p>
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
                                Crear Cuenta
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>¿Ya tienes una cuenta? <button onClick={() => navigate('/')} className="text-link">Iniciar Sesión</button></p>
                </div>
            </motion.div>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {showConfirmModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={cancelRegistration}
                    >
                        <motion.div
                            className="modal-content glass"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                padding: '2rem',
                                borderRadius: '1rem',
                                maxWidth: '400px',
                                textAlign: 'center'
                            }}
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                style={{ display: 'inline-block', marginBottom: '1rem' }}
                            >
                                <MessageCircle size={64} className="gradient-text" />
                            </motion.div>

                            <h3 style={{ marginBottom: '1rem' }}>📱 Confirma en tu Telegram</h3>
                            <p style={{ color: '#888', marginBottom: '1.5rem' }}>
                                Hemos enviado un mensaje de confirmación a tu Telegram.
                                Por favor, confirma la creación de tu cuenta.
                            </p>

                            <div style={{
                                background: 'rgba(255,255,255,0.05)',
                                padding: '1rem',
                                borderRadius: '0.5rem',
                                marginBottom: '1.5rem'
                            }}>
                                <p style={{ fontSize: '0.9rem', color: '#aaa' }}>
                                    ⏰ La solicitud expira en 10 minutos
                                </p>
                            </div>

                            <button
                                onClick={cancelRegistration}
                                className="auth-button"
                                style={{ background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)' }}
                            >
                                Cancelar
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Register;
