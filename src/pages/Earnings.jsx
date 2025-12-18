import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, ShoppingCart, Calendar } from 'lucide-react';
import { Card, Title, AreaChart, DonutChart } from '@tremor/react';
import DashboardLayout from '../components/DashboardLayout';
import SkeletonLoader from '../components/SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import './Pages.css';

const Earnings = () => {
    const { user } = useAuth();
    const [earnings, setEarnings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [monthlyData, setMonthlyData] = useState([]);
    const [planBreakdown, setPlanBreakdown] = useState([]);

    useEffect(() => {
        loadEarnings();
    }, [user]);

    const loadEarnings = async () => {
        try {
            setLoading(true);

            if (!user?.uid) {
                setLoading(false);
                return;
            }

            // First, get the Telegram chatId from telegram_users collection
            const telegramUsersRef = collection(db, 'telegram_users');
            const telegramQuery = query(telegramUsersRef, where('firebaseUid', '==', user.uid));
            const telegramSnapshot = await getDocs(telegramQuery);

            if (telegramSnapshot.empty) {
                console.log('No telegram_users entry found for user:', user.uid);
                setEarnings({
                    totals: {
                        totalSales: 0,
                        totalAmount: 0,
                        totalCommissions: 0,
                        paidCommissions: 0,
                        pendingCommissions: 0
                    }
                });
                setLoading(false);
                return;
            }

            const telegramData = telegramSnapshot.docs[0].data();
            const chatId = telegramData.chatId;

            console.log('Loading earnings for chatId:', chatId);

            // Get earnings document for this user using their chatId
            const earningsRef = doc(db, 'earnings', chatId);
            const earningsDoc = await getDoc(earningsRef);

            if (earningsDoc.exists()) {
                const data = earningsDoc.data();
                setEarnings(data);

                // Process monthly data for chart
                const monthly = data.monthly || {};
                const monthlyArray = Object.entries(monthly)
                    .map(([key, value]) => ({
                        month: formatMonthKey(key),
                        'Ventas': value.sales,
                        'Comisiones': value.commission
                    }))
                    .sort((a, b) => a.month.localeCompare(b.month))
                    .slice(-6); // Last 6 months

                setMonthlyData(monthlyArray);

                // Get plan breakdown from purchase_orders
                await loadPlanBreakdown(chatId);
            } else {
                setEarnings({
                    totals: {
                        totalSales: 0,
                        totalAmount: 0,
                        totalCommissions: 0,
                        paidCommissions: 0,
                        pendingCommissions: 0
                    }
                });
            }
        } catch (error) {
            console.error('Error loading earnings:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadPlanBreakdown = async (chatId) => {
        try {
            const ordersRef = collection(db, 'purchase_orders');
            const snapshot = await getDocs(ordersRef);

            const planCounts = {};

            snapshot.docs.forEach(doc => {
                const order = doc.data();
                if (order.adminId === chatId && order.status === 'approved') {
                    const planName = order.plan?.name || 'Desconocido';
                    planCounts[planName] = (planCounts[planName] || 0) + 1;
                }
            });

            const breakdown = Object.entries(planCounts).map(([name, count]) => ({
                name,
                value: count
            }));

            setPlanBreakdown(breakdown);
        } catch (error) {
            console.error('Error loading plan breakdown:', error);
        }
    };

    const formatMonthKey = (key) => {
        const [year, month] = key.split('-');
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${months[parseInt(month) - 1]} ${year}`;
    };

    if (loading) {
        return (
            <DashboardLayout>
                <SkeletonLoader />
            </DashboardLayout>
        );
    }

    const totals = earnings?.totals || {};

    return (
        <DashboardLayout>
            <div className="page-container">
                <div className="page-header">
                    <div>
                        <Title>💰 Mis Ganancias</Title>
                        <p className="page-subtitle">Resumen de tus comisiones y ventas</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="stat-card">
                            <div className="stat-content">
                                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                    <ShoppingCart size={24} />
                                </div>
                                <div className="stat-details">
                                    <p className="stat-label">Total Ventas</p>
                                    <h3 className="stat-value">{totals.totalSales || 0}</h3>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="stat-card">
                            <div className="stat-content">
                                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                                    <DollarSign size={24} />
                                </div>
                                <div className="stat-details">
                                    <p className="stat-label">Comisiones Totales</p>
                                    <h3 className="stat-value">${totals.totalCommissions || 0} MXN</h3>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="stat-card">
                            <div className="stat-content">
                                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                                    <TrendingUp size={24} />
                                </div>
                                <div className="stat-details">
                                    <p className="stat-label">Comisiones Pendientes</p>
                                    <h3 className="stat-value">${totals.pendingCommissions || 0} MXN</h3>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Card className="stat-card">
                            <div className="stat-content">
                                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                                    <Calendar size={24} />
                                </div>
                                <div className="stat-details">
                                    <p className="stat-label">Comisiones Pagadas</p>
                                    <h3 className="stat-value">${totals.paidCommissions || 0} MXN</h3>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>

                {/* Charts */}
                <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                    {monthlyData.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <Card>
                                <Title>Comisiones por Mes</Title>
                                <AreaChart
                                    className="mt-4 h-72"
                                    data={monthlyData}
                                    index="month"
                                    categories={['Comisiones']}
                                    colors={['blue']}
                                    valueFormatter={(value) => `$${value} MXN`}
                                />
                            </Card>
                        </motion.div>
                    )}

                    {planBreakdown.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <Card>
                                <Title>Planes Vendidos</Title>
                                <DonutChart
                                    className="mt-4 h-72"
                                    data={planBreakdown}
                                    category="value"
                                    index="name"
                                    colors={['blue', 'cyan', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']}
                                />
                            </Card>
                        </motion.div>
                    )}
                </div>

                {/* Empty State */}
                {(!earnings || totals.totalSales === 0) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        style={{ textAlign: 'center', padding: '3rem', marginTop: '2rem' }}
                    >
                        <DollarSign size={64} style={{ margin: '0 auto', opacity: 0.3 }} />
                        <h3 style={{ marginTop: '1rem', opacity: 0.7 }}>Aún no tienes ventas</h3>
                        <p style={{ opacity: 0.5, marginTop: '0.5rem' }}>
                            Tus comisiones aparecerán aquí cuando completes tu primera venta
                        </p>
                    </motion.div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Earnings;
