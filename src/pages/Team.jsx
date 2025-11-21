import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, User, ChevronRight } from 'lucide-react';

const Team = () => {
    const { user, getDownlines, getAllUsers } = useAuth();
    const [downlines, setDownlines] = useState([]);
    const [uplineUser, setUplineUser] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            const directDownlines = getDownlines(user.nickname);
            // Fetch 2nd level downlines for each direct downline
            const downlinesWithNested = directDownlines.map(d => {
                const nested = getDownlines(d.nickname);
                return { ...d, nestedDownlines: nested };
            });
            setDownlines(downlinesWithNested);
        }
    }, [user, getDownlines]);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
            <div style={{ flex: 1, padding: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '2rem' }}>My Team</h1>

                {/* Downlines Section */}
                <div className="card">
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={24} color="#10B981" />
                        My Downlines ({downlines.length})
                    </h2>

                    {downlines.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {downlines.map(downline => (
                                <div
                                    key={downline.id}
                                    style={{
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '0.5rem',
                                        padding: '1rem',
                                        backgroundColor: '#F9FAFB',
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    <div
                                        onClick={() => navigate(`/calendar/${downline.id}`)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', marginBottom: '1rem' }}
                                    >
                                        <img src={downline.avatar} alt={downline.nickname} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600' }}>{downline.nickname}</div>
                                            <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>{downline.fullName}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#4F46E5', marginTop: '0.25rem', fontWeight: '500' }}>
                                                {downline.points} Points • {downline.streak} Day Streak
                                            </div>
                                        </div>
                                        <ChevronRight size={20} color="#9CA3AF" />
                                    </div>

                                    {/* Nested Downlines (2nd Level) */}
                                    {downline.nestedDownlines && downline.nestedDownlines.length > 0 && (
                                        <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {downline.nestedDownlines.map(nested => (
                                                <div
                                                    key={nested.id}
                                                    onClick={() => navigate(`/calendar/${nested.id}`)}
                                                    title={`${nested.nickname} (${nested.fullName})`}
                                                    style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '50%',
                                                        backgroundColor: '#E0E7FF',
                                                        color: '#4F46E5',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'bold',
                                                        cursor: 'pointer',
                                                        border: '2px solid white',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                                    }}
                                                >
                                                    {nested.avatar ? (
                                                        <img src={nested.avatar} alt={nested.nickname} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                                    ) : (
                                                        nested.nickname.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
                            <Users size={48} color="#D1D5DB" style={{ margin: '0 auto 1rem' }} />
                            <p>You don't have any downlines yet.</p>
                            <p style={{ fontSize: '0.875rem' }}>Invite friends to join and select you as their upline!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Team;
