"use client"

import { DailyUpdateStat, TopContributor, CampusAnalytics } from "@/lib/campus-stats"
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar,
} from "recharts"
import { Users, MessageSquare, MessageCircle, TrendingUp } from "lucide-react"

interface Props {
    dailyStats: DailyUpdateStat[]
    topContributors: TopContributor[]
    analytics: CampusAnalytics
}

export default function CampusStats({ dailyStats, topContributors, analytics }: Props) {
    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-slate-800">Campus Analytics</h2>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 font-medium">Total Participants</p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">{analytics.total_participants}</p>
                        </div>
                        <Users className="text-blue-500" size={32} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 font-medium">Daily Updates</p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">{analytics.total_daily_updates}</p>
                        </div>
                        <MessageSquare className="text-green-500" size={32} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 font-medium">Feedback Submissions</p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">{analytics.total_feedback}</p>
                        </div>
                        <MessageCircle className="text-purple-500" size={32} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 font-medium">Avg Updates/User</p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">{analytics.avg_updates_per_user}</p>
                        </div>
                        <TrendingUp className="text-orange-500" size={32} />
                    </div>
                </div>
            </div>

            {/* Daily Updates Trend Line Chart */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-700 mb-6">Daily Updates Trend (Last 7 Days)</h3>
                <div className="h-75 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dailyStats}>
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
            </div>

            {/* Top Contributors Bar Chart */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-700 mb-6">Top Contributors</h3>
                {topContributors.length > 0 ? (
                    <div className="h-75 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topContributors} layout="vertical" margin={{ left: 150 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                <YAxis
                                    type="category"
                                    dataKey="user_name"
                                    stroke="#475569"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    width={140}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="updates_count" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-75 flex items-center justify-center text-slate-500">
                        No contributor data available
                    </div>
                )}
            </div>
        </div>
    )
}
