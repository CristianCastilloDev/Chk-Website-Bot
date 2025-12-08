import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Crown, Infinity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPlans } from '../services/db';
import { useAuth } from '../context/AuthContext';
import './Pricing.css';

const Pricing = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            const fetchedPlans = await getPlans();
            setPlans(fetchedPlans);
        } catch (error) {
            console.error('Error loading plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPlanIcon = (type) => {
        switch (type) {
            case 'free':
                return <Zap size={32} />;
            case 'monthly':
                return <Check size={32} />;
            case 'annual':
                return <Crown size={32} />;
            case 'lifetime':
                return <Infinity size={32} />;
            default:
                return <Check size={32} />;
        }
    };

    const handleSelectPlan = (plan) => {
        if (!isAuthenticated) {
            navigate('/register');
        } else {
            navigate('/dashboard/billing');
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 }
    };

    if (loading) {
        return (
            <div className="pricing-loading">
                <div className="spinner"></div>
                <p>Loading plans...</p>
            </div>
        );
    }

    return (
        <div className="pricing-container">
            <motion.div
                className="pricing-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <h1 className="gradient-text">Elige tu Plan</h1>
                <p>Elige el plan perfecto para tus necesidades. Sube, baja o cancela en cualquier momento.</p>
            </motion.div>

            <motion.div
                className="pricing-grid"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {plans.map((plan) => (
                    <motion.div
                        key={plan.id}
                        className={`pricing-card glass ${plan.popular ? 'popular' : ''}`}
                        variants={cardVariants}
                        whileHover={{ y: -10, boxShadow: 'var(--shadow-lg)' }}
                    >
                        {plan.popular && (
                            <div className="popular-badge gradient-primary">
                                <Crown size={16} />
                                Mas Popular
                            </div>
                        )}

                        <div className="plan-icon gradient-primary">
                            {getPlanIcon(plan.type)}
                        </div>

                        <h3 className="plan-name">{plan.name}</h3>

                        <div className="plan-price">
                            <span className="currency">$</span>
                            <span className="amount">{plan.price}</span>
                            {plan.type === 'monthly' && <span className="period">/Mes</span>}
                            {plan.type === 'annual' && <span className="period">/Año</span>}
                        </div>

                        <div className="plan-credits">
                            <Zap size={18} />
                            <span>{plan.credits.toLocaleString()} Creditos</span>
                        </div>

                        <ul className="plan-features">
                            {plan.features.map((feature, index) => (
                                <li key={index}>
                                    <Check size={18} />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <motion.button
                            className={`plan-button ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => handleSelectPlan(plan)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {plan.type === 'free' ? 'Get Started' : 'Subscribe Now'}
                        </motion.button>
                    </motion.div>
                ))}
            </motion.div>

            <motion.div
                className="pricing-faq glass"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <h3>Frequently Asked Questions</h3>
                <div className="faq-grid">
                    <div className="faq-item">
                        <h4>What are credits?</h4>
                        <p>Credits are used to access premium features and services. Each action consumes a certain number of credits.</p>
                    </div>
                    <div className="faq-item">
                        <h4>Can I change my plan?</h4>
                        <p>Yes! You can upgrade, downgrade, or cancel your plan at any time from your dashboard.</p>
                    </div>
                    <div className="faq-item">
                        <h4>Do credits expire?</h4>
                        <p>Monthly credits reset each month. Annual and lifetime credits don't expire.</p>
                    </div>
                    <div className="faq-item">
                        <h4>Is there a refund policy?</h4>
                        <p>We offer a 30-day money-back guarantee on all paid plans.</p>
                    </div>
                </div>
            </motion.div>

            <div className="pricing-background">
                <div className="gradient-orb orb-1"></div>
                <div className="gradient-orb orb-2"></div>
            </div>
        </div>
    );
};

export default Pricing;
