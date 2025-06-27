import type { Team } from '../types';

/**
 * Check if user can create teams
 * Users can create teams if:
 * 1. They have no existing team memberships (first-time users)
 * 2. They have ADMIN or MANAGER role in at least one team
 */
export const canCreateTeam = (teams: Team[]): boolean => {
  if (!Array.isArray(teams) || teams.length === 0) {
    return true; // First-time users can create teams
  }

  // Check if user has ADMIN or MANAGER role in any team
  return teams.some(team => 
    team.members?.some(member => 
      ['ADMIN', 'MANAGER'].includes(member.role)
    )
  );
};

/**
 * Check if user can create projects in a specific team
 * Users can create projects if they have ADMIN or MANAGER role in that team
 */
export const canCreateProject = (teams: Team[], teamId?: string): boolean => {
  if (!Array.isArray(teams) || !teamId) {
    return false;
  }

  const team = teams.find(t => t.id === teamId);
  if (!team) {
    return false;
  }

  return team.members?.some(member => 
    ['ADMIN', 'MANAGER'].includes(member.role)
  ) || false;
};

/**
 * Check if user can create projects (has ADMIN or MANAGER role in any team)
 */
export const canCreateAnyProject = (teams: Team[]): boolean => {
  if (!Array.isArray(teams) || teams.length === 0) {
    return false;
  }

  return teams.some(team => 
    team.members?.some(member => 
      ['ADMIN', 'MANAGER'].includes(member.role)
    )
  );
};

/**
 * Check if user can manage team (add/remove members)
 * Only ADMINs can manage team members
 */
export const canManageTeam = (teams: Team[], teamId: string): boolean => {
  if (!Array.isArray(teams) || !teamId) {
    return false;
  }

  const team = teams.find(t => t.id === teamId);
  if (!team) {
    return false;
  }

  return team.members?.some(member => 
    member.role === 'ADMIN'
  ) || false;
};

/**
 * Get user's role in a specific team
 */
export const getUserRoleInTeam = (teams: Team[], teamId: string): string | null => {
  if (!Array.isArray(teams) || !teamId) {
    return null;
  }

  const team = teams.find(t => t.id === teamId);
  if (!team) {
    return null;
  }

  const membership = team.members?.find(member => member.role);
  return membership?.role || null;
};

/**
 * Get user's highest role across all teams
 */
export const getUserHighestRole = (teams: Team[]): string | null => {
  if (!Array.isArray(teams) || teams.length === 0) {
    return null;
  }

  const roles = teams.flatMap(team => 
    team.members?.map(member => member.role) || []
  );

  if (roles.includes('ADMIN')) return 'ADMIN';
  if (roles.includes('MANAGER')) return 'MANAGER';
  if (roles.includes('DEVELOPER')) return 'DEVELOPER';
  
  return null;
};
