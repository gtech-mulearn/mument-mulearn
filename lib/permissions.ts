const roleHierarchy: Role[] = [
  "participant",
  "buddy",
  "qa_watcher",
  "qa_lead",
  "campus_coordinator",
  "admin",
]

export function hasMinimumRole(
  userRole: Role,
  requiredRole: Role
) {
  return (
    roleHierarchy.indexOf(userRole) >=
    roleHierarchy.indexOf(requiredRole)
  )
}

// Specific permissions
export const permissions = {
  canEditCheckpoint: (role: Role) =>
    ["buddy", "qa_lead", "admin"].includes(role),

  canAssignRoles: (role: Role) =>
    ["campus_coordinator", "admin"].includes(role),

  canViewAllProfiles: (role: Role) =>
    ["qa_watcher", "qa_lead", "admin"].includes(role),
}
