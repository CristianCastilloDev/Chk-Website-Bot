import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Copy, Download } from 'lucide-react';
import { useToast } from './Toast';
import './CCGenerator.css';

const CCGenerator = ({ isOpen, onClose }) => {
    const [bin, setBin] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [cvv, setCvv] = useState('');
    const [quantity, setQuantity] = useState('10');
    const [mixResults, setMixResults] = useState(false);
    const [generatedCards, setGeneratedCards] = useState([]);
    const { showSuccess, showWarning } = useToast();

    const generateCards = () => {
        if (!bin || bin.length < 6) {
            showWarning('El BIN debe tener al menos 6 dígitos');
            return;
        }

        const qty = parseInt(quantity) || 10;
        if (qty < 1 || qty > 100) {
            showWarning('La cantidad debe estar entre 1 y 100');
            return;
        }

        const cards = [];
        for (let i = 0; i < qty; i++) {
            const cardNumber = generateCardNumber(bin);
            const expMonth = month || generateRandomMonth();
            const expYear = year || generateRandomYear();
            const cardCvv = cvv || generateRandomCVV();

            cards.push(`${cardNumber}|${expMonth}|${expYear}|${cardCvv}`);
        }

        if (mixResults) {
            cards.sort(() => Math.random() - 0.5);
        }

        setGeneratedCards(cards);
        showSuccess(`${qty} tarjetas generadas`);
    };

    const generateCardNumber = (binPrefix) => {
        let cardNumber = binPrefix.padEnd(15, '0');

        // Generate random digits for remaining positions
        for (let i = binPrefix.length; i < 15; i++) {
            cardNumber = cardNumber.substring(0, i) + Math.floor(Math.random() * 10) + cardNumber.substring(i + 1);
        }

        // Calculate Luhn check digit
        const checkDigit = calculateLuhn(cardNumber);
        return cardNumber + checkDigit;
    };

    const calculateLuhn = (number) => {
        let sum = 0;
        let isEven = true;

        for (let i = number.length - 1; i >= 0; i--) {
            let digit = parseInt(number[i]);

            if (isEven) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }

            sum += digit;
            isEven = !isEven;
        }

        return (10 - (sum % 10)) % 10;
    };

    const generateRandomMonth = () => {
        return String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    };

    const generateRandomYear = () => {
        const currentYear = new Date().getFullYear();
        return String(currentYear + Math.floor(Math.random() * 6));
    };

    const generateRandomCVV = () => {
        return String(Math.floor(Math.random() * 900) + 100);
    };

    const copyCards = () => {
        const text = generatedCards.join('\n');
        navigator.clipboard.writeText(text);
        showSuccess('Tarjetas copiadas al portapapeles');
    };

    const exportCards = () => {
        const text = generatedCards.join('\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `generated_cards_${Date.now()}.txt`;
        a.click();
        showSuccess('Tarjetas exportadas');
    };

    const clearAll = () => {
        setBin('');
        setMonth('');
        setYear('');
        setCvv('');
        setQuantity('10');
        setMixResults(false);
        setGeneratedCards([]);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="ccgen-overlay"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="ccgen-modal"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="ccgen-header">
                        <div className="ccgen-header-content">
                            <CreditCard size={24} />
                            <div>
                                <h2>CC Generator</h2>
                                <p>Deja los campos vacíos para randomizar</p>
                            </div>
                        </div>
                        <button className="ccgen-close" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="ccgen-content">
                        <div className="ccgen-form">
                            <div className="ccgen-input-group">
                                <label>BIN</label>
                                <input
                                    type="text"
                                    placeholder="Ej: 424242"
                                    value={bin}
                                    onChange={(e) => setBin(e.target.value.replace(/\D/g, '').slice(0, 16))}
                                    maxLength={16}
                                />
                            </div>

                            <div className="ccgen-row">
                                <div className="ccgen-input-group">
                                    <label>Mes</label>
                                    <input
                                        type="text"
                                        placeholder="MM"
                                        value={month}
                                        onChange={(e) => setMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                                        maxLength={2}
                                    />
                                </div>

                                <div className="ccgen-input-group">
                                    <label>Año</label>
                                    <input
                                        type="text"
                                        placeholder="YYYY"
                                        value={year}
                                        onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        maxLength={4}
                                    />
                                </div>
                            </div>

                            <div className="ccgen-input-group">
                                <label>CVV</label>
                                <input
                                    type="text"
                                    placeholder="Ej: 123"
                                    value={cvv}
                                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                    maxLength={4}
                                />
                            </div>

                            <div className="ccgen-input-group">
                                <label>Cantidad (1-100)</label>
                                <input
                                    type="number"
                                    placeholder="10"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    min="1"
                                    max="100"
                                />
                            </div>

                            <div className="ccgen-checkbox">
                                <input
                                    type="checkbox"
                                    id="mixResults"
                                    checked={mixResults}
                                    onChange={(e) => setMixResults(e.target.checked)}
                                />
                                <label htmlFor="mixResults">Mix Results</label>
                            </div>
                        </div>

                        {/* Generated Cards */}
                        {generatedCards.length > 0 && (
                            <div className="ccgen-results">
                                <div className="ccgen-results-header">
                                    <span>{generatedCards.length} tarjetas generadas</span>
                                    <div className="ccgen-results-actions">
                                        <button onClick={copyCards} title="Copiar">
                                            <Copy size={16} />
                                        </button>
                                        <button onClick={exportCards} title="Exportar">
                                            <Download size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="ccgen-results-list">
                                    {generatedCards.map((card, index) => (
                                        <div key={index} className="ccgen-result-item">
                                            {card}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="ccgen-footer">
                        <button className="ccgen-btn ccgen-btn-secondary" onClick={clearAll}>
                            Limpiar
                        </button>
                        <button className="ccgen-btn ccgen-btn-primary" onClick={generateCards}>
                            Generar
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CCGenerator;
