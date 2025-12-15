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
import './Pages.css';

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
            console.log('🔄 Refreshing orders table...');
            
            // Delay de 2 segundos para mostrar la animación del skeleton
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const orders = await getCustomerOrders(5);
            setOrdersTable(orders);
            
            console.log('✅ Orders table refreshed');
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

    // Render for regular users (non-admin)
    if (!isAdmin()) {
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
                            <h2>🎉 Dashboard Personal</h2>
                            <p>
                                Tu dashboard personal muestra tus lives asignadas, días restantes de plan y estado de cuenta. 
                                Todas las métricas se actualizan en tiempo real.
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            </DashboardLayout>
        );
    }

    // Render for admin/dev - Full Analytics Dashboard
    return (
        <DashboardLayout currentPage="overview">
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
                        <h1>Analytics Dashboard</h1>
                        <p>Métricas y estadísticas del sistema</p>
                    </div>
                    <DateRangePicker 
                        value={dateRange}
                        onChange={handleDateRangeChange}
                    />
                </div>

                {analyticsLoading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <p>Cargando analytics...</p>
                    </div>
                ) : (
                    <>
                        {/* Metrics Grid - Top Row */}
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '1.5rem',
                            marginBottom: '2rem'
                        }}>
                            <MetricCard
                                icon={<ShoppingCart />}
                                title="Órdenes"
                                value={analyticsStats?.orders.total || 0}
                                comparison={analyticsStats?.orders.comparison}
                                subtitle="Total de órdenes"
                            />
                            
                            <MetricCard
                                icon={<CheckCircle />}
                                title="Aprobadas"
                                value={analyticsStats?.orders.approved || 0}
                                subtitle="Órdenes aprobadas"
                            />
                            
                            <MetricCard
                                icon={<Users />}
                                title="Usuarios"
                                value={analyticsStats?.users.total || 0}
                                subtitle="Usuarios activos"
                                chart={
                                    <DonutChart
                                        data={usersChartData}
                                        category="value"
                                        index="name"
                                        colors={['emerald', 'cyan', 'gray']}
                                        showLabel={false}
                                        className="h-24"
                                    />
                                }
                            />
                            
                            <MetricCard
                                icon={<CreditCard />}
                                title="Suscripciones"
                                value={analyticsStats?.subscriptions.total || 0}
                                subtitle="Total de suscripciones"
                                chart={
                                    <DonutChart
                                        data={subsChartData}
                                        category="value"
                                        index="name"
                                        colors={['violet', 'amber']}
                                        showLabel={false}
                                        className="h-24"
                                    />
                                }
                            />
                            
                            <MetricCard
                                icon={<Database />}
                                title="Lives Totales"
                                value={analyticsStats?.lives.total?.toLocaleString() || '0'}
                                subtitle={`${analyticsStats?.lives.available || 0} disponibles`}
                            />
                        </div>

                        {/* Metrics Grid - Second Row */}
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '1.5rem',
                            marginBottom: '2rem'
                        }}>
                            <MetricCard
                                icon={<DollarSign />}
                                title="Total del Mes"
                                value={`$${analyticsStats?.revenue.total || 0}`}
                                comparison={analyticsStats?.revenue.comparison}
                                subtitle="Ingresos totales"
                            />
                            
                            <MetricCard
                                icon={<TrendingUp />}
                                title="Ingresos"
                                value={`$${analyticsStats?.revenue.total || 0}`}
                                comparison={analyticsStats?.revenue.comparison}
                                subtitle="Comparado con mes anterior"
                            />
                        </div>

                        {/* Charts Section */}
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
                            gap: '1.5rem',
                            marginBottom: '2rem'
                        }}>
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

                            <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                                <Title>📈 Actividad de Usuarios</Title>
                                <AreaChart
                                    className="mt-6"
                                    data={activityData}
                                    index="date"
                                    categories={["count"]}
                                    colors={["violet"]}
                                    valueFormatter={(value) => `${value} Acciones`}
                                    yAxisWidth={48}
                                />
                            </Card>
                        </div>

                        {/* Progress Cards + Customer Orders Table - 3 Column Grid */}
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '1.5rem',
                            marginBottom: '2rem'
                        }}>
                            {/* Órdenes Aprobadas */}
                            <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <FileText size={20} />
                                    <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>Órdenes Aprobadas</h3>
                                </div>
                                <CircularProgress 
                                    value={approvedOrdersPercent}
                                    size={120}
                                    color="success"
                                />
                                <p style={{ marginTop: '1rem', fontSize: '1.5rem', fontWeight: 700 }}>
                                    ${(analyticsStats?.revenue.total * 0.7).toFixed(2)}
                                </p>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Año Fiscal Actual</p>
                            </div>

                            {/* Fondos Recaudados */}
                            <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <Wallet size={20} />
                                    <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>Fondos Recaudados</h3>
                                </div>
                                <CircularProgress 
                                    value={fundsCollectedPercent}
                                    size={120}
                                    color="primary"
                                />
                                <p style={{ marginTop: '1rem', fontSize: '1.5rem', fontWeight: 700 }}>
                                    ${analyticsStats?.revenue.total || 0}
                                </p>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Año Fiscal Actual</p>
                            </div>

                            {/* Customer Orders Table */}
                            <Card className="animate-fade-in" style={{ animationDelay: '0.2s', padding: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem'}}>
                                    <Title style={{ fontSize: '0.875rem', margin: 0 }}>📋 Órdenes de Clientes</Title>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        {/* View All Orders Button */}
                                        <button
                                            onClick={() => navigate('/dashboard/orders')}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.35rem',
                                                padding: '0.35rem 0.75rem',
                                                background: 'var(--primary)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.transform = 'translateY(-1px)';
                                                e.target.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.3)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.transform = 'translateY(0)';
                                                e.target.style.boxShadow = 'none';
                                            }}
                                        >
                                            Ver todas
                                            <ArrowRight size={12} />
                                        </button>
                                        
                                        {/* Refresh Button - Icon Only */}
                                        <button
                                            onClick={refreshTable}
                                            disabled={tableLoading}
                                            title={tableLoading ? 'Cargando...' : 'Refrescar'}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '0.35rem',
                                                background: 'transparent',
                                                border: 'none',
                                                borderRadius: '6px',
                                                color: 'var(--text-primary)',
                                                cursor: tableLoading ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.2s',
                                                opacity: tableLoading ? 0.6 : 1
                                            }}
                                            onMouseEnter={(e) => !tableLoading && (e.target.style.background = 'var(--glass-border)')}
                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                        >
                                            <RefreshCw size={14} style={{ animation: tableLoading ? 'spin 1s linear infinite' : 'none' }} />
                                        </button>
                                    </div>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                {tableLoading ? (
                                    // Skeleton Loader - Same structure as real table
                                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ padding: '0.5rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Admin</th>
                                                <th style={{ padding: '0.5rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Usuario</th>
                                                <th style={{ padding: '0.5rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[...Array(5)].map((_, index) => (
                                                <tr 
                                                    key={index}
                                                    style={{ 
                                                        background: 'rgba(128, 128, 128, 0.1)',
                                                        borderRadius: '12px'
                                                    }}
                                                >
                                                    <td style={{ padding: '0.5rem', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <div className="skeleton-text" style={{ width: '28px', height: '28px', borderRadius: '50%' }}></div>
                                                            <div className="skeleton-text" style={{ width: '60%', height: '14px' }}></div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '0.5rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <div className="skeleton-text" style={{ width: '28px', height: '28px', borderRadius: '50%' }}></div>
                                                            <div className="skeleton-text" style={{ width: '50%', height: '14px' }}></div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '0.5rem', borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}>
                                                        <div className="skeleton-text" style={{ width: '70px', height: '22px', borderRadius: '12px' }}></div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ padding: '0.5rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Admin</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Usuario</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ordersTable.map((order, index) => (
                                            <tr 
                                                key={order.id}
                                                style={{ 
                                                    background: order.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' :
                                                               order.status === 'pending' ? 'rgba(251, 191, 36, 0.1)' :
                                                               'rgba(239, 68, 68, 0.1)',
                                                    borderRadius: '12px',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                            >
                                                <td style={{ padding: '0.5rem', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px', fontSize: '0.875rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <div style={{
                                                            width: '28px',
                                                            height: '28px',
                                                            borderRadius: '50%',
                                                            background: order.profilePhoto ? `url(${order.profilePhoto})` : '#6366f1',
                                                            backgroundSize: 'cover',
                                                            backgroundPosition: 'center',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'white',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            flexShrink: 0
                                                        }}>
                                                            {!order.profilePhoto && (order.profile?.charAt(0) || 'A')}
                                                        </div>
                                                        <span>{order.profile}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.5rem', fontSize: '0.875rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <div style={{
                                                            width: '28px',
                                                            height: '28px',
                                                            borderRadius: '50%',
                                                            background: order.addressPhoto ? `url(${order.addressPhoto})` : '#10b981',
                                                            backgroundSize: 'cover',
                                                            backgroundPosition: 'center',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'white',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            flexShrink: 0
                                                        }}>
                                                            {!order.addressPhoto && (order.address?.charAt(0) || 'U')}
                                                        </div>
                                                        <span>{order.address}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.5rem', borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}>
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
                                            </tr>
                                        ))}
                                    </tbody>
                                    </table>
                                )}
                            </div>
                        </Card>
                    </div>
                    </>
                )}
            </motion.div>
        </DashboardLayout>
    );
};

export default Overview;
