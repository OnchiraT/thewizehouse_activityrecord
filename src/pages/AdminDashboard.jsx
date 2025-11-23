import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Users, Trash2, RefreshCw, Shield, LogOut, Edit2, Download } from 'lucide-react';
import UserSearch from '../components/UserSearch';
import { supabase } from '../lib/supabaseClient';
import * as XLSX from 'xlsx';

const AdminDashboard = () => {
    const { getAllUsers } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('users');
    const [editingUser, setEditingUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const isAdmin = localStorage.getItem('isAdmin');
        if (!isAdmin) {
            navigate('/admin/login');
            return;
        }
        fetchUsers();
    }, [navigate]);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false }); // assuming created_at exists in profiles? No, join_date
        // .order('join_date', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
            addToast('Failed to load users', 'error');
        } else {
            setUsers(data || []);
        }
        setLoading(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('isAdmin');
        navigate('/login');
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user? This will delete their profile and activity history. (Auth account cannot be deleted from here)')) {
            // Delete activities first (cascade should handle it if set, but let's be safe)
            const { error: actError } = await supabase
                .from('activities')
                .delete()
                .eq('user_id', userId);

            if (actError) {
                addToast('Failed to delete user activities', 'error');
                return;
            }

            // Delete profile
            const { error: profError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

            if (profError) {
                addToast('Failed to delete user profile', 'error');
            } else {
                addToast('User data deleted successfully', 'success');
                fetchUsers();
            }
        }
    };

    const handleResetHistory = async (userId) => {
        if (window.confirm('Reset activity history for this user? This cannot be undone.')) {
            const { error } = await supabase
                .from('activities')
                .delete()
                .eq('user_id', userId);

            if (error) {
                addToast('Failed to reset history', 'error');
            } else {
                // Reset points and streak in profile
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ points: 0, streak: 0 })
                    .eq('id', userId);

                if (updateError) {
                    addToast('Failed to reset stats', 'error');
                } else {
                    addToast('User history and stats reset', 'success');
                    fetchUsers();
                }
            }
        }
    };

    const handleUpdateUpline = async (userId, newUplineNickname) => {
        const { error } = await supabase
            .from('profiles')
            .update({ upline: newUplineNickname })
            .eq('id', userId);

        if (error) {
            addToast('Failed to update upline', 'error');
        } else {
            addToast('Upline updated', 'success');
            setEditingUser(null);
            fetchUsers();
        }
    };

    const handleExportAllData = async () => {
        // Fetch all activities with user details
        const { data: activities, error } = await supabase
            .from('activities')
            .select(`
                *,
                profiles (nickname, full_name, upline)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            addToast('Failed to fetch data for export', 'error');
            return;
        }

        const rows = activities.map(a => ({
            Date: a.date_string,
            Time: new Date(a.created_at).toLocaleTimeString(),
            User: a.profiles?.nickname,
            FullName: a.profiles?.full_name,
            Upline: a.profiles?.upline,
            Type: a.type,
            Details: JSON.stringify(a.data), // Simplified
            Points: 1
        }));

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "All Activities");
        XLSX.writeFile(workbook, "all_activities_export.xlsx");
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
            {/* Admin Header */}
            <div style={{ backgroundColor: '#1F2937', color: 'white', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Shield size={24} />
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Admin Dashboard</h1>
                </div>
                <div className="flex gap-4">
                    <button onClick={handleExportAllData} className="btn" style={{ backgroundColor: '#10B981', color: 'white', border: 'none' }}>
                        <Download size={16} style={{ marginRight: '0.5rem' }} />
                        Export All Data
                    </button>
                    <button onClick={handleLogout} className="btn" style={{ color: 'white', borderColor: 'white' }}>
                        <LogOut size={16} style={{ marginRight: '0.5rem' }} />
                        Logout
                    </button>
                </div>
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
                </div>

                {/* User Management Table */}
                {activeTab === 'users' && (
                    <div className="card" style={{ overflowX: 'auto' }}>
                        {loading ? (
                            <div className="p-4 text-center">Loading users...</div>
                        ) : (
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
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt={user.nickname} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#E5E7EB' }}></div>
                                                    )}
                                                    <div>
                                                        <div style={{ fontWeight: '600' }}>{user.nickname}</div>
                                                        <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>{user.full_name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>ID: {user.id}</div>
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
                                                        title="Delete User Data"
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
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
