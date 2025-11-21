import React from 'react';
import { Flame } from 'lucide-react';

const StreakCounter = ({ streak }) => {
    return (
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #FFF 0%, #FEF2F2 100%)' }}>
            <div>
                <h3 style={{ color: '#6B7280', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Streak</h3>
                <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#EF4444', lineHeight: 1 }}>
                    {streak} <span style={{ fontSize: '1rem', fontWeight: '500', color: '#9CA3AF' }}>Days</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#4B5563', marginTop: '0.5rem' }}>
                    {streak > 0 ? "Keep the fire burning! 🔥" : "Start your streak today!"}
                </p>
            </div>
            <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: streak > 0 ? '#FEE2E2' : '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: streak > 0 ? '0 0 15px rgba(239, 68, 68, 0.3)' : 'none'
            }}>
                <Flame size={32} color={streak > 0 ? '#EF4444' : '#9CA3AF'} fill={streak > 0 ? '#EF4444' : 'none'} />
            </div>
        </div>
    );
};

export default StreakCounter;
