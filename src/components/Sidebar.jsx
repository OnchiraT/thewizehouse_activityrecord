
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Calendar, User, Users, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ onClose }) => {
    const location = useLocation();
    const { logout, user } = useAuth();

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { path: '/', icon: Home, label: 'Dashboard' },
        { path: '/record', icon: PlusCircle, label: 'Record Activity' },
        { path: '/calendar', icon: Calendar, label: 'Calendar' },
        { path: '/team', icon: Users, label: 'My Team' },
        { path: '/profile', icon: User, label: 'Profile' },
    ];

    return (
        <div style={{
            width: '250px',
            backgroundColor: '#1F2937',
            color: 'white',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem'
        }}>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.25rem' }}>
                    W
                </div>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Wize House</span>
            </div>

            <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#374151', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img src={user?.avatar} alt="User" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', backgroundColor: '#fff' }} />
                <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.nickname}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{user?.points} Points</div>
                </div>
            </div>

            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.75rem 1rem',
                            borderRadius: '0.375rem',
                            color: isActive(item.path) ? 'white' : '#9CA3AF',
                            backgroundColor: isActive(item.path) ? '#4F46E5' : 'transparent',
                            transition: 'all 0.2s'
                        }}
                    >
                        <item.icon size={20} style={{ marginRight: '0.75rem' }} />
                        {item.label}
                    </Link>
                ))}
            </nav>

            <button
                onClick={logout}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.375rem',
                    color: '#EF4444',
                    marginTop: 'auto',
                    width: '100%',
                    textAlign: 'left'
                }}
            >
                <LogOut size={20} style={{ marginRight: '0.75rem' }} />
                Logout
            </button>
        </div>
    );
};

export default Sidebar;
