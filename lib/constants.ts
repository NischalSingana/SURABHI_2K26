/** Standard prize eligibility terms appended to all competition terms and conditions */
export const PRIZE_ELIGIBILITY_TERMS = `- Prize Eligibility: All three prizes will be awarded only if the number of participants or teams exceeds 10.
- Organizer's Discretion: If there are fewer than 10 participants or teams, the Organizing Committee reserves the right to decide the number of prizes to be distributed.`;

/** Common virtual participation terms (point-wise) for all events */
export const COMMON_VIRTUAL_TERMS = [
  "All virtual rounds will be conducted online through the official platform (Google Meet / Zoom / submission portal as announced).",
  "Participants must ensure stable internet connection, working microphone, and camera where required.",
  "Login details and schedule will be shared after successful registration.",
  "Participants must join on time. Late entry may not be allowed.",
  "Participants must keep camera ON during performance.",
  "Participants should share their screen if asked.",
];

export const BRANCHES = [
    "Engineering",
    "Management",
    "Computer Science & IT",
    "Commerce",
    "Science",
    "Pharmacy",
    "Medicine",
    "Law",
    "Architecture",
    "Arts",
    "Other"
];

export const INDIAN_STATES = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Lakshadweep",
    "Delhi",
    "Puducherry",
    "Ladakh",
    "Jammu and Kashmir",
];

// Registration Fees
export const REGISTRATION_FEES = {
    PHYSICAL: 350, // Physical participation at KL University
    VIRTUAL: 150,  // Virtual participation (proctored online)
} as const;

// States eligible for virtual participation (outside AP & Telangana)
export const VIRTUAL_EXCLUDED_STATES = ["Andhra Pradesh", "Telangana"];
