import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Shield, Zap, Calendar, Search, Edit2, User, Crown, Code, DollarSign, Info, Users as UsersIcon, Award, UserCheck, UserX } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import EditUserModal from '../components/EditUserModal';
import UserDetailModal from '../components/UserDetailModal';
import SkeletonLoader from '../components/SkeletonLoader';
import { getAllUsers } from '../services/db';
import './Pages.css';
import './Users-table-fix.css';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUserDetail, setSelectedUserDetail] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [stats, setStats] = useState({
        admins: 0,
        devs: 0,
        members: 0,
        activePlans: 0,
        expiredPlans: 0
    });
    const [openMenuId, setOpenMenuId] = useState(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            // Delay de 2 segundos para mostrar la animación del skeleton
            await new Promise(resolve => setTimeout(resolve, 2000));

            const fetchedUsers = await getAllUsers();
            setUsers(fetchedUsers);

            // Calculate statistics
            const admins = fetchedUsers.filter(u => u.role === 'admin').length;
            const devs = fetchedUsers.filter(u => u.role === 'dev').length;
            const members = fetchedUsers.filter(u => u.role !== 'admin' && u.role !== 'dev').length;

            const now = new Date();
            const activePlans = fetchedUsers.filter(u => {
                if (u.role === 'admin' || u.role === 'dev') return false;
                const expiresAt = u.planExpiresAt?.toDate ? u.planExpiresAt.toDate() : null;
                return expiresAt && expiresAt > now;
            }).length;

            const expiredPlans = fetchedUsers.filter(u => {
                const expiresAt = u.planExpiresAt?.toDate ? u.planExpiresAt.toDate() : null;
                return expiresAt && expiresAt < now;
            }).length;

            setStats({ admins, devs, members, activePlans, expiredPlans });
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());

        // Custom filter logic
        let matchesRole = true;

        if (filterRole === 'all') {
            matchesRole = true;
        } else if (filterRole === 'premium') {
            // Premium: usuarios con plan activo
            const remainingDays = user.planExpiresAt
                ? Math.max(0, Math.ceil((user.planExpiresAt.toDate() - new Date()) / (1000 * 60 * 60 * 24)))
                : 0;
            matchesRole = remainingDays > 0 && user.role !== 'admin' && user.role !== 'dev';
        } else if (filterRole === 'miembro') {
            // Miembros: usuarios sin plan activo (free)
            const remainingDays = user.planExpiresAt
                ? Math.max(0, Math.ceil((user.planExpiresAt.toDate() - new Date()) / (1000 * 60 * 60 * 24)))
                : 0;
            matchesRole = (remainingDays === 0 || !user.planExpiresAt) && user.role !== 'admin' && user.role !== 'dev';
        } else if (filterRole === 'expired') {
            // Planes expirados: usuarios que tuvieron plan pero ya expiró
            const hasExpiredPlan = user.planExpiresAt && user.planExpiresAt.toDate() < new Date();
            matchesRole = hasExpiredPlan;
        } else {
            // Admin o Dev
            matchesRole = user.role === filterRole;
        }

        return matchesSearch && matchesRole;
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
    };

    const handleSaveUser = async () => {
        await loadUsers(); // Reload users after save
    };

    const handleViewDetails = (user) => {
        setSelectedUserDetail(user);
        setIsDetailModalOpen(true);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedUserDetail(null);
    };

    const getRoleIcon = (role) => {
        const icons = {
            free: User,
            premium: Crown,
            pro: Shield,
            admin: Shield,
            dev: Code,
            owner: Crown
        };
        const Icon = icons[role] || User;
        return <Icon size={14} />;
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Calcular días restantes del plan
    const getRemainingDays = (planExpiresAt) => {
        if (!planExpiresAt) return null;

        const expirationDate = planExpiresAt.toDate ? planExpiresAt.toDate() : new Date(planExpiresAt);
        const now = new Date();
        const diffTime = expirationDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays > 0 ? diffDays : 0;
    };

    // Determinar el tipo de plan basado en si tiene plan activo
    const getPlanType = (user) => {
        if (user.role === 'admin' || user.role === 'dev') return 'ILIMITADA';

        const remainingDays = getRemainingDays(user.planExpiresAt);
        if (remainingDays === null || remainingDays === 0) return 'FREE';

        return 'PREMIUM';
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
    };

    const toggleMenu = (userId) => {
        setOpenMenuId(openMenuId === userId ? null : userId);
    };

    const handleMenuAction = (user, action) => {
        setOpenMenuId(null);
        if (action === 'details') {
            handleViewDetails(user);
        } else if (action === 'edit') {
            handleEditUser(user);
        }
    };

    if (loading) {
        return (
            <DashboardLayout currentPage="users-all">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="page-header">
                        <h1>Administración de Usuarios</h1>
                        <p>Administra todos los usuarios registrados y sus suscripciones</p>
                    </div>

                    <div className="users-table glass">
                        <div className="table-header">
                            <div className="table-cell">Usuario</div>
                            <div className="table-cell">Email</div>
                            <div className="table-cell">Rol</div>
                            <div className="table-cell">Créditos</div>
                            <div className="table-cell">Plan</div>
                            <div className="table-cell">Días Restantes</div>
                            <div className="table-cell">Acciones</div>
                        </div>
                        <div className="table-body">
                            <SkeletonLoader type="table-rows" columns={7} rows={5} />
                        </div>
                    </div>
                </motion.div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout currentPage="users-all">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="page-header">
                    <h1>Administración de Usuarios</h1>
                    <p>Administra todos los usuarios registrados y sus suscripciones</p>
                </div>

                {/* Statistics Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                }}>
                    {/* Total Admins */}
                    <div className="glass" style={{ padding: '1.25rem', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <Shield size={18} style={{ color: '#ef4444' }} />
                            <h3 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Admins</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#ef4444' }}>
                            {stats.admins}
                        </p>
                    </div>

                    {/* Total Devs */}
                    <div className="glass" style={{ padding: '1.25rem', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <Code size={18} style={{ color: '#8b5cf6' }} />
                            <h3 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Devs</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#8b5cf6' }}>
                            {stats.devs}
                        </p>
                    </div>

                    {/* Total Members */}
                    <div className="glass" style={{ padding: '1.25rem', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <UsersIcon size={18} style={{ color: '#3b82f6' }} />
                            <h3 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Miembros</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#3b82f6' }}>
                            {stats.members}
                        </p>
                    </div>

                    {/* Active Plans */}
                    <div className="glass" style={{ padding: '1.25rem', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <UserCheck size={18} style={{ color: '#10b981' }} />
                            <h3 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Planes Activos</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#10b981' }}>
                            {stats.activePlans}
                        </p>
                    </div>

                    {/* Expired Plans */}
                    <div className="glass" style={{ padding: '1.25rem', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <UserX size={18} style={{ color: '#f59e0b' }} />
                            <h3 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Planes Expirados</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#f59e0b' }}>
                            {stats.expiredPlans}
                        </p>
                    </div>
                </div>

                <div className="users-filters glass">
                    <div className="search-box">
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Buscar usuarios..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="role-filter">
                        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                            <option value="all">Todos los Roles</option>
                            <option value="premium">Premium</option>
                            <option value="miembro">Miembros</option>
                            <option value="expired">Planes Expirados</option>
                            <option value="admin">Administradores</option>
                            <option value="dev">Developers</option>
                        </select>
                    </div>
                </div>

                {filteredUsers.length === 0 ? (
                    <div className="empty-state glass">
                        <p>No se encontraron usuarios</p>
                    </div>
                ) : (
                    <motion.div
                        className="users-table glass"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <div className="table-header">
                            <div className="table-cell">Usuario</div>
                            <div className="table-cell">Email</div>
                            <div className="table-cell">Rol</div>
                            <div className="table-cell">Créditos</div>
                            <div className="table-cell">Plan</div>
                            <div className="table-cell">Días Restantes</div>
                            <div className="table-cell">Acciones</div>
                        </div>

                        <div className="table-body">
                            {filteredUsers.map((user) => (
                                <motion.div
                                    key={user.id}
                                    className="table-row"
                                    variants={itemVariants}
                                    whileHover={{ backgroundColor: 'var(--bg-secondary)' }}
                                >
                                    <div className="table-cell">
                                        <div className="user-cell">
                                            <div
                                                className="user-avatar-small"
                                                style={{
                                                    background: user.photoURL ? 'transparent' : (user.avatar?.color || '#6366f1'),
                                                    backgroundImage: user.photoURL ? `url(${user.photoURL})` : 'none',
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center'
                                                }}
                                            >
                                                {!user.photoURL && (user.avatar?.initials || user.name?.charAt(0) || 'U')}
                                            </div>
                                            <span className="user-name-text">{user.name}</span>
                                        </div>
                                    </div>
                                    <div className="table-cell">
                                        <div className="email-cell">
                                            <Mail size={16} />
                                            {user.telegramId || 'N/A'}
                                        </div>
                                    </div>
                                    <div className="table-cell">
                                        <span className={`role-badge ${['free', 'usuario'].includes(user.role) ? 'miembro' : user.role}`}>
                                            {getRoleIcon(user.role)}
                                            {['free', 'usuario'].includes(user.role) ? 'Miembro' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                        </span>
                                    </div>
                                    <div className="table-cell">
                                        <div className="credits-cell">
                                            {user.role === 'dev' ? (
                                                <>
                                                    <DollarSign size={16} />
                                                    <span style={{ fontWeight: 700 }}>∞</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Zap size={16} />
                                                    {user.credits?.toLocaleString() || 0}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="table-cell">
                                        <span className="plan-badge">
                                            {getPlanType(user)}
                                        </span>
                                    </div>
                                    <div className="table-cell">
                                        {user.role === 'admin' || user.role === 'dev' ? (
                                            <div className="days-cell">
                                                <Calendar size={16} />
                                                <span style={{ fontWeight: 700 }}>∞</span>
                                            </div>
                                        ) : (
                                            <div className="days-cell">
                                                <Calendar size={16} />
                                                {getRemainingDays(user.planExpiresAt) !== null ? (
                                                    <span className={getRemainingDays(user.planExpiresAt) > 0 ? 'days-active' : 'days-expired'}>
                                                        {getRemainingDays(user.planExpiresAt)} días
                                                    </span>
                                                ) : (
                                                    <span className="days-none">Sin plan</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="table-cell">
                                        <div className="action-buttons" style={{ position: 'relative' }}>
                                            {/* Desktop buttons */}
                                            <button
                                                className="detail-user-btn"
                                                onClick={() => handleViewDetails(user)}
                                                title="Ver detalles"
                                            >
                                                <Info size={16} />
                                            </button>
                                            <button
                                                className="edit-user-btn"
                                                onClick={() => handleEditUser(user)}
                                                title="Editar usuario"
                                            >
                                                <Edit2 size={16} />
                                            </button>

                                            {/* Mobile menu button */}
                                            <button
                                                className="mobile-menu-btn"
                                                onClick={() => toggleMenu(user.id)}
                                                style={{
                                                    display: 'none',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '40px',
                                                    height: '40px',
                                                    background: 'var(--bg-tertiary)',
                                                    border: '1px solid var(--glass-border)',
                                                    borderRadius: 'var(--radius-md)',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '1.5rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    transition: 'all var(--transition-base)',
                                                    position: 'relative'
                                                }}
                                            >
                                                ⋮
                                            </button>

                                            {/* Dropdown menu */}
                                            {openMenuId === user.id && (
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        top: '100%',
                                                        right: 0,
                                                        marginTop: '0.5rem',
                                                        background: 'var(--bg-secondary)',
                                                        border: '1px solid var(--glass-border)',
                                                        borderRadius: 'var(--radius-md)',
                                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                                        zIndex: 1000,
                                                        minWidth: '160px',
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    <button
                                                        onClick={() => handleMenuAction(user, 'details')}
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.75rem 1rem',
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: 'var(--text-primary)',
                                                            fontSize: '0.9rem',
                                                            textAlign: 'left',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.75rem',
                                                            transition: 'background var(--transition-fast)'
                                                        }}
                                                        onMouseEnter={(e) => e.target.style.background = 'var(--bg-tertiary)'}
                                                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                                    >
                                                        <Info size={16} />
                                                        Ver detalles
                                                    </button>
                                                    <button
                                                        onClick={() => handleMenuAction(user, 'edit')}
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.75rem 1rem',
                                                            background: 'transparent',
                                                            border: 'none',
                                                            borderTop: '1px solid var(--glass-border)',
                                                            color: 'var(--text-primary)',
                                                            fontSize: '0.9rem',
                                                            textAlign: 'left',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.75rem',
                                                            transition: 'background var(--transition-fast)'
                                                        }}
                                                        onMouseEnter={(e) => e.target.style.background = 'var(--bg-tertiary)'}
                                                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                                    >
                                                        <Edit2 size={16} />
                                                        Editar usuario
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Edit User Modal */}
                <EditUserModal
                    user={selectedUser}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSaveUser}
                />

                {/* User Detail Modal */}
                <UserDetailModal
                    user={selectedUserDetail}
                    isOpen={isDetailModalOpen}
                    onClose={handleCloseDetailModal}
                />
            </motion.div>
        </DashboardLayout>
    );
};

export default Users;
