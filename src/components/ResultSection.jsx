import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Copy, Download } from 'lucide-react';
import { useToast } from './Toast';
import './ResultSection.css';

const ResultSection = ({
    title,
    icon: Icon,
    count,
    results,
    color,
    defaultOpen = false
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const { showSuccess } = useToast();

    const copyResults = () => {
        const text = results.map(r => r.card).join('\n');
        navigator.clipboard.writeText(text);
        showSuccess(`${count} tarjetas copiadas al portapapeles`);
    };

    const exportResults = () => {
        const csv = 'Card,Status,Result,Time\n' +
            results.map(r => `${r.card},${r.status},${r.result},${r.time}s`).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.csv`;
        a.click();
        showSuccess('Resultados exportados');
    };

    return (
        <div className="result-section" style={{ '--section-color': color }}>
            <div
                className="result-section-header"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="result-section-title">
                    <div className="result-icon-wrapper">
                        <Icon size={18} />
                    </div>
                    <span className="result-title-text">{title}</span>
                    <span className="result-count">({count})</span>
                </div>

                <div className="result-section-actions">
                    {count > 0 && (
                        <>
                            <button
                                className="result-action-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    copyResults();
                                }}
                                title="Copiar todas"
                            >
                                <Copy size={16} />
                            </button>
                            <button
                                className="result-action-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    exportResults();
                                }}
                                title="Exportar"
                            >
                                <Download size={16} />
                            </button>
                        </>
                    )}
                    <ChevronDown
                        size={20}
                        className={`chevron ${isOpen ? 'open' : ''}`}
                    />
                </div>
            </div>

            <AnimatePresence>
                {isOpen && count > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="result-section-content"
                    >
                        <div className="result-cards">
                            {results.map((result, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="result-card"
                                >
                                    <div className="result-card-main">
                                        <span className="result-card-number">{result.card}</span>
                                        <span className="result-card-time">{result.time}s</span>
                                    </div>
                                    {result.result && (
                                        <div className="result-card-message">
                                            {result.result}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ResultSection;
