"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

type FinalSubmissionRecord = {
  id: string
  full_name: string
  email: string | null
  team_name: string
  team_code: string | null
  campus_name: string | null
  district_name: string | null
  drive_link: string
  submitted_at: string
}

type SubmissionSearchToolsProps = {
  submissions: FinalSubmissionRecord[]
  showCampusFilter?: boolean
  showDistrictFilter?: boolean
}

export default function SubmissionSearchTools({
  submissions,
  showCampusFilter = true,
  showDistrictFilter = true,
}: SubmissionSearchToolsProps) {
  const [query, setQuery] = useState("")
  const [campusFilter, setCampusFilter] = useState("all")
  const [districtFilter, setDistrictFilter] = useState("all")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const campuses = useMemo(() => {
    return Array.from(new Set(submissions.map((s) => s.campus_name).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b))
  }, [submissions])

  const districts = useMemo(() => {
    return Array.from(new Set(submissions.map((s) => s.district_name).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b))
  }, [submissions])

  const filteredSubmissions = useMemo(() => {
    const searchText = query.trim().toLowerCase()
    return submissions.filter((submission) => {
      const haystack = [
        submission.full_name,
        submission.email ?? "",
        submission.team_name,
        submission.team_code ?? "",
        submission.campus_name ?? "",
        submission.district_name ?? "",
        submission.drive_link,
      ]
        .join(" ")
        .toLowerCase()

      const matchesSearch = !searchText || haystack.includes(searchText)
      const matchesCampus = !showCampusFilter || campusFilter === "all" || submission.campus_name === campusFilter
      const matchesDistrict = !showDistrictFilter || districtFilter === "all" || submission.district_name === districtFilter

      const submittedDate = submission.submitted_at ? new Date(submission.submitted_at) : null
      const matchesFromDate =
        !fromDate ||
        (submittedDate !== null && submittedDate >= new Date(`${fromDate}T00:00:00`))
      const matchesToDate =
        !toDate ||
        (submittedDate !== null && submittedDate <= new Date(`${toDate}T23:59:59`))

      return matchesSearch && matchesCampus && matchesDistrict && matchesFromDate && matchesToDate
    })
  }, [submissions, query, campusFilter, districtFilter, fromDate, toDate, showCampusFilter, showDistrictFilter])

  const hasActiveFilters =
    query.length > 0 ||
    (showCampusFilter && campusFilter !== "all") ||
    (showDistrictFilter && districtFilter !== "all") ||
    fromDate.length > 0 ||
    toDate.length > 0

  function clearFilters() {
    setQuery("")
    setCampusFilter("all")
    setDistrictFilter("all")
    setFromDate("")
    setToDate("")
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <div>
            <label htmlFor="submission-search" className="block text-xs text-slate-500 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                id="submission-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, email, team, campus..."
                className="w-full pl-9 pr-2.5 py-2.5 rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
              />
            </div>
          </div>

          {showCampusFilter && (
            <div>
              <label htmlFor="campus-filter" className="block text-xs text-slate-500 mb-1">
                Campus
              </label>
              <select
                id="campus-filter"
                value={campusFilter}
                onChange={(e) => setCampusFilter(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
              >
                <option value="all">All Campuses</option>
                {campuses.map((campus) => (
                  <option key={campus} value={campus}>
                    {campus}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showDistrictFilter && (
            <div>
              <label htmlFor="district-filter" className="block text-xs text-slate-500 mb-1">
                District
              </label>
              <select
                id="district-filter"
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
              >
                <option value="all">All Districts</option>
                {districts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="from-date-filter" className="block text-xs text-slate-500 mb-1">
              Submitted From
            </label>
            <input
              id="from-date-filter"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
            />
          </div>

          <div>
            <label htmlFor="to-date-filter" className="block text-xs text-slate-500 mb-1">
              Submitted To
            </label>
            <input
              id="to-date-filter"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="text-sm text-slate-600">
            Showing <span className="font-semibold text-slate-900">{filteredSubmissions.length}</span> of {submissions.length}
          </div>
          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              hasActiveFilters
                ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                : "bg-slate-50 text-slate-400 cursor-not-allowed"
            }`}
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
        <table className="w-full min-w-230 text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Name</th>
              <th className="text-left px-4 py-3 font-semibold">Email</th>
              <th className="text-left px-4 py-3 font-semibold">Team</th>
              <th className="text-left px-4 py-3 font-semibold">Campus</th>
              <th className="text-left px-4 py-3 font-semibold">District</th>
              <th className="text-left px-4 py-3 font-semibold">Submitted At</th>
              <th className="text-left px-4 py-3 font-semibold">Drive Link</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={7}>
                  No submissions found for the selected filters.
                </td>
              </tr>
            ) : (
              filteredSubmissions.map((submission) => (
                <tr key={submission.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-800 font-medium">{submission.full_name}</td>
                  <td className="px-4 py-3 text-slate-700">{submission.email ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {submission.team_name}
                    {submission.team_code ? ` (${submission.team_code})` : ""}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{submission.campus_name ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{submission.district_name ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={submission.drive_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-blue hover:underline break-all"
                    >
                      Open Link
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
