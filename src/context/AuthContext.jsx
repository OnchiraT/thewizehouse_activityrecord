import React, { createContext, useState, useContext, useEffect } from 'react';
import { getBKKDateString } from '../utils/dateUtils';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for logged in user in localStorage
        const storedUser = localStorage.getItem('wize_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = (nickname, password) => {
        // Mock login logic
        const users = JSON.parse(localStorage.getItem('wize_users') || '[]');
        const foundUser = users.find(u => u.nickname === nickname && u.password === password);

        if (foundUser) {
            setUser(foundUser);
            localStorage.setItem('wize_user', JSON.stringify(foundUser));
            return { success: true };
        }
        return { success: false, message: 'Invalid nickname or password' };
    };

    const register = (userData) => {
        // Mock registration logic
        const users = JSON.parse(localStorage.getItem('wize_users') || '[]');

        if (users.find(u => u.nickname === userData.nickname)) {
            return { success: false, message: 'Nickname already taken' };
        }

        const newUser = {
            ...userData,
            id: Date.now().toString(),
            points: 0,
            streak: 0,
            history: [],
            joinDate: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('wize_users', JSON.stringify(users));

        // Auto login after register
        setUser(newUser);
        localStorage.setItem('wize_user', JSON.stringify(newUser));

        return { success: true };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('wize_user');
    };

    const updateUser = (updates) => {
        if (!user) return;

        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem('wize_user', JSON.stringify(updatedUser));

        // Update in users array as well
        const users = JSON.parse(localStorage.getItem('wize_users') || '[]');
        const userIndex = users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
            users[userIndex] = updatedUser;
            localStorage.setItem('wize_users', JSON.stringify(users));
        }
    };

    const addActivity = (activity) => {
        if (!user) return { success: false, message: 'Not logged in' };

        const today = getBKKDateString();
        const newActivity = {
            ...activity,
            id: Date.now().toString(),
            date: new Date().toISOString(), // Keep timestamp as UTC/ISO for sorting/storage
            dateString: today // Use BKK date string for grouping/scoring
        };

        // Check if activity type already done today for points
        const activitiesToday = user.history.filter(a => a.dateString === today && a.type === activity.type);
        const isEligibleForPoints = activitiesToday.length === 0;

        let pointsToAdd = 0;
        if (isEligibleForPoints) {
            pointsToAdd = 1;
        }

        // Update Streak Logic
        // If last activity was yesterday, increment streak.
        // If last activity was today, keep streak.
        // If last activity was before yesterday, reset streak to 1.
        // (Simplified: Just check if we have ANY activity today or yesterday)

        // Actually, streak usually means "consecutive days with AT LEAST ONE activity".
        // So if I already have activity today, streak doesn't change.
        // If I have no activity today, but had yesterday, streak increments (only once per day).
        // Wait, streak should increment only once per day.

        const hasActivityToday = user.history.some(a => a.dateString === today);

        // Calculate yesterday in BKK time
        const bkkNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
        bkkNow.setDate(bkkNow.getDate() - 1);
        const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: "Asia/Bangkok", year: 'numeric', month: '2-digit', day: '2-digit' });
        const yesterday = formatter.format(bkkNow);

        const hasActivityYesterday = user.history.some(a => a.dateString === yesterday);

        let newStreak = user.streak;

        if (!hasActivityToday) {
            if (hasActivityYesterday) {
                newStreak += 1;
            } else if (user.streak === 0) {
                newStreak = 1;
            } else {
                // Check if we missed a day (already handled by not incrementing, but if we missed more?)
                // For simplicity, if no activity yesterday and streak > 0, it should have been reset already? 
                // Or we reset it now.
                // Let's assume we reset on login or here.
                // If !hasActivityYesterday && streak > 0 -> reset to 1 (today is day 1)
                newStreak = 1;
            }
        }

        const updatedUser = {
            ...user,
            points: user.points + pointsToAdd,
            streak: newStreak,
            history: [newActivity, ...user.history]
        };

        updateUser(updatedUser);
        return { success: true, pointsAdded: pointsToAdd };
    };

    // Helper to get all users (for Upline dropdown)
    const getAllUsers = () => {
        return JSON.parse(localStorage.getItem('wize_users') || '[]');
    };

    const getDownlines = (nickname) => {
        const users = getAllUsers();
        return users.filter(u => u.upline === nickname);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, updateUser, getAllUsers, getDownlines, addActivity, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
