'use client';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, MoveLeft, MoveRight } from "lucide-react";
import FilterBar from "./FilterBar";
import UpdateCard from "./UpdateCard";
import { Role } from "@/types/user";
import { useToast } from "@/components/ToastProvider";

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

export default function DailyForumFilter({ dailyUpdates, colleges, role, page = 1, limit = 50, initialSort = 'recent', totalRows = 0 }: { dailyUpdates: DailyUpdate[]; colleges: string[]; role?: Role; page?: number; limit?: number; initialSort?: string; totalRows?: number }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { show: showToast } = useToast();
    
    // Use actual database row count, fallback to dailyUpdates length
    const actualTotalRows = totalRows > 0 ? totalRows : dailyUpdates.length;
    const urlPage = parseInt(searchParams.get('page') || '1', 10);
    const urlSort = searchParams.get('sort') || initialSort;
    const urlKeyword = searchParams.get('keyword') || '';
    const urlCollege = searchParams.get('college') || '';
    const urlDate = searchParams.get('date') || '';
    
    const [keyword, setKeyword] = useState(urlKeyword);
    const [college, setCollege] = useState(urlCollege);
    const [date, setDate] = useState(urlDate);
    const [sort, setSort] = useState(urlSort);
    const [isLoading, setIsLoading] = useState(false);
    const [upvoting, setUpvoting] = useState<string | null>(null);
    const [upvotedUpdates, setUpvotedUpdates] = useState<Set<string>>(
        new Set(dailyUpdates.filter(u => u.hasUpvoted).map(u => u.id))
    );
    const [upvoteCounts, setUpvoteCounts] = useState<Record<string, number>>(
        dailyUpdates.reduce((acc, u) => {
            acc[u.id] = u.upvote_count || 0;
            return acc;
        }, {} as Record<string, number>)
    );

    const handleSortChange = (newSort: string) => {
        setSort(newSort);
        setIsLoading(true);
        // Reset to page 1 but preserve current filters
        const params = new URLSearchParams();
        params.set('page', '1');
        params.set('sort', newSort);
        if (keyword) params.set('keyword', keyword);
        if (college) params.set('college', college);
        if (date) params.set('date', date);
        router.push(`?${params.toString()}`);
    };

    const filteredUpdates = dailyUpdates.filter((entry: DailyUpdate) => {
        const keywordMatch = keyword === '' ||
            entry.content?.toLowerCase().includes(keyword.toLowerCase()) ||
            entry.user_name?.toLowerCase().includes(keyword.toLowerCase());

        const collegeMatch = college === '' || entry.college_name === college;

        let dateMatch = true;
        if (date) {
            const entryDate = entry.created_at ? new Date(entry.created_at).toLocaleDateString() : '';
            const filterDate = new Date(date).toLocaleDateString();
            dateMatch = entryDate === filterDate;
        }

        return keywordMatch && collegeMatch && dateMatch;
    }).sort((a, b) => {
        // Note: Server-side sorting handles date-based ordering
        // Client-side sorting only for client-side filters
        if (sort === 'upvotes') {
            return (upvoteCounts[b.id] || 0) - (upvoteCounts[a.id] || 0);
        }
        return 0;
    });

    // Handle loading state when page changes
    useEffect(() => {
        setIsLoading(false);
    }, [urlPage, sort, college, date, keyword, filteredUpdates.length]);

    //Handle loading state force for timeout
    useEffect(() => {
        if (isLoading) {
            const timer = setTimeout(() => {
                setIsLoading(false);
            }, 3000); // Minimum loading time of 3 seconds

            return () => clearTimeout(timer);
        }
    }, [isLoading]);

    // Paginate filtered results
    const itemsPerPage = limit;
    const totalPages = Math.ceil(filteredUpdates.length / itemsPerPage);
    const currentPage = Math.max(1, Math.min(urlPage, totalPages));
    const startIdx = (currentPage - 1) * itemsPerPage;
    const paginatedUpdates = filteredUpdates.slice(startIdx, startIdx + itemsPerPage);

    const handleUpvote = async (updateId: string) => {
        setUpvoting(updateId);
        
        // Optimistic update - immediately update UI for better UX
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
            const response = await fetch('/api/daily-updates/upvote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    update_id: updateId,
                    action: wasUpvoted ? 'remove' : 'upvote'
                })
            });

            if (response.ok) {
                const result = await response.json();
                // Update with actual count from server if available
                if (result.data?.new_count !== undefined) {
                    setUpvoteCounts(prev => ({
                        ...prev,
                        [updateId]: result.data.new_count
                    }));
                }
            } else {
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
                
                const error = await response.json();
                showToast({
                    title: "Upvote Failed",
                    description: error.message || "Failed to upvote the update."
                });
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

    const handlePrevClick = () => {
        if (currentPage > 1) {
            setIsLoading(true);
            router.push(`?page=${currentPage - 1}&sort=${sort}`);
        }
    };

    const handleNextClick = () => {
        if (currentPage < totalPages) {
            setIsLoading(true);
            router.push(`?page=${currentPage + 1}&sort=${sort}`);
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
                totalUpdates={actualTotalRows}
                filteredUpdates={paginatedUpdates.length}
                role={role || 'participant'}
                filteredData={filteredUpdates}
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
            />

            {filteredUpdates.length > 0 ? (
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
                    {paginatedUpdates.map((entry, index: number) => {
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
                                upvoteCount={upvoteCounts[entry.id] || 0}
                                onUpvote={handleUpvote}
                            />
                        );
                    })}
                    
                    {/* Pagination Controls */}
                    <div className="mt-8 flex items-center justify-between border-t pt-4">
                        <div className="text-sm text-slate-600">
                            Showing <span className="font-semibold">{paginatedUpdates.length}</span> of <span className="font-semibold">{filteredUpdates.length}</span> results.
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    handlePrevClick();
                                }}
                                disabled={currentPage === 1 || isLoading}
                                className={`px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors`}
                            >
                                <MoveLeft />
                            </button>
                            <span className="px-4 py-2 text-slate-600">Page {currentPage}/{totalPages}</span>
                            <button
                                onClick={() => {
                                    handleNextClick();
                                }}
                                disabled={currentPage >= totalPages || isLoading}
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
