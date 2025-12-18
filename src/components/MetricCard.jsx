import { TrendingUp } from 'lucide-react';
import './MetricCard.css';

const MetricCard = ({
    icon,
    title,
    value,
    comparison,
    chart,
    subtitle,
    iconBg = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
}) => {
    const isPositive = comparison && parseFloat(comparison) > 0;
    const Icon = icon;

    return (
        <div className="metric-card-v2">
            <div className="metric-card-content">
                <div className="metric-text-section">
                    <p className="metric-label">{title}</p>
                    <p className="metric-description">{subtitle}</p>
                    <h2 className="metric-number">{value}</h2>

                    {comparison !== undefined && comparison !== 0 && (
                        <div className="metric-badge">
                            <TrendingUp size={12} />
                            <span>+{Math.abs(comparison)}%</span>
                            <span className="badge-text">since last month</span>
                        </div>
                    )}
                </div>

                <div className="metric-icon-wrapper" style={{ background: iconBg }}>
                    {Icon && <Icon size={24} color="white" />}
                </div>
            </div>

            {chart && (
                <div className="metric-chart-section">
                    {chart}
                </div>
            )}
        </div>
    );
};

export default MetricCard;
