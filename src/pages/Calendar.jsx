import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Download, MapPin, Book, Video, Users, DollarSign, FileText, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getBKKDate } from '../utils/dateUtils';

const Calendar = () => {
    const { user, getAllUsers } = useAuth();
    const { userId } = useParams();
    const [currentDate, setCurrentDate] = useState(getBKKDate());
    const [targetUser, setTargetUser] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        if (userId) {
            const users = getAllUsers();
            const found = users.find(u => u.id === userId);
            setTargetUser(found);
        } else {
            setTargetUser(user);
        }
    }, [userId, user, getAllUsers]);

    const displayUser = targetUser || user;

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const getActivityColor = (type) => {
        switch (type) {
            case 'checkin': return '#EF4444';
            case 'book': return '#3B82F6';
            case 'clip': return '#10B981';
            case 'coaching': return '#F59E0B';
            case 'sale': return '#8B5CF6';
            default: return '#9CA3AF';
        }
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'checkin': return MapPin;
            case 'book': return Book;
            case 'clip': return Video;
            case 'coaching': return Users;
            case 'sale': return DollarSign;
            default: return MapPin;
        }
    };

    const getActivitiesForDay = (day) => {
        if (!displayUser || !displayUser.history) return [];
        const dateString = format(day, 'yyyy-MM-dd');
        return displayUser.history.filter(a => (a.date_string || a.dateString) === dateString);
    };

    const getFormattedDetails = (activity) => {
        // Handle Supabase structure where details are in 'data' column, or legacy flat structure
        const details = activity.data || activity;

        let text = '';
        if (activity.type === 'checkin') text = `Type: ${details.checkinType}`;
        if (activity.type === 'book') text = `Title: ${details.bookTitle}\nSummary: ${details.summary}`;
        if (activity.type === 'clip') text = `Link: ${details.clipLink}\nSummary: ${details.summary}`;
        if (activity.type === 'coaching') text = `Coachee: ${details.coachee}\nNotes: ${details.notes}`;
        if (activity.type === 'sale') text = `Amount: ${details.amount}\nNotes: ${details.notes}`;
        return text;
    };

    const handleExportExcel = () => {
        if (!displayUser || !displayUser.history) return;

        const rows = displayUser.history.map(a => ({
            Date: a.dateString,
            Time: format(new Date(a.timestamp), 'HH:mm'),
            Type: a.type,
            Details: getFormattedDetails(a),
            Points: 1
        }));

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Activity History");
        XLSX.writeFile(workbook, "activity_history.xlsx");
    };

    const handleExportPDF = () => {
        if (!displayUser || !displayUser.history) return;

        const doc = new jsPDF();
        doc.text("Activity History", 14, 15);

        const tableColumn = ["Date", "Time", "Type", "Details", "Points"];
        const tableRows = displayUser.history.map(a => [
            a.dateString,
            format(new Date(a.timestamp), 'HH:mm'),
            a.type,
            getFormattedDetails(a),
            1
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        });

        doc.save("activity_history.pdf");
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
            <div style={{ flex: 1, padding: '2rem' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>
                        {userId && displayUser ? `${displayUser.nickname}'s Calendar` : 'Activity Calendar'}
                    </h1>
                    <div className="flex gap-2">
                        <button onClick={handleExportExcel} className="btn" style={{ border: '1px solid #10B981', backgroundColor: 'white', color: '#059669' }}>
                            <Download size={16} style={{ marginRight: '0.5rem' }} />
                            Excel
                        </button>
                        <button onClick={handleExportPDF} className="btn" style={{ border: '1px solid #EF4444', backgroundColor: 'white', color: '#DC2626' }}>
                            <FileText size={16} style={{ marginRight: '0.5rem' }} />
                            PDF
                        </button>
                    </div>
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#EF4444' }}></div>
                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>Check-in</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#3B82F6' }}></div>
                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>Book</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10B981' }}></div>
                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>Clip</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#F59E0B' }}></div>
                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>Coaching</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#8B5CF6' }}></div>
                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>Sale</span>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: '2rem' }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                        <button onClick={prevMonth} className="btn"><ChevronLeft /></button>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{format(currentDate, 'MMMM yyyy')}</h2>
                        <button onClick={nextMonth} className="btn"><ChevronRight /></button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: '#E5E7EB', border: '1px solid #E5E7EB' }}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} style={{ padding: '0.5rem', textAlign: 'center', fontWeight: '600', backgroundColor: 'white' }}>{day}</div>
                        ))}
                        {calendarDays.map(day => {
                            const activities = getActivitiesForDay(day);
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const isToday = isSameDay(day, getBKKDate());

                            return (
                                <div key={day.toString()} style={{
                                    minHeight: '100px',
                                    padding: '0.5rem',
                                    backgroundColor: isCurrentMonth ? 'white' : '#F9FAFB',
                                    position: 'relative'
                                }}>
                                    <div style={{
                                        textAlign: 'right',
                                        fontSize: '0.875rem',
                                        color: isToday ? '#4F46E5' : '#6B7280',
                                        fontWeight: isToday ? 'bold' : 'normal'
                                    }}>
                                        {format(day, 'd')}
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                        {activities.map((activity, idx) => (
                                            <div key={idx} style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                backgroundColor: getActivityColor(activity.type),
                                                title: activity.type
                                            }} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Recent History</h2>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: '#F9FAFB' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', color: '#6B7280' }}>Date</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', color: '#6B7280' }}>Activity</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', color: '#6B7280' }}>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayUser?.history.slice(0, 20).map((activity, idx) => {
                                const Icon = getActivityIcon(activity.type);
                                return (
                                    <tr key={idx} style={{ borderTop: '1px solid #E5E7EB' }}>
                                        <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                                            <div style={{ fontWeight: '500' }}>{activity.date_string || activity.dateString}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{format(new Date(activity.created_at || activity.timestamp), 'HH:mm')}</div>
                                        </td>
                                        <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                                            <div className="flex items-center gap-2">
                                                <Icon size={16} color={getActivityColor(activity.type)} />
                                                <span style={{ textTransform: 'capitalize' }}>{activity.type}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#4B5563', whiteSpace: 'pre-wrap' }}>
                                            {getFormattedDetails(activity)}
                                            {(activity.image_url || activity.data?.image || activity.image) && (
                                                <div style={{ marginTop: '0.5rem' }}>
                                                    <img
                                                        src={activity.image_url || activity.data?.image || activity.image}
                                                        alt="Evidence"
                                                        style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '4px', border: '1px solid #E5E7EB', cursor: 'pointer', display: 'block' }}
                                                        onClick={() => setSelectedImage(activity.image_url || activity.data?.image || activity.image)}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'block';
                                                        }}
                                                    />
                                                    <a
                                                        href={activity.image_url || activity.data?.image || activity.image}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ display: 'none', fontSize: '0.75rem', color: '#3B82F6', textDecoration: 'underline' }}
                                                    >
                                                        View Evidence
                                                    </a>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {(!displayUser?.history || displayUser.history.length === 0) && (
                                <tr>
                                    <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>No activities recorded yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Image Modal */}
            {
                selectedImage && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 50,
                        padding: '1rem'
                    }} onClick={() => setSelectedImage(null)}>
                        <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }} onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => setSelectedImage(null)}
                                style={{
                                    position: 'absolute',
                                    top: '-1rem',
                                    right: '-1rem',
                                    backgroundColor: 'white',
                                    borderRadius: '50%',
                                    padding: '0.5rem',
                                    cursor: 'pointer',
                                    border: 'none',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            >
                                <X size={24} color="#374151" />
                            </button>
                            <img
                                src={selectedImage}
                                alt="Full size evidence"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '85vh',
                                    borderRadius: '0.5rem',
                                    objectFit: 'contain'
                                }}
                            />
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Calendar;
