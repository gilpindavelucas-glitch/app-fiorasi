
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CalendarEvent } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, TrashIcon } from './Icons';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const Calendar: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<Record<string, CalendarEvent[]>>({});
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [eventTitle, setEventTitle] = useState('');
    const [eventColor, setEventColor] = useState(COLORS[0]);

    useEffect(() => {
        const savedEvents = localStorage.getItem('calendarEvents');
        if (savedEvents) {
            setEvents(JSON.parse(savedEvents));
        }
    }, []);

    const saveEvents = useCallback((updatedEvents: Record<string, CalendarEvent[]>) => {
        setEvents(updatedEvents);
        localStorage.setItem('calendarEvents', JSON.stringify(updatedEvents));
    }, []);

    const daysInMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate(), [currentDate]);
    const firstDayOfMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(), [currentDate]);

    const calendarGrid = useMemo(() => {
        const grid = [];
        const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
        
        for (let i = 0; i < adjustedFirstDay; i++) {
            grid.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            grid.push(i);
        }
        return grid;
    }, [daysInMonth, firstDayOfMonth]);

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const handleDayClick = (day: number) => {
        setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    };

    const handleAddEvent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventTitle || !selectedDate) return;
        const dateKey = selectedDate.toISOString().split('T')[0];
        const newEvent: CalendarEvent = { id: Date.now().toString(), title: eventTitle, color: eventColor };
        const updatedEvents = { ...events };
        updatedEvents[dateKey] = [...(updatedEvents[dateKey] || []), newEvent];
        saveEvents(updatedEvents);
        setEventTitle('');
    };

    const handleDeleteEvent = (dateKey: string, eventId: string) => {
        const updatedEvents = { ...events };
        updatedEvents[dateKey] = updatedEvents[dateKey].filter(e => e.id !== eventId);
        if (updatedEvents[dateKey].length === 0) {
            delete updatedEvents[dateKey];
        }
        saveEvents(updatedEvents);
    };

    const today = new Date();
    
    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow p-4 border border-[var(--border-color)]">
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-gray-100"><ChevronLeftIcon className="w-5 h-5" /></button>
                <h3 className="text-lg font-semibold">{currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-gray-100"><ChevronRightIcon className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-500 mb-2">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 flex-1">
                {calendarGrid.map((day, index) => {
                    const dateKey = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0] : '';
                    const dayEvents = events[dateKey] || [];
                    const isToday = day && currentDate.getFullYear() === today.getFullYear() && currentDate.getMonth() === today.getMonth() && day === today.getDate();
                    return (
                        <div key={index} onClick={() => day && handleDayClick(day)} className={`p-1 text-center rounded-md cursor-pointer transition-colors ${selectedDate?.getDate() === day ? 'bg-[var(--primary-color-light)]' : 'hover:bg-gray-100'}`}>
                            <span className={`w-7 h-7 flex items-center justify-center rounded-full mx-auto ${isToday ? 'bg-[var(--primary-color)] text-white' : ''}`}>{day}</span>
                            <div className="flex justify-center items-center h-2 mt-1 space-x-1">
                                {dayEvents.slice(0, 3).map(e => <div key={e.id} className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }}></div>)}
                            </div>
                        </div>
                    );
                })}
            </div>
            {selectedDate && (
                <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                    <h4 className="font-semibold mb-2">Eventos para {selectedDate.toLocaleDateString('es-ES')}</h4>
                    <ul className="space-y-2 mb-4 max-h-24 overflow-y-auto">
                        {(events[selectedDate.toISOString().split('T')[0]] || []).map(event => (
                            <li key={event.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-gray-50">
                                <div className="flex items-center">
                                    <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: event.color }}></span>
                                    {event.title}
                                </div>
                                <button onClick={() => handleDeleteEvent(selectedDate.toISOString().split('T')[0], event.id)} className="text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                            </li>
                        ))}
                    </ul>
                    <form onSubmit={handleAddEvent} className="space-y-2">
                        <input type="text" value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="Nuevo evento..." className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)]" />
                        <div className="flex items-center justify-between">
                             <div className="flex space-x-2">
                                {COLORS.map(c => <button type="button" key={c} onClick={() => setEventColor(c)} className={`w-6 h-6 rounded-full border-2 ${eventColor === c ? 'border-[var(--primary-color)]' : 'border-transparent'}`} style={{ backgroundColor: c }}></button>)}
                            </div>
                            <button type="submit" className="flex items-center gap-1 bg-[var(--primary-color)] text-white px-3 py-1 rounded-md text-sm hover:opacity-90"><PlusIcon className="w-4 h-4"/>Añadir</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
