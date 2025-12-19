import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ShoppingCart,
    CheckCircle,
    Users,
    CreditCard,
    DollarSign,
    TrendingUp,
    Heart,
    Shield,
    Activity
} from 'lucide-react';
import { Card, Title, BarChart, DonutChart, AreaChart } from '@tremor/react';
import DashboardLayout from '../components/DashboardLayout';
import MetricCard from '../components/MetricCard';
import DateRangePicker from '../components/DateRangePicker';
import { useAuth } from '../context/AuthContext';
import {
    getAnalyticsStats,
    getSalesDynamics,
    getUserActivity,
    getCustomerOrders
} from '../services/db';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import './Pages.css';

const Overview = () => {
    const { user } = useAuth();
    const [dateRange, setDateRange] = useState('all');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [salesData, setSalesData] = useState([]);
    const [activityData, setActivityData] = useState([]);
    const [ordersTable, setOrdersTable] = useState([]);
    const [clientStats, setClientStats] = useState(null);

    const isClient = user?.role === 'client';

    useEffect(() => {
        if (isClient) {
            loadClientStats();
        } else {
            loadAnalyticsData();
        }
    }, [dateRange, isClient]);

    const loadClientStats = async () => {
        try {
            setLoading(true);

            // Get total lives count
            const livesSnapshot = await getDocs(collection(db, 'lives'));
            const totalLives = livesSnapshot.size;

            // Get today's lives
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayTimestamp = Timestamp.fromDate(today);

            const todayLivesQuery = query(
                collection(db, 'lives'),
                where('createdAt', '>=', todayTimestamp)
            );
            const todayLivesSnapshot = await getDocs(todayLivesQuery);
            const todayLives = todayLivesSnapshot.size;

            // Get active users (users who logged in last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const sevenDaysTimestamp = Timestamp.fromDate(sevenDaysAgo);

            const activeUsersQuery = query(
                collection(db, 'users'),
                where('lastLogin', '>=', sevenDaysTimestamp)
            );
            const activeUsersSnapshot = await getDocs(activeUsersQuery);
            const activeUsers = activeUsersSnapshot.size;

            // Get user's plan info
            const userPlan = user?.plan || 'free';
            const userCredits = user?.credits || 0;

            setClientStats({
                totalLives,
                todayLives,
                activeUsers,
                userPlan,
                userCredits
            });
        } catch (error) {
            console.error('Error loading client stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAnalyticsData = async () => {
        try {
            setLoading(true);

            const [statsData, sales, activity, orders] = await Promise.all([
                getAnalyticsStats(dateRange),
                getSalesDynamics(dateRange),
                getUserActivity(dateRange),
                getCustomerOrders(10)
            ]);

            setStats(statsData);
            setSalesData(sales);
            setActivityData(activity);
            setOrdersTable(orders);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateRangeChange = (period, customRange) => {
        setDateRange(period);
    };

    if (loading) {
        return (
            <DashboardLayout currentPage="dashboard">
                <div className="page-header">
                    <h1>{isClient ? 'Dashboard' : 'Analytics'}</h1>
                    <p>Cargando datos...</p>
                </div>
            </DashboardLayout>
        );
    }

    // Client Dashboard View
    if (isClient && clientStats) {
        return (
            <DashboardLayout currentPage="dashboard">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Header */}
                    <div className="page-header" style={{
                        marginBottom: '2rem'
                    }}>
                        <h1>Dashboard</h1>
                        <p>Estadísticas generales del sistema</p>
                    </div>

                    {/* Client Stats Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '1.5rem',
                        marginBottom: '2rem'
                    }}>
                        <MetricCard
                            title="Lives Totales"
                            value={clientStats.totalLives.toLocaleString()}
                            icon={Heart}
                            trend="neutral"
                            color="#10b981"
                        />
                        <MetricCard
                            title="Lives de Hoy"
                            value={clientStats.todayLives.toLocaleString()}
                            icon={Activity}
                            trend="up"
                            color="#3b82f6"
                        />
                        <MetricCard
                            title="Usuarios Activos"
                            value={clientStats.activeUsers.toLocaleString()}
                            icon={Users}
                            trend="neutral"
                            color="#8b5cf6"
                        />
                        <MetricCard
                            title="Tus Créditos"
                            value={clientStats.userCredits.toLocaleString()}
                            icon={CreditCard}
                            trend="neutral"
                            color="#f59e0b"
                        />
                    </div>

                    {/* User Plan Info */}
                    <Card style={{ marginTop: '2rem' }}>
                        <Title>Tu Plan Actual</Title>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            marginTop: '1rem',
                            padding: '1rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: '8px'
                        }}>
                            <Shield size={32} color="#10b981" />
                            <div>
                                <h3 style={{ margin: 0, textTransform: 'capitalize' }}>
                                    {clientStats.userPlan}
                                </h3>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    {clientStats.userCredits} créditos disponibles
                                </p>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout currentPage="dashboard">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Header */}
                <div className="page-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div>
                        <h1>Analytics</h1>
                        <p>Dashboard de métricas y estadísticas</p>
                    </div>
                    <DateRangePicker
                        value={dateRange}
                        onChange={handleDateRangeChange}
                    />
                </div>

                {/* Metrics Grid - Top Row */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    <MetricCard
                        icon={ShoppingCart}
                        title="ÓRDENES"
                        value={stats?.orders.total || 0}
                        comparison={stats?.orders.comparison}
                        subtitle="Total de órdenes"
                        iconBg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    />

                    <MetricCard
                        icon={CheckCircle}
                        title="APROBADAS"
                        value={stats?.orders.approved || 0}
                        comparison={stats?.orders.comparison}
                        subtitle="Órdenes aprobadas"
                        iconBg="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                    />

                    <MetricCard
                        icon={Users}
                        title="USUARIOS"
                        value={stats?.users.active || 0}
                        subtitle="Usuarios activos"
                        iconBg="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                    />

                    <MetricCard
                        icon={CreditCard}
                        title="SUSCRIPCIONES"
                        value={stats?.subscriptions.total || 0}
                        subtitle="Total de suscripciones"
                        iconBg="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
                    />
                </div>

                {/* Metrics Grid - Second Row */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    <MetricCard
                        icon={DollarSign}
                        title="TOTAL DEL MES"
                        value={`$${stats?.revenue.total || 0}`}
                        comparison={stats?.revenue.comparison}
                        subtitle="Ingresos totales"
                        iconBg="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
                    />

                    <MetricCard
                        icon={TrendingUp}
                        title="INGRESOS"
                        value={`$${stats?.revenue.total || 0}`}
                        comparison={stats?.revenue.comparison}
                        subtitle="Comparado con mes anterior"
                        iconBg="linear-gradient(135deg, #30cfd0 0%, #330867 100%)"
                    />
                </div>

                {/* Charts Section */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    {/* Sales Dynamics */}
                    <Card className="animate-fade-in">
                        <Title>📊 Ventas Dinámicas</Title>
                        <BarChart
                            className="mt-6"
                            data={salesData}
                            index="month"
                            categories={["plans", "credits"]}
                            colors={["blue", "amber"]}
                            valueFormatter={(value) => `$${value}`}
                            stack={true}
                            yAxisWidth={48}
                        />
                    </Card>

                    {/* User Activity */}
                    <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        <Title>📈 Actividad de Usuarios</Title>
                        <AreaChart
                            className="mt-6"
                            data={activityData}
                            index="date"
                            categories={["count"]}
                            colors={["violet"]}
                            valueFormatter={(value) => `${value} acciones`}
                            yAxisWidth={48}
                        />
                    </Card>
                </div>

                {/* Customer Orders Table */}
                <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <Title>📋 Órdenes de Clientes</Title>
                    <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600 }}>Admin</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600 }}>Usuario</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600 }}>Fecha</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600 }}>Estado</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600 }}>Precio</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ordersTable.map((order, index) => (
                                    <tr
                                        key={order.id}
                                        style={{
                                            borderBottom: '1px solid var(--glass-border)',
                                            background: order.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' :
                                                order.status === 'pending' ? 'rgba(251, 191, 36, 0.1)' :
                                                    'rgba(239, 68, 68, 0.1)'
                                        }}
                                    >
                                        <td style={{ padding: '0.75rem' }}>{order.profile}</td>
                                        <td style={{ padding: '0.75rem' }}>{order.address}</td>
                                        <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{order.date}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: order.status === 'approved' ? '#10b981' :
                                                    order.status === 'pending' ? '#f59e0b' : '#ef4444',
                                                color: 'white'
                                            }}>
                                                {order.status === 'approved' ? 'Aprobado' :
                                                    order.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>{order.price}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </motion.div>
        </DashboardLayout>
    );
};

export default Overview;
