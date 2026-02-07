"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Team } from "@/lib/team"
import { Search, X } from "lucide-react"

interface SearchableTeamFilterProps {
    teams: Team[]
    campuses: { id: string; name: string }[]
    searchQuery: string
    totalTeams: number
}

export default function SearchableTeamFilter({ teams, campuses, searchQuery, totalTeams }: SearchableTeamFilterProps) {
    const router = useRouter()
    const [searchInput, setSearchInput] = useState(searchQuery)
    const [selectedCampus, setSelectedCampus] = useState("")
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [isCampusOpen, setIsCampusOpen] = useState(false)
    const searchRef = useRef<HTMLDivElement>(null)
    const campusRef = useRef<HTMLDivElement>(null)

    // Close dropdowns on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false)
            }
            if (campusRef.current && !campusRef.current.contains(event.target as Node)) {
                setIsCampusOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Filter teams based on search input and selected campus
    const filteredTeams = teams.filter(team => {
        const matchesSearch =
            team.team_code.toLowerCase().includes(searchInput.toLowerCase()) ||
            team.team_name.toLowerCase().includes(searchInput.toLowerCase())
        const matchesCampus = !selectedCampus || team.campus_id === selectedCampus
        return matchesSearch && matchesCampus
    })

    const handleSearch = (value: string) => {
        setSearchInput(value)
        setIsSearchOpen(true)
        updateUrl(value, selectedCampus)
    }

    const handleCampusSelect = (campusId: string) => {
        setSelectedCampus(campusId)
        setIsCampusOpen(false)
        updateUrl(searchInput, campusId)
    }

    const handleSearchSelect = (team: Team) => {
        setSearchInput(`${team.team_code} - ${team.team_name}`)
        setIsSearchOpen(false)
    }

    const handleClear = () => {
        setSearchInput("")
        setSelectedCampus("")
        setIsSearchOpen(false)
        setIsCampusOpen(false)
        router.push("/admin/teams")
    }

    const updateUrl = (search: string, campus: string) => {
        const params = new URLSearchParams()
        params.set("page", "1")
        if (search) params.set("search", search)
        if (campus) params.set("campus", campus)
        router.push(`/admin/teams?${params.toString()}`)
    }

    const selectedCampusName = campuses.find(c => c.id === selectedCampus)?.name

    // Count filtered teams
    const filteredTeamsCount = teams.filter(team => {
        const matchesSearch =
            team.team_code.toLowerCase().includes(searchInput.toLowerCase()) ||
            team.team_name.toLowerCase().includes(searchInput.toLowerCase())
        const matchesCampus = !selectedCampus || team.campus_id === selectedCampus
        return matchesSearch && matchesCampus
    }).length

    return (
        <div className="space-y-3">
            {/* Filter Bar */}
            <div className="flex gap-3">
            {/* Search Bar */}
            <div className="relative flex-1" ref={searchRef}>
                <div
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl border bg-white flex items-center justify-between transition-colors cursor-pointer ${
                        isSearchOpen ? "border-brand-blue ring-2 ring-brand-blue/20" : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                    <div className="flex items-center gap-2 flex-1">
                        <Search size={18} className="text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search teams by code or name..."
                            value={searchInput}
                            onChange={(e) => handleSearch(e.target.value)}
                            onFocus={() => setIsSearchOpen(true)}
                            className="flex-1 bg-transparent outline-none placeholder-gray-400 text-slate-800"
                        />
                    </div>
                    {searchInput && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setSearchInput("")
                                setIsSearchOpen(false)
                                updateUrl("", selectedCampus)
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Search Dropdown */}
                {isSearchOpen && searchInput && filteredTeams.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                        {filteredTeams.map((team) => (
                            <div
                                key={team.id}
                                onClick={() => handleSearchSelect(team)}
                                className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                            >
                                <div className="font-semibold text-slate-800">{team.team_code}</div>
                                <div className="text-sm text-slate-600">{team.team_name}</div>
                                <div className="text-xs text-slate-400">{team.campus_name || team.campus_id}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* No Search Results */}
                {isSearchOpen && searchInput && filteredTeams.length === 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4 text-center text-gray-500">
                        No teams match your search
                    </div>
                )}
            </div>

            {/* Campus Filter */}
            <div className="relative w-48" ref={campusRef}>
                <div
                    onClick={() => setIsCampusOpen(!isCampusOpen)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl border bg-white flex items-center justify-between transition-colors cursor-pointer ${
                        isCampusOpen ? "border-brand-blue ring-2 ring-brand-blue/20" : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-gray-400">🏢</span>
                        <span className="truncate text-slate-800 text-sm">
                            {selectedCampusName || "All Campus"}
                        </span>
                    </div>
                    {selectedCampus && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleCampusSelect("")
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Campus Dropdown */}
                {isCampusOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                        <div
                            onClick={() => handleCampusSelect("")}
                            className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-100 transition-colors font-medium text-slate-800"
                        >
                            All Campus
                        </div>
                        {campuses.map((campus) => (
                            <div
                                key={campus.id}
                                onClick={() => handleCampusSelect(campus.id)}
                                className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors text-slate-800"
                            >
                                {campus.name}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Clear All Button */}
            {(searchInput || selectedCampus) && (
                <button
                    onClick={handleClear}
                    className="px-4 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-all text-sm"
                >
                    Clear
                </button>
            )}
            </div>

            {/* Result Count */}
            <div className="text-sm text-slate-500">
                {searchInput || selectedCampus ? (
                    <>
                        Showing <span className="font-semibold text-slate-700">{filteredTeamsCount}</span> of{" "}
                        <span className="font-semibold text-slate-700">{totalTeams}</span> teams
                    </>
                ) : (
                    <>
                        Total: <span className="font-semibold text-slate-700">{totalTeams}</span> teams
                    </>
                )}
            </div>
        </div>
    )
}
