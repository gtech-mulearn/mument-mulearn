'use client';

import { useState, useEffect } from "react";
import { Loader2, MoveLeft, MoveRight } from "lucide-react";
import FilterBar from "./FilterBar";
import UpdateCard from "./UpdateCard";
import { Role } from "@/types/user";
import { useToast } from "@/components/ToastProvider";
import { searchUpdates, upvoteUpdate } from "@/actions/daily-updates";

interface DailyUpdate {
    id: string;
    content: string;
    user_name: string;
    college_name?: string | null;
    college?: string;
    created_at: string;
    upvote_count: number;
    hasUpvoted?: boolean;
}

interface UpdateCardDailyUpdate {
    id: string;
    content: string;
    user_name?: string;
    college_name?: string;
    created_at?: string;
    upvote_count?: number;
    hasUpvoted?: boolean;
}

export default function DailyForumFilter({ colleges, role, initialSort = 'recent', totalRows = 0 }: { colleges: string[]; role?: Role; initialSort?: string; totalRows?: number }) {
    const { show: showToast } = useToast();
    
    const [page, setPage] = useState(1);
    const [keyword, setKeyword] = useState('');
    const [college, setCollege] = useState('');
    const [date, setDate] = useState('');
    const [sort, setSort] = useState(initialSort);
    const [isLoading, setIsLoading] = useState(false);
    const [upvoting, setUpvoting] = useState<string | null>(null);
    const [upvotedUpdates, setUpvotedUpdates] = useState<Set<string>>(new Set());
    const [upvoteCounts, setUpvoteCounts] = useState<Record<string, number>>({});
    
    const [updates, setUpdates] = useState<DailyUpdate[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const limit = 50;

    // Fetch updates from server
    const fetchUpdates = async (pageNum: number, filters: { keyword: string; college: string; date: string; sort: string }) => {
        setIsLoading(true);
        try {
            const data = await searchUpdates(
                filters.keyword,
                filters.college,
                filters.date,
                filters.sort as 'recent' | 'oldest' | 'upvotes',
                pageNum,
                limit
            );
            setUpdates(data.updates || []);
            setTotal(data.total || 0);
            setTotalPages(data.totalPages || 0);
            // Reset upvote state for new results
            setUpvotedUpdates(new Set());
            setUpvoteCounts({});
        } catch (error) {
            console.error('Fetch error:', error);
            showToast({
                title: "Error",
                description: "Failed to load updates",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Debounce keyword search to avoid excessive API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchUpdates(1, { keyword, college, date, sort });
        }, 300); // Wait 300ms after user stops typing
        
        return () => clearTimeout(timer);
    }, [keyword, college, date, sort]);

    const handleSortChange = (newSort: string) => {
        setSort(newSort);
        setPage(1);
    };

    const handlePrevClick = () => {
        if (page > 1) {
            setPage(page - 1);
            fetchUpdates(page - 1, { keyword, college, date, sort });
        }
    };

    const handleNextClick = () => {
        if (page < totalPages) {
            setPage(page + 1);
            fetchUpdates(page + 1, { keyword, college, date, sort });
        }
    };

    const handleUpvote = async (updateId: string) => {
        setUpvoting(updateId);
        
        // Optimistic update
        const wasUpvoted = upvotedUpdates.has(updateId);
        const newUpvoted = new Set(upvotedUpdates);
        
        if (wasUpvoted) {
            newUpvoted.delete(updateId);
            setUpvoteCounts(prev => ({
                ...prev,
                [updateId]: Math.max(0, (prev[updateId] || 0) - 1)
            }));
        } else {
            newUpvoted.add(updateId);
            setUpvoteCounts(prev => ({
                ...prev,
                [updateId]: (prev[updateId] || 0) + 1
            }));
        }
        setUpvotedUpdates(newUpvoted);

        try {
            const result = await upvoteUpdate(updateId, wasUpvoted ? 'remove' : 'upvote');
            
            if (result.success && result.data && result.data.new_count !== undefined) {
                setUpvoteCounts(prev => ({
                    ...prev,
                    [updateId]: result.data!.new_count
                }));
            } else {
                throw new Error('Failed to upvote');
            }
        } catch (error) {
            // Revert optimistic update on error
            const revertedUpvoted = new Set(newUpvoted);
            if (wasUpvoted) {
                revertedUpvoted.add(updateId);
            } else {
                revertedUpvoted.delete(updateId);
            }
            setUpvotedUpdates(revertedUpvoted);
            
            setUpvoteCounts(prev => ({
                ...prev,
                [updateId]: wasUpvoted ? (prev[updateId] || 0) + 1 : Math.max(0, (prev[updateId] || 0) - 1)
            }));
            
            console.error('Upvote error:', error);
            showToast({
                title: "Upvote Failed",
                description: error instanceof Error ? error.message : "Failed to upvote the update."
            });
        } finally {
            setUpvoting(null);
        }
    };

    return (
        <div>
            <FilterBar
                keyword={keyword}
                setKeyword={setKeyword}
                college={college}
                setCollege={setCollege}
                date={date}
                setDate={setDate}
                sort={sort}
                setSort={handleSortChange}
                colleges={colleges}
                totalUpdates={total}
                filteredUpdates={updates.length}
                role={role || 'participant'}
                filteredData={updates}
                currentPage={page}
                totalPages={totalPages}
                itemsPerPage={limit}
            />

            {updates.length > 0 ? (
                <div className="relative">
                    {isLoading && (
                        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-3 p-8">
                                <div className="animate-spin">
                                    <Loader2 size={32} className="text-blue-500" />
                                </div>
                                <span className="text-sm text-slate-600 font-medium">Loading...</span>
                            </div>
                        </div>
                    )}
                    <div className={isLoading ? 'opacity-50 pointer-events-none' : ''}>
                    {updates.map((entry, index: number) => {
                        const updateData: UpdateCardDailyUpdate = {
                            ...entry,
                            college_name: entry.college_name || entry.college || undefined
                        };
                        return (
                            <UpdateCard
                                key={entry.id}
                                update={updateData}
                                index={index}
                                upvoting={upvoting}
                                hasUpvoted={upvotedUpdates.has(entry.id)}
                                upvoteCount={upvoteCounts[entry.id] || entry.upvote_count || 0}
                                onUpvote={handleUpvote}
                            />
                        );
                    })}
                    
                    {/* Pagination Controls */}
                    <div className="mt-8 flex items-center justify-between border-t pt-4">
                        <div className="text-sm text-slate-600">
                            Showing <span className="font-semibold">{updates.length}</span> of <span className="font-semibold">{total}</span> results.
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handlePrevClick}
                                disabled={page === 1 || isLoading}
                                className={`px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors`}
                            >
                                <MoveLeft />
                            </button>
                            <span className="px-4 py-2 text-slate-600">Page {page}/{totalPages}</span>
                            <button
                                onClick={handleNextClick}
                                disabled={page >= totalPages || isLoading}
                                className={`px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors`}
                            >
                                <MoveRight />
                            </button>
                        </div>
                    </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-8 text-slate-500">
                    No updates match your filters.
                </div>
            )}
        </div>
    );
}
