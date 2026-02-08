"use server";

import { getPublicEvents } from "@/actions/events.action";
import { getContactCategories } from "@/actions/contact.action";
import { getAllSponsors } from "@/actions/admin/sponsors.action";
import type { TrainingPayload } from "@/lib/chatbot-knowledge";
import {
  getStaticKnowledgeBlock,
  ABOUT_SURABHI,
  SURABHI_DATES,
  SURABHI_VENUE,
  SURABHI_EMAIL,
  SURABHI_ADDRESS,
  WEBSITE_URL,
  LIBERAL_ARTS_CLUBS,
  ACCOMMODATION_KNOWLEDGE,
  CONTACT_KNOWLEDGE,
} from "@/lib/chatbot-knowledge";

/** Build the full training payload (events, contact, sponsors, static knowledge). Used by API route and chat. */
export async function getTrainingPayload(): Promise<TrainingPayload | null> {
  try {
    const [eventsResult, contactResult, sponsorsResult] = await Promise.all([
      getPublicEvents(),
      getContactCategories(),
      getAllSponsors(),
    ]);

    const competitions =
      eventsResult.success && Array.isArray(eventsResult.data)
        ? eventsResult.data.map((ev: any) => ({
            name: ev.name,
            category: ev.Category?.name ?? "",
            categorySlug: ev.Category?.slug ?? "",
            slug: ev.slug,
            description: ev.description ?? "",
            termsAndConditions: ev.termsandconditions ?? "",
            virtualTermsAndConditions: ev.virtualTermsAndConditions ?? null,
            venue: ev.venue ?? "",
            date:
              ev.date instanceof Date
                ? ev.date.toISOString().slice(0, 10)
                : String(ev.date ?? ""),
            startTime: ev.startTime ?? "",
            endTime: ev.endTime ?? "",
            isGroupEvent: ev.isGroupEvent ?? false,
            minTeamSize: ev.minTeamSize ?? 1,
            maxTeamSize: ev.maxTeamSize ?? 1,
            participantLimit: ev.participantLimit ?? 0,
            virtualEnabled: ev.virtualEnabled ?? false,
          }))
        : [];

    const contact =
      contactResult.success && contactResult.data
        ? contactResult.data.map((cat: any) => ({
            name: cat.name,
            coordinators: (cat.coordinators ?? []).map((c: any) => ({
              name: c.name,
              phone: c.phone,
              email: c.email,
            })),
          }))
        : [];

    const sponsors =
      sponsorsResult.success && sponsorsResult.sponsors
        ? sponsorsResult.sponsors.map((s: any) => ({
            name: s.name,
            description: s.description ?? "",
            website: s.website ?? null,
          }))
        : [];

    const payload: TrainingPayload = {
      about: {
        summary: ABOUT_SURABHI,
        dates: SURABHI_DATES,
        venue: SURABHI_VENUE,
        email: SURABHI_EMAIL,
        address: SURABHI_ADDRESS,
        website: WEBSITE_URL,
        liberalArtsClubs: LIBERAL_ARTS_CLUBS,
      },
      accommodation: {
        summary: ACCOMMODATION_KNOWLEDGE,
      },
      contact: {
        summary: CONTACT_KNOWLEDGE,
        categories: contact,
      },
      sponsors,
      competitions,
      staticKnowledgeBlock: getStaticKnowledgeBlock(),
    };

    return payload;
  } catch (e) {
    console.error("[getTrainingPayload]", e);
    return null;
  }
}
