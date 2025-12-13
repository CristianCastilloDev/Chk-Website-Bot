import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, User, Lock, Bell, MessageSquare, Link as LinkIcon, Unlink, AtSign, Shield, Key, CheckCircle2, XCircle } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { 
    updateUserDocument, 
    linkTelegramAccount, 
    getTelegramLink, 
    unlinkTelegramAccount,
    updateUserAnnouncements,
    requestPasswordChange,
    confirmPasswordChange
} from '../services/db';
import './Pages.css';

const Settings = () => {
    const { user } = useAuth();
    const { showSuccess, showError, showInfo } = useToast();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        receiveAnnouncements: user?.receiveAnnouncements !== undefined ? user.receiveAnnouncements : true
    });
    const [telegramLink, setTelegramLink] = useState(null);
    const [telegramId, setTelegramId] = useState('');
    const [linkingTelegram, setLinkingTelegram] = useState(false);
    
    // Password change state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordStep, setPasswordStep] = useState('request'); // 'request' or 'confirm'
    const [passwordCode, setPasswordCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    // Load Telegram link status
    useEffect(() => {
        const loadTelegramLink = async () => {
            if (user?.id) {
                const link = await getTelegramLink(user.id);
                setTelegramLink(link);
            }
        };
        loadTelegramLink();
    }, [user]);

    // Update formData when user data changes
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                receiveAnnouncements: user.receiveAnnouncements !== undefined ? user.receiveAnnouncements : true
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Update name
            await updateUserDocument(user.id, {
                name: formData.name
            });

            // Update announcements preference
            await updateUserAnnouncements(user.id, formData.receiveAnnouncements);

            showSuccess('Configuración guardada exitosamente');
        } catch (error) {
            showError('Error al guardar: ' + error.message);
        }
    };

    const handleLinkTelegram = async (e) => {
        e.preventDefault();
        setLinkingTelegram(true);

        try {
            await linkTelegramAccount(user.id, telegramId);
            const link = await getTelegramLink(user.id);
            setTelegramLink(link);
            setTelegramId('');
            showSuccess('Telegram vinculado exitosamente');
        } catch (error) {
            showError(error.message);
        } finally {
            setLinkingTelegram(false);
        }
    };

    const handleUnlinkTelegram = async () => {
        if (!confirm('¿Estás seguro de desvincular tu cuenta de Telegram?')) return;

        try {
            await unlinkTelegramAccount(user.id);
            setTelegramLink(null);
            showSuccess('Telegram desvinculado exitosamente');
        } catch (error) {
            showError('Error al desvincular: ' + error.message);
        }
    };

    const handleRequestPasswordChange = async () => {
        setChangingPassword(true);
        try {
            const result = await requestPasswordChange(user.id);
            showInfo(result.message);
            setPasswordStep('confirm');
        } catch (error) {
            showError(error.message);
            setShowPasswordModal(false);
        } finally {
            setChangingPassword(false);
        }
    };

    const handleConfirmPasswordChange = async (e) => {
        e.preventDefault();
        
        if (newPassword !== confirmNewPassword) {
            showError('Las contraseñas no coinciden');
            return;
        }

        if (newPassword.length < 6) {
            showError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setChangingPassword(true);
        try {
            await confirmPasswordChange(user.id, passwordCode, newPassword);
            showSuccess('Contraseña actualizada exitosamente');
            setShowPasswordModal(false);
            setPasswordStep('request');
            setPasswordCode('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (error) {
            showError(error.message);
        } finally {
            setChangingPassword(false);
        }
    };

    return (
        <DashboardLayout currentPage="settings">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="settings-page-container"
            >
                <div className="page-header-minimal">
                    <h1>Configuración</h1>
                    <p>Administra tu perfil y preferencias</p>
                </div>

                <div className="settings-grid">
                    {/* Profile Information */}
                    <motion.div
                        className="settings-card-minimal glass"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="card-header-minimal">
                            <User size={20} />
                            <h3>Información del Perfil</h3>
                        </div>

                        <form onSubmit={handleSubmit} className="settings-form-minimal">
                            <div className="form-field-minimal">
                                <label>Nombre</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Tu nombre"
                                />
                            </div>

                            <div className="form-field-minimal">
                                <label>Usuario</label>
                                <div className="read-only-field">
                                    <AtSign size={16} />
                                    <span>{user?.username || user?.email}</span>
                                </div>
                            </div>

                            <button type="submit" className="btn-save-minimal">
                                <Save size={18} />
                                Guardar Cambios
                            </button>
                        </form>
                    </motion.div>

                    {/* Telegram Bot */}
                    <motion.div
                        className="settings-card-minimal glass"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="card-header-minimal">
                            <MessageSquare size={20} />
                            <h3>Telegram Bot</h3>
                        </div>

                        <div className="settings-form-minimal">
                            {!telegramLink ? (
                                <>
                                    <p className="helper-text">
                                        Vincula tu cuenta de Telegram para recibir notificaciones y usar el bot.
                                    </p>
                                    <form onSubmit={handleLinkTelegram}>
                                        <div className="form-field-minimal">
                                            <label>Telegram ID</label>
                                            <input
                                                type="text"
                                                value={telegramId}
                                                onChange={(e) => setTelegramId(e.target.value)}
                                                placeholder="123456789"
                                                required
                                            />
                                            <p className="field-hint">
                                                Abre Telegram, busca <strong>@ChkBot</strong> y envía <code>/start</code> para obtener tu ID
                                            </p>
                                        </div>
                                        <button 
                                            type="submit" 
                                            className="btn-save-minimal"
                                            disabled={linkingTelegram || !telegramId}
                                        >
                                            <LinkIcon size={18} />
                                            {linkingTelegram ? 'Vinculando...' : 'Vincular Telegram'}
                                        </button>
                                    </form>
                                </>
                            ) : (
                                <>
                                    <div className="telegram-linked">
                                        <CheckCircle2 size={20} className="success-icon" />
                                        <div>
                                            <p className="linked-status">Telegram Vinculado</p>
                                            <p className="linked-id">ID: {telegramLink.telegramId}</p>
                                            {telegramLink.username && (
                                                <p className="linked-username">@{telegramLink.username}</p>
                                            )}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleUnlinkTelegram}
                                        className="btn-danger-minimal"
                                    >
                                        <Unlink size={18} />
                                        Desvincular
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>

                    {/* Preferences */}
                    <motion.div
                        className="settings-card-minimal glass"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="card-header-minimal">
                            <Bell size={20} />
                            <h3>Preferencias</h3>
                        </div>

                        <div className="settings-form-minimal">
                            <label className="toggle-label">
                                <div className="toggle-content">
                                    <span className="toggle-title">Recibir Anuncios</span>
                                    <p className="toggle-description">
                                        Recibe notificaciones sobre nuevas funciones y actualizaciones
                                    </p>
                                </div>
                                <div className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        name="receiveAnnouncements"
                                        checked={formData.receiveAnnouncements}
                                        onChange={handleChange}
                                    />
                                    <span className="toggle-slider"></span>
                                </div>
                            </label>
                        </div>
                    </motion.div>

                    {/* Security */}
                    <motion.div
                        className="settings-card-minimal glass"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="card-header-minimal">
                            <Shield size={20} />
                            <h3>Seguridad</h3>
                        </div>

                        <div className="settings-form-minimal">
                            <p className="helper-text">
                                Cambia tu contraseña de forma segura con confirmación vía Telegram
                            </p>
                            <button 
                                onClick={() => setShowPasswordModal(true)}
                                className="btn-save-minimal"
                                disabled={!telegramLink}
                            >
                                <Key size={18} />
                                Cambiar Contraseña
                            </button>
                            {!telegramLink && (
                                <p className="field-hint error">
                                    Debes vincular Telegram para cambiar tu contraseña
                                </p>
                            )}
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Password Change Modal */}
            <AnimatePresence>
                {showPasswordModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowPasswordModal(false)}
                    >
                        <motion.div
                            className="modal-content glass"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h2>Cambiar Contraseña</h2>
                                <button 
                                    className="modal-close"
                                    onClick={() => setShowPasswordModal(false)}
                                >
                                    <XCircle size={24} />
                                </button>
                            </div>

                            {passwordStep === 'request' ? (
                                <div className="modal-body">
                                    <p className="modal-description">
                                        Se enviará un código de confirmación a tu cuenta de Telegram vinculada.
                                    </p>
                                    <button 
                                        onClick={handleRequestPasswordChange}
                                        className="btn-save-minimal"
                                        disabled={changingPassword}
                                    >
                                        <MessageSquare size={18} />
                                        {changingPassword ? 'Enviando...' : 'Enviar Código'}
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleConfirmPasswordChange} className="modal-body">
                                    <div className="form-field-minimal">
                                        <label>Código de Confirmación</label>
                                        <input
                                            type="text"
                                            value={passwordCode}
                                            onChange={(e) => setPasswordCode(e.target.value)}
                                            placeholder="123456"
                                            required
                                            maxLength={6}
                                        />
                                        <p className="field-hint">
                                            Revisa tu Telegram para obtener el código
                                        </p>
                                    </div>

                                    <div className="form-field-minimal">
                                        <label>Nueva Contraseña</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                        />
                                    </div>

                                    <div className="form-field-minimal">
                                        <label>Confirmar Contraseña</label>
                                        <input
                                            type="password"
                                            value={confirmNewPassword}
                                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                        />
                                    </div>

                                    <button 
                                        type="submit"
                                        className="btn-save-minimal"
                                        disabled={changingPassword}
                                    >
                                        <Lock size={18} />
                                        {changingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

export default Settings;
