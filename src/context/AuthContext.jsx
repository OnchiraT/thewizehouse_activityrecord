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

            // Ignore token refresh events to prevent unnecessary re-renders/fetches
            if (event === 'TOKEN_REFRESHED') {
                console.log('AuthContext: Token refreshed, skipping profile fetch');
                return;
            }

            if (session) {
                // Only fetch profile if we don't have it or if it's a fresh login
                // We can check if 'user' state is already populated with the same ID
                // But 'user' state isn't available in this closure easily without refs or dependency
                // So we'll just fetch, but we could optimize. 
                // For now, just ignoring TOKEN_REFRESHED is the big win.
                console.log('AuthContext: Session detected (not refresh), fetching profile...');
                await fetchProfile(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                console.log('AuthContext: User signed out, clearing state');
                setUser(null);
                setLoading(false);
            } else {
                // Other events (e.g. USER_UPDATED, etc) or no session
                if (!session) {
                    setUser(null);
                    setLoading(false);
                }
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

    const fetchProfile = async (userId, sessionUser = null) => {
        try {
            console.log('AuthContext: Fetching profile for', userId);

            // Race database fetch against a 20-second timeout
            // Fetch profile AND ScoreMember
            const dbPromise = supabase
                .from('profiles')
                .select('*, ScoreMember(*)')
                .eq('id', userId)
                .single();

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Profile fetch timeout')), 20000)
            );

            const { data, error } = await Promise.race([dbPromise, timeoutPromise]);

            if (error) {
                // Attempt to create fallback profile for any error (e.g., missing profile)
                console.warn('AuthContext: Profile fetch error, attempting fallback creation.', error);

                // Use provided sessionUser or fetch it if missing
                let currentUser = sessionUser;
                if (!currentUser) {
                    const { data: { user } } = await supabase.auth.getUser();
                    currentUser = user;
                }

                if (currentUser) {
                    const { error: insertError } = await supabase
                        .from('profiles')
                        .insert([
                            {
                                id: currentUser.id,
                                nickname: currentUser.user_metadata?.nickname || currentUser.email.split('@')[0],
                                full_name: currentUser.user_metadata?.full_name || '',
                                upline: currentUser.user_metadata?.upline || null,
                                // Points/Streak now in ScoreMember, handled separately or default 0
                            }
                        ]);

                    // Also create ScoreMember entry
                    const { error: scoreError } = await supabase
                        .from('ScoreMember')
                        .insert([{ member_id: currentUser.id }]);

                    if (insertError) {
                        console.error('AuthContext: Failed to create fallback profile:', insertError);
                    } else {
                        console.log('AuthContext: Fallback profile created, setting user directly');
                        setUser({
                            id: currentUser.id,
                            email: currentUser.email,
                            nickname: currentUser.user_metadata?.nickname || currentUser.email.split('@')[0],
                            history: [],
                            points: 0,
                            streak: 0
                        });
                        return;
                    }
                }
                throw error;
            }

            // Fetch recent history from VIEW
            const { data: history, error: historyError } = await supabase
                .from('activity_history_view')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (historyError) throw historyError;

            // Map ScoreMember data to user object for backward compatibility
            const scoreData = data.ScoreMember?.[0] || { total_point: 0, current_streak: 0 };

            setUser({
                ...data,
                points: scoreData.total_point,
                streak: scoreData.current_streak,
                history: history || []
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
            console.log('AuthContext: Using minimal fallback user due to error');
            setUser({ id: userId, history: [], points: 0, streak: 0 });
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        setLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setLoading(false);
            return { success: false, message: error.message };
        }

        if (data.user) {
            await fetchProfile(data.user.id);
        }

        setLoading(false);
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

        let avatarUrl = user.avatar_url || user.avatar; // Handle both legacy and new field names if needed

        // Handle Avatar Upload if present and is base64
        if (updates.avatar && updates.avatar.startsWith('data:image')) {
            try {
                const base64Response = await fetch(updates.avatar);
                const blob = await base64Response.blob();
                const fileName = `avatars/${user.id}/${Date.now()}.jpg`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('activity-images') // Using the same public bucket for simplicity
                    .upload(fileName, blob, {
                        contentType: blob.type || 'image/jpeg',
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('activity-images')
                    .getPublicUrl(fileName);

                avatarUrl = publicUrl;
            } catch (error) {
                console.error("Avatar upload failed:", error);
                // Continue updating other fields even if avatar fails
            }
        }

        const profileUpdates = {
            nickname: updates.nickname || user.nickname,
            full_name: updates.fullName || user.full_name, // Map fullName to full_name
            upline: updates.upline || user.upline,
            avatar_url: avatarUrl
        };

        const { error } = await supabase
            .from('profiles')
            .update(profileUpdates)
            .eq('id', user.id);

        if (error) {
            console.error('Error updating user:', error);
            return { success: false, error: error.message };
        } else {
            // Update local state
            setUser(prev => ({
                ...prev,
                ...profileUpdates,
                // Ensure we update both camelCase and snake_case versions to be safe for UI
                fullName: profileUpdates.full_name,
                avatar: avatarUrl
            }));
            return { success: true };
        }
    };

    const addActivity = async (activity) => {
        if (!user) return { success: false, message: 'Not logged in' };

        const today = getBKKDateString();
        let imageUrl = null;

        // 1. Upload Image if present
        if (activity.image) {
            try {
                const base64Response = await fetch(activity.image);
                const blob = await base64Response.blob();
                const fileName = `${user.id}/${Date.now()}.jpg`;

                const { error: uploadError } = await supabase.storage
                    .from('activity-images')
                    .upload(fileName, blob, {
                        contentType: blob.type || 'image/jpeg',
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('activity-images')
                    .getPublicUrl(fileName);

                imageUrl = publicUrl;
            } catch (error) {
                console.error("Image upload failed:", error);
                return { success: false, message: "Image upload failed" };
            }
        }

        try {
            // 2. Insert into Specific Detail Table
            let detailTable = '';
            let detailData = { create_by: user.id, image_file: imageUrl };

            switch (activity.type) {
                case 'checkin':
                    detailTable = 'CheckinCenter';
                    detailData = { ...detailData, checkin_type: activity.checkinType, location: activity.location };
                    break;
                case 'book':
                    detailTable = 'BookSummary';
                    detailData = { ...detailData, book_title: activity.bookTitle, key_takeaway: activity.summary };
                    break;
                case 'clip':
                    detailTable = 'ClipSummary';
                    detailData = { ...detailData, clip_link: activity.clipLink, key_takeaway: activity.summary };
                    break;
                case 'coaching':
                    detailTable = 'Coaching';
                    detailData = { ...detailData, coachee_name: activity.coachee, key_takeaway: activity.notes };
                    break;
                case 'sale':
                    detailTable = 'SaleSlip';
                    detailData = { ...detailData, amount: activity.amount, note: activity.notes };
                    break;
                default:
                    return { success: false, message: 'Invalid activity type' };
            }

            const { data: insertedDetail, error: detailError } = await supabase
                .from(detailTable)
                .insert([detailData])
                .select()
                .single();

            if (detailError) throw detailError;

            // 3. Insert into RecordActivity
            const { data: insertedRecord, error: recordError } = await supabase
                .from('RecordActivity')
                .insert([{
                    member_id: user.id,
                    activity_type: activity.type,
                    ref_id: insertedDetail.id,
                    date_string: today
                }])
                .select()
                .single();

            if (recordError) throw recordError;

            // 4. Calculate Points & Streak
            const activitiesToday = user.history.filter(a => a.date_string === today && a.type === activity.type);
            const isEligibleForPoints = activitiesToday.length === 0;
            const pointsToAdd = isEligibleForPoints ? 1 : 0;

            const hasActivityToday = user.history.some(a => a.date_string === today);

            // Calculate yesterday in BKK time
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
                    newStreak = 1; // Reset if missed a day (logic implies streak is consecutive days)
                }
            }

            const newTotalPoints = (user.points || 0) + pointsToAdd;

            // 5. Update ScoreMember
            const { error: scoreError } = await supabase
                .from('ScoreMember')
                .upsert({
                    member_id: user.id,
                    total_point: newTotalPoints,
                    current_streak: newStreak,
                    update_on: new Date().toISOString(),
                    update_by: user.id
                }, { onConflict: 'member_id' });

            if (scoreError) throw scoreError;

            // 6. Update local state
            // We need to construct a "history item" that looks like what the View returns
            // so the UI updates immediately without refetching
            const newHistoryItem = {
                id: insertedRecord.id,
                user_id: user.id,
                type: activity.type,
                created_at: insertedRecord.create_on,
                date_string: today,
                image_url: imageUrl,
                data: { ...activity, image: undefined } // Approximate the JSON structure
            };

            setUser(prev => ({
                ...prev,
                points: newTotalPoints,
                streak: newStreak,
                history: [newHistoryItem, ...prev.history]
            }));

            return { success: true, pointsAdded: pointsToAdd };

        } catch (error) {
            console.error("Error adding activity:", error);
            return { success: false, message: error.message };
        }
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
