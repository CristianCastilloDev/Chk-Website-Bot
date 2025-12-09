import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Activity, Database, UserCheck, ShoppingCart } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats } from '../services/statistics';
import './Pages.css';

const Overview = () => {
    const { user, isAdmin } = useAuth();
    const [stats, setStats] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                console.log('📊 Fetching dashboard stats...', { isAdmin: isAdmin(), userId: user?.id });

                const data = await getDashboardStats(isAdmin(), user?.id);
                console.log('📊 Dashboard stats received:', data);

                if (isAdmin()) {
                    // Admin stats - Estadísticas del sistema completo
                    const adminStats = [
                        {
                            id: 1,
                            label: 'Usuarios Totales',
                            value: data.totalUsers?.toLocaleString() || '0',
                            icon: Users,
                            gradient: 'gradient-primary',
                            change: `${data.newUsers || 0} nuevos este mes`
                        },
                        {
                            id: 2,
                            label: 'Usuarios Activos',
                            value: data.activeUsers?.toLocaleString() || '0',
                            icon: UserCheck,
                            gradient: 'gradient-accent',
                            change: `${data.conversionRate || 0}% premium`
                        },
                        {
                            id: 3,
                            label: 'Lives Totales',
                            value: data.totalLives?.toLocaleString() || '0',
                            icon: Database,
                            gradient: 'gradient-warm',
                            change: `${data.availableLives || 0} disponibles`
                        },
                        {
                            id: 4,
                            label: 'Ventas del Mes',
                            value: data.salesCount?.toLocaleString() || '0',
                            icon: ShoppingCart,
                            gradient: 'gradient-primary',
                            change: `$${data.salesAmount?.toLocaleString() || 0}`
                        }
                    ];
                    console.log('✅ Setting admin stats:', adminStats);
                    setStats(adminStats);
                } else {
                    // Client stats
                    const remainingDays = user?.planExpiresAt
                        ? Math.max(0, Math.ceil((user.planExpiresAt.toDate() - new Date()) / (1000 * 60 * 60 * 24)))
                        : 0;

                    const clientStats = [
                        {
                            id: 1,
                            label: 'Lives Asignadas',
                            value: data.userLivesCount?.toLocaleString() || '0',
                            icon: Database,
                            gradient: 'gradient-primary',
                            change: 'Total disponibles'
                        },
                        {
                            id: 2,
                            label: 'Días Restantes',
                            value: remainingDays.toString(),
                            icon: Activity,
                            gradient: 'gradient-accent',
                            change: remainingDays > 0 ? 'Plan activo' : 'Sin plan'
                        },
                        {
                            id: 3,
                            label: 'Rol',
                            value: user?.role?.toUpperCase() || 'MIEMBRO',
                            icon: Users,
                            gradient: 'gradient-warm',
                            change: 'Tu nivel de acceso'
                        },
                        {
                            id: 4,
                            label: 'Estado',
                            value: 'Activo',
                            icon: TrendingUp,
                            gradient: 'gradient-primary',
                            change: 'Cuenta verificada'
                        }
                    ];
                    console.log('✅ Setting client stats:', clientStats);
                    setStats(clientStats);
                }
            } catch (error) {
                console.error('❌ Error fetching stats:', error);
            }
        };

        if (user) {
            fetchStats();
        }
    }, [user, isAdmin]);

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
                    <p>Bienvenido {user?.name}! Aquí está tu resumen.</p>
                </div>

                <motion.div
                    className="stats-grid"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {stats.length === 0 ? (
                        // Loading state
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-primary)' }}>
                            Cargando estadísticas...
                        </div>
                    ) : (
                        stats.map((stat) => (
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
                                    <span className="stat-change">{stat.change}</span>
                                </div>
                                <div className="stat-content">
                                    <h3 className="stat-value">{stat.value}</h3>
                                    <p className="stat-label">{stat.label}</p>
                                </div>
                            </motion.div>
                        ))
                    )}
                </motion.div>

                <motion.div
                    className="welcome-section glass"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="welcome-content">
                        <h2>🎉 Dashboard con Estadísticas en Tiempo Real!</h2>
                        <p>
                            {isAdmin()
                                ? 'Como administrador, puedes ver estadísticas completas del sistema: usuarios totales, activos, lives totales del sistema y ventas del mes. Todas las métricas se actualizan en tiempo real desde Firebase.'
                                : 'Tu dashboard personal muestra tus lives asignadas, días restantes de plan y estado de cuenta. Todas las métricas se actualizan en tiempo real.'}
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </DashboardLayout>
    );
};

export default Overview;
