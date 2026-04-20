"use strict";

require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });
const mongoose   = require("mongoose");
const User       = require("./models/User");
const Profile    = require("./models/Profile");
const Preference = require("./models/Preference");
const Match      = require("./models/Match");
const Document   = require("./models/Document");
const OTP        = require("./models/OTP");
const connectDB  = require("./config/db");
const logger     = require("./utils/logger");

const NAMES_MALE = [
  "Aarav Sharma", "Vihaan Gupta", "Ishaan Reddy", "Arjun Varma",
  "Reyansh Malhotra", "Sai Kumar", "Vivaan Mukherjee", "Advait Nair",
  "Kabir Bose", "Aaryan Chauhan", "Dev Mehta", "Atharv Pandey",
  "Dhruv Shah", "Ranveer Gill", "Rohan Desai"
];

const NAMES_FEMALE = [
  "Aditi Rao", "Saanvi Patel", "Ananya Singh", "Myra Kapoor",
  "Kiara Joshi", "Zara Khan", "Anika Das", "Sia Iyer",
  "Aavya Kulkarni", "Shanaya Choudhury", "Avni Saxena", "Diya Mishra",
  "Zoya Ahmed", "Ira Trivedi", "Riya Sen"
];

const RELIGIONS   = ["Hindu", "Muslim", "Christian", "Sikh", "Buddhist"];
const EDUCATIONS  = ["Bachelor's - Engineering", "Master's - Business (MBA)", "Bachelor's - Medicine (MBBS)", "Master's - Science", "Chartered Accountant (CA)", "Bachelor's - Arts"];
const PROFESSIONS = ["Software Engineer", "Doctor", "Lawyer", "Business Owner", "Teacher / Professor", "Banker / Financial Analyst", "Government Employee"];
const INCOMES     = ["4-7 Lakh", "7-10 Lakh", "10-15 Lakh", "15-20 Lakh", "20-30 Lakh", "30-50 Lakh"];
const STATUSES    = ["Single", "Divorced", "Widowed", "Single"];
const STATES      = ["Maharashtra", "Karnataka", "Delhi", "Tamil Nadu", "Gujarat", "West Bengal", "Uttar Pradesh", "Rajasthan"];
const CITIES      = ["Mumbai", "Bengaluru", "Delhi", "Chennai", "Ahmedabad", "Kolkata", "Pune", "Jaipur"];
const BODY_TYPES  = ["Slim", "Athletic", "Average"];
const COMPLEXIONS = ["Fair", "Wheatish", "Wheatish Brown"];
const DIETS       = ["Vegetarian", "Non-Vegetarian", "Eggetarian"];
const HEIGHTS     = ["5'4\"", "5'5\"", "5'6\"", "5'7\"", "5'8\"", "5'9\"", "5'10\"", "5'11\"", "6'0\"", "6'1\""];
const BIOS = [
  "Looking for a life partner who values family, honesty, and mutual respect. I enjoy reading, travelling, and exploring new cuisines.",
  "A calm and grounded individual seeking someone with similar values. I believe in open communication and shared goals.",
  "Family-oriented professional with a good sense of humour. I enjoy weekend trekking, cooking, and spending time with loved ones.",
  "Simple living, high thinking. Looking for someone compatible who appreciates the small joys in life.",
  "Ambitious yet humble. I value education, culture, and meaningful connections. Open to learning and growing together."
];

async function seedData() {
  if (process.env.NODE_ENV === "production") {
    logger.error("⚠️ CRITICAL: Attempted to run seed script in production! Aborting.");
    process.exit(1);
  }

  try {
    await connectDB();

    logger.info("Clearing database...");
    await Promise.all([
      User.deleteMany({}),
      Profile.deleteMany({}),
      Preference.deleteMany({}),
      Match.deleteMany({}),
      Document.deleteMany({}),
      OTP.deleteMany({})
    ]);

    const password = "Password123";

    // ─── Admin (credentials read from .env) ──────────────────────────────────
    const admin = await User.create({
      name:          process.env.ADMIN_NAME     || "System Administrator",
      email:         process.env.ADMIN_EMAIL    || "admin@knot.com",
      password:      process.env.ADMIN_PASSWORD || "Admin@123",
      phone:         process.env.ADMIN_PHONE    || "0000000000",
      dob:           new Date("1980-01-01"),
      gender:        "Male",
      maritalStatus: "Single",
      role:          "Admin",
      isEmailVerified:   true,
      isPhoneVerified:   true,
      isProfileVerified: true,
      isProfileComplete: true,
      onboardingStep:    12,
      trustScore:        100
    });

    await Profile.create({
      userId:  admin._id,
      aboutMe: "Platform administrator.",
      religion: "Other"
    });

    logger.info(`✅ Admin: ${process.env.ADMIN_EMAIL || "admin@knot.com"} / ${process.env.ADMIN_PASSWORD || "Admin@123"}`);

    // ─── 30 Users ─────────────────────────────────────────────────────────────
    const users = [];
    for (let i = 0; i < 30; i++) {
      const isMale = i < 15;
      const name = isMale ? NAMES_MALE[i % 15] : NAMES_FEMALE[i % 15];
      const verified = i < 12; // first 12 fully verified

      // 1. Create User (identity + auth only)
      const user = await User.create({
        name,
        email: `user${i}@example.com`,
        password,
        phone: (9000000000 + i).toString(),
        dob: new Date(1990 + (i % 10), i % 12, (i % 28) + 1),
        gender: isMale ? "Male" : "Female",
        maritalStatus: STATUSES[i % STATUSES.length],
        isEmailVerified: true,
        isPhoneVerified: verified,
        isProfileVerified: verified,
        isProfileComplete: true,
        onboardingStep: 12,
        trustScore: verified ? 85 : 35,
        profileViews: Math.floor(Math.random() * 150) + 10
      });

      // 2. Create Profile (personal + professional + lifestyle)
      await Profile.create({
        userId: user._id,
        religion: RELIGIONS[i % RELIGIONS.length],
        education: EDUCATIONS[i % EDUCATIONS.length],
        profession: PROFESSIONS[i % PROFESSIONS.length],
        income: INCOMES[i % INCOMES.length],
        location: {
          country: "India",
          state: STATES[i % STATES.length],
          city: CITIES[i % CITIES.length]
        },
        height: HEIGHTS[i % HEIGHTS.length],
        weight: 55 + (i % 30),
        bodyType: BODY_TYPES[i % BODY_TYPES.length],
        complexion: COMPLEXIONS[i % COMPLEXIONS.length],
        ethnicity: "North Indian",
        familyStatus: i % 3 === 0 ? "Rich" : "Middle Class",
        livingWithFamily: i % 2 === 0 ? "Yes" : "No",
        lifestyle: {
          diet: DIETS[i % DIETS.length],
          drinking: i % 4 === 0 ? "Occasionally" : "No",
          smoking: "No"
        },
        aboutMe: BIOS[i % BIOS.length],
        profileImage: `https://randomuser.me/api/portraits/${isMale ? "men" : "women"}/${(i % 99) + 1}.jpg`
      });

      // 3. Create Preference (partner preferences)
      await Preference.create({
        userId: user._id,
        ageRange: { min: 22, max: 35 },
        maritalStatus: ["Single"],
        religion: [RELIGIONS[i % RELIGIONS.length]]
      });

      users.push(user);
    }

    // ─── Sample Matches ───────────────────────────────────────────────────────
    await Match.create({ senderId: users[0]._id, receiverId: users[15]._id, status: "Accepted" });
    await Match.create({ senderId: users[1]._id, receiverId: users[16]._id, status: "Accepted" });
    await Match.create({ senderId: users[2]._id, receiverId: users[17]._id, status: "Pending" });
    await Match.create({ senderId: users[3]._id, receiverId: users[18]._id, status: "Pending" });

    logger.info("✅ Seed complete: 1 Admin + 30 Users (+ Profiles + Preferences) + 4 Matches");
    process.exit(0);
  } catch (err) {
    logger.error("Seed failed:", err);
    process.exit(1);
  }
}

seedData();
