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

        // Get all approved individual registrations with user data
        const individualRegistrations = await prisma.individualRegistration.findMany({
            where: { paymentStatus: "APPROVED" },
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

        // Get all approved group registrations with user data and members
        const groupRegistrations = await prisma.groupRegistration.findMany({
            where: { paymentStatus: "APPROVED" },
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
            const leaderGender = reg.user.gender?.toUpperCase();

            if (isKL) {
                klTeams++;
                klTeamMembers += memberCount + 1;
                if (leaderGender === "MALE") klTeamMale++;
                else if (leaderGender === "FEMALE") klTeamFemale++;
                if (members) {
                    Object.values(members).forEach((member: any) => {
                        const memberGender = member.gender?.toUpperCase();
                        if (memberGender === "MALE") klTeamMale++;
                        else if (memberGender === "FEMALE") klTeamFemale++;
                    });
                }
            } else {
                otherTeams++;
                otherTeamMembers += memberCount + 1;
                if (leaderGender === "MALE") otherTeamMale++;
                else if (leaderGender === "FEMALE") otherTeamFemale++;
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
                            where: { paymentStatus: "APPROVED" },
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
                            where: { paymentStatus: "APPROVED" },
                            select: {
                                id: true,
                                groupName: true,
                                members: true,
                                registrationDetails: true,
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

        const categoryAnalytics = await Promise.all(
            categories.map(async (category) => {
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

            // Collect all team member phone numbers for batch lookup
            const allMemberPhones = new Set<string>();
            category.Event.forEach((event) => {
                event.groupRegistrations.forEach((reg) => {
                    const members = reg.members as Record<string, any> | null;
                    if (members) {
                        Object.values(members).forEach((member: any) => {
                            if (member?.phone) {
                                allMemberPhones.add(member.phone);
                            }
                        });
                    }
                });
            });

            // Batch fetch all users by phone numbers
            const usersByPhone = new Map<string, { collageId: string | null; branch: string | null; year: string | null }>();
            if (allMemberPhones.size > 0) {
                const users = await prisma.user.findMany({
                    where: {
                        phone: {
                            in: Array.from(allMemberPhones),
                        },
                    },
                    select: {
                        phone: true,
                        collageId: true,
                        branch: true,
                        year: true,
                    },
                });
                users.forEach((user) => {
                    if (user.phone) {
                        usersByPhone.set(user.phone, {
                            collageId: user.collageId,
                            branch: user.branch,
                            year: user.year != null ? String(user.year) : null,
                        });
                    }
                });
            }

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
                    const leaderGender = reg.user.gender?.toUpperCase();
                    const participantCount = memberCount + 1;

                    if (isKL) {
                        klTeams++;
                        categoryKlTeams++;
                        klTeamMembers += participantCount;
                        categoryKlTeamMembers += participantCount;
                        if (leaderGender === "MALE") {
                            klTeamMale++;
                            categoryKlTeamMale++;
                        } else if (leaderGender === "FEMALE") {
                            klTeamFemale++;
                            categoryKlTeamFemale++;
                        }
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
                        otherTeamMembers += participantCount;
                        categoryOtherTeamMembers += participantCount;
                        if (leaderGender === "MALE") {
                            otherTeamMale++;
                            categoryOtherTeamMale++;
                        } else if (leaderGender === "FEMALE") {
                            otherTeamFemale++;
                            categoryOtherTeamFemale++;
                        }
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
                    registrations: event.groupRegistrations.map((reg) => {
                        // Enrich members data by looking up users from the batch lookup map
                        const members = reg.members as Record<string, any> | null;
                        let enrichedMembers = members;
                        
                        if (members) {
                            const memberEntries = Object.entries(members);
                            const enrichedMemberEntries = memberEntries.map(([key, member]: [string, any]) => {
                                if (member?.phone) {
                                    const userData = usersByPhone.get(member.phone);
                                    // Enrich member data with user details if found
                                    return [
                                        key,
                                        {
                                            ...member,
                                            collageId: userData?.collageId || member.collageId || null,
                                            branch: userData?.branch || member.branch || null,
                                            year: userData?.year || member.year || null,
                                        },
                                    ];
                                }
                                return [key, member];
                            });
                            
                            // Convert back to object
                            enrichedMembers = Object.fromEntries(enrichedMemberEntries);
                        }
                        
                        return {
                            id: reg.id,
                            groupName: reg.groupName,
                            members: enrichedMembers,
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
                        };
                    }),
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
            })
        );

        return {
            success: true,
            categories: categoryAnalytics,
        };
    } catch (error: any) {
        console.error("Error fetching category-wise analytics:", error);
        return { success: false, error: error.message };
    }
}
