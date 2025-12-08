import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Shield, DollarSign } from 'lucide-react';
import './UserTooltip.css';

const UserTooltip = ({ user, isVisible, position }) => {
    if (!user) return null;

    const getRoleIcon = (role) => {
        return <Shield size={14} />;
    };

    const getRoleColor = (role) => {
        const colors = {
            free: '#6b7280',
            premium: '#3b82f6',
            pro: '#8b5cf6',
            admin: '#f59e0b',
            dev: '#10b981'
        };
        return colors[role] || '#6b7280';
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="user-tooltip glass"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    style={{
                        left: position?.x || 0,
                        top: position?.y || 0
                    }}
                >
                    {/* Avatar and Name */}
                    <div className="tooltip-header">
                        <div
                            className="tooltip-avatar"
                            style={{ background: user.avatar?.color || '#6366f1' }}
                        >
                            {user.avatar?.initials || user.name?.charAt(0) || 'U'}
                        </div>
                        <div className="tooltip-user-info">
                            <h4>{user.name}</h4>
                            <p className="tooltip-username">@{user.username}</p>
                        </div>
                    </div>

                    {/* User Details */}
                    <div className="tooltip-details">
                        <div className="tooltip-detail-item">
                            <Mail size={14} />
                            <span>{user.email}</span>
                        </div>
                        <div className="tooltip-detail-item">
                            <Shield size={14} style={{ color: getRoleColor(user.role) }} />
                            <span className={`role-badge ${user.role}`}>
                                {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                            </span>
                        </div>
                        <div className="tooltip-detail-item">
                            <DollarSign size={14} />
                            <span>{user.role === 'dev' ? '∞' : (user.credits?.toLocaleString() || '0')} créditos</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default UserTooltip;
