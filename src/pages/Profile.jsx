import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Camera, Upload, ArrowLeft, Edit2, Save, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import UserSearch from '../components/UserSearch';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        nickname: '',
        avatar: null
    });
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName,
                nickname: user.nickname,
                avatar: user.avatar_url || user.avatar
            });
            setPreviewUrl(user.avatar_url || user.avatar);
        }
    }, [user]);

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

    const { addToast } = useToast();

    const handleSave = async () => {
        const result = await updateUser(formData);
        if (result && result.success) {
            addToast('Profile updated successfully!', 'success');
            setIsEditing(false);
        } else {
            addToast(result?.error || 'Failed to update profile', 'error');
        }
    };

    const handleCancel = () => {
        setFormData({
            fullName: user.fullName,
            nickname: user.nickname,
            avatar: user.avatar_url || user.avatar
        });
        setPreviewUrl(user.avatar_url || user.avatar);
        setIsEditing(false);
    };

    if (!user) return null;

    return (
        <div className="container" style={{ padding: '2rem 0', maxWidth: '600px' }}>
            <div className="card">
                <div className="flex items-center justify-between" style={{ marginBottom: '2rem' }}>
                    <Link to="/" className="btn" style={{ paddingLeft: 0 }}>
                        <ArrowLeft size={20} style={{ marginRight: '0.5rem' }} />
                        Back to Dashboard
                    </Link>
                    {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="btn btn-primary">
                            <Edit2 size={16} style={{ marginRight: '0.5rem' }} />
                            Edit Profile
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={handleCancel} className="btn" style={{ border: '1px solid #D1D5DB' }}>
                                <X size={16} style={{ marginRight: '0.5rem' }} />
                                Cancel
                            </button>
                            <button onClick={handleSave} className="btn btn-primary">
                                <Save size={16} style={{ marginRight: '0.5rem' }} />
                                Save
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-center gap-4">
                    {/* Avatar Section */}
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            border: '4px solid #fff',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}>
                            <img src={previewUrl || user.avatar_url || user.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        {isEditing && (
                            <label style={{
                                position: 'absolute',
                                bottom: '0',
                                right: '0',
                                backgroundColor: '#4F46E5',
                                color: 'white',
                                padding: '0.5rem',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgb(0 0 0 / 0.1)'
                            }}>
                                <Camera size={16} />
                                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                            </label>
                        )}
                        {/* Streak Badge (View Only) */}
                        {!isEditing && (
                            <div style={{
                                position: 'absolute',
                                bottom: '0',
                                right: '0',
                                backgroundColor: '#EF4444',
                                color: 'white',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                border: '2px solid white'
                            }}>
                                🔥 {user.streak} Days
                            </div>
                        )}
                    </div>

                    {/* Info Section */}
                    <div className="flex flex-col gap-4" style={{ width: '100%', marginTop: '1rem' }}>
                        <div className="flex flex-col gap-2">
                            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280' }}>Nickname</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="nickname"
                                    value={formData.nickname}
                                    onChange={handleChange}
                                    style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #D1D5DB' }}
                                />
                            ) : (
                                <div style={{ fontSize: '1.125rem', fontWeight: '600' }}>{user.nickname}</div>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280' }}>Full Name</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #D1D5DB' }}
                                />
                            ) : (
                                <div style={{ fontSize: '1.125rem', fontWeight: '600' }}>{user.fullName}</div>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280' }}>Mentor</label>
                            {isEditing ? (
                                <UserSearch
                                    initialValue={formData.upline || user.upline}
                                    onSelect={(u) => setFormData(prev => ({ ...prev, upline: u ? u.nickname : '' }))}
                                    placeholder="Search new Mentor..."
                                    excludeUserId={user.id}
                                />
                            ) : (
                                <div style={{ fontSize: '1rem', color: '#4B5563' }}>{user.upline || 'None'}</div>
                            )}
                        </div>

                        {!isEditing && (
                            <div className="flex gap-4" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' }}>
                                <div style={{ flex: 1, textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Total Score</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3B82F6' }}>{user.points || 0}</div>
                                </div>
                                <div style={{ flex: 1, textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Current Streak</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#EF4444' }}>{user.streak || 0}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
