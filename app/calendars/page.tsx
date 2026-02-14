"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';

type Calendar = {
    id: number;
    name: string;
};

export default function CalendarList() {
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [newCalendarName, setNewCalendarName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchCalendars();
    }, []);

    const fetchCalendars = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/calendars/');
            if (res.ok) {
                const data = await res.json();
                setCalendars(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCalendarName) return;

        try {
            const res = await fetch('http://localhost:8000/api/calendars/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCalendarName }),
            });
            if (res.ok) {
                setNewCalendarName("");
                setIsCreating(false);
                fetchCalendars();
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900">マイカレンダー</h1>
                    <button
                        onClick={() => setIsCreating(!isCreating)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                    >
                        <Plus className="w-5 h-5" />
                        新規作成
                    </button>
                </div>

                {isCreating && (
                    <form onSubmit={handleCreate} className="mb-8 bg-white p-6 rounded-xl shadow-lg border border-indigo-100 animate-in fade-in slide-in-from-top-4">
                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={newCalendarName}
                                onChange={(e) => setNewCalendarName(e.target.value)}
                                placeholder="カレンダー名 (例: 自宅用)"
                                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={!newCalendarName}
                                className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                作成
                            </button>
                        </div>
                    </form>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                    {calendars.map((calendar) => (
                        <div
                            key={calendar.id}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all group flex justify-between items-center"
                        >
                            <Link
                                href={`/calendars/${calendar.id}`}
                                className="flex-1 flex justify-between items-center"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                                        <CalendarIcon className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800">{calendar.name}</h2>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transform group-hover:translate-x-1 transition-all mr-4" />
                            </Link>
                            <button
                                onClick={async (e) => {
                                    e.preventDefault();
                                    if (!confirm(`「${calendar.name}」を削除してもよろしいですか？\n含まれるスケジュールもすべて削除されます。`)) return;
                                    try {
                                        const res = await fetch(`http://localhost:8000/api/calendars/${calendar.id}`, {
                                            method: 'DELETE',
                                        });
                                        if (res.ok) {
                                            fetchCalendars();
                                        }
                                    } catch (error) {
                                        console.error(error);
                                    }
                                }}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors z-10"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18"></path>
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
