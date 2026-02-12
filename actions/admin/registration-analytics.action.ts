"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { Role } from "@prisma/client";

/**
 * Helper function to check if a user is from KL University
 */
function isKLUniversity(user: {
    email?: string | null;
    collage?: string | null;
}): boolean {
    if (!user) return false;
    if (user.email?.toLowerCase().endsWith("@kluniversity.in")) return true;
    const collage = (user.collage || "").toLowerCase();
    return (
        collage.includes("kl university") ||
        collage.includes("kl") ||
        collage.includes("koneru") ||
        collage.includes("klef")
    );
}

/**
 * Get total registration statistics by college (KL vs Others)
 */
export async function getRegistrationStatsByCollege() {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || session.user.role !== Role.GOD) {
            throw new Error("Unauthorized - GOD role required");
        }

        // Get all individual registrations with user data
        const individualRegistrations = await prisma.individualRegistration.findMany({
            select: {
                id: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        collage: true,
                        isInternational: true,
                        gender: true,
                    },
                },
            },
        });

        // Get all group registrations with user data and members
        const groupRegistrations = await prisma.groupRegistration.findMany({
            select: {
                id: true,
                members: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        collage: true,
                        isInternational: true,
                        gender: true,
                    },
                },
            },
        });

        // Count KL vs Other for individual registrations with gender
        let klIndividual = 0;
        let otherIndividual = 0;
        let klIndividualMale = 0;
        let klIndividualFemale = 0;
        let otherIndividualMale = 0;
        let otherIndividualFemale = 0;

        individualRegistrations.forEach((reg) => {
            const isKL = isKLUniversity(reg.user);
            const gender = reg.user.gender?.toUpperCase();
            if (isKL) {
                klIndividual++;
                if (gender === "MALE") klIndividualMale++;
                else if (gender === "FEMALE") klIndividualFemale++;
            } else {
                otherIndividual++;
                if (gender === "MALE") otherIndividualMale++;
                else if (gender === "FEMALE") otherIndividualFemale++;
            }
        });

        // Count KL vs Other for group registrations (teams and members) with gender
        let klTeams = 0;
        let otherTeams = 0;
        let klTeamMembers = 0;
        let otherTeamMembers = 0;
        let klTeamMale = 0;
        let klTeamFemale = 0;
        let otherTeamMale = 0;
        let otherTeamFemale = 0;

        groupRegistrations.forEach((reg) => {
            const members = reg.members as Record<string, any> | null;
            const memberCount = members ? Object.keys(members).length : 0;
            const isKL = isKLUniversity(reg.user);

            if (isKL) {
                klTeams++;
                klTeamMembers += memberCount;
                // Count genders in team members
                if (members) {
                    Object.values(members).forEach((member: any) => {
                        const memberGender = member.gender?.toUpperCase();
                        if (memberGender === "MALE") klTeamMale++;
                        else if (memberGender === "FEMALE") klTeamFemale++;
                    });
                }
            } else {
                otherTeams++;
                otherTeamMembers += memberCount;
                // Count genders in team members
                if (members) {
                    Object.values(members).forEach((member: any) => {
                        const memberGender = member.gender?.toUpperCase();
                        if (memberGender === "MALE") otherTeamMale++;
                        else if (memberGender === "FEMALE") otherTeamFemale++;
                    });
                }
            }
        });

        const totalMale = klIndividualMale + otherIndividualMale + klTeamMale + otherTeamMale;
        const totalFemale = klIndividualFemale + otherIndividualFemale + klTeamFemale + otherTeamFemale;

        return {
            success: true,
            stats: {
                individual: {
                    kl: klIndividual,
                    other: otherIndividual,
                    total: klIndividual + otherIndividual,
                    gender: {
                        kl: {
                            male: klIndividualMale,
                            female: klIndividualFemale,
                        },
                        other: {
                            male: otherIndividualMale,
                            female: otherIndividualFemale,
                        },
                        total: {
                            male: klIndividualMale + otherIndividualMale,
                            female: klIndividualFemale + otherIndividualFemale,
                        },
                    },
                },
                team: {
                    kl: {
                        teams: klTeams,
                        members: klTeamMembers,
                        gender: {
                            male: klTeamMale,
                            female: klTeamFemale,
                        },
                    },
                    other: {
                        teams: otherTeams,
                        members: otherTeamMembers,
                        gender: {
                            male: otherTeamMale,
                            female: otherTeamFemale,
                        },
                    },
                    total: {
                        teams: klTeams + otherTeams,
                        members: klTeamMembers + otherTeamMembers,
                        gender: {
                            male: klTeamMale + otherTeamMale,
                            female: klTeamFemale + otherTeamFemale,
                        },
                    },
                },
                overall: {
                    kl: {
                        registrations: klIndividual + klTeams,
                        participants: klIndividual + klTeamMembers,
                        gender: {
                            male: klIndividualMale + klTeamMale,
                            female: klIndividualFemale + klTeamFemale,
                        },
                    },
                    other: {
                        registrations: otherIndividual + otherTeams,
                        participants: otherIndividual + otherTeamMembers,
                        gender: {
                            male: otherIndividualMale + otherTeamMale,
                            female: otherIndividualFemale + otherTeamFemale,
                        },
                    },
                    total: {
                        registrations: klIndividual + otherIndividual + klTeams + otherTeams,
                        participants: klIndividual + otherIndividual + klTeamMembers + otherTeamMembers,
                        gender: {
                            male: totalMale,
                            female: totalFemale,
                        },
                    },
                },
            },
        };
    } catch (error: any) {
        console.error("Error fetching registration stats by college:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Get category-wise registration analytics
 */
export async function getCategoryWiseAnalytics() {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || session.user.role !== Role.GOD) {
            throw new Error("Unauthorized - GOD role required");
        }

        // Get categories with their events
        const categories = await prisma.category.findMany({
            select: {
                id: true,
                name: true,
                Event: {
                    select: {
                        id: true,
                        name: true,
                        isGroupEvent: true,
                        individualRegistrations: {
                            select: {
                                id: true,
                                createdAt: true,
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        collage: true,
                                        collageId: true,
                                        branch: true,
                                        year: true,
                                        phone: true,
                                        gender: true,
                                        isInternational: true,
                                    },
                                },
                            },
                        },
                        groupRegistrations: {
                            select: {
                                id: true,
                                groupName: true,
                                members: true,
                                createdAt: true,
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        collage: true,
                                        collageId: true,
                                        branch: true,
                                        year: true,
                                        phone: true,
                                        gender: true,
                                        isInternational: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: {
                        name: "asc",
                    },
                },
            },
            orderBy: {
                name: "asc",
            },
        });

        const categoryAnalytics = categories.map((category) => {
            // Aggregate all events in this category
            let categoryKlIndividual = 0;
            let categoryOtherIndividual = 0;
            let categoryKlIndividualMale = 0;
            let categoryKlIndividualFemale = 0;
            let categoryOtherIndividualMale = 0;
            let categoryOtherIndividualFemale = 0;
            let categoryKlTeams = 0;
            let categoryOtherTeams = 0;
            let categoryKlTeamMembers = 0;
            let categoryOtherTeamMembers = 0;
            let categoryKlTeamMale = 0;
            let categoryKlTeamFemale = 0;
            let categoryOtherTeamMale = 0;
            let categoryOtherTeamFemale = 0;

            // Process each event in the category
            const competitions = category.Event.map((event) => {
                // Individual registrations breakdown with gender
                let klIndividual = 0;
                let otherIndividual = 0;
                let klIndividualMale = 0;
                let klIndividualFemale = 0;
                let otherIndividualMale = 0;
                let otherIndividualFemale = 0;

                event.individualRegistrations.forEach((reg) => {
                    const isKL = isKLUniversity(reg.user);
                    const gender = reg.user.gender?.toUpperCase();
                    if (isKL) {
                        klIndividual++;
                        categoryKlIndividual++;
                        if (gender === "MALE") {
                            klIndividualMale++;
                            categoryKlIndividualMale++;
                        } else if (gender === "FEMALE") {
                            klIndividualFemale++;
                            categoryKlIndividualFemale++;
                        }
                    } else {
                        otherIndividual++;
                        categoryOtherIndividual++;
                        if (gender === "MALE") {
                            otherIndividualMale++;
                            categoryOtherIndividualMale++;
                        } else if (gender === "FEMALE") {
                            otherIndividualFemale++;
                            categoryOtherIndividualFemale++;
                        }
                    }
                });

                // Group registrations breakdown with gender
                let klTeams = 0;
                let otherTeams = 0;
                let klTeamMembers = 0;
                let otherTeamMembers = 0;
                let klTeamMale = 0;
                let klTeamFemale = 0;
                let otherTeamMale = 0;
                let otherTeamFemale = 0;

                event.groupRegistrations.forEach((reg) => {
                    const members = reg.members as Record<string, any> | null;
                    const memberCount = members ? Object.keys(members).length : 0;
                    const isKL = isKLUniversity(reg.user);

                    if (isKL) {
                        klTeams++;
                        categoryKlTeams++;
                        klTeamMembers += memberCount;
                        categoryKlTeamMembers += memberCount;
                        if (members) {
                            Object.values(members).forEach((member: any) => {
                                const memberGender = member.gender?.toUpperCase();
                                if (memberGender === "MALE") {
                                    klTeamMale++;
                                    categoryKlTeamMale++;
                                } else if (memberGender === "FEMALE") {
                                    klTeamFemale++;
                                    categoryKlTeamFemale++;
                                }
                            });
                        }
                    } else {
                        otherTeams++;
                        categoryOtherTeams++;
                        otherTeamMembers += memberCount;
                        categoryOtherTeamMembers += memberCount;
                        if (members) {
                            Object.values(members).forEach((member: any) => {
                                const memberGender = member.gender?.toUpperCase();
                                if (memberGender === "MALE") {
                                    otherTeamMale++;
                                    categoryOtherTeamMale++;
                                } else if (memberGender === "FEMALE") {
                                    otherTeamFemale++;
                                    categoryOtherTeamFemale++;
                                }
                            });
                        }
                    }
                });

                return {
                    id: event.id,
                    name: event.name,
                    isGroupEvent: event.isGroupEvent,
                individual: {
                    kl: klIndividual,
                    other: otherIndividual,
                    total: klIndividual + otherIndividual,
                    gender: {
                        kl: {
                            male: klIndividualMale,
                            female: klIndividualFemale,
                        },
                        other: {
                            male: otherIndividualMale,
                            female: otherIndividualFemale,
                        },
                        total: {
                            male: klIndividualMale + otherIndividualMale,
                            female: klIndividualFemale + otherIndividualFemale,
                        },
                    },
                    registrations: event.individualRegistrations.map((reg) => ({
                        id: reg.id,
                        createdAt: reg.createdAt,
                        user: {
                            id: reg.user.id,
                            name: reg.user.name,
                            email: reg.user.email,
                            collage: reg.user.collage,
                            collageId: reg.user.collageId,
                            branch: reg.user.branch,
                            year: reg.user.year,
                            phone: reg.user.phone,
                            gender: reg.user.gender,
                            isInternational: reg.user.isInternational,
                        },
                    })),
                },
                team: {
                    kl: {
                        teams: klTeams,
                        members: klTeamMembers,
                        gender: {
                            male: klTeamMale,
                            female: klTeamFemale,
                        },
                    },
                    other: {
                        teams: otherTeams,
                        members: otherTeamMembers,
                        gender: {
                            male: otherTeamMale,
                            female: otherTeamFemale,
                        },
                    },
                    total: {
                        teams: klTeams + otherTeams,
                        members: klTeamMembers + otherTeamMembers,
                        gender: {
                            male: klTeamMale + otherTeamMale,
                            female: klTeamFemale + otherTeamFemale,
                        },
                    },
                    registrations: event.groupRegistrations.map((reg) => ({
                        id: reg.id,
                        groupName: reg.groupName,
                        members: reg.members,
                        createdAt: reg.createdAt,
                        user: {
                            id: reg.user.id,
                            name: reg.user.name,
                            email: reg.user.email,
                            collage: reg.user.collage,
                            collageId: reg.user.collageId,
                            branch: reg.user.branch,
                            year: reg.user.year,
                            phone: reg.user.phone,
                            gender: reg.user.gender,
                            isInternational: reg.user.isInternational,
                        },
                    })),
                },
                overall: {
                    kl: {
                        registrations: klIndividual + klTeams,
                        participants: klIndividual + klTeamMembers,
                        gender: {
                            male: klIndividualMale + klTeamMale,
                            female: klIndividualFemale + klTeamFemale,
                        },
                    },
                    other: {
                        registrations: otherIndividual + otherTeams,
                        participants: otherIndividual + otherTeamMembers,
                        gender: {
                            male: otherIndividualMale + otherTeamMale,
                            female: otherIndividualFemale + otherTeamFemale,
                        },
                    },
                    total: {
                        registrations: klIndividual + otherIndividual + klTeams + otherTeams,
                        participants: klIndividual + otherIndividual + klTeamMembers + otherTeamMembers,
                        gender: {
                            male: klIndividualMale + otherIndividualMale + klTeamMale + otherTeamMale,
                            female: klIndividualFemale + otherIndividualFemale + klTeamFemale + otherTeamFemale,
                        },
                    },
                },
                };
            });

            // Return category-level aggregated data
            return {
                id: category.id,
                name: category.name,
                individual: {
                    kl: categoryKlIndividual,
                    other: categoryOtherIndividual,
                    total: categoryKlIndividual + categoryOtherIndividual,
                    gender: {
                        kl: {
                            male: categoryKlIndividualMale,
                            female: categoryKlIndividualFemale,
                        },
                        other: {
                            male: categoryOtherIndividualMale,
                            female: categoryOtherIndividualFemale,
                        },
                        total: {
                            male: categoryKlIndividualMale + categoryOtherIndividualMale,
                            female: categoryKlIndividualFemale + categoryOtherIndividualFemale,
                        },
                    },
                },
                team: {
                    kl: {
                        teams: categoryKlTeams,
                        members: categoryKlTeamMembers,
                        gender: {
                            male: categoryKlTeamMale,
                            female: categoryKlTeamFemale,
                        },
                    },
                    other: {
                        teams: categoryOtherTeams,
                        members: categoryOtherTeamMembers,
                        gender: {
                            male: categoryOtherTeamMale,
                            female: categoryOtherTeamFemale,
                        },
                    },
                    total: {
                        teams: categoryKlTeams + categoryOtherTeams,
                        members: categoryKlTeamMembers + categoryOtherTeamMembers,
                        gender: {
                            male: categoryKlTeamMale + categoryOtherTeamMale,
                            female: categoryKlTeamFemale + categoryOtherTeamFemale,
                        },
                    },
                },
                overall: {
                    kl: {
                        registrations: categoryKlIndividual + categoryKlTeams,
                        participants: categoryKlIndividual + categoryKlTeamMembers,
                        gender: {
                            male: categoryKlIndividualMale + categoryKlTeamMale,
                            female: categoryKlIndividualFemale + categoryKlTeamFemale,
                        },
                    },
                    other: {
                        registrations: categoryOtherIndividual + categoryOtherTeams,
                        participants: categoryOtherIndividual + categoryOtherTeamMembers,
                        gender: {
                            male: categoryOtherIndividualMale + categoryOtherTeamMale,
                            female: categoryOtherIndividualFemale + categoryOtherTeamFemale,
                        },
                    },
                    total: {
                        registrations: categoryKlIndividual + categoryOtherIndividual + categoryKlTeams + categoryOtherTeams,
                        participants: categoryKlIndividual + categoryOtherIndividual + categoryKlTeamMembers + categoryOtherTeamMembers,
                        gender: {
                            male: categoryKlIndividualMale + categoryOtherIndividualMale + categoryKlTeamMale + categoryOtherTeamMale,
                            female: categoryKlIndividualFemale + categoryOtherIndividualFemale + categoryKlTeamFemale + categoryOtherTeamFemale,
                        },
                    },
                },
                competitions: competitions,
            };
        });

        return {
            success: true,
            categories: categoryAnalytics,
        };
    } catch (error: any) {
        console.error("Error fetching category-wise analytics:", error);
        return { success: false, error: error.message };
    }
}
