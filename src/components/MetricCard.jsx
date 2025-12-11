import './MetricCard.css';

const MetricCard = ({ 
    icon, 
    title, 
    value, 
    comparison, 
    chart,
    subtitle 
}) => {
    const isPositive = comparison && parseFloat(comparison) > 0;
    const isNegative = comparison && parseFloat(comparison) < 0;

    return (
        <div className="metric-card glass">
            <div className="metric-header">
                {icon && <div className="metric-icon">{icon}</div>}
                <div className="metric-info">
                    <h3 className="metric-title">{title}</h3>
                    {subtitle && <p className="metric-subtitle">{subtitle}</p>}
                </div>
            </div>

            <div className="metric-content">
                <div className="metric-value">{value}</div>
                
                {comparison && (
                    <div className={`metric-comparison ${isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'}`}>
                        <span className="comparison-icon">
                            {isPositive ? '↑' : isNegative ? '↓' : '→'}
                        </span>
                        <span className="comparison-value">{comparison}</span>
                        <span className="comparison-label">since last month</span>
                    </div>
                )}

                {chart && (
                    <div className="metric-chart">
                        {chart}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MetricCard;
