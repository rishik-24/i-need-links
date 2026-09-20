export type GovernmentCategory =
  "citizen" | "education" | "land" | "vehicle" | "jobs" | "health" | "business";

export interface GovernmentPortal {
  id: string;
  name: string;
  description: string;
  category: GovernmentCategory;
  url: string;
  icon: string;
}

export interface GovernmentCategoryInfo {
  id: GovernmentCategory;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
}

export const governmentCategories: GovernmentCategoryInfo[] = [
  {
    id: "citizen",
    title: "সার্টিফিকেট ও নাগরিক পরিষেবা",
    subtitle: "Certificates & Citizen Services",
    description:
      "পঞ্চায়েত সার্টিফিকেট, জন্ম-মৃত্যু, e-District ও পরিচয় সংক্রান্ত পরিষেবা",
    icon: "📜",
  },
  {
    id: "education",
    title: "শিক্ষা ও স্কলারশিপ",
    subtitle: "Education & Scholarships",
    description:
      "পশ্চিমবঙ্গের ছাত্রছাত্রীদের জন্য সরকারি ও নির্বাচিত বেসরকারি Scholarship / Financial Assistance portal",
    icon: "🎓",
  },
  {
    id: "land",
    title: "জমি, কৃষি ও গ্রামীণ পরিষেবা",
    subtitle: "Land, Agriculture & Rural Services",
    description: "জমি, Job Card, কৃষক, রেশন ও পঞ্চায়েত পরিষেবা",
    icon: "🌾",
  },
  {
    id: "vehicle",
    title: "গাড়ি, লাইসেন্স ও চালান",
    subtitle: "Vehicle, Driving Licence & Challan",
    description: "Driving Licence, vehicle service ও traffic challan",
    icon: "🚘",
  },
  {
    id: "jobs",
    title: "সরকারি চাকরি ও Employment",
    subtitle: "Government Jobs & Employment",
    description:
      "Railway, Bank, SSC, UPSC, West Bengal এবং অন্যান্য সরকারি চাকরির official recruitment portal",
    icon: "💼",
  },
  {
    id: "health",
    title: "স্বাস্থ্য ও সামাজিক প্রকল্প",
    subtitle: "Health & Social Welfare",
    description: "স্বাস্থ্য কার্ড ও গুরুত্বপূর্ণ সামাজিক প্রকল্প",
    icon: "❤️",
  },
  {
    id: "business",
    title: "ব্যবসা, Tax ও Licence",
    subtitle: "Business, Tax & Licence",
    description: "Business registration, tax, PF ও licence services",
    icon: "🏢",
  },
];

export const governmentPortals: GovernmentPortal[] = [
  // ============================================================
  // 1. CERTIFICATES & CITIZEN SERVICES
  // ============================================================

  {
    id: "edistrict",
    name: "WB e-District Citizen Services",
    description: "Certificates & Citizen Services",
    category: "citizen",
    url: "https://edistrict.wb.gov.in/",
    icon: "🏛️",
  },
  {
    id: "wbpms",
    name: "WBPMS Gram Panchayat Certificate",
    description: "Residence / Income / Character & Other GP Certificates",
    category: "citizen",
    url: "https://wbpms.in/",
    icon: "📜",
  },
  {
    id: "birth-death",
    name: "Birth & Death Registration",
    description: "WB Janma-Mrityu Tathya / Certificate Services",
    category: "citizen",
    url: "https://janma-mrityutathya.wb.gov.in/",
    icon: "👶",
  },
  {
    id: "uidai",
    name: "Aadhaar / UIDAI",
    description: "Aadhaar Services",
    category: "citizen",
    url: "https://uidai.gov.in/",
    icon: "🪪",
  },
  {
    id: "pan",
    name: "PAN Services",
    description: "PAN Application / Services",
    category: "citizen",
    url: "https://www.protean-tinpan.com/",
    icon: "💳",
  },
  {
    id: "voter",
    name: "Voter Services",
    description: "Election / Voter Portal",
    category: "citizen",
    url: "https://voters.eci.gov.in/",
    icon: "🗳️",
  },
  {
    id: "passport",
    name: "Passport Seva",
    description: "Passport Services",
    category: "citizen",
    url: "https://www.passportindia.gov.in/",
    icon: "📘",
  },
  {
    id: "citizenship",
    name: "CAA / Indian Citizenship",
    description: "Citizenship Application Portal",
    category: "citizen",
    url: "https://indiancitizenshiponline.nic.in/",
    icon: "🇮🇳",
  },

  // ============================================================
  // 2. EDUCATION & SCHOLARSHIPS
  // ============================================================

  {
    id: "svmcm",
    name: "SVMCM Scholarship",
    description: "Swami Vivekananda Merit-cum-Means Scholarship",
    category: "education",
    url: "https://svmcm.wb.gov.in/",
    icon: "🎓",
  },
  {
    id: "aikyashree",
    name: "Aikyashree Scholarship",
    description: "Minority Students Scholarship – Govt. of West Bengal",
    category: "education",
    url: "https://www.wbmdfcscholarship.in/",
    icon: "☪️",
  },
  {
    id: "oasis",
    name: "OASIS Scholarship",
    description: "SC / ST / OBC Scholarship – West Bengal",
    category: "education",
    url: "https://oasis.gov.in/",
    icon: "📚",
  },
  {
    id: "nabanna",
    name: "Nabanna Scholarship / CMRF",
    description: "Chief Minister's Relief Fund – Educational Assistance",
    category: "education",
    url: "https://cmrf.wb.gov.in/",
    icon: "🏛️",
  },
  {
    id: "national-scholarship",
    name: "National Scholarship Portal",
    description: "Central Government Scholarship Services",
    category: "education",
    url: "https://scholarships.gov.in/",
    icon: "🏅",
  },
  {
    id: "nmms",
    name: "NMMS Scholarship WB",
    description: "National Means-cum-Merit Scholarship – School Education WB",
    category: "education",
    url: "https://banglarshiksha.wb.gov.in/",
    icon: "📝",
  },
  {
    id: "freeship",
    name: "West Bengal Freeship Scheme",
    description: "Tuition Fee Waiver for eligible technical students",
    category: "education",
    url: "https://wbfs.wb.gov.in/",
    icon: "🎒",
  },
  {
    id: "kanyashree",
    name: "Kanyashree",
    description: "K1 / K2 – West Bengal Girls' Education Scheme",
    category: "education",
    url: "https://admin-kanyashree.wb.gov.in/",
    icon: "👩‍🎓",
  },
  {
    id: "kanyashree-k3",
    name: "Kanyashree K3",
    description: "Postgraduate Scholarship – via SVMCM",
    category: "education",
    url: "https://svmcm.wb.gov.in/",
    icon: "🎓",
  },
  {
    id: "hindi-scholarship",
    name: "Hindi Scholarship Scheme",
    description: "Post-Matric Hindi Scholarship information – WBSCHE",
    category: "education",
    url: "https://wbsche.wb.gov.in/",
    icon: "🖊️",
  },
  {
    id: "banglar-shiksha",
    name: "Banglar Shiksha",
    description: "West Bengal School Education Portal",
    category: "education",
    url: "https://banglarshiksha.wb.gov.in/",
    icon: "🏫",
  },
  {
    id: "wbchse-scholarship",
    name: "WBCHSE Scholarship Directory",
    description:
      "Official list of scholarships useful for West Bengal students",
    category: "education",
    url: "https://wbchse.wb.gov.in/",
    icon: "📑",
  },
  {
    id: "lic-golden-jubilee",
    name: "LIC Golden Jubilee Scholarship",
    description: "LIC Golden Jubilee Foundation Scholarship",
    category: "education",
    url: "https://licindia.in/",
    icon: "🏆",
  },
  {
    id: "gp-birla",
    name: "G P Birla Scholarship",
    description: "Merit-cum-means support for eligible WB/Jharkhand students",
    category: "education",
    url: "https://gpbirlaedufoundation.com/",
    icon: "🎖️",
  },
  {
    id: "gp-birla-apply",
    name: "G P Birla Apply Online",
    description: "Direct online scholarship application",
    category: "education",
    url: "https://gpbirlaedufoundation.com/",
    icon: "🖊️",
  },
  {
    id: "sitaram-jindal",
    name: "Sitaram Jindal Foundation Scholarship",
    description: "Scholarship for eligible students in multiple courses",
    category: "education",
    url: "https://app.sitaramjindalfoundation.org/",
    icon: "📘",
  },

  // ============================================================
  // 3. LAND, AGRICULTURE & RURAL SERVICES
  // ============================================================

  {
    id: "banglarbhumi",
    name: "Banglarbhumi",
    description: "Land & Mutation",
    category: "land",
    url: "https://banglarbhumi.gov.in/",
    icon: "🗺️",
  },
  {
    id: "mgnrega",
    name: "MGNREGA Job Card",
    description: "Job Card / Worker Information",
    category: "land",
    url: "https://mnregaweb4.nic.in/",
    icon: "🧑‍🌾",
  },
  {
    id: "pm-kisan",
    name: "PM-KISAN",
    description: "Farmer Services",
    category: "land",
    url: "https://pmkisan.gov.in/",
    icon: "🌱",
  },
  {
    id: "ration",
    name: "Ration Card / Food WB",
    description: "WB Food & Supplies",
    category: "land",
    url: "https://food.wb.gov.in/",
    icon: "🌾",
  },
  {
    id: "nfsa",
    name: "NFSA",
    description: "National Food Security",
    category: "land",
    url: "https://nfsa.gov.in/",
    icon: "📗",
  },
  {
    id: "wbprdtax",
    name: "WBPRD Property Tax",
    description: "Panchayat Online Property Tax",
    category: "land",
    url: "https://prdtax.wb.gov.in/",
    icon: "🏠",
  },

  // ============================================================
  // 4. VEHICLE, DRIVING LICENCE & CHALLAN
  // ============================================================

  {
    id: "parivahan",
    name: "Parivahan Sewa",
    description: "Driving / Vehicle Services",
    category: "vehicle",
    url: "https://parivahan.gov.in/",
    icon: "🚘",
  },
  {
    id: "sarathi",
    name: "Sarathi Parivahan",
    description: "Driving / Learner Licence",
    category: "vehicle",
    url: "https://sarathi.parivahan.gov.in/",
    icon: "🪪",
  },
  {
    id: "vahan",
    name: "Vahan",
    description: "Vehicle Related Services",
    category: "vehicle",
    url: "https://vahan.parivahan.gov.in/",
    icon: "🚙",
  },
  {
    id: "echallan",
    name: "e-Challan",
    description: "Traffic Challan Check / Payment",
    category: "vehicle",
    url: "https://echallan.parivahan.gov.in/",
    icon: "🚦",
  },

  // ============================================================
  // 5. GOVERNMENT JOBS & EMPLOYMENT
  // ============================================================

  {
    id: "employment-bank",
    name: "Employment Bank WB",
    description: "West Bengal Job Seeker / Employment Services",
    category: "jobs",
    url: "https://employmentbankwb.gov.in/",
    icon: "💼",
  },
  {
    id: "wbpsc",
    name: "WBPSC",
    description: "WBCS / Clerkship / Miscellaneous & WB Govt Recruitment",
    category: "jobs",
    url: "https://psc.wb.gov.in/",
    icon: "🏛️",
  },
  {
    id: "wbssc",
    name: "WB School Service Commission",
    description: "School Service / Teacher Recruitment",
    category: "jobs",
    url: "https://www.westbengalssc.com/",
    icon: "🏫",
  },
  {
    id: "wb-police",
    name: "West Bengal Police Recruitment",
    description: "WBP / Kolkata Police Recruitment",
    category: "jobs",
    url: "https://www.wbpolice.gov.in/",
    icon: "👮",
  },
  {
    id: "ssc",
    name: "SSC",
    description:
      "CGL / CHSL / MTS / GD / JE / Stenographer & Central Govt Jobs",
    category: "jobs",
    url: "https://ssc.gov.in/",
    icon: "📋",
  },
  {
    id: "upsc",
    name: "UPSC",
    description: "Civil Services / NDA / CDS / CAPF & Central Recruitment",
    category: "jobs",
    url: "https://www.upsc.gov.in/",
    icon: "🇮🇳",
  },
  {
    id: "upsc-online",
    name: "UPSC Online Application",
    description: "UPSC Examination Application Portal",
    category: "jobs",
    url: "https://upsconline.nic.in/",
    icon: "📝",
  },
  {
    id: "rrb-kolkata",
    name: "RRB Kolkata",
    description: "Railway Recruitment Board Kolkata",
    category: "jobs",
    url: "https://www.rrbkolkata.gov.in/",
    icon: "🚆",
  },
  {
    id: "indian-railways",
    name: "Indian Railways",
    description: "Railway Recruitment / Official Railway Portal",
    category: "jobs",
    url: "https://indianrailways.gov.in/",
    icon: "🚉",
  },
  {
    id: "ibps",
    name: "IBPS",
    description: "Bank PO / Clerk-CSA / SO / RRB Recruitment",
    category: "jobs",
    url: "https://www.ibps.in/",
    icon: "🏦",
  },
  {
    id: "sbi-careers",
    name: "SBI Careers",
    description: "SBI PO / Clerk / Specialist Officer Recruitment",
    category: "jobs",
    url: "https://sbi.co.in/",
    icon: "🏦",
  },
  {
    id: "rbi-opportunities",
    name: "RBI Opportunities",
    description: "RBI Recruitment / Vacancies",
    category: "jobs",
    url: "https://opportunities.rbi.org.in/",
    icon: "💰",
  },
  {
    id: "nabard-careers",
    name: "NABARD Careers",
    description: "NABARD Recruitment / Career Notices",
    category: "jobs",
    url: "https://www.nabard.org/",
    icon: "🌾",
  },
  {
    id: "sebi-careers",
    name: "SEBI Careers",
    description: "SEBI Recruitment / Vacancies",
    category: "jobs",
    url: "https://www.sebi.gov.in/",
    icon: "📈",
  },
  {
    id: "ncs",
    name: "National Career Service",
    description: "Government Jobs & Career Services",
    category: "jobs",
    url: "https://www.ncs.gov.in/",
    icon: "👔",
  },
  {
    id: "india-post-gds",
    name: "India Post GDS",
    description: "Gramin Dak Sevak Recruitment",
    category: "jobs",
    url: "https://indiapostgdsonline.gov.in/",
    icon: "📮",
  },
  {
    id: "army",
    name: "Indian Army Recruitment",
    description: "Join Indian Army",
    category: "jobs",
    url: "https://joinindianarmy.nic.in/",
    icon: "🪖",
  },
  {
    id: "navy",
    name: "Indian Navy Recruitment",
    description: "Join Indian Navy",
    category: "jobs",
    url: "https://www.joinindiannavy.gov.in/",
    icon: "⚓",
  },
  {
    id: "air-force",
    name: "Indian Air Force Recruitment",
    description: "Agniveervayu / Air Force Recruitment",
    category: "jobs",
    url: "https://agnipathvayu.cdac.in/",
    icon: "✈️",
  },
  {
    id: "coast-guard",
    name: "Coast Guard Recruitment",
    description: "Indian Coast Guard Recruitment",
    category: "jobs",
    url: "https://joinindiancoastguard.cdac.in/",
    icon: "🛟",
  },

  // ============================================================
  // 6. HEALTH & SOCIAL WELFARE
  // ============================================================

  {
    id: "ayushman",
    name: "Ayushman Bharat PM-JAY",
    description: "Health Card and PM-JAY Services",
    category: "health",
    url: "https://pmjay.gov.in/",
    icon: "❤️",
  },
  {
    id: "swasthya-sathi",
    name: "Swasthya Sathi",
    description: "West Bengal Health",
    category: "health",
    url: "https://swasthyasathi.gov.in/",
    icon: "🩺",
  },
  {
    id: "kanyashree-health",
    name: "Kanyashree",
    description: "West Bengal Scheme",
    category: "health",
    url: "https://www.wbkanyashree.gov.in/",
    icon: "👩‍🎓",
  },

  // ============================================================
  // 7. BUSINESS, TAX & LICENCE
  // ============================================================

  {
    id: "silpa-sathi",
    name: "Silpa Sathi",
    description: "West Bengal Single Window / Business Services",
    category: "business",
    url: "https://silpasathi.wb.gov.in/",
    icon: "🏭",
  },
  {
    id: "income-tax",
    name: "Income Tax e-Filing",
    description: "Income Tax e-Filing Portal",
    category: "business",
    url: "https://www.incometax.gov.in/",
    icon: "🧾",
  },
  {
    id: "gst",
    name: "GST Portal",
    description: "GST Services",
    category: "business",
    url: "https://www.gst.gov.in/",
    icon: "🧮",
  },
  {
    id: "epfo",
    name: "EPFO",
    description: "PF Services",
    category: "business",
    url: "https://www.epfindia.gov.in/",
    icon: "🏦",
  },
  {
    id: "udyam",
    name: "Udyam Registration",
    description: "MSME Registration",
    category: "business",
    url: "https://udyamregistration.gov.in/",
    icon: "🏪",
  },
  {
    id: "fssai",
    name: "FSSAI / FoSCoS",
    description: "Food Licence / Registration",
    category: "business",
    url: "https://foscos.fssai.gov.in/",
    icon: "🍽️",
  },
];
