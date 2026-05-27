const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

let isDatabaseConnected = false;
const MOCK_USERS = [];

async function seedDefaultUser() {
  const defaultEmail = 'test@example.com';
  const defaultPassword = 'password123';

  if (isDatabaseConnected) {
    try {
      const userExists = await User.findOne({ email: defaultEmail });
      if (!userExists) {
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        const newUser = new User({
          email: defaultEmail,
          password: hashedPassword
        });
        await newUser.save();
        console.log('🌱 Database seeded successfully! Default account:');
        console.log(`   Email:    ${defaultEmail}`);
        console.log(`   Password: ${defaultPassword}`);
      } else {
        console.log('✅ Default account test@example.com is ready in the database.');
      }
    } catch (err) {
      console.error('⚠️ Seeding failed:', err.message);
    }
  } else {
    const hashedMockPassword = await bcrypt.hash(defaultPassword, 10);
    MOCK_USERS.push({
      email: defaultEmail,
      password: hashedMockPassword
    });
    console.log('🌱 Fallback Mock Database seeded! Default account:');
    console.log(`   Email:    ${defaultEmail}`);
    console.log(`   Password: ${defaultPassword}`);
  }
}

const MONGODB_URI = 'mongodb://127.0.0.1:27017/mern_login_db';
console.log('Connecting to MongoDB...');

mongoose.connect(MONGODB_URI)
  .then(() => {
    isDatabaseConnected = true;
    console.log('🔌 Connected to MongoDB database successfully.');
    seedDefaultUser();
  })
  .catch((err) => {
    console.log('\n================================================================');
    console.log('⚠️ WARNING: Could not connect to local MongoDB database.');
    console.log('   Make sure MongoDB is running locally on mongodb://localhost:27017.');
    console.log('   💡 FALLBACK: Starting server in MOCK DATABASE mode.');
    console.log('   The form will work perfectly, but user records are kept in memory!');
    console.log('================================================================\n');
    isDatabaseConnected = false;
    seedDefaultUser();
  });

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the MERN Login Form Backend API!',
    status: 'Running',
    databaseMode: isDatabaseConnected ? 'MongoDB Connected' : 'Mock In-Memory Fallback'
  });
});

app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  const validationErrors = {};

  if (!email || email.trim() === '') {
    validationErrors.email = 'Email is required on the server';
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      validationErrors.email = 'Please provide a valid email format';
    }
  }

  if (!password || password.trim() === '') {
    validationErrors.password = 'Password is required on the server';
  } else if (password.length < 6) {
    validationErrors.password = 'Password must be at least 6 characters';
  }

  if (Object.keys(validationErrors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Server-side validation failed',
      errors: validationErrors
    });
  }

  try {
    let userExists;

    if (isDatabaseConnected) {
      userExists = await User.findOne({ email: email.toLowerCase() });
    } else {
      userExists = MOCK_USERS.find(u => u.email === email.toLowerCase());
    }

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered. Please sign in instead!'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (isDatabaseConnected) {
      const newUser = new User({
        email: email.toLowerCase(),
        password: hashedPassword
      });
      await newUser.save();
    } else {
      MOCK_USERS.push({
        email: email.toLowerCase(),
        password: hashedPassword
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Registration successful! 🎉 You can now sign in.'
    });

  } catch (err) {
    console.error('Error handling register endpoint:', err);
    return res.status(500).json({
      success: false,
      message: 'An unexpected internal server error occurred during registration.'
    });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const validationErrors = {};

  if (!email || email.trim() === '') {
    validationErrors.email = 'Email is required on the server';
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      validationErrors.email = 'Please provide a valid email format';
    }
  }

  if (!password || password.trim() === '') {
    validationErrors.password = 'Password is required on the server';
  } else if (password.length < 6) {
    validationErrors.password = 'Password must be at least 6 characters';
  }

  if (Object.keys(validationErrors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Server-side validation failed',
      errors: validationErrors
    });
  }

  try {
    let user;

    if (isDatabaseConnected) {
      user = await User.findOne({ email: email.toLowerCase() });
    } else {
      user = MOCK_USERS.find(u => u.email === email.toLowerCase());
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful! 🎉 Welcome back.',
      user: {
        email: user.email
      }
    });

  } catch (err) {
    console.error('Error handling login endpoint:', err);
    return res.status(500).json({
      success: false,
      message: 'An unexpected internal server error occurred.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Express server running on: http://localhost:${PORT}`);
});
