import { VIRTUAL_EXCLUDED_STATES, REGISTRATION_FEES } from "./constants";

export interface VirtualEligibility {
  isEligible: boolean;
  reason?: string;
}

/**
 * Check if a user is eligible for virtual participation
 * Requirements:
 * 1. Must be Google OAuth user (other college) OR international student
 * 2. If Indian student, must NOT be from Andhra Pradesh or Telangana
 */
export function checkVirtualEligibility(user: {
  email?: string;
  state?: string | null;
  isInternational?: boolean;
  collage?: string | null;
}): VirtualEligibility {
  // International students are eligible for virtual participation
  if (user.isInternational) {
    return {
      isEligible: true,
    };
  }

  // KL University students must attend physically — check both email domain and college name
  const isKLStudent =
    user.email?.toLowerCase().endsWith("@kluniversity.in") ||
    user.collage?.toLowerCase() === "kl university";
  if (isKLStudent) {
    return {
      isEligible: false,
      reason: "KL University students must participate physically",
    };
  }

  // State is required for virtual participation eligibility check (for Indian students)
  if (!user.state || user.state.trim() === "") {
    return {
      isEligible: false,
      reason: "Please update your profile with state information to check virtual participation eligibility",
    };
  }

  // Check if user is from excluded states (AP or Telangana) - case-insensitive
  const stateLower = user.state.trim().toLowerCase();
  const isExcludedState = VIRTUAL_EXCLUDED_STATES.some(
    (s) => s.toLowerCase() === stateLower
  );
  if (isExcludedState) {
    return {
      isEligible: false,
      reason: `Students from Andhra Pradesh and Telangana must participate physically at KL University`,
    };
  }

  // Google OAuth users from other states are eligible
  return {
    isEligible: true,
  };
}

/**
 * Get registration fee based on participation mode
 */
export function getRegistrationFee(isVirtual: boolean): number {
  return isVirtual ? REGISTRATION_FEES.VIRTUAL : REGISTRATION_FEES.PHYSICAL;
}

/**
 * Get fee display with mode label
 */
export function getFeeDisplay(isVirtual: boolean): string {
  const fee = getRegistrationFee(isVirtual);
  const mode = isVirtual ? "Virtual" : "Physical";
  return `₹${fee} (${mode} Participation)`;
}
