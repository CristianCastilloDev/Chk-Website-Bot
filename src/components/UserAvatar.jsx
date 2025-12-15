import './UserAvatar.css';

/**
 * UserAvatar Component
 * Displays user avatar with fallback to initials
 * 
 * @param {string} photoURL - User's photo URL (can be base64 or external URL)
 * @param {string} name - User's name for initials fallback
 * @param {string} size - Avatar size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 * @param {string} className - Additional CSS classes
 */
const UserAvatar = ({ photoURL, name = '', size = 'md', className = '' }) => {
    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const sizeClass = `user-avatar-${size}`;

    return (
        <div className={`user-avatar ${sizeClass} ${className}`}>
            {photoURL ? (
                <img
                    src={photoURL}
                    alt={name || 'User'}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                        // Fallback to initials if image fails to load
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                    }}
                />
            ) : null}
            <div
                className="user-avatar-initials gradient-primary"
                style={{ display: photoURL ? 'none' : 'flex' }}
            >
                {getInitials(name)}
            </div>
        </div>
    );
};

export default UserAvatar;
