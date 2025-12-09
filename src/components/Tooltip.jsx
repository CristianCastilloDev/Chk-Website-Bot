import { useState } from 'react';
import PropTypes from 'prop-types';
import './Tooltip.css';

const Tooltip = ({ children, content, position = 'top', delay = 200 }) => {
    const [isVisible, setIsVisible] = useState(false);
    let timeout;

    const showTooltip = () => {
        timeout = setTimeout(() => {
            setIsVisible(true);
        }, delay);
    };

    const hideTooltip = () => {
        clearTimeout(timeout);
        setIsVisible(false);
    };

    return (
        <div
            className="tooltip-wrapper"
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
            onFocus={showTooltip}
            onBlur={hideTooltip}
        >
            {children}
            {isVisible && content && (
                <div className={`tooltip tooltip-${position}`} role="tooltip">
                    {content}
                    <div className="tooltip-arrow" />
                </div>
            )}
        </div>
    );
};

Tooltip.propTypes = {
    children: PropTypes.node.isRequired,
    content: PropTypes.string.isRequired,
    position: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
    delay: PropTypes.number,
};

export default Tooltip;
