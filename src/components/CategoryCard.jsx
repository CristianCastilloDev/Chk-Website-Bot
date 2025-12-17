import { MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const CategoryCard = ({ name, icon: Icon, iconColor, count, size, onClick, badge }) => {
    return (
        <motion.div
            className="category-card"
            onClick={onClick}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
        >
            <div className="category-header">
                <div className="category-icon" style={{ backgroundColor: iconColor }}>
                    <Icon size={32} color="white" strokeWidth={2} />
                </div>
                <button
                    className="category-menu"
                    onClick={(e) => {
                        e.stopPropagation();
                        // Handle menu click
                    }}
                >
                    <MoreVertical size={20} />
                </button>
            </div>
            <div className="category-content">
                <h3 className="category-name">{name}</h3>
                <div className="category-underline" style={{ backgroundColor: iconColor }}></div>
                <div className="category-stats">
                    <span className="category-count">{count} Files</span>
                    <span className="category-size">{size}</span>
                </div>
            </div>
            {badge && (
                <div className="category-badge" style={{ backgroundColor: iconColor }}>
                    {badge}
                </div>
            )}
        </motion.div>
    );
};

CategoryCard.propTypes = {
    name: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    iconColor: PropTypes.string.isRequired,
    count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    size: PropTypes.string.isRequired,
    onClick: PropTypes.func,
    badge: PropTypes.string
};

export default CategoryCard;
