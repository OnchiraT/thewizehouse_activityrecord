import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle size={20} />;
            case 'error': return <AlertCircle size={20} />;
            case 'warning': return <AlertCircle size={20} />;
            default: return <Info size={20} />;
        }
    };

    const getColors = () => {
        switch (type) {
            case 'success': return { bg: '#ECFDF5', text: '#065F46', border: '#10B981' };
            case 'error': return { bg: '#FEF2F2', text: '#991B1B', border: '#EF4444' };
            case 'warning': return { bg: '#FFFBEB', text: '#92400E', border: '#F59E0B' };
            default: return { bg: '#EFF6FF', text: '#1E40AF', border: '#3B82F6' };
        }
    };

    const colors = getColors();

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem',
            backgroundColor: colors.bg,
            color: colors.text,
            borderLeft: `4px solid ${colors.border}`,
            borderRadius: '0.375rem',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            minWidth: '300px',
            maxWidth: '400px',
            animation: 'slideIn 0.3s ease-out'
        }}>
            <div style={{ color: colors.border }}>{getIcon()}</div>
            <div style={{ flex: 1, fontSize: '0.875rem', fontWeight: '500' }}>{message}</div>
            <button onClick={onClose} style={{ color: colors.text, opacity: 0.7 }}>
                <X size={16} />
            </button>
        </div>
    );
};

export default Toast;
