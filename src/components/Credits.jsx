import { motion } from 'framer-motion';
import { Zap, TrendingUp, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Credits.css';

const Credits = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!user) return null;

    const formatDate = (timestamp) => {
        if (!timestamp) return 'No expiration';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString();
    };

    const getPlanColor = (type) => {
        switch (type) {
            case 'free':
                return 'var(--text-secondary)';
            case 'monthly':
                return 'var(--primary)';
            case 'annual':
                return 'var(--accent)';
            case 'lifetime':
                return 'var(--accent-pink)';
            default:
                return 'var(--primary)';
        }
    };

    return (
        <motion.div
            className="credits-widget glass"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="credits-header">
                <div className="credits-icon gradient-accent">
                    <Zap size={24} />
                </div>
                <div className="credits-info">
                    <span className="credits-label">Available Credits</span>
                    <motion.span
                        className="credits-amount"
                        key={user.credits}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        {user.credits?.toLocaleString() || 0}
                    </motion.span>
                </div>
            </div>

            <div className="credits-divider"></div>

            <div className="plan-info">
                <div className="plan-item">
                    <TrendingUp size={16} />
                    <div>
                        <span className="plan-label">Current Plan</span>
                        <span
                            className="plan-value"
                            style={{ color: getPlanColor(user.plan?.type) }}
                        >
                            {user.plan?.type?.toUpperCase() || 'FREE'}
                        </span>
                    </div>
                </div>

                {user.plan?.endDate && (
                    <div className="plan-item">
                        <Calendar size={16} />
                        <div>
                            <span className="plan-label">Expires</span>
                            <span className="plan-value">
                                {formatDate(user.plan.endDate)}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {user.plan?.type === 'free' && (
                <motion.button
                    className="upgrade-button gradient-primary"
                    onClick={() => navigate('/pricing')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    Upgrade Plan
                </motion.button>
            )}
        </motion.div>
    );
};

export default Credits;
