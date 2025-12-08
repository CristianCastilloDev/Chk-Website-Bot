import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import Credits from '../components/Credits';
import { useAuth } from '../context/AuthContext';
import './Pages.css';

const Overview = () => {
    const { user, isAdmin } = useAuth();

    const stats = [
        {
            id: 1,
            label: 'Créditos Disponibles',
            value: user?.credits?.toLocaleString() || '0',
            icon: DollarSign,
            gradient: 'gradient-primary',
            change: '+12%'
        },
        {
            id: 2,
            label: 'Plan Actual',
            value: user?.plan?.type?.toUpperCase() || 'FREE',
            icon: Activity,
            gradient: 'gradient-accent',
            change: '+23%'
        },
        {
            id: 3,
            label: 'Rol',
            value: user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'User',
            icon: Users,
            gradient: 'gradient-warm',
            change: '+5%'
        },
        {
            id: 4,
            label: 'Estado',
            value: 'Activo',
            icon: TrendingUp,
            gradient: 'gradient-primary',
            change: '+8%'
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <DashboardLayout currentPage="overview">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="page-header">
                    <h1>Resumen</h1>
                    <p>Bienvenido! Aquí está lo que está sucediendo hoy.</p>
                </div>

                {/* Credits Widget for Clients */}
                {!isAdmin() && <Credits />}

                <motion.div
                    className="stats-grid"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {stats.map((stat) => (
                        <motion.div
                            key={stat.id}
                            className="stat-card glass"
                            variants={itemVariants}
                            whileHover={{ y: -5, boxShadow: 'var(--shadow-lg)' }}
                        >
                            <div className="stat-header">
                                <div className={`stat-icon ${stat.gradient}`}>
                                    <stat.icon size={24} />
                                </div>
                                <span className="stat-change success">{stat.change}</span>
                            </div>
                            <div className="stat-content">
                                <h3 className="stat-value">{stat.value}</h3>
                                <p className="stat-label">{stat.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                <motion.div
                    className="welcome-section glass"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="welcome-content">
                        <h2>🎉 Dashboard Listo con Firebase!</h2>
                        <p>
                            Tu dashboard ahora está impulsado por Firebase con sincronización de datos en tiempo real,
                            control de acceso basado en roles (Admin/Cliente), sistema de créditos y planes de suscripción.
                            {isAdmin() ? ' Como administrador, tienes acceso completo a la gestión de usuarios y análisis.' : ' Gestiona tus créditos y actualiza tu plan en cualquier momento!'}
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </DashboardLayout>
    );
};

export default Overview;
