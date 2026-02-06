import { Role } from "@/types/user"

// ----------------------------------------------------------------------
// 1. Feature Access (Can they see/do X?)
// ----------------------------------------------------------------------

export const permissions = {
  // --- Checkpoints ---
  canManageCheckpoints(role: Role) {
    // Admin, Campus Coordinator, Buddy (assigned)
    // Note: Buddy permission is typically "assigned only", so the UI might need to check context.
    // This general permission means "has access to the management UI"
    return ["buddy", "campus_coordinator", "admin"].includes(role)
  },

  canCreateCheckpoints(role: Role) {
    return ["buddy", "campus_coordinator"].includes(role)
  },

  canEditCheckpoints(role: Role) {
    return ["buddy", "campus_coordinator", "admin"].includes(role)
  },

  // --- Feedback ---
  canSubmitFeedback() {
    return true // Everyone
  },

  // View Feedback Inbox (General access to the page)
  canViewFeedbackInbox(role: Role) {
    // Foreman (Grouped), Watcher (All), Admin (All)
    // Zonal Lead is "Core Level", likely similar to Admin/Watcher
    return ["qa_foreman", "qa_watcher", "zonal_lead", "admin"].includes(role)
  },

  // Granular Feedback View Scopes
  canViewAllFeedback(role: Role) {
    return ["qa_watcher", "zonal_lead", "admin"].includes(role)
  },

  canViewGroupedFeedback(role: Role) {
    return ["qa_foreman", "qa_watcher", "zonal_lead", "admin"].includes(role)
  },

  canVerifyCampusFeedback(role: Role) {
    return ["campus_coordinator", "admin"].includes(role)
  },

  // Actions
  canGroupFeedback(role: Role) {
    return ["qa_watcher", "zonal_lead", "admin"].includes(role)
  },

  canEscalateFeedback(role: Role) {
    return ["qa_watcher", "zonal_lead", "admin"].includes(role)
  },


  // --- Announcements ---
  canCreateAnnouncements(role: Role) {
    return ["campus_coordinator", "admin"].includes(role)
  },

  canCreateGlobalAnnouncements(role: Role) {
    return role === "admin"
  },

  // --- User Management ---
  canPromoteUsers(role: Role) {
    // Admin (Any), Campus Coordinator (Participant -> Buddy)
    return ["campus_coordinator", "admin"].includes(role)
  },

  canAssignBuddies(role: Role) {
    return ["campus_coordinator", "admin"].includes(role)
  },

  // --- Access Scope ---
  hasAccessToAllCampuses(role: Role) {
    // Core roles
    return ["qa_foreman", "qa_watcher", "zonal_lead", "admin"].includes(role)
  },

  canOverridePermissions(role: Role) {
    return role === "admin"
  }
}

// ----------------------------------------------------------------------
// 2. Helpers
// ----------------------------------------------------------------------

export function hasRole(role: Role, allowed: Role[]) {
  return allowed.includes(role)
}
