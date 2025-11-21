import React from 'react';
import { Award, Lock } from 'lucide-react';

const PromiseBadge = ({ streak }) => {
    const target = 56;
    const progress = Math.min((streak / target) * 100, 100);
    const daysLeft = Math.max(target - streak, 0);
    const isUnlocked = streak >= target;

    return (
        <div className="card" style={{ background: 'linear-gradient(135deg, #FFF 0%, #F0F9FF 100%)' }}>
            <div className="flex justify-between items-start" style={{ marginBottom: '1rem' }}>
                <div>
                    <h3 style={{ color: '#6B7280', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Promise Keeper Badge</h3>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827', marginTop: '0.25rem' }}>
                        56-Day Challenge
                    </div>
                </div>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: isUnlocked ? '#DBEAFE' : '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {isUnlocked ? <Award size={24} color="#3B82F6" /> : <Lock size={24} color="#9CA3AF" />}
                </div>
            </div>

            <div style={{ width: '100%', height: '8px', backgroundColor: '#E5E7EB', borderRadius: '9999px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#3B82F6', borderRadius: '9999px', transition: 'width 0.5s ease-out' }}></div>
            </div>

            <div className="flex justify-between items-center" style={{ fontSize: '0.875rem' }}>
                <span style={{ color: '#3B82F6', fontWeight: '600' }}>{Math.round(progress)}% Complete</span>
                <span style={{ color: '#6B7280' }}>{daysLeft > 0 ? `${daysLeft} days away` : 'Unlocked!'}</span>
            </div>
        </div>
    );
};

export default PromiseBadge;
