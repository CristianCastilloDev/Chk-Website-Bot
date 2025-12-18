import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './Pricing.css';

const Pricing = () => {
    const navigate = useNavigate();
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Reset state on mount
        setLoading(true);
        setTeamMembers([]);
        loadTeamMembers();
    }, []);

    const loadTeamMembers = async () => {
        try {
            const usersRef = collection(db, 'users');
            const adminQuery = query(usersRef, where('role', 'in', ['admin', 'dev']));
            const usersSnapshot = await getDocs(adminQuery);

            const members = [];

            for (const userDoc of usersSnapshot.docs) {
                const userData = userDoc.data();

                const telegramQuery = query(
                    collection(db, 'telegram_users'),
                    where('firebaseUid', '==', userDoc.id)
                );
                const telegramSnapshot = await getDocs(telegramQuery);

                let telegramData = null;
                if (!telegramSnapshot.empty) {
                    telegramData = telegramSnapshot.docs[0].data();
                }

                members.push({
                    id: userDoc.id,
                    name: userData.name || userData.username,
                    role: userData.role === 'dev' ? 'Developer' : 'Administrator',
                    telegramUsername: telegramData?.username || null,
                    photoURL: userData.photoURL || null,
                    bio: userData.bio || 'Disponible para ayudarte con tus consultas.'
                });
            }

            setTeamMembers(members);
        } catch (error) {
            console.error('Error loading team members:', error);
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.12 }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 80 }
        }
    };

    const openTelegram = (username) => {
        if (!username) return;
        window.open(`https://t.me/${username}`, '_blank');
    };

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    if (loading) {
        return (
            <div className="pricing-wrapper">
                <div className="pricing-loading">
                    <Loader2 className="spinner" size={48} />
                    <p>Cargando equipo...</p>
                </div>
                <div className="pricing-background">
                    <div className="gradient-orb orb-1"></div>
                    <div className="gradient-orb orb-2"></div>
                    <div className="gradient-orb orb-3"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="pricing-wrapper">
            <div className="pricing-content-center">
                {/* Header */}
                <motion.div
                    className="pricing-header-modern"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <motion.div
                        className="header-icon-modern"
                        animate={{
                            rotate: [0, 5, -5, 0],
                            scale: [1, 1.05, 1]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatDelay: 2
                        }}
                    >
                        <Sparkles size={40} />
                    </motion.div>
                    <h1>Conoce Nuestro Equipo</h1>
                    <p>Contáctanos directamente por Telegram para adquirir créditos o planes personalizados</p>
                </motion.div>

                {/* Team Grid */}
                {teamMembers.length > 0 ? (
                    <motion.div
                        className="team-grid-center"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {teamMembers.map((member) => (
                            <motion.div
                                key={member.id}
                                className="team-member-modern"
                                variants={cardVariants}
                                whileHover={{ y: -5, scale: 1.02 }}
                            >
                                {/* Available Badge */}
                                <div className="available-badge">
                                    <span className="pulse-dot"></span>
                                    Disponible
                                </div>

                                {/* Avatar */}
                                <div className="avatar-modern">
                                    {member.photoURL ? (
                                        <img src={member.photoURL} alt={member.name} />
                                    ) : (
                                        <div className="avatar-initials">
                                            <span>{getInitials(member.name)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <h3 className="member-name-modern">{member.name}</h3>
                                <p className="member-role-modern">{member.role}</p>
                                <p className="member-bio-modern">{member.bio}</p>

                                {/* Telegram Button */}
                                {member.telegramUsername && (
                                    <motion.button
                                        className="telegram-button"
                                        onClick={() => openTelegram(member.telegramUsername)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Send size={16} />
                                        Contactar
                                    </motion.button>
                                )}
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="no-team">
                        <p>No hay administradores disponibles</p>
                    </div>
                )}

                {/* How it Works */}
                <motion.div
                    className="how-it-works"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    style={{ padding: 'var(--space-2xl)' }}
                >
                    <h2>¿Cómo funciona?</h2>
                    <div className="steps-grid">
                        <div className="step-card">
                            <div className="step-number">1</div>
                            <h4>Contacta</h4>
                            <p>Envía un mensaje a cualquiera de nuestros administradores</p>
                        </div>
                        <div className="step-card">
                            <div className="step-number">2</div>
                            <h4>Solicita</h4>
                            <p>Indica cuántos créditos o qué plan necesitas</p>
                        </div>
                        <div className="step-card">
                            <div className="step-number">3</div>
                            <h4>Recibe</h4>
                            <p>Tu cuenta será actualizada inmediatamente</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Background */}
            <div className="pricing-background">
                <div className="gradient-orb orb-1"></div>
                <div className="gradient-orb orb-2"></div>
                <div className="gradient-orb orb-3"></div>
            </div>
        </div>
    );
};

export default Pricing;
