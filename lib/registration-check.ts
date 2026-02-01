/**
 * Checks if a user has completed the registration process
 * @param user - The user object to check
 * @returns true if registration is complete, false otherwise
 */
export function isRegistrationComplete(user: any): boolean {
    if (!user) return false;

    if (user.isInternational) {
        return !!(user.phone && user.country);
    }

    return !!(
        user.collage &&
        user.collageId &&
        user.branch &&
        user.year &&
        user.phone
    );
}
