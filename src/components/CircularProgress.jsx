import PropTypes from 'prop-types';
import './Progress.css';

const CircularProgress = ({
    size = 40,
    strokeWidth = 4,
    value = null, // null for indeterminate
    color = 'primary'
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const isIndeterminate = value === null;
    const percentage = isIndeterminate ? 25 : Math.min(Math.max(value, 0), 100);
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="circular-progress-container" style={{ width: size, height: size }}>
            <svg
                className={`circular-progress ${isIndeterminate ? 'circular-progress-indeterminate' : ''}`}
                width={size}
                height={size}
            >
                {/* Background circle */}
                <circle
                    className="circular-progress-bg"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <circle
                    className={`circular-progress-fill circular-progress-${color}`}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </svg>
            {!isIndeterminate && value !== undefined && (
                <div className="circular-progress-label">
                    {Math.round(value)}%
                </div>
            )}
        </div>
    );
};

CircularProgress.propTypes = {
    size: PropTypes.number,
    strokeWidth: PropTypes.number,
    value: PropTypes.number, // null for indeterminate
    color: PropTypes.oneOf(['primary', 'success', 'warning', 'error']),
};

export default CircularProgress;
