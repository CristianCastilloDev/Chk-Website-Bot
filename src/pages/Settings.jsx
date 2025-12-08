import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, User, Mail, Lock, Bell } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { updateUserDocument } from '../services/db';
import './Pages.css';

const Settings = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        notifications: true
    });
    const [saved, setSaved] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Update user in database
        updateUserDocument(user.id, {
            name: formData.name,
            email: formData.email
        });

        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <DashboardLayout currentPage="settings">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="page-header">
                    <h1>Configuración</h1>
                    <p>Administra tus preferencias de cuenta</p>
                </div>

                <div className="settings-container">
                    <motion.div
                        className="settings-card glass"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h3>Información de Perfil</h3>
                        <form onSubmit={handleSubmit} className="settings-form">
                            <div className="form-group">
                                <label htmlFor="name">
                                    <User size={18} />
                                    Nombre Completo
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">
                                    <Mail size={18} />
                                    Correo Electronico
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>

                            <motion.button
                                type="submit"
                                className="btn-primary"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Save size={18} />
                                Guardar Cambios
                            </motion.button>

                            {saved && (
                                <motion.div
                                    className="success-message"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    ✓ Configuración guardada exitosamente!
                                </motion.div>
                            )}
                        </form>
                    </motion.div>

                    <motion.div
                        className="settings-card glass"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h3>Preferencias</h3>
                        <div className="settings-form">
                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="notifications"
                                        checked={formData.notifications}
                                        onChange={handleChange}
                                    />
                                    <div className="checkbox-content">
                                        <div className="checkbox-header">
                                            <Bell size={18} />
                                            <span>Notificaciones por Email</span>
                                        </div>
                                        <p className="checkbox-description">
                                            Recibe actualizaciones por email sobre tu actividad de cuenta
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="settings-card glass"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <h3>Seguridad</h3>
                        <div className="settings-form">
                            <div className="form-group">
                                <label htmlFor="current-password">
                                    <Lock size={18} />
                                    Contraseña Actual
                                </label>
                                <input
                                    id="current-password"
                                    type="password"
                                    placeholder="••••••••"
                                    disabled
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="new-password">
                                    <Lock size={18} />
                                    Contraseña Nueva
                                </label>
                                <input
                                    id="new-password"
                                    type="password"
                                    placeholder="••••••••"
                                    disabled
                                />
                            </div>

                            <p className="info-text">
                                Cambio de contraseña proximamente
                            </p>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </DashboardLayout>
    );
};

export default Settings;
