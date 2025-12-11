import './SkeletonLoader.css';

const SkeletonLoader = ({ type = 'card', count = 1, height = '100px', columns = 4, rows = 5 }) => {
    const renderSkeleton = () => {
        switch (type) {
            case 'card':
                return (
                    <div className="skeleton-card" style={{ height }}>
                        <div className="skeleton-header">
                            <div className="skeleton-circle"></div>
                            <div className="skeleton-text skeleton-title"></div>
                        </div>
                        <div className="skeleton-text skeleton-line"></div>
                        <div className="skeleton-text skeleton-line short"></div>
                    </div>
                );

            case 'table':
                return (
                    <div className="skeleton-table">
                        <div className="skeleton-table-header">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="skeleton-text skeleton-th"></div>
                            ))}
                        </div>
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="skeleton-table-row">
                                {[1, 2, 3, 4].map(j => (
                                    <div key={j} className="skeleton-text skeleton-td"></div>
                                ))}
                            </div>
                        ))}
                    </div>
                );

            case 'table-rows':
                return (
                    <div className="skeleton-table-rows">
                        {[...Array(rows)].map((_, i) => (
                            <div key={i} className="skeleton-table-row-card">
                                {[...Array(columns)].map((_, j) => (
                                    <div key={j} className="skeleton-cell">
                                        <div className="skeleton-text skeleton-bar"></div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                );

            case 'stats':
                return (
                    <div className="skeleton-stats-grid">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="skeleton-stat-card">
                                <div className="skeleton-text skeleton-stat-label"></div>
                                <div className="skeleton-text skeleton-stat-value"></div>
                            </div>
                        ))}
                    </div>
                );

            case 'list':
                return (
                    <div className="skeleton-list">
                        {[...Array(count)].map((_, i) => (
                            <div key={i} className="skeleton-list-item">
                                <div className="skeleton-circle small"></div>
                                <div className="skeleton-text skeleton-list-text"></div>
                            </div>
                        ))}
                    </div>
                );

            case 'text':
                return (
                    <div className="skeleton-text-block">
                        <div className="skeleton-text skeleton-line"></div>
                        <div className="skeleton-text skeleton-line"></div>
                        <div className="skeleton-text skeleton-line short"></div>
                    </div>
                );

            default:
                return <div className="skeleton-box" style={{ height }}></div>;
        }
    };

    return (
        <div className="skeleton-container">
            {type === 'card' || type === 'list' ? (
                [...Array(count)].map((_, i) => (
                    <div key={i}>{renderSkeleton()}</div>
                ))
            ) : (
                renderSkeleton()
            )}
        </div>
    );
};

export default SkeletonLoader;
