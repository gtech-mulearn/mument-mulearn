"use client"

import { DailyUpdateStat, CampusStat, DistrictStat } from "@/lib/stats"
import { getCampusDailyUpdateStats } from "@/lib/stats-actions"
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar,
    PieChart, Pie, Cell, Legend
} from "recharts"
import { useState, useTransition } from "react"
import { ChevronDown, Search, X } from "lucide-react"

interface Props {
    dailyStats: DailyUpdateStat[]
    campusStats: CampusStat[]
    districtStats: DistrictStat[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function AdminStats({ dailyStats, campusStats, districtStats }: Props) {
    const [selectedCampus, setSelectedCampus] = useState<string | null>(null)
    const [openDropdown, setOpenDropdown] = useState(false)
    const [campusDailyStats, setCampusDailyStats] = useState<DailyUpdateStat[]>([])
    const [isPending, startTransition] = useTransition()
    const [campusSearch, setCampusSearch] = useState('')

    // Get unique campus names
    const campusNames = campusStats.map(c => c.name)
    const filteredCampuses = campusNames.filter(c =>
        c.toLowerCase().includes(campusSearch.toLowerCase())
    )
    
    // Filter campus stats by selected campus
    const filteredCampusStats = selectedCampus 
        ? campusStats.filter(c => c.name === selectedCampus)
        : campusStats.slice(0, 5) // Only show top 5 when viewing all campuses

    // Handle campus selection and fetch stats
    const handleCampusSelect = (campus: string | null) => {
        setSelectedCampus(campus)
        setOpenDropdown(false)
        
        if (campus) {
            startTransition(async () => {
                const stats = await getCampusDailyUpdateStats(campus)
                setCampusDailyStats(stats)
            })
        } else {
            setCampusDailyStats([])
        }
    }
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Platform Analytics</h2>
                
                {/* Campus Filter Dropdown */}
                <div className="relative w-48">
                    <div
                        onClick={() => setOpenDropdown(!openDropdown)}
                        className={`w-full text-left px-4 py-2 rounded-lg border bg-white flex items-center justify-between transition-colors cursor-pointer
                            ${openDropdown ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 hover:border-gray-300'}
                        `}
                    >
                        <span className="text-sm font-medium text-slate-700">
                            {selectedCampus ? selectedCampus : 'All Campuses'}
                        </span>
                        <ChevronDown size={16} className={`text-slate-400 transition-transform ${openDropdown ? 'rotate-180' : ''}`} />
                    </div>

                    {openDropdown && (
                        <div className="absolute z-50 top-full right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-lg overflow-hidden min-w-full animate-in fade-in zoom-in-95 duration-100">
                            {/* Search Input */}
                            <div className="p-2 border-b border-gray-100 bg-gray-50 sticky top-0">
                                <div className="relative">
                                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        autoFocus
                                        type="text"
                                        className="w-full pl-8 pr-8 py-1.5 text-sm rounded-md border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                                        placeholder="Search campuses..."
                                        value={campusSearch}
                                        onChange={(e) => setCampusSearch(e.target.value)}
                                    />
                                    {campusSearch && (
                                        <button
                                            onClick={() => setCampusSearch('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Campus List */}
                            <div className="max-h-64 overflow-y-auto p-1">
                                {filteredCampuses.length === 0 ? (
                                    <div className="px-4 py-3 text-sm text-slate-500 text-center">
                                        No campuses found
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => handleCampusSelect(null)}
                                            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                                                !selectedCampus ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            All Campuses ({campusNames.length})
                                        </button>
                                        {filteredCampuses.map(campus => {
                                            const count = campusStats.find(c => c.name === campus)?.count || 0
                                            return (
                                                <button
                                                    key={campus}
                                                    onClick={() => handleCampusSelect(campus)}
                                                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex justify-between items-center ${
                                                        selectedCampus === campus ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <span>{campus}</span>
                                                    <span className="text-xs text-slate-500">{count}</span>
                                                </button>
                                            )
                                        })}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Daily Updates: Line Chart */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-700 mb-6">
                    Daily Updates Trend (Last 7 Days) {selectedCampus && `- ${selectedCampus}`}
                </h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <LineChart data={selectedCampus ? campusDailyStats : dailyStats}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#2563eb"
                                strokeWidth={3}
                                dot={{ fill: '#2563eb', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                {isPending && <p className="text-center text-sm text-slate-500 mt-2">Loading campus data...</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Campus Analytics: Only show when viewing all campuses */}
                {!selectedCampus && (
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-700 mb-6">Top 5 Campuses by Users</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <BarChart data={filteredCampusStats} layout="vertical" margin={{ left: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                    <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        stroke="#475569"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        width={120}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    </div>
                )}

                {/* Campus-wise message */}
                {selectedCampus && (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 flex items-center justify-center">
                        <p className="text-center text-blue-800 font-medium">
                            Viewing detailed analytics for <strong>{selectedCampus}</strong>
                        </p>
                    </div>
                )}

                {/* District Distribution: Pie Chart - Only show when viewing all campuses */}
                {!selectedCampus && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-700 mb-6">District Distribution</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <PieChart>
                                <Pie
                                    data={districtStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="count"
                                >
                                    {districtStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Legend
                                    layout="vertical"
                                    verticalAlign="middle"
                                    align="right"
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{ fontSize: '12px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                )}
            </div>
        </div>
    )
}
