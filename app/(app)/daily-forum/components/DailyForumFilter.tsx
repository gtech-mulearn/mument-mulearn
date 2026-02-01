'use client';

import { useState } from "react";
import FilterBar from "./FilterBar";
import UpdateCard from "./UpdateCard";
import { Role } from "@/types/user";

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

export default function DailyForumFilter({ dailyUpdates, colleges, role }: { dailyUpdates: DailyUpdate[]; colleges: string[]; role?: Role }) {
    const [keyword, setKeyword] = useState('');
    const [college, setCollege] = useState('');
    const [date, setDate] = useState('');
    const [sort, setSort] = useState('recent');
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
        if (sort === 'recent') {
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        } else if (sort === 'oldest') {
            return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        } else if (sort === 'upvotes') {
            return (upvoteCounts[b.id] || 0) - (upvoteCounts[a.id] || 0);
        }
        return 0;
    });

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
                alert(error.error || 'Failed to upvote');
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
            alert('Failed to upvote');
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
                setSort={setSort}
                colleges={colleges}
                totalUpdates={dailyUpdates.length}
                filteredUpdates={filteredUpdates.length}
                role={role || 'participant'}
                filteredData={filteredUpdates}
            />

            {filteredUpdates.length > 0 ? (
                <div>
                    {filteredUpdates.map((entry, index: number) => {
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
                </div>
            ) : (
                <div className="text-center py-8 text-slate-500">
                    No updates match your filters.
                </div>
            )}
        </div>
    );
}
