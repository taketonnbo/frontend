"use client"
import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, getDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Upload, Calendar as CalendarIcon, Loader2 } from 'lucide-react';

type TrashSchedule = {
    trash_type: string;
    collection_date: string;
    id?: number;
};

// タグのキーワードに基づいて色を返す関数
const getTrashColor = (trashType: string): string => {
    const type = trashType.toLowerCase();

    // キーワードベースのカラーマッピング
    if (type.includes('可燃') || type.includes('燃やす') || type.includes('燃える') || type.includes('もやす')) {
        return "bg-red-100 text-red-700 border-red-200";
    } else if (type.includes('資源') || type.includes('リサイクル') || type.includes('ペット') || type.includes('プラ')) {
        return "bg-blue-100 text-blue-700 border-blue-200";
    } else if (type.includes('不燃') || type.includes('燃えない') || type.includes('粗大') || type.includes('もえない')) {
        return "bg-gray-100 text-gray-700 border-gray-200";
    } else if (type.includes('びん') || type.includes('瓶') || type.includes('缶') || type.includes('カン')) {
        return "bg-green-100 text-green-700 border-green-200";
    } else if (type.includes('紙') || type.includes('古紙')) {
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
    } else {
        // デフォルトカラー（その他のゴミ種類）
        return "bg-purple-100 text-purple-700 border-purple-200";
    }
};


// Update component signature to accept props
export default function TrashCalendar({ calendarId }: { calendarId?: number }) {
    const [file, setFile] = useState<File | null>(null);
    const [schedules, setSchedules] = useState<TrashSchedule[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedSchedule, setSelectedSchedule] = useState<TrashSchedule | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editTrashType, setEditTrashType] = useState("");

    // 年度選択用の状態
    const [yearSelectionData, setYearSelectionData] = useState<{
        candidateYears: number[];
        rawData: any[];
        calendarId?: number;
    } | null>(null);
    const [selectedYear, setSelectedYear] = useState<number | null>(null);

    const fetchSchedules = async () => {
        if (!calendarId) return;
        try {
            const res = await fetch(`http://localhost:8000/api/calendars/${calendarId}/schedules`);
            if (res.ok) {
                const data = await res.json();
                setSchedules(data);
            }
        } catch (error) {
            console.error("Failed to fetch schedules:", error);
        }
    };

    // Fetch schedules on mount if calendarId is present
    React.useEffect(() => {
        if (calendarId) {
            fetchSchedules();
        }
    }, [calendarId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        const url = calendarId
            ? `http://localhost:8000/api/trash/upload?calendar_id=${calendarId}`
            : 'http://localhost:8000/api/trash/upload';

        try {
            const res = await fetch(url, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                throw new Error('Upload failed');
            }

            const data = await res.json();

            // 年度選択が必要な場合
            if (data.status === 'year_selection_required') {
                setYearSelectionData({
                    candidateYears: data.candidate_years,
                    rawData: data.raw_data,
                    calendarId: data.calendar_id
                });
                setLoading(false);
                return;
            }

            // 通常の成功レスポンス
            setSchedules(data);
        } catch (error) {
            console.error(error);
            alert('画像のアップロードに失敗しました。バックエンドがポート8000で起動しているか確認してください。');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmYear = async () => {
        if (!selectedYear || !yearSelectionData) return;

        setLoading(true);
        try {
            const res = await fetch('http://localhost:8000/api/trash/upload/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    base_year: selectedYear,
                    raw_data: yearSelectionData.rawData,
                    calendar_id: yearSelectionData.calendarId || calendarId
                })
            });

            if (res.ok) {
                const data = await res.json();
                setSchedules(data);
                setYearSelectionData(null);
                setSelectedYear(null);
            } else {
                throw new Error('Failed to confirm year');
            }
        } catch (error) {
            console.error(error);
            alert('保存に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSchedule = async () => {
        if (!selectedSchedule || !selectedSchedule.id) return;
        if (!confirm('この予定を削除してもよろしいですか？')) return;

        try {
            const res = await fetch(`http://localhost:8000/api/trash/${selectedSchedule.id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setIsEditModalOpen(false);
                setSelectedSchedule(null);
                fetchSchedules();
            }
        } catch (error) {
            console.error(error);
            alert('削除に失敗しました');
        }
    };

    const handleUpdateSchedule = async () => {
        if (!selectedSchedule || !selectedSchedule.id) return;

        try {
            const res = await fetch(`http://localhost:8000/api/trash/${selectedSchedule.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    trash_type: editTrashType,
                    collection_date: selectedSchedule.collection_date
                }),
            });
            if (res.ok) {
                setIsEditModalOpen(false);
                setSelectedSchedule(null);
                fetchSchedules();
            }
        } catch (error) {
            console.error(error);
            alert('更新に失敗しました');
        }
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const onDateClick = (day: Date) => setCurrentMonth(day);

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-8 px-4">
                <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>
                <div className="text-xl font-bold text-gray-800">
                    {format(currentMonth, 'yyyy年 MMMM', { locale: ja })}
                </div>
                <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ChevronRight className="w-6 h-6 text-gray-600" />
                </button>
            </div>
        );
    };

    const renderDays = () => {
        const days = [];
        const dateFormat = "EEE";
        const startDate = startOfWeek(currentMonth);

        for (let i = 0; i < 7; i++) {
            days.push(
                <div key={i} className="text-center text-sm font-semibold text-gray-500 py-4 uppercase tracking-wider">
                    {format(addDays(startDate, i), dateFormat, { locale: ja })}
                </div>
            );
        }
        return <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">{days}</div>;
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const dateFormat = "d";
        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = "";

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, dateFormat);
                const cloneDay = day;

                // Find all schedules for this day
                const daySchedules = schedules.filter(s =>
                    new Date(s.collection_date).toDateString() === cloneDay.toDateString()
                );

                days.push(
                    <div
                        key={day.toString()}
                        className={`min-h-[120px] p-2 border border-gray-50 relative group transition-all duration-200
              ${!isSameMonth(day, monthStart) ? "bg-gray-50/30 text-gray-300" : "bg-white"}
              ${isSameDay(day, new Date()) ? "ring-2 ring-indigo-500 ring-inset z-10" : ""}
              hover:bg-indigo-50/20
            `}
                        onClick={() => onDateClick(cloneDay)}
                    >
                        <div className={`text-right mb-2 font-medium ${!isSameMonth(day, monthStart) ? "text-gray-300" : "text-gray-700"}`}>
                            {formattedDate}
                        </div>

                        <div className="space-y-1">
                            {daySchedules.map((schedule, idx) => (
                                <div
                                    key={idx}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (calendarId) { // Only allow edit if identifying by calendarId
                                            setSelectedSchedule(schedule);
                                            setEditTrashType(schedule.trash_type);
                                            setIsEditModalOpen(true);
                                        }
                                    }}
                                    className={`
                  text-xs p-1.5 rounded-md border shadow-sm cursor-pointer hover:opacity-80
                  ${getTrashColor(schedule.trash_type)}
                `}>
                                    <p className="font-semibold text-[10px] leading-tight truncate">{schedule.trash_type}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div key={day.toString()} className="grid grid-cols-7">
                    {days}
                </div>
            );
            days = [];
        }
        return <div className="bg-white rounded-b-xl shadow-sm border border-gray-100 overflow-hidden">{rows}</div>;
    };

    return (
        <div className="w-full max-w-6xl mx-auto space-y-10">

            {/* Upload Section */}
            <div className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl p-8 border border-white/40">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-100 rounded-xl">
                        <Upload className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">
                        カレンダー生成
                    </h2>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="relative w-full group">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500
                file:mr-4 file:py-3 file:px-8
                file:rounded-xl file:border-0
                file:text-sm file:font-bold
                file:bg-indigo-50 file:text-indigo-600
                hover:file:bg-indigo-100 file:transition-colors
                cursor-pointer border-2 border-dashed border-gray-300 rounded-2xl p-4 
                focus:outline-none focus:border-indigo-500 transition-colors
                group-hover:border-indigo-300"
                        />
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={!file || loading}
                        className={`w-full md:w-auto px-10 py-4 rounded-xl font-bold text-white shadow-lg shadow-indigo-200 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl
              ${!file || loading
                                ? 'bg-gray-400 cursor-not-allowed shadow-none hover:translate-y-0'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-indigo-500/30'}`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                AI解析中...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                <CalendarIcon className="w-5 h-5" />
                                スケジュール作成
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Calendar Section */}
            {schedules.length > 0 && (
                <div className="bg-white/90 backdrop-blur rounded-3xl p-8 shadow-2xl border border-white/50 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {renderHeader()}
                    {renderDays()}
                    {renderCells()}
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && selectedSchedule && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">予定の編集</h3>
                        <p className="text-gray-500 mb-4">
                            {format(new Date(selectedSchedule.collection_date), 'yyyy年MM月dd日', { locale: ja })}
                        </p>

                        <div className="space-y-4 mb-6">
                            <label className="block text-sm font-medium text-gray-700">ゴミの種類</label>
                            {/* 既存のタグからドロップダウン選択 */}
                            {schedules.length > 0 && (() => {
                                const uniqueTrashTypes = Array.from(new Set(schedules.map(s => s.trash_type)));
                                return uniqueTrashTypes.length > 0 ? (
                                    <select
                                        value={editTrashType}
                                        onChange={(e) => setEditTrashType(e.target.value)}
                                        className="block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500 mb-2"
                                    >
                                        <option value="">-- 既存のタグから選択 --</option>
                                        {uniqueTrashTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                ) : null;
                            })()}
                            {/* 自由入力フィールド */}
                            <input
                                type="text"
                                placeholder="または直接入力..."
                                value={editTrashType}
                                onChange={(e) => setEditTrashType(e.target.value)}
                                className="block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={handleDeleteSchedule}
                                className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition-colors"
                            >
                                削除
                            </button>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleUpdateSchedule}
                                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium transition-colors"
                            >
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Year Selection Modal */}
            {yearSelectionData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">
                            📅 年度の選択
                        </h3>
                        <p className="text-gray-600 mb-6">
                            カレンダーの開始年度を選択してください
                        </p>

                        <div className="space-y-3 mb-6">
                            {yearSelectionData.candidateYears.map(year => (
                                <button
                                    key={year}
                                    onClick={() => setSelectedYear(year)}
                                    className={`w-full p-4 rounded-lg border-2 transition-all ${selectedYear === year
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="font-bold text-lg">{year}年 4月 〜 {year + 1}年 3月</div>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setYearSelectionData(null);
                                    setSelectedYear(null);
                                }}
                                className="flex-1 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleConfirmYear}
                                disabled={!selectedYear}
                                className="flex-1 px-4 py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                確定
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
