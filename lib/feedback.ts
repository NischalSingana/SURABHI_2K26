export const FEEDBACK_RATING_FIELDS = [
  { key: "competition", label: "Competition Quality" },
  { key: "experience", label: "Event Flow & Pacing" },
  { key: "hospitality", label: "Hospitality & Support" },
  { key: "fairJudgement", label: "Fair Judgement" },
  { key: "organization", label: "Organization & Coordination" },
  { key: "venue", label: "Venue & Facilities" },
] as const;

export type RatingKey = (typeof FEEDBACK_RATING_FIELDS)[number]["key"];
export type FeedbackRatings = Record<RatingKey, number>;
