import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MapPin, Book, Video, Users, DollarSign, ArrowLeft, Camera, Upload } from 'lucide-react';
import UserSearch from '../components/UserSearch';

const RecordActivity = () => {
    const { user, addActivity, getAllUsers } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [selectedType, setSelectedType] = useState(null);
    const [formData, setFormData] = useState({});
    const [previewUrl, setPreviewUrl] = useState(null);
    const [location, setLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [isLocating, setIsLocating] = useState(false);

    const activityTypes = [
        { id: 'checkin', label: 'Check-in', color: '#EF4444', icon: MapPin, description: 'Onsite or Online Check-in' },
        { id: 'book', label: 'Book Summary', color: '#3B82F6', icon: Book, description: 'Read a book and share takeaways' },
        { id: 'clip', label: 'Clip Summary', color: '#10B981', icon: Video, description: 'Watch a clip and share takeaways' },
        { id: 'coaching', label: 'Coaching', color: '#F59E0B', icon: Users, description: 'Coach a team member' },
        { id: 'sale', label: 'Sale / Slip', color: '#8B5CF6', icon: DollarSign, description: 'Upload sale slip' },
    ];

    const handleTypeSelect = (type) => {
        setSelectedType(type);
        setFormData({});
        setPreviewUrl(null);
        setLocation(null);
        setLocationError(null);
        setIsLocating(false);
        setNotification(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'checkinType' && value === 'onsite') {
            getLocation();
        }
    };

    const getLocation = () => {
        setIsLocating(true);
        setLocationError(null);
        setLocation(null);

        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser');
            setIsLocating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
                setIsLocating(false);
            },
            (error) => {
                setLocationError('Unable to retrieve your location. Please allow location access.');
                setIsLocating(false);
            }
        );
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, image: reader.result }));
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const activity = {
            type: selectedType.id,
            ...formData,
            location: location,
            timestamp: new Date().toISOString()
        };

        const result = await addActivity(activity);

        if (result.success) {
            addToast(`Activity recorded! You earned ${result.pointsAdded} point(s).`, 'success');
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } else {
            addToast(result.message || 'Failed to record activity', 'error');
        }
    };

    // Check eligibility for points
    const today = new Date().toISOString().split('T')[0];
    // Note: user.history might now contain objects with date_string (Supabase) or dateString (legacy/local)
    // We should standardize, but for now let's check both or assume Supabase format 'date_string'
    const isEligible = selectedType && !user.history.some(a => (a.date_string || a.dateString) === today && a.type === selectedType.id);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
            <div style={{ flex: 1, padding: '2rem' }}>

                {!selectedType ? (
                    <>
                        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '2rem' }}>Record Activity</h1>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            {activityTypes.map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => handleTypeSelect(type)}
                                    className="card"
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        padding: '2rem',
                                        gap: '1rem',
                                        borderTop: `4px solid ${type.color}`,
                                        transition: 'transform 0.2s',
                                        textAlign: 'center'
                                    }}
                                >
                                    <div style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '50%',
                                        backgroundColor: `${type.color}20`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <type.icon size={28} color={type.color} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontWeight: '600', fontSize: '1.125rem' }}>{type.label}</h3>
                                        <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '0.5rem' }}>{type.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <button onClick={() => setSelectedType(null)} className="btn" style={{ marginBottom: '1.5rem', paddingLeft: 0 }}>
                            <ArrowLeft size={20} style={{ marginRight: '0.5rem' }} />
                            Back to Selection
                        </button>

                        <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <selectedType.icon color={selectedType.color} />
                                {selectedType.label}
                            </h2>
                            <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                backgroundColor: isEligible ? '#ECFDF5' : '#F3F4F6',
                                color: isEligible ? '#10B981' : '#6B7280'
                            }}>
                                {isEligible ? 'Eligible for Point' : 'Already done today'}
                            </span>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {/* Check-in Form */}
                            {selectedType.id === 'checkin' && (
                                <>
                                    <div className="flex flex-col gap-2">
                                        <label style={{ fontWeight: '500' }}>Check-in Type</label>
                                        <select name="checkinType" onChange={handleChange} required style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #D1D5DB' }}>
                                            <option value="">Select Type</option>
                                            <option value="onsite">Type A: Onsite (GPS)</option>
                                            <option value="online">Type B: Online (Photo)</option>
                                        </select>
                                    </div>
                                    {formData.checkinType === 'onsite' && (
                                        <div style={{ padding: '1rem', backgroundColor: '#F3F4F6', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
                                            {isLocating && <div style={{ color: '#6B7280' }}>Detecting location...</div>}

                                            {location && (
                                                <div style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <MapPin size={16} />
                                                    Location detected: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                                </div>
                                            )}

                                            {locationError && (
                                                <div style={{ color: '#DC2626' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                        <MapPin size={16} />
                                                        {locationError}
                                                    </div>
                                                    <button type="button" onClick={getLocation} className="btn" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', border: '1px solid #DC2626' }}>
                                                        Retry Location
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {formData.checkinType === 'online' && (
                                        <div className="flex flex-col gap-2">
                                            <label style={{ fontWeight: '500' }}>Upload Screen Capture</label>
                                            <input type="file" accept="image/*" onChange={handleFileChange} required />
                                            {previewUrl && <img src={previewUrl} alt="Preview" style={{ width: '100%', borderRadius: '0.375rem', marginTop: '0.5rem' }} />}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Book Summary Form */}
                            {selectedType.id === 'book' && (
                                <>
                                    <div className="flex flex-col gap-2">
                                        <label style={{ fontWeight: '500' }}>Book Title</label>
                                        <input type="text" name="bookTitle" onChange={handleChange} required style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #D1D5DB' }} />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label style={{ fontWeight: '500' }}>Key Takeaway</label>
                                        <textarea name="summary" rows="4" onChange={handleChange} required style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #D1D5DB' }}></textarea>
                                    </div>
                                </>
                            )}

                            {/* Clip Summary Form */}
                            {selectedType.id === 'clip' && (
                                <>
                                    <div className="flex flex-col gap-2">
                                        <label style={{ fontWeight: '500' }}>Clip Link</label>
                                        <input type="url" name="clipLink" onChange={handleChange} required style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #D1D5DB' }} />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label style={{ fontWeight: '500' }}>Key Takeaway</label>
                                        <textarea name="summary" rows="4" onChange={handleChange} required style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #D1D5DB' }}></textarea>
                                    </div>
                                </>
                            )}

                            {/* Coaching Form */}
                            {selectedType.id === 'coaching' && (
                                <>
                                    <div className="flex flex-col gap-2">
                                        <label style={{ fontWeight: '500' }}>Who did you coach?</label>
                                        <UserSearch
                                            onSelect={(u) => setFormData(prev => ({ ...prev, coachee: u ? u.nickname : '' }))}
                                            placeholder="Search Coachee..."
                                            excludeUserId={user.id}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label style={{ fontWeight: '500' }}>Key Takeaway / Notes</label>
                                        <textarea name="notes" rows="4" onChange={handleChange} required style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #D1D5DB' }}></textarea>
                                    </div>
                                </>
                            )}

                            {/* Sale Form */}
                            {selectedType.id === 'sale' && (
                                <>
                                    <div className="flex flex-col gap-2">
                                        <label style={{ fontWeight: '500' }}>Sale Amount (Optional)</label>
                                        <input type="number" name="amount" onChange={handleChange} style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #D1D5DB' }} />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label style={{ fontWeight: '500' }}>Notes</label>
                                        <textarea name="notes" rows="2" onChange={handleChange} style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #D1D5DB' }}></textarea>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label style={{ fontWeight: '500' }}>Upload Slip</label>
                                        <input type="file" accept="image/*" onChange={handleFileChange} required />
                                        {previewUrl && <img src={previewUrl} alt="Preview" style={{ width: '100%', borderRadius: '0.375rem', marginTop: '0.5rem' }} />}
                                    </div>
                                </>
                            )}

                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ marginTop: '1rem', opacity: (formData.checkinType === 'onsite' && !location) ? 0.5 : 1 }}
                                disabled={formData.checkinType === 'onsite' && !location}
                            >
                                Submit Activity
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecordActivity;
