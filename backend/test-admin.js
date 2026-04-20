
require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const BASE_URL = 'http://localhost:5000/api';

async function testAdminAPI() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = require("./models/User");
    
    let admin = await User.findOne({ role: "Admin" });
    if (!admin) {
      console.log('Creating temporary admin user...');
      admin = await User.create({
        name: "Test Admin", email: "testadmin@knot.com", password: "Password123",
        phone: "9999999999", dob: new Date(), gender: "Male",
        maritalStatus: "Single", role: "Admin"
      });
    }

    const token = jwt.sign({ user: { id: admin._id, tv: admin.tokenVersion || 0 } }, process.env.JWT_SECRET, { expiresIn: "1h" });
    console.log(`✅ Admin Token Generated.`);

    console.log('\nTesting GET /api/admin/reports...');
    const reportsRes = await fetch(`${BASE_URL}/admin/reports`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const reportsData = await reportsRes.json();
    console.log(`✅ GET /admin/reports: Success=${reportsData.success}, Msg=${reportsData.message}, Total=${reportsData.total}`);

    let targetUser = await User.findOne({ role: "User" });
    if (!targetUser) {
      console.log('Creating temporary target user...');
      targetUser = await User.create({
        name: "Test User", email: "testuser@knot.com", password: "Password123",
        phone: "8888888888", dob: new Date(), gender: "Female",
        maritalStatus: "Single", role: "User"
      });
    }
    console.log(`\nFound/Created target user: ${targetUser.name} (${targetUser._id})`);

    console.log('Testing POST /api/admin/flag/:userId (Flagging)...');
    const flagRes = await fetch(`${BASE_URL}/admin/flag/${targetUser._id}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ flagReason: 'Fake Profile' })
    });
    const flagData = await flagRes.json();
    console.log(`✅ Flag Response: Success=${flagData.success}, isFlagged=${flagData.isFlagged}, Msg=${flagData.message}, Reason=${flagData.flagReason}`);

    console.log('\nTesting POST /api/admin/flag/:userId (Unflagging)...');
    const unflagRes = await fetch(`${BASE_URL}/admin/flag/${targetUser._id}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const unflagData = await unflagRes.json();
    console.log(`✅ Unflag Response: Success=${unflagData.success}, isFlagged=${unflagData.isFlagged}, Msg=${unflagData.message}`);

    console.log('\n🎉 Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}
testAdminAPI();
