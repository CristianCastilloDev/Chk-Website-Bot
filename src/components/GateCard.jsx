import { motion } from 'framer-motion';
import { CreditCard, Wallet, Shield, AlertCircle, Wrench, Check } from 'lucide-react';
import './GateCard.css';

const GateCard = ({ gate, selected, onSelect, showStatus = true }) => {
    const getIcon = (type) => {
        switch (type) {
            case 'stripe':
                return (
                    <img
                        src="https://cdn.simpleicons.org/stripe/white"
                        alt="Stripe"
                        loading="lazy"
                        decoding="async"
                        style={{ width: '24px', height: '24px' }}
                    />
                );
            case 'paypal':
                return (
                    <img
                        src="https://cdn.simpleicons.org/paypal/white"
                        alt="PayPal"
                        loading="lazy"
                        decoding="async"
                        style={{ width: '24px', height: '24px' }}
                    />
                );
            case 'braintree':
                return (
                    <img
                        src="https://cdn.simpleicons.org/braintree/white"
                        alt="Braintree"
                        loading="lazy"
                        decoding="async"
                        style={{ width: '24px', height: '24px' }}
                    />
                );
            default:
                return <CreditCard size={24} />;
        }
    };

    const getStatusBadge = () => {
        switch (gate.status) {
            case 'active':
                return (
                    <div className="gate-status-badge active">
                        <Check size={14} />
                        <span>Activo</span>
                    </div>
                );
            case 'maintenance':
                return (
                    <div className="gate-status-badge maintenance">
                        <Wrench size={14} />
                        <span>Mantenimiento</span>
                    </div>
                );
            case 'inactive':
                return (
                    <div className="gate-status-badge inactive">
                        <AlertCircle size={14} />
                        <span>Inactivo</span>
                    </div>
                );
            default:
                return null;
        }
    };

    const isDisabled = gate.status === 'maintenance' || gate.status === 'inactive';

    return (
        <motion.div
            className={`gate-card ${selected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
            onClick={() => !isDisabled && onSelect()}
            whileHover={!isDisabled ? { scale: 1.02 } : {}}
            whileTap={!isDisabled ? { scale: 0.98 } : {}}
            style={{ borderColor: gate.color }}
        >
            <div className="gate-card-icon" style={{ background: gate.color }}>
                {getIcon(gate.type)}
            </div>

            <div className="gate-card-content">
                <h4>{gate.name}</h4>
                {gate.description && (
                    <p className="gate-description">{gate.description}</p>
                )}
            </div>

            {showStatus && getStatusBadge()}

            {selected && !isDisabled && (
                <div className="gate-selected-indicator">
                    <Check size={20} />
                </div>
            )}
        </motion.div>
    );
};

export default GateCard;
