import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { Shield } from 'lucide-react';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { addToast } = useToast();

    const handleLogin = (e) => {
        e.preventDefault();
        if (username === 'Admin' && password === 'PJtwh2025') {
            localStorage.setItem('isAdmin', 'true');
            addToast('Admin login successful', 'success');
            navigate('/admin/dashboard');
        } else {
            addToast('Invalid admin credentials', 'error');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#1F2937', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Shield size={32} color="white" />
                    </div>
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Admin Login</h2>
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #D1D5DB' }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #D1D5DB' }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#1F2937' }}>
                        Login to Admin Panel
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
