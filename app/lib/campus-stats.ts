import { createClient } from "./supabase/server";

export interface DailyUpdateStat {
    date: string;
    count: number;
}

export interface TopContributor {
    user_id: string;
    user_name: string;
    updates_count: number;
}

export interface CampusAnalytics {
    total_participants: number;
    total_daily_updates: number;
    total_feedback: number;
    avg_updates_per_user: number;
}

export async function getDailyUpdateStats(): Promise<DailyUpdateStat[]> {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Fetch college_id from profiles table
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("campus_id")
        .eq("id", user.id)
        .single();

    if (profileError || !profile?.campus_id) {
        console.error("Error fetching user campus:", profileError);
        return [];
    }

    const college_id = profile.campus_id;

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
        .from("daily_updates")
        .select("created_at")
        .eq("college_id", college_id)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: true })

    if (error) {
        console.error("Error fetching daily stats:", error);
        return [];
    }

    const statsMap = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        statsMap.set(key, 0);
    }

    data?.forEach((update) => {
        if (update.created_at) {
            const dateKey = new Date(update.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (statsMap.has(dateKey)) {
                statsMap.set(dateKey, (statsMap.get(dateKey) || 0) + 1);
            }
        }
    })

    return Array.from(statsMap.entries())
        .map(([date, count]) => ({ date, count }))
        .reverse();
}

export async function getTopContributors(campusId: string): Promise<TopContributor[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("daily_updates")
        .select("user_id")
        .eq("college_id", campusId);

    if (error) {
        console.error("Error fetching contributors:", error);
        return [];
    }

    // Count updates per user
    const contributorMap = new Map<string, number>();
    data?.forEach((update) => {
        if (update.user_id) {
            contributorMap.set(update.user_id, (contributorMap.get(update.user_id) || 0) + 1);
        }
    });

    // Get top 5 contributors
    const topUserIds = Array.from(contributorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([userId]) => userId);

    if (topUserIds.length === 0) {
        return [];
    }

    // Fetch user names
    const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", topUserIds);

    if (profileError) {
        console.error("Error fetching profiles:", profileError);
        return [];
    }

    return topUserIds.map(userId => ({
        user_id: userId,
        user_name: profiles?.find(p => p.id === userId)?.full_name || 'Unknown',
        updates_count: contributorMap.get(userId) || 0
    }));
}

export async function getCampusAnalytics(campusId: string): Promise<CampusAnalytics> {
    const supabase = await createClient();

    // Get total participants
    const { count: participantCount, error: participantError } = await supabase
        .from("profiles")
        .select("*", { count: 'exact', head: true })
        .eq("campus_id", campusId);

    // Get total daily updates
    const { count: updateCount, error: updateError } = await supabase
        .from("daily_updates")
        .select("*", { count: 'exact', head: true })
        .eq("college_id", campusId);

    // Get total feedback
    const { count: feedbackCount, error: feedbackError } = await supabase
        .from("feedback")
        .select("*", { count: 'exact', head: true })
        .eq("campus_id", campusId);

    if (participantError || updateError || feedbackError) {
        console.error("Error fetching campus analytics:", { participantError, updateError, feedbackError });
    }

    const totalParticipants = participantCount || 0;
    const totalUpdates = updateCount || 0;
    const totalFeedback = feedbackCount || 0;
    const avgUpdates = totalParticipants > 0 ? Math.round((totalUpdates / totalParticipants) * 10) / 10 : 0;

    return {
        total_participants: totalParticipants,
        total_daily_updates: totalUpdates,
        total_feedback: totalFeedback,
        avg_updates_per_user: avgUpdates
    };
}