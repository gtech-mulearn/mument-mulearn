import { createClient } from "@/lib/supabase/server"

type AwardOpts = {
  related_type?: string
  related_id?: string | null
  reason?: string
  awarded_by?: string | null
  metadata?: Record<string, unknown>
}

export async function awardPoints(userId: string, ruleKey: string, opts: AwardOpts = {}) {
  const supabase = await createClient()

  // Prefer the DB RPC for atomic checks + insert. Falls back to JS logic if RPC unavailable.
  try {
    const { data, error } = await supabase.rpc("award_points", {
      p_user_id: userId,
      p_rule_key: ruleKey,
      p_reason: opts.reason ?? null,
      p_related_type: opts.related_type ?? null,
      p_related_id: opts.related_id ?? null,
      p_awarded_by: opts.awarded_by ?? null,
      p_metadata: opts.metadata ? opts.metadata : {},
    })

    if (error) throw error
    // Supabase rpc returns an array of rows for set-returning functions
    return Array.isArray(data) ? data[0] : data
  } catch (rpcErr) {
    // If RPC call failed (missing function, permission, etc.), rethrow so callers can decide.
    throw rpcErr
  }
}

export async function getUserPoints(userId: string) {
  const supabase = await createClient()

  const { data: bal, error: balErr } = await supabase
    .from("user_point_balances")
    .select("points")
    .eq("user_id", userId)
    .single()

  if (!balErr && bal) return Number(bal.points || 0)

  // fallback compute
  const { data: rows, error: rowsErr } = await supabase.from("point_transactions").select("amount").eq("user_id", userId)
  if (rowsErr) throw rowsErr
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rows || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
}

export async function getRecentTransactions(userId: string, limit = 20) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("point_transactions")
    .select("id, amount, reason, rule_id, related_type, related_id, metadata, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export async function getLeaderboard(limit = 50) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("user_point_balances")
    .select("user_id, points")
    .order("points", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// --- Step & checkpoint helpers ---
export function computeMultiplier(dayIndex: number) {
  // dayIndex is 1-based day number in month (1..30)
  if (dayIndex >= 1 && dayIndex <= 7) return 1.0
  if (dayIndex >= 8 && dayIndex <= 14) return 1.5
  if (dayIndex >= 15 && dayIndex <= 21) return 2.0
  if (dayIndex >= 22 && dayIndex <= 30) return 3.0
  return 1.0
}

// Step progression rules
export function applyMissedDays(currentStep: number, missedDays: number) {
  // Each missed day -> -1 step, capped at -3 steps total. Step floor = 1
  const loss = Math.min(missedDays, 3)
  const next = currentStep - loss
  return Math.max(1, next)
}

export function applyActiveDays(currentStep: number, activeDays: number) {
  // Each active day -> +1 step, but you can only climb one step per day.
  // Clamp to 30 (total steps) as upper bound.
  const gain = Math.max(0, activeDays)
  const next = currentStep + gain
  return Math.min(30, next)
}

export function computeConsistencyPercent(activeDays: number, totalDays: number) {
  if (totalDays <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((activeDays / totalDays) * 100)))
}

export function checkpointWeightFromConsistency(consistencyPercent: number) {
  if (consistencyPercent >= 75) return 1.0
  if (consistencyPercent >= 50) return 0.7
  return 0.4
}

export async function getStepBasePoints(step: number, speedIndex = 1) {
  const supabase = await createClient()
  const col = (() => {
    switch (speedIndex) {
      case 1:
        return "base_speed1"
      case 2:
        return "base_speed2"
      case 3:
        return "base_speed3"
      case 4:
        return "base_speed4"
      default:
        return "base_speed1"
    }
  })()

  const { data, error } = await supabase.from("step_base_points").select(col).eq("step", step).single()
  if (error || !data) return null
  return Number((data as Record<string, unknown>)[col] || 0)
}

export async function computeDailyPoints(step: number, dayIndex: number, speedIndex = 1) {
  const base = await getStepBasePoints(step, speedIndex)
  if (!base) throw new Error("Base points for step not found")
  const m = computeMultiplier(dayIndex)
  return Math.round(base * m)
}

export async function computeCheckpointAward(checkpointKey: string, consistencyPercent: number) {
  const supabase = await createClient()
  const { data: cp, error } = await supabase.from("checkpoint_definitions").select("base_points").eq("key", checkpointKey).single()
  if (error || !cp) throw new Error("Checkpoint not found")
  const base = Number(cp.base_points || 0)

  let weight = 1.0
  if (consistencyPercent >= 75) weight = 1.0
  else if (consistencyPercent >= 50) weight = 0.7
  else weight = 0.4

  return Math.round(base * weight)
}
