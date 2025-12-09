import PropTypes from 'prop-types';
import './Progress.css';

const ProgressBar = ({
    value = 0,
    max = 100,
    showLabel = true,
    color = 'primary',
    size = 'medium',
    animated = true
}) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
        <div className={`progress-bar-container progress-${size}`}>
            {showLabel && (
                <div className="progress-label">
                    <span>{Math.round(percentage)}%</span>
                </div>
            )}
            <div className="progress-track">
                <div
                    className={`progress-fill progress-${color} ${animated ? 'progress-animated' : ''}`}
                    style={{ width: `${percentage}%` }}
                    role="progressbar"
                    aria-valuenow={value}
                    aria-valuemin={0}
                    aria-valuemax={max}
                />
            </div>
        </div>
    );
};

ProgressBar.propTypes = {
    value: PropTypes.number,
    max: PropTypes.number,
    showLabel: PropTypes.bool,
    color: PropTypes.oneOf(['primary', 'success', 'warning', 'error']),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    animated: PropTypes.bool,
};

export default ProgressBar;
