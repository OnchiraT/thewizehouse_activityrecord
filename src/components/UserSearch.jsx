import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const UserSearch = ({ onSelect, placeholder = "Search mentor...", initialValue = null, excludeUserId = null, users = null }) => {
    const { getAllUsers } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [internalUsers, setInternalUsers] = useState([]);
    const wrapperRef = useRef(null);

    // Use provided users prop or internal state
    const sourceUsers = users || internalUsers;

    useEffect(() => {
        // If users prop is not provided, fetch them
        if (!users) {
            const fetchUsers = async () => {
                const data = await getAllUsers();
                setInternalUsers(data || []);
            };
            fetchUsers();
        }
    }, [users, getAllUsers]);

    useEffect(() => {
        if (initialValue && sourceUsers.length > 0) {
            const found = sourceUsers.find(u => u.nickname === initialValue || u.id === initialValue);
            if (found) {
                setSelectedUser(found);
                setSearchTerm(found.nickname);
            }
        }
    }, [initialValue, sourceUsers]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        setIsOpen(true);
        setSelectedUser(null); // Clear selection when typing

        if (term.trim() === '') {
            setFilteredUsers([]);
            return;
        }

        const filtered = sourceUsers.filter(user => {
            if (excludeUserId && user.id === excludeUserId) return false;
            const searchLower = term.toLowerCase();
            return (
                user.nickname.toLowerCase().includes(searchLower) ||
                user.fullName.toLowerCase().includes(searchLower)
            );
        });
        setFilteredUsers(filtered);
    };

    const handleSelect = (user) => {
        setSelectedUser(user);
        setSearchTerm(user.nickname);
        setIsOpen(false);
        onSelect(user);
    };

    const clearSelection = () => {
        setSelectedUser(null);
        setSearchTerm('');
        onSelect(null);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    style={{
                        width: '100%',
                        padding: '0.75rem 1rem 0.75rem 2.5rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #D1D5DB',
                        outline: 'none'
                    }}
                />
                <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                {searchTerm && (
                    <button
                        onClick={clearSelection}
                        style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {isOpen && filteredUsers.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '0.5rem',
                    backgroundColor: 'white',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    zIndex: 50,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    border: '1px solid #E5E7EB'
                }}>
                    {filteredUsers.map(user => (
                        <div
                            key={user.id}
                            onClick={() => handleSelect(user)}
                            style={{
                                padding: '0.75rem 1rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                borderBottom: '1px solid #F3F4F6'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        >
                            <img src={user.avatar} alt={user.nickname} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                            <div>
                                <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>{user.nickname}</div>
                                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{user.fullName}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserSearch;
