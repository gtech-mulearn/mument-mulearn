"use client"

import { useState, useRef, useEffect } from "react"
import { Search, ChevronDown, Check, X } from "lucide-react"

interface Option {
    id: string
    name: string
}

interface CampusSearchableSelectProps {
    options: Option[]
    value: string
    onChange: (value: string) => void
    placeholder: string
    label?: string
}

export default function CampusSearchableSelect({ options, value, onChange, placeholder, label }: CampusSearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState("")
    const wrapperRef = useRef<HTMLDivElement>(null)

    const selectedOption = options.find(o => o.id === value)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const filteredOptions = options.filter(option =>
        option.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="relative" ref={wrapperRef}>
            {/* Trigger Button */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full text-left px-3 py-2 rounded-lg border bg-white flex items-center justify-between transition-colors cursor-pointer
                    ${isOpen ? 'border-brand-blue ring-2 ring-brand-blue/20' : 'border-gray-200 hover:border-gray-300'}
                `}
            >
                <div className="flex flex-col overflow-hidden flex-1">
                    {/* Optional Label (Tiny) if value selected, or just placeholder */}
                    {value && value !== 'all' ? (
                        <span className="block truncate text-sm font-medium text-slate-800">
                            {selectedOption ? selectedOption.name : value}
                        </span>
                    ) : (
                        <span className="text-sm text-slate-400">{placeholder}</span>
                    )}
                </div>

                <div className="flex items-center gap-2 ml-2">
                    {value && value !== 'all' && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                onChange("all")
                            }}
                            className="p-0.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">

                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-50 bg-gray-50/50 sticky top-0">
                        <div className="relative">
                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                autoFocus
                                type="text"
                                className="w-full pl-8 pr-2 py-1.5 text-xs rounded-md border border-gray-200 focus:outline-none focus:border-brand-blue bg-white"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="overflow-y-auto flex-1 p-1">
                        <button
                            className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between
                               ${value === 'all' || !value ? 'bg-brand-blue/5 text-brand-blue font-medium' : 'text-slate-600 hover:bg-slate-50'}
                           `}
                            onClick={() => {
                                onChange("all")
                                setIsOpen(false)
                                setSearch("")
                            }}
                        >
                            <span>All</span>
                            {(value === 'all' || !value) && <Check size={14} />}
                        </button>

                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-4 text-center text-xs text-gray-400">
                                No results found
                            </div>
                        ) : (
                            filteredOptions.map(option => {
                                const isSelected = option.id === value
                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => {
                                            onChange(option.id)
                                            setIsOpen(false)
                                            setSearch("")
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between group
                                            ${isSelected ? 'bg-brand-blue/5 text-brand-blue font-medium' : 'text-slate-600 hover:bg-slate-50'}
                                        `}
                                    >
                                        <span className="truncate">{option.name}</span>
                                        {isSelected && <Check size={14} />}
                                    </button>
                                )
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
