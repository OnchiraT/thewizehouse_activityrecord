import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Users, Trash2, RefreshCw, Shield, LogOut, Edit2 } from 'lucide-react';
import UserSearch from '../components/UserSearch';

const AdminDashboard = () => {
    const { getAllUsers, updateUser, deleteUser } = useAuth(); // Assuming deleteUser exists or needs to be added
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('users');
    const [editingUser, setEditingUser] = useState(null);

    useEffect(() => {
        const isAdmin = localStorage.getItem('isAdmin');
        if (!isAdmin) {
            navigate('/admin/login');
            return;
        }
        setUsers(getAllUsers());
    }, [getAllUsers, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('isAdmin');
        navigate('/login');
    };

    const handleDeleteUser = (userId) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            // Mock delete for now if not in context, or implement in context
            // For now, let's assume we need to add deleteUser to AuthContext or handle it here manually with localStorage
            const currentUsers = JSON.parse(localStorage.getItem('users') || '[]');
            const updatedUsers = currentUsers.filter(u => u.id !== userId);
            localStorage.setItem('users', JSON.stringify(updatedUsers));
            setUsers(updatedUsers);
            addToast('User deleted successfully', 'success');
        }
    };

    const handleResetHistory = (userId) => {
        if (window.confirm('Reset activity history for this user?')) {
            const currentUsers = JSON.parse(localStorage.getItem('users') || '[]');
            const updatedUsers = currentUsers.map(u => {
                if (u.id === userId) {
                    return { ...u, history: [], points: 0, streak: 0 };
                }
                return u;
            });
            localStorage.setItem('users', JSON.stringify(updatedUsers));
            setUsers(updatedUsers);
            addToast('User history reset', 'success');
        }
    };

    const handleUpdateUpline = (userId, newUplineNickname) => {
        const currentUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const updatedUsers = currentUsers.map(u => {
            if (u.id === userId) {
                return { ...u, upline: newUplineNickname };
            }
            return u;
        });
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        setUsers(updatedUsers);
        addToast('Upline updated', 'success');
        setEditingUser(null);
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
            {/* Admin Header */}
            <div style={{ backgroundColor: '#1F2937', color: 'white', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Shield size={24} />
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Admin Dashboard</h1>
                </div>
                <button onClick={handleLogout} className="btn" style={{ color: 'white', borderColor: 'white' }}>
                    <LogOut size={16} style={{ marginRight: '0.5rem' }} />
                    Logout
                </button>
            </div>

            <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`btn ${activeTab === 'users' ? 'btn-primary' : ''}`}
                        style={{ backgroundColor: activeTab === 'users' ? '#1F2937' : 'white', color: activeTab === 'users' ? 'white' : '#374151' }}
                    >
                        <Users size={16} style={{ marginRight: '0.5rem' }} />
                        User Management
                    </button>
                    {/* Add more tabs later if needed */}
                </div>

                {/* User Management Table */}
                {activeTab === 'users' && (
                    <div className="card" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #E5E7EB', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem' }}>User</th>
                                    <th style={{ padding: '1rem' }}>Upline</th>
                                    <th style={{ padding: '1rem' }}>Stats</th>
                                    <th style={{ padding: '1rem' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div className="flex items-center gap-3">
                                                <img src={user.avatar} alt={user.nickname} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                                <div>
                                                    <div style={{ fontWeight: '600' }}>{user.nickname}</div>
                                                    <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>{user.fullName}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {editingUser === user.id ? (
                                                <div style={{ minWidth: '200px' }}>
                                                    <UserSearch
                                                        initialValue={user.upline}
                                                        onSelect={(u) => handleUpdateUpline(user.id, u ? u.nickname : '')}
                                                        excludeUserId={user.id}
                                                        placeholder="Select new upline..."
                                                    />
                                                    <button onClick={() => setEditingUser(null)} style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '0.5rem' }}>Cancel</button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span>{user.upline || '-'}</span>
                                                    <button onClick={() => setEditingUser(user.id)} style={{ color: '#3B82F6' }}>
                                                        <Edit2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.875rem' }}>
                                                <div>Points: <strong>{user.points}</strong></div>
                                                <div>Streak: <strong>{user.streak}</strong></div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleResetHistory(user.id)}
                                                    title="Reset History & Stats"
                                                    className="btn"
                                                    style={{ padding: '0.5rem', color: '#F59E0B', borderColor: '#F59E0B' }}
                                                >
                                                    <RefreshCw size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    title="Delete User"
                                                    className="btn"
                                                    style={{ padding: '0.5rem', color: '#EF4444', borderColor: '#EF4444' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
