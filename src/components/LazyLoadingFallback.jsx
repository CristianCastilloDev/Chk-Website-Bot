import React from 'react';
import './LazyLoadingFallback.css';

/**
 * Lightweight fallback component for lazy-loaded routes
 * Uses pure CSS animations for minimal bundle impact
 */
const LazyLoadingFallback = () => {
  return (
    <div className="lazy-loading-container">
      <div className="lazy-loading-content">
        <div className="spinner"></div>
        <p className="loading-text">Cargando...</p>
      </div>
    </div>
  );
};

export default LazyLoadingFallback;
