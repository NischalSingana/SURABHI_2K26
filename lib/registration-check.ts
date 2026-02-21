/**
 * Checks if a user has completed the registration process
 * @param user - The user object to check
 * @returns true if registration is complete, false otherwise
 */
export function isRegistrationComplete(user: any): boolean {
    if (!user) return false;

    // International students: need phone, country, and college/institution name
    if (user.isInternational) {
        return !!(user.phone && user.country && user.collage);
    }

    // Indian students (KL University and Other College): need all fields including state and city
    return !!(
        user.collage &&
        user.collageId &&
        user.branch &&
        user.year &&
        user.phone &&
        user.state &&
        user.city
    );
}

/**
 * Gets a list of missing required fields for a user
 * @param user - The user object to check
 * @returns Array of missing field names
 */
export function getMissingFields(user: any): string[] {
    if (!user) return [];

    const missingFields: string[] = [];

    if (user.isInternational) {
        if (!user.phone) missingFields.push("Phone Number");
        if (!user.country) missingFields.push("Country");
        if (!user.collage) missingFields.push("College/Institution Name");
    } else {
        if (!user.collage) missingFields.push("College");
        if (!user.collageId) missingFields.push("College ID");
        if (!user.branch) missingFields.push("Branch/Program");
        if (!user.year) missingFields.push("Year");
        if (!user.phone) missingFields.push("Phone Number");
        if (!user.state) missingFields.push("State");
        if (!user.city) missingFields.push("City/Town");
    }

    return missingFields;
}
