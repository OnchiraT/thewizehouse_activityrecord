
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import '../styles/global.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Login.jsx: Submitting login...');
        const result = await login(email, password);
        console.log('Login.jsx: Login result:', result);
        if (result.success) {
            addToast('Welcome back!', 'success');
            console.log('Login.jsx: Navigating to dashboard...');
            navigate('/', { replace: true });
        } else {
            addToast(result.message, 'error');
        }
    };

    // If user is already logged in, redirect to dashboard
    React.useEffect(() => {
        console.log('Login.jsx: useEffect triggered, user:', user);
        if (user) {
            console.log('Login.jsx: User exists, redirecting to dashboard...');
            navigate('/', { replace: true });
        }
    }, [user, navigate]);

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <h2 className="text-center" style={{ marginBottom: '1.5rem' }}>Welcome Back</h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="email" style={{ fontSize: '0.875rem', fontWeight: '500' }}>Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #D1D5DB' }}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="password" style={{ fontSize: '0.875rem', fontWeight: '500' }}>Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #D1D5DB' }}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                        Login
                    </button>
                </form>

                <div className="text-center" style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: '#6B7280' }}>
                    Don't have an account? <Link to="/register" style={{ color: '#4F46E5', fontWeight: '500' }}>Register</Link>
                </div>
                <div className="text-center" style={{ marginTop: '1rem', fontSize: '0.75rem' }}>
                    <Link to="/admin/login" style={{ color: '#9CA3AF' }}>Admin Panel Login</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
