import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getBKKDateString } from '../utils/dateUtils';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                await fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                await fetchProfile(session.user.id);
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;

            // Fetch recent history for streak/points calculation if needed locally, 
            // but for now let's just attach the profile.
            // We might need to fetch history separately or join it.
            // For simplicity, let's fetch the last few activities to keep the 'history' prop working if possible,
            // or refactor the app to fetch history where needed.
            // The current app expects `user.history` array.

            const { data: history, error: historyError } = await supabase
                .from('activities')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (historyError) throw historyError;

            setUser({ ...data, history: history || [] });
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) return { success: false, message: error.message };
        return { success: true };
    };

    const register = async (userData) => {
        const { data, error } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
        });

        if (error) return { success: false, message: error.message };

        if (data.user) {
            // Create profile
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([{
                    id: data.user.id,
                    nickname: userData.nickname,
                    full_name: userData.fullName,
                    upline: userData.upline || null, // Ensure empty string becomes null if needed, or keep as is
                    points: 0,
                    streak: 0,
                    join_date: new Date().toISOString()
                }]);

            if (profileError) {
                // If profile creation fails, we might want to cleanup the auth user, but for now just return error
                return { success: false, message: profileError.message };
            }
        }

        return { success: true };
    };

    const logout = async () => {
        await supabase.auth.signOut();
    };

    const updateUser = async (updates) => {
        if (!user) return;

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

        if (error) {
            console.error('Error updating user:', error);
        } else {
            setUser(prev => ({ ...prev, ...updates }));
        }
    };

    const addActivity = async (activity) => {
        if (!user) return { success: false, message: 'Not logged in' };

        const today = getBKKDateString();

        // Prepare activity data
        const newActivity = {
            user_id: user.id,
            type: activity.type,
            data: {
                ...activity, // Store all other fields in data JSONB
                type: undefined, // Remove duplicate fields
                image: undefined // Don't store base64 image in JSON if possible, handle separately
            },
            date_string: today,
            created_at: new Date().toISOString()
        };

        // Handle Image Upload if present (base64)
        let imageUrl = null;
        if (activity.image) {
            // Convert base64 to blob and upload
            try {
                const base64Response = await fetch(activity.image);
                const blob = await base64Response.blob();
                const fileName = `${user.id}/${Date.now()}.jpg`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('activity-images')
                    .upload(fileName, blob);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('activity-images')
                    .getPublicUrl(fileName);

                imageUrl = publicUrl;
                newActivity.image_url = imageUrl;
            } catch (error) {
                console.error("Image upload failed:", error);
                return { success: false, message: "Image upload failed" };
            }
        }

        // Insert Activity
        const { data: insertedActivity, error } = await supabase
            .from('activities')
            .insert([newActivity])
            .select()
            .single();

        if (error) return { success: false, message: error.message };

        // Calculate Points & Streak (Server-side logic ideally, but client-side for now)
        // Check if activity type already done today
        const activitiesToday = user.history.filter(a => a.date_string === today && a.type === activity.type);
        const isEligibleForPoints = activitiesToday.length === 0;

        let pointsToAdd = 0;
        if (isEligibleForPoints) {
            pointsToAdd = 1;
        }

        // Streak Logic (Same as before)
        const hasActivityToday = user.history.some(a => a.date_string === today);

        const bkkNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
        bkkNow.setDate(bkkNow.getDate() - 1);
        const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: "Asia/Bangkok", year: 'numeric', month: '2-digit', day: '2-digit' });
        const yesterday = formatter.format(bkkNow);
        const hasActivityYesterday = user.history.some(a => a.date_string === yesterday);

        let newStreak = user.streak;
        if (!hasActivityToday) {
            if (hasActivityYesterday) {
                newStreak += 1;
            } else if (user.streak === 0) {
                newStreak = 1;
            } else {
                newStreak = 1;
            }
        }

        // Update Profile with new points/streak
        const updates = {
            points: user.points + pointsToAdd,
            streak: newStreak
        };

        await updateUser(updates);

        // Update local state
        setUser(prev => ({
            ...prev,
            ...updates,
            history: [insertedActivity, ...prev.history]
        }));

        return { success: true, pointsAdded: pointsToAdd };
    };

    const getAllUsers = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*');

        if (error) {
            console.error(error);
            return [];
        }
        return data;
    };

    const getDownlines = async (nickname) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('upline', nickname);

        if (error) return [];
        return data;
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, updateUser, getAllUsers, getDownlines, addActivity, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
