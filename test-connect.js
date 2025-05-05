require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, { family: 4 })
  .then(() => { console.log('🟢 Connected'); process.exit(); })
  .catch(e => { console.error('🔴 Failed:', e); process.exit(1); });
