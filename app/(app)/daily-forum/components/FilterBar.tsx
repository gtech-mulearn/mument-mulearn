'use client';

import { Search, X, ChevronDown, Calendar, Download } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Role } from "@/types/user";
import { exportToExcel } from "@/lib/excel-export";

interface FilterBarProps {
    keyword: string;
    setKeyword: (value: string) => void;
    college: string;
    setCollege: (value: string) => void;
    date: string;
    setDate: (value: string) => void;
    sort: string;
    setSort: (value: string) => void;
    colleges: string[];
    totalUpdates: number;
    filteredUpdates: number;
    role: Role;
    filteredData?: Array<{
        id: string;
        user_name: string;
        college?: string;
        college_name?: string | null;
        content: string;
        created_at: string;
        upvote_count: number;
    }>;
}

export default function FilterBar({
    keyword,
    setKeyword,
    college,
    setCollege,
    date,
    setDate,
    sort,
    setSort,
    colleges,
    totalUpdates,
    filteredUpdates,
    role,
    filteredData = []
}: FilterBarProps) {
    const [collegeSearch, setCollegeSearch] = useState('');
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const handleExcelExport = async () => {
        try {
            setIsExporting(true);
            await exportToExcel(filteredData, 'daily-updates', 'Daily Updates');
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to export to Excel');
        } finally {
            setIsExporting(false);
        }
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpenDropdown(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredColleges = colleges.filter(c =>
        c.toLowerCase().includes(collegeSearch.toLowerCase())
    );

    const selectedDateDisplay = date ? new Date(date).toLocaleDateString() : 'Select Date';

    return (
        <div ref={wrapperRef} className="mb-6 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                {/* Keyword Search */}
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search updates or username..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm transition-colors hover:border-gray-300"
                    />
                    {keyword && (
                        <button
                            type="button"
                            onClick={() => setKeyword('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* College Dropdown */}
                <div className="relative">
                    <div
                        onClick={() => setOpenDropdown(openDropdown === 'college' ? null : 'college')}
                        className={`w-full text-left px-3 py-2 rounded-lg border bg-white flex items-center justify-between transition-colors cursor-pointer
                            ${openDropdown === 'college' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 hover:border-gray-300'}
                        `}
                    >
                        <div className="flex flex-col overflow-hidden flex-1">
                            {college ? (
                                <span className="block truncate text-sm font-medium text-slate-800">
                                    {college}
                                </span>
                            ) : (
                                <span className="text-sm text-slate-400">All Colleges</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                            {college && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCollege('');
                                    }}
                                    className="p-0.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            )}
                            <ChevronDown size={14} className={`text-slate-400 transition-transform ${openDropdown === 'college' ? 'rotate-180' : ''}`} />
                        </div>
                    </div>

                    {openDropdown === 'college' && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            <div className="p-2 border-b border-gray-50 bg-gray-50/50 sticky top-0">
                                <div className="relative">
                                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        autoFocus
                                        type="text"
                                        className="w-full pl-8 pr-2 py-1.5 text-xs rounded-md border border-gray-200 focus:outline-none focus:border-blue-500 bg-white"
                                        placeholder="Search colleges..."
                                        value={collegeSearch}
                                        onChange={(e) => setCollegeSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="overflow-y-auto flex-1 p-1">
                                <button
                                    className={`w-full text-left px-3 py-2 text-sm rounded-md
                                       ${!college ? 'bg-blue-500/10 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}
                                   `}
                                    onClick={() => {
                                        setCollege('');
                                        setOpenDropdown(null);
                                        setCollegeSearch('');
                                    }}
                                >
                                    All Colleges
                                </button>
                                {filteredColleges.map(c => (
                                    <button
                                        key={c}
                                        className={`w-full text-left px-3 py-2 text-sm rounded-md
                                           ${college === c ? 'bg-blue-500/10 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}
                                       `}
                                        onClick={() => {
                                            setCollege(c);
                                            setOpenDropdown(null);
                                            setCollegeSearch('');
                                        }}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Date Picker */}
                <div className="relative">
                    <div
                        onClick={() => setOpenDropdown(openDropdown === 'date' ? null : 'date')}
                        className={`w-full text-left px-3 py-2 rounded-lg border bg-white flex items-center justify-between transition-colors cursor-pointer
                            ${openDropdown === 'date' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 hover:border-gray-300'}
                        `}
                    >
                        <div className="flex flex-col overflow-hidden flex-1">
                            <span className={`block truncate text-sm ${date ? 'font-medium text-slate-800' : 'text-slate-400'}`}>
                                {selectedDateDisplay}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                            {date && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDate('');
                                    }}
                                    className="p-0.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            )}
                            <Calendar size={14} className="text-slate-400" />
                        </div>
                    </div>

                    {openDropdown === 'date' && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100 p-3">
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => {
                                    setDate(e.target.value);
                                    setOpenDropdown(null);
                                }}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    )}
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                    <div
                        onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
                        className={`w-full text-left px-3 py-2 rounded-lg border bg-white flex items-center justify-between transition-colors cursor-pointer
                            ${openDropdown === 'sort' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 hover:border-gray-300'}
                        `}
                    >
                        <div className="flex flex-col overflow-hidden flex-1">
                            <span className="block truncate text-sm font-medium text-slate-700">
                                {sort === 'recent' ? 'Newest First' : sort === 'oldest' ? 'Oldest First' : sort === 'upvotes' ? 'Most Upvoted' : 'Sort by...'}
                            </span>
                        </div>
                        <ChevronDown size={16} className="text-slate-400 shrink-0" />
                    </div>
                    {openDropdown === 'sort' && (
                        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                            <button
                                onClick={() => {
                                    setSort('recent');
                                    setOpenDropdown(null);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                    sort === 'recent' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                Newest First
                            </button>
                            <button
                                onClick={() => {
                                    setSort('oldest');
                                    setOpenDropdown(null);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                    sort === 'oldest' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                Oldest First
                            </button>
                            <button
                                onClick={() => {
                                    setSort('upvotes');
                                    setOpenDropdown(null);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                    sort === 'upvotes' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                Most Upvoted
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Clear All Button */}
            {(keyword || college || date) && (
                <button
                    onClick={() => {
                        setKeyword('');
                        setCollege('');
                        setDate('');
                    }}
                    className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 border border-slate-300 font-medium text-sm transition-colors"
                >
                    Clear All Filters
                </button>
            )}

            <p className="text-sm text-slate-500 mt-3">
                Showing {filteredUpdates} of {totalUpdates} updates
            </p>
            {role === "admin" && (
                <button
                    type="button"
                    onClick={handleExcelExport}
                    disabled={isExporting || filteredUpdates === 0}
                    className="w-full mt-3 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed border border-green-600 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                    <Download size={16} />
                    {isExporting ? 'Exporting...' : 'Export to Excel'}
                </button>
            )}
        </div>
    );
}
