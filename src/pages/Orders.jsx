import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ShoppingCart,
    CheckCircle,
    XCircle,
    Clock,
    Plus,
    Filter,
    Search,
    RefreshCw,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { Card, Title } from '@tremor/react';
import DashboardLayout from '../components/DashboardLayout';
import SkeletonLoader from '../components/SkeletonLoader';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, getDoc, updateDoc, doc, addDoc, serverTimestamp, query, where, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import UserAvatar from '../components/UserAvatar';
import './Pages.css';

const Orders = () => {
    const { user, isAdmin } = useAuth();
    const { showSuccess, showError, showWarning } = useToast();
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Form states
    const [formData, setFormData] = useState({
        targetUser: '',
        type: 'plan',
        description: '',
        amount: '',
        price: ''
    });

    useEffect(() => {
        loadOrders();
    }, []);

    useEffect(() => {
        filterOrders();
    }, [orders, filter, searchTerm]);

    const loadOrders = async () => {
        try {
            setLoading(true);

            // Delay de 2 segundos para mostrar la animación del skeleton
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Load analytics_orders (old system)
            const analyticsOrdersRef = collection(db, 'analytics_orders');
            const analyticsSnapshot = await getDocs(analyticsOrdersRef);

            const analyticsOrdersData = await Promise.all(analyticsSnapshot.docs.map(async (orderDoc) => {
                const orderData = orderDoc.data();
                let adminPhoto = null;
                let userPhoto = null;

                // Fetch admin photo
                if (orderData.createdBy) {
                    try {
                        const usersRef = collection(db, 'users');
                        const usersSnapshot = await getDocs(usersRef);
                        const adminUser = usersSnapshot.docs.find(doc => doc.data().name === orderData.createdBy);
                        if (adminUser) {
                            adminPhoto = adminUser.data().photoURL || null;
                        }
                    } catch (error) {
                        console.error('Error fetching admin photo:', error);
                    }
                }

                // Fetch target user photo
                if (orderData.targetUser) {
                    try {
                        const usersRef = collection(db, 'users');
                        const usersSnapshot = await getDocs(usersRef);
                        const targetUser = usersSnapshot.docs.find(doc => doc.data().name === orderData.targetUser);
                        if (targetUser) {
                            userPhoto = targetUser.data().photoURL || null;
                        }
                    } catch (error) {
                        console.error('Error fetching user photo:', error);
                    }
                }

                return {
                    id: orderDoc.id,
                    ...orderData,
                    orderType: 'analytics', // Mark as analytics order
                    adminPhoto,
                    userPhoto,
                    createdAt: orderData.createdAt?.toDate(),
                    approvedAt: orderData.approvedAt?.toDate(),
                    rejectedAt: orderData.rejectedAt?.toDate()
                };
            }));

            // Load purchase_orders (new system)
            const purchaseOrdersRef = collection(db, 'purchase_orders');
            const purchaseSnapshot = await getDocs(purchaseOrdersRef);

            const purchaseOrdersData = await Promise.all(purchaseSnapshot.docs.map(async (orderDoc) => {
                const orderData = orderDoc.data();

                return {
                    id: orderDoc.id,
                    ...orderData,
                    orderType: 'purchase', // Mark as purchase order
                    // Map purchase order fields to match analytics structure
                    targetUser: orderData.clientUsername,
                    createdBy: orderData.adminUsername || 'Pendiente',
                    description: `${orderData.plan?.name} - $${orderData.plan?.price} ${orderData.plan?.currency}`,
                    amount: orderData.plan?.type === 'credits' ? orderData.plan?.credits : orderData.plan?.duration,
                    price: orderData.plan?.price,
                    type: orderData.plan?.type === 'credits' ? 'credits' : 'plan',
                    createdAt: orderData.timestamps?.created?.toDate(),
                    approvedAt: orderData.timestamps?.approved?.toDate(),
                    rejectedAt: orderData.timestamps?.rejected?.toDate()
                };
            }));

            // Combine both arrays
            const allOrders = [...analyticsOrdersData, ...purchaseOrdersData];

            // Ordenar por fecha (más recientes primero)
            allOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

            setOrders(allOrders);
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterOrders = () => {
        let filtered = [...orders];

        // Filtrar por estado
        if (filter !== 'all') {
            filtered = filtered.filter(order => order.status === filter);
        }

        // Filtrar por búsqueda
        if (searchTerm) {
            filtered = filtered.filter(order =>
                order.targetUser?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.createdBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredOrders(filtered);
        setCurrentPage(1); // Reset to first page when filters change
    };

    const handleApprove = async (orderId) => {
        try {
            // Buscar la orden
            const order = orders.find(o => o.id === orderId);
            if (!order) {
                showWarning('Orden no encontrada');
                return;
            }

            // Handle based on order type
            if (order.orderType === 'purchase') {
                // Purchase order - check current status
                const orderRef = doc(db, 'purchase_orders', orderId);
                const orderSnap = await getDoc(orderRef);

                if (!orderSnap.exists()) {
                    showWarning('Orden no encontrada');
                    return;
                }

                const orderData = orderSnap.data();
                const currentStatus = orderData.status;

                if (currentStatus === 'pending') {
                    // Just accept the order, don't apply plan yet
                    await updateDoc(orderRef, {
                        status: 'accepted',
                        adminId: user?.telegramId || user?.uid,
                        adminUsername: user?.name || user?.email,
                        'timestamps.accepted': new Date()
                    });

                    showSuccess(`Orden aceptada. Esperando comprobante de pago de ${order.targetUser}`);

                } else if (currentStatus === 'payment_sent' || currentStatus === 'accepted') {
                    // Apply plan and approve
                    // Apply plan to user
                    const usersRef = collection(db, 'users');
                    const usersQuery = query(usersRef, where('telegramId', '==', orderData.clientId));
                    const usersSnapshot = await getDocs(usersQuery);

                    if (usersSnapshot.empty) {
                        showWarning('Usuario no encontrado');
                        return;
                    }

                    const userDoc = usersSnapshot.docs[0];
                    const userId = userDoc.id;
                    const userData = userDoc.data();

                    if (orderData.plan.type === 'days') {
                        // Apply day-based plan
                        const now = new Date();
                        const currentExpiry = userData.planExpiresAt?.toDate() || now;
                        const startDate = currentExpiry > now ? currentExpiry : now;
                        const expiryDate = new Date(startDate.getTime() + orderData.plan.duration * 24 * 60 * 60 * 1000);

                        await updateDoc(doc(db, 'users', userId), {
                            plan: orderData.plan.id,
                            planExpiresAt: expiryDate,
                            updatedAt: new Date()
                        });
                    } else if (orderData.plan.type === 'credits') {
                        // Apply credit-based plan
                        const currentCredits = userData.credits || 0;

                        await updateDoc(doc(db, 'users', userId), {
                            credits: currentCredits + orderData.plan.credits,
                            updatedAt: new Date()
                        });
                    }

                    // Update order status
                    await updateDoc(orderRef, {
                        status: 'approved',
                        'timestamps.approved': new Date(),
                        approvedBy: user?.telegramId || user?.email
                    });

                    // Calculate and register commissions
                    const commissionPercent = orderData.adminId ? 20 : 10;
                    const commissionAmount = orderData.plan.price * commissionPercent / 100;

                    // Update earnings (simplified - you may want to create earningsService.js)
                    const sellerId = orderData.adminId;
                    if (sellerId) {
                        const now = new Date();
                        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

                        const earningsRef = doc(db, 'earnings', sellerId);
                        const earningsDoc = await getDoc(earningsRef);

                        if (earningsDoc.exists()) {
                            const earnings = earningsDoc.data();
                            const currentMonthly = earnings.monthly || {};
                            const currentMonth = currentMonthly[monthKey] || { sales: 0, amount: 0, commission: 0 };

                            await updateDoc(earningsRef, {
                                'totals.totalSales': (earnings.totals?.totalSales || 0) + 1,
                                'totals.totalAmount': (earnings.totals?.totalAmount || 0) + orderData.plan.price,
                                'totals.totalCommissions': (earnings.totals?.totalCommissions || 0) + commissionAmount,
                                'totals.pendingCommissions': (earnings.totals?.pendingCommissions || 0) + commissionAmount,
                                [`monthly.${monthKey}.sales`]: currentMonth.sales + 1,
                                [`monthly.${monthKey}.amount`]: currentMonth.amount + orderData.plan.price,
                                [`monthly.${monthKey}.commission`]: currentMonth.commission + commissionAmount,
                                lastUpdated: new Date()
                            });
                        } else {
                            await setDoc(earningsRef, {
                                userId: sellerId,
                                role: 'admin',
                                totals: {
                                    totalSales: 1,
                                    totalAmount: orderData.plan.price,
                                    totalCommissions: commissionAmount,
                                    paidCommissions: 0,
                                    pendingCommissions: commissionAmount
                                },
                                monthly: {
                                    [monthKey]: {
                                        sales: 1,
                                        amount: orderData.plan.price,
                                        commission: commissionAmount
                                    }
                                },
                                lastUpdated: new Date()
                            });
                        }
                    }

                    showSuccess(`Orden aprobada y plan activado para ${order.targetUser}`);
                } else {
                    showWarning(`Esta orden ya está ${currentStatus}`);
                }

            } else {
                // Analytics order - apply plan/credits manually
                // Buscar al usuario por email
                const usersRef = collection(db, 'users');
                const usersSnapshot = await getDocs(usersRef);
                const targetUser = usersSnapshot.docs.find(doc => doc.data().email === order.targetUserEmail);

                if (!targetUser) {
                    showWarning(`Usuario ${order.targetUser} no encontrado`);
                    return;
                }

                const userId = targetUser.id;
                const userData = targetUser.data();

                // Aplicar cambios según el tipo de orden
                if (order.type === 'credits') {
                    // Agregar créditos
                    const currentCredits = userData.credits || 0;
                    const newCredits = currentCredits + order.amount;

                    await updateDoc(doc(db, 'users', userId), {
                        credits: newCredits
                    });
                } else if (order.type === 'plan') {
                    // Agregar días al plan
                    const now = new Date();
                    let newExpirationDate;

                    if (userData.planExpiresAt && userData.planExpiresAt.toDate() > now) {
                        // Si tiene plan activo, sumar días a la fecha actual
                        newExpirationDate = new Date(userData.planExpiresAt.toDate());
                        newExpirationDate.setDate(newExpirationDate.getDate() + order.amount);
                    } else {
                        // Si no tiene plan o está expirado, empezar desde hoy
                        newExpirationDate = new Date();
                        newExpirationDate.setDate(newExpirationDate.getDate() + order.amount);
                    }

                    await updateDoc(doc(db, 'users', userId), {
                        planExpiresAt: newExpirationDate
                    });
                }

                // Actualizar el estado de la orden
                const orderRef = doc(db, 'analytics_orders', orderId);
                await updateDoc(orderRef, {
                    status: 'approved',
                    approvedBy: user?.name || user?.email,
                    approvedAt: new Date()
                });

                showSuccess(`Orden aprobada y ${order.type === 'credits' ? 'créditos agregados' : 'plan activado'} para ${order.targetUser}`);
            }

            // Recargar órdenes
            await loadOrders();
        } catch (error) {
            console.error('Error approving order:', error);
            showWarning('Error al aprobar la orden: ' + error.message);
        }
    };

    const handleReject = async (orderId) => {
        const reason = prompt('Razón del rechazo (opcional):');

        try {
            // Buscar la orden
            const order = orders.find(o => o.id === orderId);
            if (!order) {
                showWarning('Orden no encontrada');
                return;
            }

            // Handle based on order type
            if (order.orderType === 'purchase') {
                // Purchase order
                const orderRef = doc(db, 'purchase_orders', orderId);
                await updateDoc(orderRef, {
                    status: 'rejected',
                    'timestamps.rejected': new Date(),
                    rejectedBy: user?.telegramId || user?.email,
                    rejectionReason: reason || 'Sin razón especificada'
                });
            } else {
                // Analytics order
                const orderRef = doc(db, 'analytics_orders', orderId);
                await updateDoc(orderRef, {
                    status: 'rejected',
                    rejectedBy: user?.name || user?.email,
                    rejectedAt: new Date(),
                    rejectionReason: reason || 'Sin razón especificada'
                });
            }

            await loadOrders();
            showSuccess('Orden rechazada');
        } catch (error) {
            console.error('Error rejecting order:', error);
            showWarning('Error al rechazar la orden: ' + error.message);
        }
    };

    const handleCreateOrder = async (e) => {
        e.preventDefault();

        try {
            const ordersRef = collection(db, 'analytics_orders');
            await addDoc(ordersRef, {
                createdBy: user?.name || user?.email,
                createdAt: new Date(),
                targetUser: formData.targetUser,
                type: formData.type,
                description: formData.description,
                amount: parseInt(formData.amount),
                price: parseFloat(formData.price),
                status: 'pending',
                approvedBy: null,
                approvedAt: null,
                rejectedBy: null,
                rejectedAt: null,
                rejectionReason: null
            });

            // Resetear formulario
            setFormData({
                targetUser: '',
                type: 'plan',
                description: '',
                amount: '',
                price: ''
            });
            setShowCreateForm(false);

            // Recargar órdenes
            await loadOrders();
            showSuccess('Orden creada exitosamente');
        } catch (error) {
            console.error('Error creating order:', error);
            showWarning('Error al crear la orden: ' + error.message);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: { bg: '#f59e0b', label: 'Pendiente', icon: Clock },
            approved: { bg: '#10b981', label: 'Aprobado', icon: CheckCircle },
            rejected: { bg: '#ef4444', label: 'Rechazado', icon: XCircle }
        };

        const config = styles[status] || styles.pending;
        const Icon = config.icon;

        return (
            <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: config.bg,
                color: 'white'
            }}>
                <Icon size={14} />
                {config.label}
            </span>
        );
    };

    // Pagination calculations
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const goToPrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        approved: orders.filter(o => o.status === 'approved').length,
        rejected: orders.filter(o => o.status === 'rejected').length
    };

    return (
        <DashboardLayout currentPage="orders">
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
                        <h1>📦 Gestión de Órdenes</h1>
                        <p>Sistema de aprobación de órdenes (Solo Devs)</p>
                    </div>
                    {isAdmin() && (
                        <button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.5rem',
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Plus size={20} />
                            Nueva Orden
                        </button>
                    )}
                </div>

                {/* Stats Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '2rem'
                }}>
                    <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <ShoppingCart size={20} style={{ color: 'var(--primary)' }} />
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total</span>
                        </div>
                        <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{stats.total}</p>
                    </div>

                    <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <Clock size={20} style={{ color: '#f59e0b' }} />
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Pendientes</span>
                        </div>
                        <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: '#f59e0b' }}>{stats.pending}</p>
                    </div>

                    <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <CheckCircle size={20} style={{ color: '#10b981' }} />
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Aprobadas</span>
                        </div>
                        <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: '#10b981' }}>{stats.approved}</p>
                    </div>

                    <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <XCircle size={20} style={{ color: '#ef4444' }} />
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Rechazadas</span>
                        </div>
                        <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: '#ef4444' }}>{stats.rejected}</p>
                    </div>
                </div>

                {/* Create Order Form */}
                {showCreateForm && isAdmin() && (
                    <Card style={{ marginBottom: '2rem' }}>
                        <Title>Crear Nueva Orden</Title>
                        <form onSubmit={handleCreateOrder} style={{ marginTop: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                                        Usuario Destino
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.targetUser}
                                        onChange={(e) => setFormData({ ...formData, targetUser: e.target.value })}
                                        required
                                        placeholder="Ej: User001"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: '8px',
                                            color: 'var(--text-primary)'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                                        Tipo
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: '8px',
                                            color: 'var(--text-primary)'
                                        }}
                                    >
                                        <option value="plan">Plan</option>
                                        <option value="credits">Créditos</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                                        Cantidad
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                        placeholder={formData.type === 'plan' ? 'Días' : 'Créditos'}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: '8px',
                                            color: 'var(--text-primary)'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                                        Precio ($)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        required
                                        placeholder="0.00"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: '8px',
                                            color: 'var(--text-primary)'
                                        }}
                                    />
                                </div>

                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                                        Descripción
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        required
                                        placeholder="Descripción de la orden..."
                                        rows={3}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: '8px',
                                            color: 'var(--text-primary)',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    type="submit"
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        background: 'var(--primary)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Crear Orden
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        background: 'transparent',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* Filters */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                    flexWrap: 'wrap',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => setFilter('all')}
                            style={{
                                padding: '0.5rem 1rem',
                                background: filter === 'all' ? 'var(--primary)' : 'transparent',
                                color: filter === 'all' ? 'white' : 'var(--text-primary)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 600
                            }}
                        >
                            Todas
                        </button>
                        <button
                            onClick={() => setFilter('pending')}
                            style={{
                                padding: '0.5rem 1rem',
                                background: filter === 'pending' ? '#f59e0b' : 'transparent',
                                color: filter === 'pending' ? 'white' : 'var(--text-primary)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 600
                            }}
                        >
                            Pendientes
                        </button>
                        <button
                            onClick={() => setFilter('approved')}
                            style={{
                                padding: '0.5rem 1rem',
                                background: filter === 'approved' ? '#10b981' : 'transparent',
                                color: filter === 'approved' ? 'white' : 'var(--text-primary)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 600
                            }}
                        >
                            Aprobadas
                        </button>
                        <button
                            onClick={() => setFilter('rejected')}
                            style={{
                                padding: '0.5rem 1rem',
                                background: filter === 'rejected' ? '#ef4444' : 'transparent',
                                color: filter === 'rejected' ? 'white' : 'var(--text-primary)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 600
                            }}
                        >
                            Rechazadas
                        </button>
                    </div>

                    <div style={{ flex: 1, minWidth: '250px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="text"
                                placeholder="Buscar por usuario, admin o descripción..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem 0.75rem 0.5rem 2.5rem',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '8px',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.875rem'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Orders Table */}
                <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <Title>Órdenes ({filteredOrders.length}) - Página {currentPage} de {totalPages || 1}</Title>
                        <button
                            onClick={loadOrders}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                background: 'transparent',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'var(--glass-border)'}
                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                            <RefreshCw size={16} />
                            Refrescar
                        </button>
                    </div>
                    {loading ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Admin</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Usuario</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Tipo</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Descripción</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Precio</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Fecha</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Estado</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...Array(10)].map((_, index) => (
                                        <tr
                                            key={index}
                                            style={{
                                                background: 'rgba(128, 128, 128, 0.1)',
                                                borderRadius: '12px'
                                            }}
                                        >
                                            <td style={{ padding: '0.75rem', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div className="skeleton-text" style={{ width: '32px', height: '32px', borderRadius: '50%' }}></div>
                                                    <div className="skeleton-text" style={{ width: '60%', height: '16px' }}></div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div className="skeleton-text" style={{ width: '32px', height: '32px', borderRadius: '50%' }}></div>
                                                    <div className="skeleton-text" style={{ width: '50%', height: '16px' }}></div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <div className="skeleton-text" style={{ width: '80px', height: '20px', borderRadius: '6px' }}></div>
                                            </td>
                                            <td style={{ padding: '0.75rem', fontSize: '0.875rem', maxWidth: '200px' }}>
                                                <div className="skeleton-text" style={{ width: '90%', height: '14px' }}></div>
                                            </td>
                                            <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                                                <div className="skeleton-text" style={{ width: '50px', height: '16px' }}></div>
                                            </td>
                                            <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                                                <div className="skeleton-text" style={{ width: '70px', height: '14px' }}></div>
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <div className="skeleton-text" style={{ width: '80px', height: '24px', borderRadius: '12px' }}></div>
                                            </td>
                                            <td style={{ padding: '0.75rem', borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <div className="skeleton-text" style={{ width: '70px', height: '28px', borderRadius: '6px' }}></div>
                                                    <div className="skeleton-text" style={{ width: '70px', height: '28px', borderRadius: '6px' }}></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            No hay órdenes que mostrar
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Admin</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Usuario</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Tipo</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Descripción</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Precio</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Fecha</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Estado</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedOrders.map((order) => (
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
                                            <td style={{ padding: '0.75rem', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <UserAvatar
                                                        photoURL={order.adminPhoto}
                                                        name={order.createdBy}
                                                        size="sm"
                                                    />
                                                    <span>{order.createdBy}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <UserAvatar
                                                        photoURL={order.userPhoto}
                                                        name={order.targetUser}
                                                        size="sm"
                                                    />
                                                    <span>{order.targetUser}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    background: order.type === 'plan' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                                    borderRadius: '6px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600
                                                }}>
                                                    {order.type === 'plan' ? '📅 Plan' : '💳 Créditos'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem', fontSize: '0.875rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {order.description}
                                            </td>
                                            <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>${order.price}</td>
                                            <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                                                {order.createdAt?.toLocaleDateString('es-ES')}
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                {getStatusBadge(order.status)}
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                {order.status === 'pending' && user?.role === 'dev' && (
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                        <button
                                                            onClick={() => handleApprove(order.id)}
                                                            style={{
                                                                padding: '0.5rem 0.75rem',
                                                                background: '#10b981',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 600,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.25rem'
                                                            }}
                                                        >
                                                            <CheckCircle size={14} />
                                                            Aprobar
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(order.id)}
                                                            style={{
                                                                padding: '0.5rem 0.75rem',
                                                                background: '#ef4444',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 600,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.25rem'
                                                            }}
                                                        >
                                                            <XCircle size={14} />
                                                            Rechazar
                                                        </button>
                                                    </div>
                                                )}
                                                {order.status === 'approved' && (
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                                        Por: {order.approvedBy}
                                                    </div>
                                                )}
                                                {order.status === 'rejected' && (
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                                        Por: {order.rejectedBy}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {!loading && filteredOrders.length > 0 && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: '1.5rem',
                            padding: '1rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: '12px',
                            border: '1px solid var(--glass-border)'
                        }}>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                Mostrando {startIndex + 1} - {Math.min(endIndex, filteredOrders.length)} de {filteredOrders.length} órdenes
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={goToPrevPage}
                                    disabled={currentPage === 1}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.5rem 1rem',
                                        background: currentPage === 1 ? 'var(--bg-secondary)' : 'var(--primary)',
                                        color: currentPage === 1 ? 'var(--text-secondary)' : 'white',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '8px',
                                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        transition: 'all 0.2s',
                                        opacity: currentPage === 1 ? 0.5 : 1
                                    }}
                                >
                                    <ChevronLeft size={16} />
                                    Anterior
                                </button>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0 1rem',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)'
                                }}>
                                    {currentPage} / {totalPages}
                                </div>
                                <button
                                    onClick={goToNextPage}
                                    disabled={currentPage === totalPages}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.5rem 1rem',
                                        background: currentPage === totalPages ? 'var(--bg-secondary)' : 'var(--primary)',
                                        color: currentPage === totalPages ? 'var(--text-secondary)' : 'white',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '8px',
                                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        transition: 'all 0.2s',
                                        opacity: currentPage === totalPages ? 0.5 : 1
                                    }}
                                >
                                    Siguiente
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </Card>
            </motion.div>
        </DashboardLayout>
    );
};

export default Orders;
