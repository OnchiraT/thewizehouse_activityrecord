
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Camera, Upload } from 'lucide-react';
import UserSearch from '../components/UserSearch';

const Register = () => {
    const navigate = useNavigate();
    const { register, getAllUsers } = useAuth();
    const { addToast } = useToast();

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        nickname: '',
        password: '',
        upline: '',
        avatar: null
    });
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uplines, setUplines] = useState([]);

    useEffect(() => {
        const fetchUplines = async () => {
            const users = await getAllUsers();
            setUplines(users || []);
        };
        fetchUplines();
    }, [getAllUsers]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, avatar: reader.result }));
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.avatar) {
            addToast('Please upload a profile picture', 'warning');
            return;
        }

        const result = await register(formData);
        if (result.success) {
            addToast('Welcome to The Wize House!', 'success');
            navigate('/');
        } else {
            addToast(result.message, 'error');
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '2rem 0' }}>
            <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
                <h2 className="text-center" style={{ marginBottom: '1.5rem' }}>Join The Wize House</h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-2">
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            backgroundColor: '#E5E7EB',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid #E5E7EB'
                        }}>
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <Camera size={40} color="#9CA3AF" />
                            )}
                        </div>
                        <label className="btn" style={{ border: '1px solid #D1D5DB', fontSize: '0.875rem' }}>
                            <Upload size={16} style={{ marginRight: '0.5rem' }} />
                            Upload Photo
                            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                        </label>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="fullName" style={{ fontSize: '0.875rem', fontWeight: '500' }}>Full Name</label>
                        <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #D1D5DB' }}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="email" style={{ fontSize: '0.875rem', fontWeight: '500' }}>Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #D1D5DB' }}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="nickname" style={{ fontSize: '0.875rem', fontWeight: '500' }}>Nickname (Display Name)</label>
                        <input
                            type="text"
                            id="nickname"
                            name="nickname"
                            value={formData.nickname}
                            onChange={handleChange}
                            required
                            style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #D1D5DB' }}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="password" style={{ fontSize: '0.875rem', fontWeight: '500' }}>Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #D1D5DB' }}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="upline" style={{ fontSize: '0.875rem', fontWeight: '500' }}>Mentor (Optional)</label>
                        <UserSearch
                            users={uplines}
                            onSelect={(user) => setFormData(prev => ({ ...prev, upline: user ? user.nickname : '' }))}
                            placeholder="Search for Mentor..."
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                        Register
                    </button>
                </form>

                <div className="text-center" style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: '#6B7280' }}>
                    Already have an account? <Link to="/login" style={{ color: '#4F46E5', fontWeight: '500' }}>Login</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
