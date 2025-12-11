import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    ShoppingCart, 
    CheckCircle, 
    Users, 
    CreditCard,
    DollarSign,
    TrendingUp,
    FileText,
    Wallet
} from 'lucide-react';
import { Card, Title, BarChart, DonutChart, AreaChart } from '@tremor/react';
import DashboardLayout from '../components/DashboardLayout';
import MetricCard from '../components/MetricCard';
import DateRangePicker from '../components/DateRangePicker';
import CircularProgress from '../components/CircularProgress';
import { 
    getAnalyticsStats, 
    getSalesDynamics, 
    getUserActivity,
    getCustomerOrders 
} from '../services/db';
import './Pages.css';

const Analytics = () => {
    const [dateRange, setDateRange] = useState('all');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [salesData, setSalesData] = useState([]);
    const [activityData, setActivityData] = useState([]);
    const [ordersTable, setOrdersTable] = useState([]);

    useEffect(() => {
        loadAnalyticsData();
    }, [dateRange]);

    const loadAnalyticsData = async () => {
        try {
            setLoading(true);
            
            // Cargar todas las estadísticas en paralelo
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

    // Preparar datos para gráficos de donut
    const usersChartData = stats ? [
        { name: 'Nuevos', value: stats.users.new, color: '#10b981' },
        { name: 'Activos', value: stats.users.active, color: '#06b6d4' },
        { name: 'Inactivos', value: stats.users.inactive, color: '#6b7280' }
    ] : [];

    const subsChartData = stats ? [
        { name: 'Planes', value: stats.subscriptions.plans, color: '#8b5cf6' },
        { name: 'Créditos', value: stats.subscriptions.credits, color: '#f59e0b' }
    ] : [];

    // Calcular porcentajes para progress circles
    const paidInvoicesPercent = stats ? (stats.orders.approved / stats.orders.total * 100) || 0 : 0;
    const fundsCollectedPercent = stats ? Math.min((stats.revenue.total / 10000) * 100, 100) : 0;

    if (loading) {
        return (
            <DashboardLayout currentPage="analytics">
                <div className="page-header">
                    <h1>Analytics</h1>
                    <p>Cargando datos...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout currentPage="analytics">
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
                        icon={<ShoppingCart />}
                        title="Órdenes"
                        value={stats?.orders.total || 0}
                        comparison={stats?.orders.comparison}
                        subtitle="Total de órdenes"
                    />
                    
                    <MetricCard
                        icon={<CheckCircle />}
                        title="Aprobadas"
                        value={stats?.orders.approved || 0}
                        subtitle="Órdenes aprobadas"
                    />
                    
                    <MetricCard
                        icon={<Users />}
                        title="Usuarios"
                        value={stats?.users.total || 0}
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
                        value={stats?.subscriptions.total || 0}
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
                        value={`$${stats?.revenue.total || 0}`}
                        comparison={stats?.revenue.comparison}
                        subtitle="Ingresos totales"
                    />
                    
                    <MetricCard
                        icon={<TrendingUp />}
                        title="Ingresos"
                        value={`$${stats?.revenue.total || 0}`}
                        comparison={stats?.revenue.comparison}
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

                {/* Progress Cards */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <FileText size={20} />
                            <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>Facturas Pagadas</h3>
                        </div>
                        <CircularProgress 
                            value={paidInvoicesPercent}
                            size={120}
                            color="success"
                        />
                        <p style={{ marginTop: '1rem', fontSize: '1.5rem', fontWeight: 700 }}>
                            ${(stats?.revenue.total * 0.7).toFixed(2)}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Año Fiscal Actual</p>
                    </div>

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
                            ${stats?.revenue.total || 0}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Año Fiscal Actual</p>
                    </div>
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

export default Analytics;
