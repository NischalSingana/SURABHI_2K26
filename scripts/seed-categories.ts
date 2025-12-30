import { prisma } from "../lib/prisma";

async function seedEventCategories() {
    try {
        console.log("Starting to seed event categories and events...\n");

        // Define categories and their events
        const categoriesData = [
            {
                name: "Dance",
                events: [
                    {
                        name: "Solo Dance Competition",
                        description: "Express yourself through the art of dance in this solo performance competition",
                        venue: "Main Auditorium",
                        date: new Date("2025-03-20"),
                        startTime: "2:00 PM",
                        endTime: "6:00 PM",
                        participantLimit: 40,
                        image: "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=800&h=600&fit=crop",
                        termsandconditions: `
              <p><strong>Terms and Conditions:</strong></p>
              <ol>
                <li>Performance duration: 3-5 minutes per participant.</li>
                <li>Any dance form is allowed (Classical, Contemporary, Hip-hop, etc.).</li>
                <li>Participants must bring their own music on a USB drive.</li>
                <li>Costumes and props are allowed but must be safe.</li>
                <li>Judges' decision is final.</li>
              </ol>
            `,
                    },
                    {
                        name: "Group Dance Battle",
                        description: "Showcase your team's choreography and coordination in this exciting group dance competition",
                        venue: "Open Air Theatre",
                        date: new Date("2025-03-21"),
                        startTime: "4:00 PM",
                        endTime: "8:00 PM",
                        participantLimit: 60,
                        image: "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=800&h=600&fit=crop",
                        termsandconditions: `
              <p><strong>Terms and Conditions:</strong></p>
              <ol>
                <li>Teams of 4-8 members allowed.</li>
                <li>Performance duration: 5-8 minutes.</li>
                <li>All team members must be registered participants.</li>
                <li>Original choreography preferred.</li>
                <li>Appropriate music and costumes required.</li>
              </ol>
            `,
                    },
                ],
            },
            {
                name: "Literary & Speaking",
                events: [
                    {
                        name: "Debate Championship",
                        description: "Engage in intellectual discourse and showcase your argumentative skills",
                        venue: "Conference Hall A",
                        date: new Date("2025-03-18"),
                        startTime: "10:00 AM",
                        endTime: "4:00 PM",
                        participantLimit: 32,
                        image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=600&fit=crop",
                        termsandconditions: `
              <p><strong>Terms and Conditions:</strong></p>
              <ol>
                <li>Teams of 2 participants (For and Against).</li>
                <li>Topics will be announced 30 minutes before each round.</li>
                <li>Time limit: 5 minutes per speaker.</li>
                <li>Use of mobile phones or notes is prohibited.</li>
                <li>Maintain decorum and respect opposing views.</li>
              </ol>
            `,
                    },
                    {
                        name: "Poetry Slam",
                        description: "Share your original poetry and captivate the audience with your words",
                        venue: "Literary Corner, Library",
                        date: new Date("2025-03-19"),
                        startTime: "3:00 PM",
                        endTime: "6:00 PM",
                        participantLimit: 25,
                        image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=600&fit=crop",
                        termsandconditions: `
              <p><strong>Terms and Conditions:</strong></p>
              <ol>
                <li>Only original poetry allowed.</li>
                <li>Performance time: 3-5 minutes.</li>
                <li>Any language permitted.</li>
                <li>Props and background music are optional.</li>
                <li>Content must be appropriate for all audiences.</li>
              </ol>
            `,
                    },
                    {
                        name: "Extempore Speaking",
                        description: "Test your spontaneity and public speaking skills with impromptu topics",
                        venue: "Seminar Hall",
                        date: new Date("2025-03-22"),
                        startTime: "11:00 AM",
                        endTime: "2:00 PM",
                        participantLimit: 30,
                        image: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&h=600&fit=crop",
                        termsandconditions: `
              <p><strong>Terms and Conditions:</strong></p>
              <ol>
                <li>Topics will be given on the spot.</li>
                <li>Preparation time: 1 minute.</li>
                <li>Speaking time: 2-3 minutes.</li>
                <li>No notes or mobile phones allowed.</li>
                <li>Clarity, content, and confidence will be judged.</li>
              </ol>
            `,
                    },
                ],
            },
            {
                name: "Music",
                events: [
                    {
                        name: "Battle of Bands",
                        description: "Rock the stage with your band and compete for the ultimate music crown",
                        venue: "Main Stage, Amphitheatre",
                        date: new Date("2025-03-25"),
                        startTime: "5:00 PM",
                        endTime: "10:00 PM",
                        participantLimit: 50,
                        image: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&h=600&fit=crop",
                        termsandconditions: `
              <p><strong>Terms and Conditions:</strong></p>
              <ol>
                <li>Bands of 3-6 members allowed.</li>
                <li>Performance time: 10-15 minutes.</li>
                <li>Basic equipment will be provided (drums, amps, mics).</li>
                <li>Bring your own instruments (guitars, keyboards, etc.).</li>
                <li>Original compositions preferred but covers allowed.</li>
              </ol>
            `,
                    },
                    {
                        name: "Solo Singing Competition",
                        description: "Let your voice shine in this solo vocal performance competition",
                        venue: "Music Hall",
                        date: new Date("2025-03-23"),
                        startTime: "1:00 PM",
                        endTime: "5:00 PM",
                        participantLimit: 35,
                        image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&h=600&fit=crop",
                        termsandconditions: `
              <p><strong>Terms and Conditions:</strong></p>
              <ol>
                <li>Any genre of music allowed (Classical, Pop, Rock, etc.).</li>
                <li>Performance time: 3-5 minutes.</li>
                <li>Karaoke tracks or live accompaniment allowed.</li>
                <li>Bring your own track on USB drive.</li>
                <li>Microphone and sound system will be provided.</li>
              </ol>
            `,
                    },
                ],
            },
            {
                name: "Photography",
                events: [
                    {
                        name: "Photo Walk Challenge",
                        description: "Capture the essence of campus life through your lens in this photography challenge",
                        venue: "Campus Wide",
                        date: new Date("2025-03-17"),
                        startTime: "7:00 AM",
                        endTime: "12:00 PM",
                        participantLimit: 45,
                        image: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&h=600&fit=crop",
                        termsandconditions: `
              <p><strong>Terms and Conditions:</strong></p>
              <ol>
                <li>Photos must be taken during the event time only.</li>
                <li>Submit 5 best photos via Google Drive link.</li>
                <li>Minimal editing allowed (color correction, cropping).</li>
                <li>Theme will be announced at the start.</li>
                <li>DSLR, mirrorless, or smartphone cameras allowed.</li>
              </ol>
            `,
                    },
                    {
                        name: "Portrait Photography Contest",
                        description: "Master the art of portrait photography and capture compelling human stories",
                        venue: "Photography Studio, Arts Block",
                        date: new Date("2025-03-24"),
                        startTime: "9:00 AM",
                        endTime: "4:00 PM",
                        participantLimit: 30,
                        image: "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=800&h=600&fit=crop",
                        termsandconditions: `
              <p><strong>Terms and Conditions:</strong></p>
              <ol>
                <li>Submit 3 portrait photographs via Google Drive link.</li>
                <li>Photos must be original and taken by the participant.</li>
                <li>Model release forms required if identifiable people are shown.</li>
                <li>Post-processing allowed but no heavy manipulation.</li>
                <li>Include camera settings and brief description with each photo.</li>
              </ol>
            `,
                    },
                    {
                        name: "Night Photography Workshop",
                        description: "Learn and practice the techniques of capturing stunning night photographs",
                        venue: "Campus Grounds",
                        date: new Date("2025-03-26"),
                        startTime: "7:00 PM",
                        endTime: "11:00 PM",
                        participantLimit: 25,
                        image: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop",
                        termsandconditions: `
              <p><strong>Terms and Conditions:</strong></p>
              <ol>
                <li>Bring your own camera (DSLR/mirrorless preferred).</li>
                <li>Tripod mandatory for participation.</li>
                <li>Basic knowledge of manual camera settings required.</li>
                <li>Submit 3 best shots via Google Drive link after the workshop.</li>
                <li>Safety guidelines must be followed during night shoot.</li>
              </ol>
            `,
                    },
                ],
            },
        ];

        // Create categories and events
        for (const categoryData of categoriesData) {
            // Check if category exists
            let category = await prisma.category.findFirst({
                where: { name: categoryData.name },
            });

            if (!category) {
                category = await prisma.category.create({
                    data: {
                        id: crypto.randomUUID(),
                        name: categoryData.name,
                        updatedAt: new Date(),
                    },
                });
                console.log(`✓ Created category: ${categoryData.name}`);
            } else {
                console.log(`✓ Category already exists: ${categoryData.name}`);
            }

            // Create events for this category
            for (const eventData of categoryData.events) {
                const existingEvent = await prisma.event.findFirst({
                    where: {
                        name: eventData.name,
                        categoryId: category.id,
                    },
                });

                if (!existingEvent) {
                    await prisma.event.create({
                        data: {
                            id: crypto.randomUUID(),
                            categoryId: category.id,
                            name: eventData.name,
                            description: eventData.description,
                            date: eventData.date,
                            image: eventData.image,
                            venue: eventData.venue,
                            startTime: eventData.startTime,
                            endTime: eventData.endTime,
                            participantLimit: eventData.participantLimit,
                            termsandconditions: eventData.termsandconditions,
                            registrationLink: "",
                            updatedAt: new Date(),
                        },
                    });
                    console.log(`  ✓ Created event: ${eventData.name}`);
                } else {
                    console.log(`  ✓ Event already exists: ${eventData.name}`);
                }
            }
            console.log("");
        }

        console.log("✅ Seeding completed successfully!");
    } catch (error) {
        console.error("❌ Error seeding data:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedEventCategories();
