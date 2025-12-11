import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Shield, Zap, Calendar, Search, Edit2, User, Crown, Code, DollarSign, Info } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import EditUserModal from '../components/EditUserModal';
import UserDetailModal from '../components/UserDetailModal';
import SkeletonLoader from '../components/SkeletonLoader';
import { getAllUsers } from '../services/db';
import './Pages.css';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUserDetail, setSelectedUserDetail] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            // Delay de 2 segundos para mostrar la animación del skeleton
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const fetchedUsers = await getAllUsers();
            setUsers(fetchedUsers);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());

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
            dev: Code
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
                                                style={{ background: user.avatar?.color || '#6366f1' }}
                                            >
                                                {user.avatar?.initials || 'U'}
                                            </div>
                                            <span className="user-name-text">{user.name}</span>
                                        </div>
                                    </div>
                                    <div className="table-cell">
                                        <div className="email-cell">
                                            <Mail size={16} />
                                            {user.email}
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
                                        <div className="action-buttons">
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
