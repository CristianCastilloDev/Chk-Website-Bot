import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import './DateRangePicker.css';

const DateRangePicker = ({ value, onChange, label = "Período" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState(value || 'all');
    const [customRange, setCustomRange] = useState({ start: null, end: null });
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectingEnd, setSelectingEnd] = useState(false);
    const dropdownRef = useRef(null);

    const presets = [
        { id: 'today', label: 'Hoy' },
        { id: 'week', label: 'Última semana' },
        { id: 'month', label: 'Último mes' },
        { id: 'year', label: 'Último año' },
        { id: 'all', label: 'Todos los tiempos' },
        { id: 'custom', label: 'Rango personalizado' }
    ];

    // Sync selectedPreset with value prop
    useEffect(() => {
        if (value) {
            setSelectedPreset(value);
        }
    }, [value]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatDateRange = () => {
        if (selectedPreset === 'all') return 'Todos los tiempos';
        if (selectedPreset === 'custom' && customRange.start && customRange.end) {
            return `${formatDate(customRange.start)} - ${formatDate(customRange.end)}`;
        }
        const preset = presets.find(p => p.id === selectedPreset);
        return preset?.label || 'Seleccionar período';
    };

    const formatDate = (date) => {
        if (!date) return '';
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        return { daysInMonth, startingDayOfWeek, year, month };
    };

    const handlePresetClick = (presetId) => {
        setSelectedPreset(presetId);
        if (presetId !== 'custom') {
            onChange(presetId);
            setIsOpen(false);
        }
    };

    const handleApply = () => {
        if (selectedPreset === 'custom' && customRange.start && customRange.end) {
            onChange('custom', customRange);
        }
        setIsOpen(false);
    };

    const handleCancel = () => {
        setCustomRange({ start: null, end: null });
        setSelectingEnd(false);
        setIsOpen(false);
    };

    const navigateMonth = (direction) => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + direction);
        setCurrentMonth(newMonth);
    };

    const renderCalendar = (monthOffset = 0) => {
        const displayMonth = new Date(currentMonth);
        displayMonth.setMonth(displayMonth.getMonth() + monthOffset);
        
        const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(displayMonth);
        const monthName = displayMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        
        const days = [];
        const weekDays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

        // Empty cells before first day
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        // Days of month - FIX: Use the displayMonth's year and month, not currentMonth
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day); // Use year and month from getDaysInMonth
            const isSelected = customRange.start && date.toDateString() === customRange.start.toDateString() ||
                              customRange.end && date.toDateString() === customRange.end.toDateString();
            const isInRange = customRange.start && customRange.end && 
                            date >= customRange.start && date <= customRange.end;
            const isToday = date.toDateString() === new Date().toDateString();

            days.push(
                <div
                    key={day}
                    className={`calendar-day ${isSelected ? 'selected' : ''} ${isInRange ? 'in-range' : ''} ${isToday ? 'today' : ''}`}
                    onClick={() => {
                        // Pass the correct date including year and month
                        const selectedDate = new Date(year, month, day);
                        
                        if (!selectingEnd) {
                            setCustomRange({ start: selectedDate, end: null });
                            setSelectingEnd(true);
                        } else {
                            if (selectedDate < customRange.start) {
                                setCustomRange({ start: selectedDate, end: customRange.start });
                            } else {
                                setCustomRange({ ...customRange, end: selectedDate });
                            }
                            setSelectingEnd(false);
                        }
                    }}
                >
                    {day}
                </div>
            );
        }

        return (
            <div className="calendar-month">
                <div className="calendar-header">
                    {monthOffset === 0 && (
                        <button className="nav-btn" onClick={() => navigateMonth(-1)}>
                            ←
                        </button>
                    )}
                    <span className="month-name">{monthName}</span>
                    {monthOffset === 1 && (
                        <button className="nav-btn" onClick={() => navigateMonth(1)}>
                            →
                        </button>
                    )}
                </div>
                <div className="calendar-weekdays">
                    {weekDays.map(day => (
                        <div key={day} className="weekday">{day}</div>
                    ))}
                </div>
                <div className="calendar-grid">
                    {days}
                </div>
            </div>
        );
    };

    return (
        <div className="date-range-picker" ref={dropdownRef}>
            <button className="date-picker-trigger" onClick={() => setIsOpen(!isOpen)}>
                <Calendar size={16} />
                <span>{formatDateRange()}</span>
                <ChevronDown size={16} className={`chevron ${isOpen ? 'open' : ''}`} />
            </button>

            {isOpen && (
                <div className="date-picker-dropdown">
                    <div className="dropdown-content">
                        {selectedPreset !== 'custom' ? (
                            /* Presets */
                            <div className="presets-section">
                                {presets.map(preset => (
                                    <button
                                        key={preset.id}
                                        className={`preset-btn ${selectedPreset === preset.id ? 'active' : ''}`}
                                        onClick={() => handlePresetClick(preset.id)}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            /* Custom Range View */
                            <>
                                {/* Back Button */}
                                <button 
                                    className="back-btn"
                                    onClick={() => {
                                        setSelectedPreset('all');
                                        setCustomRange({ start: null, end: null });
                                        setSelectingEnd(false);
                                    }}
                                >
                                    ← Regresar
                                </button>

                                <div className="calendars-container">
                                    {renderCalendar(0)}
                                    {renderCalendar(1)}
                                </div>

                                {customRange.start && customRange.end && (
                                    <div className="selected-range">
                                        Rango: {formatDate(customRange.start)} – {formatDate(customRange.end)}
                                    </div>
                                )}

                                <div className="actions">
                                    <button className="btn-cancel" onClick={handleCancel}>
                                        Cancelar
                                    </button>
                                    <button 
                                        className="btn-apply" 
                                        onClick={handleApply}
                                        disabled={!customRange.start || !customRange.end}
                                    >
                                        Aplicar
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateRangePicker;
