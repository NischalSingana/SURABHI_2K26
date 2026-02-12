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
 * Get competition-wise registration analytics
 */
export async function getCompetitionWiseAnalytics() {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || session.user.role !== Role.GOD) {
            throw new Error("Unauthorized - GOD role required");
        }

        const events = await prisma.event.findMany({
            select: {
                id: true,
                name: true,
                isGroupEvent: true,
                Category: {
                    select: {
                        name: true,
                    },
                },
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
        });

        const competitionAnalytics = events.map((event) => {
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
                    if (gender === "MALE") klIndividualMale++;
                    else if (gender === "FEMALE") klIndividualFemale++;
                } else {
                    otherIndividual++;
                    if (gender === "MALE") otherIndividualMale++;
                    else if (gender === "FEMALE") otherIndividualFemale++;
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
                    klTeamMembers += memberCount;
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
                    if (members) {
                        Object.values(members).forEach((member: any) => {
                            const memberGender = member.gender?.toUpperCase();
                            if (memberGender === "MALE") otherTeamMale++;
                            else if (memberGender === "FEMALE") otherTeamFemale++;
                        });
                    }
                }
            });

            return {
                id: event.id,
                name: event.name,
                category: event.Category.name,
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

        return {
            success: true,
            competitions: competitionAnalytics,
        };
    } catch (error: any) {
        console.error("Error fetching competition-wise analytics:", error);
        return { success: false, error: error.message };
    }
}
