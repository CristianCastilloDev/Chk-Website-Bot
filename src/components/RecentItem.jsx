import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const RecentItem = ({ name, date, size, icon: Icon, iconColor, onClick }) => {
    return (
        <motion.div
            className="recent-item"
            onClick={onClick}
            whileHover={{ x: 4, backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
            transition={{ duration: 0.2 }}
        >
            <div className="recent-icon" style={{ backgroundColor: iconColor }}>
                <Icon size={20} color="white" strokeWidth={2} />
            </div>
            <div className="recent-info">
                <span className="recent-name">{name}</span>
            </div>
            <div className="recent-meta">
                <span className="recent-date">{date}</span>
                <span className="recent-size">{size}</span>
            </div>
        </motion.div>
    );
};

RecentItem.propTypes = {
    name: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    size: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    iconColor: PropTypes.string.isRequired,
    onClick: PropTypes.func
};

export default RecentItem;
