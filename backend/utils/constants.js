"use strict";

// ─── STEP 1: Identity ─────────────────────────────────────────────────────────
exports.GENDERS = ["Male", "Female"];
exports.CREATING_FOR = ["Self", "Son", "Daughter", "Brother", "Sister", "Friend"];
exports.MARITAL_STATUSES = ["Single", "Divorced", "Widowed", "Awaiting Divorce"];

// ─── STEP 2: Religion & Education ─────────────────────────────────────────────
exports.RELIGIONS = {
  Hindu: ["Brahmin", "Kshatriya", "Vaishya", "Shudra", "Lingayat", "Maratha", "Rajput", "Jat", "Yadav", "Gujjar", "Nair", "Ezhava", "Reddy", "Naidu", "Other"],
  Muslim: ["Sunni", "Shia", "Sufi", "Ahmadiyya", "Other"],
  Christian: ["Catholic", "Protestant", "Orthodox", "Pentecostal", "Other"],
  Sikh: ["Jat Sikh", "Ramgarhia", "Khatri", "Arora", "Other"],
  Buddhist: ["Theravada", "Mahayana", "Vajrayana", "Other"],
  Jain: ["Digambar", "Shwetambar", "Other"],
  Jewish: ["Orthodox", "Reform", "Conservative", "Other"],
  Parsi: ["Irani", "Shahenshahi", "Other"],
  Other: ["Spiritual", "Agnostic", "Atheist", "Other"]
};

exports.EDUCATION_LEVELS = [
  "High School", "Diploma", "Associate Degree",
  "Bachelor's - Arts", "Bachelor's - Science", "Bachelor's - Commerce",
  "Bachelor's - Engineering", "Bachelor's - Medicine (MBBS)",
  "Bachelor's - Law (LLB)", "Bachelor's - Business (BBA)",
  "Master's - Arts", "Master's - Science", "Master's - Commerce",
  "Master's - Engineering (M.Tech)", "Master's - Business (MBA)",
  "Master's - Law (LLM)", "Master's - Medicine (MD/MS)",
  "Doctorate (PhD)", "Chartered Accountant (CA)",
  "Company Secretary (CS)", "ICWA / CMA", "Other"
];

// ─── STEP 4: Location & Background ───────────────────────────────────────────
exports.COUNTRIES = [
  "India", "United States", "United Kingdom", "Canada", "Australia",
  "UAE", "Saudi Arabia", "Singapore", "Germany", "New Zealand",
  "Malaysia", "South Africa", "Kenya", "Qatar", "Oman", "Other"
];

exports.VISA_STATUSES = [
  "Citizen", "Permanent Resident", "Work Visa", "Student Visa",
  "Dependent Visa", "Temporary Visa", "Not Applicable"
];

exports.NATIONALITIES = [
  "Indian", "American", "British", "Canadian", "Australian",
  "Emirati", "Singaporean", "German", "New Zealander", "Other"
];

// ─── STEP 5: Career & Income ──────────────────────────────────────────────────
exports.ETHNICITIES = [
  "North Indian", "South Indian", "East Indian", "West Indian",
  "Maharashtrian", "Bengali", "Punjabi", "Gujarati", "Tamil",
  "Telugu", "Kannada", "Malayalam", "Odia", "Assamese",
  "Kashmiri", "Bihari", "Rajasthani", "Marwari", "Other"
];

exports.PROFESSIONS = [
  "Software Engineer", "Doctor", "Lawyer", "Chartered Accountant",
  "Civil Engineer", "Mechanical Engineer", "Teacher / Professor",
  "Government Employee", "Defence / Armed Forces", "Business Owner",
  "Banker / Financial Analyst", "Data Scientist", "Product Manager",
  "Architect", "Pharmacist", "Dentist", "Nurse", "Pilot",
  "Chef / Hospitality", "Fashion Designer", "Journalist",
  "Consultant", "Sales / Marketing", "Human Resources",
  "Research Scientist", "Freelancer", "Homemaker",
  "Student", "Not Working", "Other"
];

exports.INCOME_RANGES = [
  "Below 2 Lakh", "2-4 Lakh", "4-7 Lakh", "7-10 Lakh",
  "10-15 Lakh", "15-20 Lakh", "20-30 Lakh", "30-50 Lakh",
  "50-75 Lakh", "75 Lakh - 1 Crore", "Above 1 Crore",
  "Not Disclosed"
];

// ─── STEP 6: Lifestyle ────────────────────────────────────────────────────────
exports.INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Chandigarh", "Puducherry", "Jammu & Kashmir", "Ladakh"
];

// ─── STEP 7: Physical Attributes ──────────────────────────────────────────────
exports.BODY_TYPES = ["Slim", "Athletic", "Average", "Heavy", "Plus Size"];
exports.FAMILY_STATUSES = ["Rich", "Upper Middle Class", "Middle Class", "Lower Middle Class", "Humble Background"];

// ─── STEP 8: Habits ───────────────────────────────────────────────────────────
exports.COMPLEXIONS = ["Very Fair", "Fair", "Wheatish", "Wheatish Brown", "Dark"];
exports.DIETS = ["Vegetarian", "Non-Vegetarian", "Eggetarian", "Vegan", "Jain"];
exports.DRINKING_HABITS = ["No", "Occasionally", "Socially", "Regularly"];
exports.SMOKING_HABITS = ["No", "Occasionally", "Regularly", "Quit"];

// ─── Height helpers ───────────────────────────────────────────────────────────
exports.HEIGHTS = (() => {
  const arr = [];
  for (let ft = 4; ft <= 7; ft++) {
    for (let inch = 0; inch < 12; inch++) {
      if (ft === 7 && inch > 0) break;
      arr.push(`${ft}'${inch}"`);
    }
  }
  return arr;
})();
