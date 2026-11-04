/** Event ownership is necessary but does not retain a revoked organizer capability. */
export function canManageEvents(user: { role: string; verified: boolean }): boolean {
  return user.role === 'ADMIN' || (user.role === 'ORGANIZER' && user.verified);
}
