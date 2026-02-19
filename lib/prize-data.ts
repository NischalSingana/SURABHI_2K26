
export interface PrizeDistribution {
  first: string;
  second: string;
  third?: string;
  runnerUp?: string;
}

export const PRIZE_DATA: Record<string, PrizeDistribution> = {
  // RAAGA
  "Voice of Raaga": {
    first: "₹6,000",
    second: "₹4,000",
    third: "₹3,000",
  },
  "Solo Instrumental": {
    first: "₹6,000",
    second: "₹4,000",
    third: "₹3,000",
  },
  "Battle of bands": {
    first: "₹15,000",
    second: "₹10,000",
    third: "₹8,000",
  },

  // NRITHYA
  "Solo (Classical, Western, Folk)": {
    first: "₹8,000",
    second: "₹6,000",
    third: "₹4,000",
  },
  "Group (Classical, Western, Folk)": {
    first: "₹10,000",
    second: "₹8,000",
    third: "₹5,000",
  },

  // VASTRANAUT
  "VASTRANAUT FASHION RUNAWAY ": {
    first: "₹12,000",
    second: "₹10,000",
    third: "₹8,000",
  },

  // CHITRAKALA
  "LandScape": {
    first: "₹6,000",
    second: "₹4,000",
    third: "₹3,000",
  },
  "Bhavishya Bharat": {
    first: "₹6,000",
    second: "₹4,000",
    third: "₹3,000",
  },

  // CINE CARNIVAL
  "Short Film": {
    first: "₹15,000",
    second: "₹10,000",
    third: "₹5,000",
  },
  "Cover songs": {
    first: "₹6,000",
    second: "₹4,000",
    third: "₹3,000",
  },
  "Photography": {
    first: "₹4,000",
    second: "₹3,000",
    third: "₹2,000",
  },

  // NATYAKA
  "Skit": {
    first: "₹10,000",
    second: "₹8,000",
    third: "₹5,000",
  },
  "Mono Action": {
    first: "₹5,000",
    second: "₹3,000",
    third: "₹2,000",
  },

  // SAHITYA
  "Short Story Writing ": {
    first: "₹5,000",
    second: "₹3,000",
    third: "₹2,000",
  },
  "Elocution": {
    first: "₹5,000",
    second: "₹3,000",
    third: "₹2,000",
  },
  "National Mock Parliament": {
    first: "₹8,000",
    second: "",
    runnerUp: "₹8,000",
  },

  // KURUKSHETRA
  "BGMI Tournament": {
    first: "₹8,000",
    second: "₹5,000",
    third: "₹3,000",
  },
  "Free Fire Tournament": {
    first: "₹8,000",
    second: "₹5,000",
    third: "₹3,000",
  },
  "Valorant Tournament": {
    first: "₹8,000",
    second: "₹5,000",
    third: "₹3,000",
  },
};
