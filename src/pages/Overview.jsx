import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp, Users, Activity, Database, UserCheck, ShoppingCart,
    CheckCircle, CreditCard, DollarSign, FileText, Wallet, RefreshCw, ArrowRight
} from 'lucide-react';
import { Card, Title, BarChart, DonutChart, AreaChart } from '@tremor/react';
import DashboardLayout from '../components/DashboardLayout';
import MetricCard from '../components/MetricCard';
import DateRangePicker from '../components/DateRangePicker';
import CircularProgress from '../components/CircularProgress';
import SkeletonLoader from '../components/SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../services/statistics';
import {
    getAnalyticsStats,
    getSalesDynamics,
    getUserActivity,
    getCustomerOrders
} from '../services/db';
import UserAvatar from '../components/UserAvatar';
import CategoryCard from '../components/CategoryCard';
import RecentItem from '../components/RecentItem';
import './Pages.css';
import './Overview.css';

const Overview = () => {
    const { user, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState([]);

    // Analytics states (for admin/dev)
    const [dateRange, setDateRange] = useState('all');
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [analyticsStats, setAnalyticsStats] = useState(null);
    const [salesData, setSalesData] = useState([]);
    const [activityData, setActivityData] = useState([]);
    const [ordersTable, setOrdersTable] = useState([]);
    const [tableLoading, setTableLoading] = useState(false);

    // Load basic stats for all users
    useEffect(() => {
        const fetchStats = async () => {
            try {
                // console.log('📊 Fetching dashboard stats...', { isAdmin: isAdmin(), userId: user?.id });

                const data = await getDashboardStats(isAdmin(), user?.id);
                // console.log('📊 Dashboard stats received:', data);

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
                    // console.log('✅ Setting admin stats:', adminStats);
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
                    // console.log('✅ Setting client stats:', clientStats);
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

    // Load analytics data for admin/dev
    useEffect(() => {
        if (isAdmin() && user) {
            loadAnalyticsData();
        }
    }, [dateRange, user, isAdmin]);

    const loadAnalyticsData = async () => {
        try {
            setAnalyticsLoading(true);

            const [statsData, sales, activity, orders] = await Promise.all([
                getAnalyticsStats(dateRange),
                getSalesDynamics(dateRange),
                getUserActivity(dateRange),
                getCustomerOrders(5) // Limit to 5 orders for overview
            ]);

            setAnalyticsStats(statsData);
            setSalesData(sales);
            setActivityData(activity);
            setOrdersTable(orders);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    // Función separada para refrescar solo la tabla
    const refreshTable = async () => {
        if (!isAdmin()) return;

        try {
            setTableLoading(true);
            // console.log('🔄 Refreshing orders table...');

            // Delay de 2 segundos para mostrar la animación del skeleton
            await new Promise(resolve => setTimeout(resolve, 2000));

            const orders = await getCustomerOrders(5);
            setOrdersTable(orders);

            // console.log('✅ Orders table refreshed');
        } catch (error) {
            console.error('❌ Error refreshing table:', error);
        } finally {
            setTableLoading(false);
        }
    };

    const handleDateRangeChange = (period, customRange) => {
        setDateRange(period);
    };

    // Preparar datos para gráficos
    const usersChartData = analyticsStats ? [
        { name: 'Nuevos', value: analyticsStats.users.new, color: '#10b981' },
        { name: 'Activos', value: analyticsStats.users.active, color: '#06b6d4' },
        { name: 'Inactivos', value: analyticsStats.users.inactive, color: '#6b7280' }
    ] : [];

    const subsChartData = analyticsStats ? [
        { name: 'Planes', value: analyticsStats.subscriptions.plans, color: '#8b5cf6' },
        { name: 'Créditos', value: analyticsStats.subscriptions.credits, color: '#f59e0b' }
    ] : [];

    const approvedOrdersPercent = analyticsStats ? (analyticsStats.orders.approved / analyticsStats.orders.total * 100) || 0 : 0;
    const fundsCollectedPercent = analyticsStats ? Math.min((analyticsStats.revenue.total / 10000) * 100, 100) : 0;

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

    // Render for regular users (non-admin) - Mobile File Manager Design
    if (!isAdmin()) {
        // Prepare categories data
        const remainingDays = user?.planExpiresAt
            ? Math.max(0, Math.ceil((user.planExpiresAt.toDate() - new Date()) / (1000 * 60 * 60 * 24)))
            : 0;

        const categories = [
            {
                id: 1,
                name: 'My Lives',
                icon: Database,
                iconColor: '#5B9FED', // Blue
                count: stats.find(s => s.label === 'Lives Asignadas')?.value || '0',
                size: 'Available',
                link: '/gates/my-lives'
            },
            {
                id: 2,
                name: 'Gates',
                icon: Activity,
                iconColor: '#F59E0B', // Orange
                count: '5',
                size: 'Active',
                link: '/dashboard/gates'
            },
            {
                id: 3,
                name: 'Tools',
                icon: FileText,
                iconColor: '#06B6D4', // Cyan
                count: '3',
                size: 'Available',
                link: '/dashboard/herramientas'
            },
            {
                id: 4,
                name: 'Settings',
                icon: Users,
                iconColor: '#EC4899', // Pink
                count: '1',
                size: user?.role?.toUpperCase() || 'MEMBER',
                link: '/dashboard/settings'
            }
        ];

        // Recent activity items
        const recentItems = [
            {
                id: 1,
                name: 'Stripe Gate',
                date: '01-03-2021',
                size: 'Live',
                icon: CheckCircle,
                iconColor: '#10b981'
            },
            {
                id: 2,
                name: 'PayPal Gate',
                date: '27-02-2021',
                size: 'Live',
                icon: CheckCircle,
                iconColor: '#10b981'
            },
            {
                id: 3,
                name: `Plan: ${remainingDays} days`,
                date: '23-02-2021',
                size: remainingDays > 0 ? 'Active' : 'Expired',
                icon: CreditCard,
                iconColor: remainingDays > 0 ? '#5B9FED' : '#ef4444'
            }
        ];

        return (
            <DashboardLayout currentPage="overview">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Search Bar */}
                    <div className="dashboard-search-container">
                        <div className="dashboard-search-bar">
                            <div className="dashboard-search-icon">
                                <TrendingUp size={24} />
                            </div>
                            <input
                                type="text"
                                className="dashboard-search-input"
                                placeholder="Search"
                            />
                        </div>
                    </div>

                    {/* My Files Section */}
                    <div className="dashboard-section-header">
                        <h2 className="dashboard-section-title">My Files</h2>
                        <button className="dashboard-add-button">
                            <span>+</span>
                            <span>Add New</span>
                        </button>
                    </div>

                    {/* Category Grid */}
                    <div className="category-grid">
                        {categories.map((category) => (
                            <CategoryCard
                                key={category.id}
                                name={category.name}
                                icon={category.icon}
                                iconColor={category.iconColor}
                                count={category.count}
                                size={category.size}
                                onClick={() => navigate(category.link)}
                            />
                        ))}
                    </div>

                    {/* Recent Files Section */}
                    <div className="recent-section">
                        <h2 className="recent-header">Recent Files</h2>
                        <div className="recent-list">
                            {recentItems.map((item) => (
                                <RecentItem
                                    key={item.id}
                                    name={item.name}
                                    date={item.date}
                                    size={item.size}
                                    icon={item.icon}
                                    iconColor={item.iconColor}
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>
            </DashboardLayout>
        );
    }

    // Render for admin/dev - Mobile File Manager Design
    // Prepare admin categories
    const adminCategories = [
        {
            id: 1,
            name: 'Órdenes',
            icon: ShoppingCart,
            iconColor: '#5B9FED', // Blue
            count: analyticsStats?.orders.total || '0',
            size: `${analyticsStats?.orders.approved || 0} Approved`,
            link: '/dashboard/orders'
        },
        {
            id: 2,
            name: 'Usuarios',
            icon: Users,
            iconColor: '#F59E0B', // Orange
            count: analyticsStats?.users.total || '0',
            size: `${analyticsStats?.users.active || 0} Active`,
            link: '/dashboard/users'
        },
        {
            id: 3,
            name: 'Lives Totales',
            icon: Database,
            iconColor: '#06B6D4', // Cyan
            count: analyticsStats?.lives.total?.toLocaleString() || '0',
            size: `${analyticsStats?.lives.available || 0} Available`,
            link: '/admin/lives'
        },
        {
            id: 4,
            name: 'Ventas',
            icon: DollarSign,
            iconColor: '#EC4899', // Pink
            count: analyticsStats?.subscriptions.total || '0',
            size: `$${analyticsStats?.revenue.total || 0}`,
            link: '/dashboard/sales'
        },
        {
            id: 5,
            name: 'Suscripciones',
            icon: CreditCard,
            iconColor: '#8b5cf6', // Purple
            count: analyticsStats?.subscriptions.total || '0',
            size: `${analyticsStats?.subscriptions.plans || 0} Plans`,
            link: '/dashboard/sales'
        },
        {
            id: 6,
            name: 'Gates',
            icon: Activity,
            iconColor: '#10b981', // Green
            count: '5',
            size: 'Active',
            link: '/admin/gate-status'
        }
    ];

    // Recent admin activity
    const recentAdminItems = ordersTable.slice(0, 5).map((order, index) => ({
        id: index + 1,
        name: `${order.profile} → ${order.address}`,
        date: new Date().toLocaleDateString('es-ES'),
        size: order.status === 'approved' ? 'Approved' : order.status === 'pending' ? 'Pending' : 'Rejected',
        icon: order.status === 'approved' ? CheckCircle : order.status === 'pending' ? RefreshCw : Activity,
        iconColor: order.status === 'approved' ? '#10b981' : order.status === 'pending' ? '#f59e0b' : '#ef4444'
    }));

    return (
        <DashboardLayout currentPage="overview">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Search Bar */}
                <div className="dashboard-search-container">
                    <div className="dashboard-search-bar">
                        <div className="dashboard-search-icon">
                            <TrendingUp size={24} />
                        </div>
                        <input
                            type="text"
                            className="dashboard-search-input"
                            placeholder="Search analytics, users, orders..."
                        />
                        <DateRangePicker
                            value={dateRange}
                            onChange={handleDateRangeChange}
                        />
                    </div>
                </div>

                {analyticsLoading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-primary)' }}>
                        Cargando analytics...
                    </div>
                ) : (
                    <>
                        {/* Admin Files Section */}
                        <div className="dashboard-section-header">
                            <h2 className="dashboard-section-title">Analytics Dashboard</h2>
                            <button
                                className="dashboard-add-button"
                                onClick={() => navigate('/dashboard/analytics')}
                            >
                                <span>📊</span>
                                <span>View Full Analytics</span>
                            </button>
                        </div>

                        {/* Category Grid */}
                        <div className="category-grid">
                            {adminCategories.map((category) => (
                                <CategoryCard
                                    key={category.id}
                                    name={category.name}
                                    icon={category.icon}
                                    iconColor={category.iconColor}
                                    count={category.count}
                                    size={category.size}
                                    onClick={() => navigate(category.link)}
                                />
                            ))}
                        </div>

                        {/* Recent Orders Section */}
                        <div className="recent-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 className="recent-header">Recent Orders</h2>
                                <button
                                    onClick={refreshTable}
                                    disabled={tableLoading}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.5rem 1rem',
                                        background: 'var(--primary)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        cursor: tableLoading ? 'not-allowed' : 'pointer',
                                        opacity: tableLoading ? 0.6 : 1,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <RefreshCw size={14} style={{ animation: tableLoading ? 'spin 1s linear infinite' : 'none' }} />
                                    {tableLoading ? 'Loading...' : 'Refresh'}
                                </button>
                            </div>

                            {tableLoading ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                    Loading orders...
                                </div>
                            ) : recentAdminItems.length > 0 ? (
                                <div className="recent-list">
                                    {recentAdminItems.map((item) => (
                                        <RecentItem
                                            key={item.id}
                                            name={item.name}
                                            date={item.date}
                                            size={item.size}
                                            icon={item.icon}
                                            iconColor={item.iconColor}
                                            onClick={() => navigate('/dashboard/orders')}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '3rem',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-card)',
                                    color: 'var(--text-secondary)'
                                }}>
                                    No recent orders
                                </div>
                            )}
                        </div>

                        {/* Quick Stats - Simplified */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '1.5rem',
                            marginTop: '2rem'
                        }}>
                            <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-card)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        background: '#10b981',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <CheckCircle size={24} color="white" />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Órdenes Aprobadas</h3>
                                        <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                            {approvedOrdersPercent.toFixed(0)}%
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-card)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        background: '#5B9FED',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Wallet size={24} color="white" />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Revenue</h3>
                                        <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                            ${analyticsStats?.revenue.total || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </motion.div>
        </DashboardLayout>
    );
};

export default Overview;
