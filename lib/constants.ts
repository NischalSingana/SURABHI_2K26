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
