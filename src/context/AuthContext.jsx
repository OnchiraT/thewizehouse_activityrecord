import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getBKKDateString } from '../utils/dateUtils';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('AuthContext: Initializing...');
        let mounted = true;

        // Set up auth state listener first
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('AuthContext: Auth state changed:', event, 'Session:', !!session);
            if (!mounted) return;

            if (session) {
                // Fetch profile whenever a session is present
                console.log('AuthContext: Session detected, fetching profile...');
                await fetchProfile(session.user.id);
            } else {
                console.log('AuthContext: No session, clearing user state');
                setUser(null);
                setLoading(false);
            }
        });

        // Then check for existing session
        const checkSession = async () => {
            try {
                console.log('AuthContext: Checking for existing session...');
                const { data: { session } } = await supabase.auth.getSession();
                console.log('AuthContext: Existing session check complete. Has session:', !!session);

                if (!mounted) return;

                // If no session, set loading to false
                // If there is a session, onAuthStateChange will handle it
                if (!session) {
                    console.log('AuthContext: No existing session found');
                    setLoading(false);
                }
            } catch (error) {
                console.error('AuthContext: Error checking session:', error);
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        checkSession();

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                // Attempt to create fallback profile for any error (e.g., missing profile)
                console.warn('AuthContext: Profile fetch error, attempting fallback creation.', error);
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { error: insertError } = await supabase
                        .from('profiles')
                        .insert([
                            {
                                id: user.id,
                                nickname: user.user_metadata?.nickname || user.email.split('@')[0],
                                full_name: user.user_metadata?.full_name || '',
                                upline: user.user_metadata?.upline || null,
                                points: 0,
                                streak: 0
                            }
                        ]);
                    if (insertError) {
                        console.error('AuthContext: Failed to create fallback profile:', insertError);
                        throw insertError;
                    }
                    // Retry fetching the profile after creation
                    return fetchProfile(userId);
                }
                // If we cannot get user info, rethrow original error
                throw error;
            }

            // Fetch recent history
            const { data: history, error: historyError } = await supabase
                .from('activities')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (historyError) throw historyError;

            setUser({ ...data, history: history || [] });
        } catch (error) {
            console.error('Error fetching profile:', error);
            // Fallback: set minimal user to avoid null user causing redirect
            setUser({ id: userId, history: [] });
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        console.log('AuthContext: login() called with email:', email);
        setLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error('AuthContext: Login error:', error);
            setLoading(false);
            return { success: false, message: error.message };
        }

        console.log('AuthContext: Login successful, user:', data.user?.id);
        if (data.user) {
            console.log('AuthContext: Calling fetchProfile...');
            await fetchProfile(data.user.id);
            console.log('AuthContext: fetchProfile complete');
        }

        console.log('AuthContext: Setting loading to false');
        setLoading(false);
        console.log('AuthContext: Returning success');
        return { success: true };
    };

    const register = async (userData) => {
        setLoading(true);
        const { data, error } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    nickname: userData.nickname,
                    full_name: userData.fullName,
                    upline: userData.upline || null
                }
            }
        });

        if (error) {
            setLoading(false);
            return { success: false, message: error.message };
        }

        // Profile is now created automatically by Supabase Trigger
        // onAuthStateChange will handle the rest if auto-login happens, 
        // otherwise we might need to set loading false if email confirmation is required.
        // But for this app, email confirmation is likely disabled or we want to wait.
        // If email confirmation is OFF, onAuthStateChange fires immediately.
        // If ON, user needs to check email.

        // For safety, if no user session is established immediately (e.g. email verification needed),
        // we should set loading false.
        if (!data.session) {
            setLoading(false);
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
