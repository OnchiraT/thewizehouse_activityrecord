import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Flame, Lock, Award, PlusCircle, Calendar as CalendarIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getQuote } from '../utils/quotes';

const Dashboard = () => {
    const { user } = useAuth();
    const [quote, setQuote] = useState('');
    const streak = user?.streak || 0;
    const goal = 56; // 8 weeks
    const progress = Math.min((streak / goal) * 100, 100);

    useEffect(() => {
        setQuote(getQuote(streak));
    }, [streak]);

    // Determine color based on streak
    const getStreakColor = (days) => {
        if (days >= 56) return 'url(#goldGradient)'; // Gold
        if (days >= 42) return '#A855F7'; // Purple
        if (days >= 28) return '#EF4444'; // Red
        if (days >= 14) return '#F97316'; // Orange
        return '#EAB308'; // Yellow
    };

    const strokeColor = getStreakColor(streak);
    const isGold = streak >= 56;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1rem' }}>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1F2937', marginBottom: '2rem', textAlign: 'center' }}>
                Your Consistency Journey
            </h1>

            {/* Circular Progress */}
            <div style={{ position: 'relative', width: '280px', height: '280px', marginBottom: '2rem' }}>
                {/* Outer Shadow/Glow */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    boxShadow: isGold
                        ? '0 0 60px rgba(234, 179, 8, 0.6)'
                        : '0 0 40px rgba(0,0,0,0.05)',
                    background: 'white',
                    animation: isGold ? 'pulse-gold 2s infinite' : 'none'
                }}></div>

                {/* CSS for Gold Animation */}
                <style>
                    {`
                        @keyframes pulse-gold {
                            0% { box-shadow: 0 0 40px rgba(234, 179, 8, 0.4); }
                            50% { box-shadow: 0 0 70px rgba(234, 179, 8, 0.8); }
                            100% { box-shadow: 0 0 40px rgba(234, 179, 8, 0.4); }
                        }
                        @keyframes shimmer {
                            0% { stop-color: #FDE68A; }
                            50% { stop-color: #D97706; }
                            100% { stop-color: #FDE68A; }
                        }
                    `}
                </style>

                <svg width="280" height="280" viewBox="0 0 280 280" style={{ transform: 'rotate(-90deg)' }}>
                    <defs>
                        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#FDE68A" />
                            <stop offset="50%" stopColor="#D97706">
                                <animate attributeName="stop-color" values="#D97706; #FDE68A; #D97706" dur="3s" repeatCount="indefinite" />
                            </stop>
                            <stop offset="100%" stopColor="#FDE68A" />
                        </linearGradient>
                    </defs>

                    {/* Background Circle */}
                    <circle
                        cx="140"
                        cy="140"
                        r="120"
                        fill="none"
                        stroke="#F3F4F6"
                        strokeWidth="12"
                    />
                    {/* Progress Circle */}
                    <circle
                        cx="140"
                        cy="140"
                        r="120"
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="12"
                        strokeDasharray={`${2 * Math.PI * 120}`}
                        strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s ease-in-out, stroke 0.5s ease' }}
                    />
                </svg>

                {/* Center Content */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Flame
                        size={48}
                        color={isGold ? '#EAB308' : '#9CA3AF'}
                        style={{
                            marginBottom: '0.5rem',
                            fill: isGold ? '#FDE68A' : '#E5E7EB',
                            filter: isGold ? 'drop-shadow(0 0 10px rgba(234, 179, 8, 0.5))' : 'none'
                        }}
                    />
                    <div style={{
                        fontSize: '5rem',
                        fontWeight: 'bold',
                        color: isGold ? '#D97706' : '#1F2937',
                        lineHeight: 1,
                        textShadow: isGold ? '0 2px 10px rgba(217, 119, 6, 0.3)' : 'none'
                    }}>
                        {streak}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: '600', color: '#6B7280', letterSpacing: '0.05em' }}>
                        DAYS STREAK
                    </div>
                </div>
            </div>

            {/* Quote & Encouragement */}
            <div style={{ textAlign: 'center', maxWidth: '500px', marginBottom: '2rem' }}>
                <p style={{ fontSize: '1.125rem', color: '#4B5563', fontStyle: 'italic', marginBottom: '1rem' }}>
                    "{quote}"
                </p>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#374151' }}>
                    "เยี่ยมเลย คุณทำต่อเนื่องมา <span style={{ color: isGold ? '#D97706' : strokeColor === 'url(#goldGradient)' ? '#EAB308' : strokeColor }}>{streak}</span> วันแล้วนะ"
                </h2>
            </div>

            {/* Total Points Card */}
            <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: '#DBEAFE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Award size={24} color="#3B82F6" />
                    </div>
                    <div>
                        <h3 style={{ fontWeight: 'bold', color: '#1F2937' }}>Total Points</h3>
                        <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>Accumulated Score</p>
                    </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3B82F6' }}>
                    {user?.points || 0}
                </div>
            </div>

            {/* Badge Card */}
            <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '1.5rem', border: isGold ? '2px solid #FDE68A' : 'none', boxShadow: isGold ? '0 10px 25px -5px rgba(234, 179, 8, 0.2)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            backgroundColor: isGold ? '#FEF3C7' : '#F3F4F6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Award size={24} color={isGold ? '#D97706' : '#6B7280'} />
                        </div>
                        <div>
                            <h3 style={{ fontWeight: 'bold', color: '#1F2937' }}>Promise Keeper Badge</h3>
                            <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>Consistency for 8 Weeks</p>
                        </div>
                    </div>
                    {streak < goal ? <Lock size={20} color="#9CA3AF" /> : <Award size={24} color="#EAB308" fill="#EAB308" />}
                </div>

                {/* Progress Bar */}
                <div style={{ height: '12px', backgroundColor: '#F3F4F6', borderRadius: '6px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                    <div style={{
                        height: '100%',
                        width: `${progress}%`,
                        background: isGold ? 'linear-gradient(90deg, #FDE68A 0%, #D97706 100%)' : '#1F2937',
                        borderRadius: '6px',
                        transition: 'width 1s ease-in-out'
                    }}></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '600' }}>
                    <span style={{ color: isGold ? '#D97706' : '#F97316' }}>{streak} Days done</span>
                    <span style={{ color: '#9CA3AF' }}>{Math.max(0, goal - streak)} Days away</span>
                    <span style={{ color: '#1F2937' }}>Goal: {goal} Days</span>
                </div>
            </div>

            {/* Quick Actions (Preserved for functionality) */}
            <div style={{ marginTop: '2rem', width: '100%', maxWidth: '500px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Link to="/record" className="btn btn-primary" style={{ justifyContent: 'center', backgroundColor: '#1F2937' }}>
                    <PlusCircle size={18} style={{ marginRight: '0.5rem' }} />
                    Record
                </Link>
                <Link to="/calendar" className="btn" style={{ justifyContent: 'center', border: '1px solid #D1D5DB', backgroundColor: 'white' }}>
                    <CalendarIcon size={18} style={{ marginRight: '0.5rem' }} />
                    Calendar
                </Link>
            </div>
        </div>
    );
};

export default Dashboard;
