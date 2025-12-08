import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import DashboardLayout from '../components/DashboardLayout';
import './Pages.css';

const Analytics = () => {
    // Mock data for analytics
    const data = {
        analytics: {
            userGrowth: [
                { month: 'Ene', users: 400 },
                { month: 'Feb', users: 600 },
                { month: 'Mar', users: 800 },
                { month: 'Abr', users: 1000 },
                { month: 'May', users: 1400 },
                { month: 'Jun', users: 1800 }
            ],
            revenue: [
                { month: 'Ene', revenue: 2400 },
                { month: 'Feb', revenue: 3200 },
                { month: 'Mar', revenue: 4100 },
                { month: 'Abr', revenue: 5000 },
                { month: 'May', revenue: 6200 },
                { month: 'Jun', revenue: 7500 }
            ],
            traffic: [
                { name: 'Directo', value: 400 },
                { name: 'Búsqueda', value: 300 },
                { name: 'Social', value: 200 },
                { name: 'Referidos', value: 100 }
            ]
        }
    };

    const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#ec4899'];

    return (
        <DashboardLayout currentPage="analytics">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="page-header">
                    <h1>Analytics</h1>
                    <p>Visualiza tus datos con gráficos hermosos</p>
                </div>

                <div className="charts-grid">
                    <motion.div
                        className="chart-card glass"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h3>Crecimiento de Usuarios</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data.analytics.userGrowth}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                                <XAxis dataKey="month" stroke="var(--text-secondary)" />
                                <YAxis stroke="var(--text-secondary)" />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: 'var(--radius-md)'
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="users"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    dot={{ fill: '#6366f1', r: 5 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </motion.div>

                    <motion.div
                        className="chart-card glass"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h3>Tendencia de Ingresos</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.analytics.revenue}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                                <XAxis dataKey="month" stroke="var(--text-secondary)" />
                                <YAxis stroke="var(--text-secondary)" />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: 'var(--radius-md)'
                                    }}
                                />
                                <Bar dataKey="revenue" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                                <defs>
                                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8b5cf6" />
                                        <stop offset="100%" stopColor="#6366f1" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>

                    <motion.div
                        className="chart-card glass"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <h3>Origenes de Tráfico</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={data.analytics.traffic}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {data.analytics.traffic.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: 'var(--radius-md)'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </motion.div>
                </div>
            </motion.div>
        </DashboardLayout>
    );
};

export default Analytics;
