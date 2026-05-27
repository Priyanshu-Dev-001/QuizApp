const User = require("../models/user.model");

// 🔥 SECRET TEACHER PASSKEY
const TEACHER_PASSKEY = "QUIZADMIN2026";


// ===============================
// ✅ REGISTER
// ===============================
exports.register = async (req, res) => {
  try {
    let {
      username,
      password,
      role,
      teacherPasskey,
    } = req.body;

    // 🔥 VALIDATION
    if (!username || !password || !role) {
      return res.status(400).json({
        message: "All fields required",
      });
    }

    // 🔥 CLEAN INPUT
    username = username.trim().toLowerCase();
    role = role.trim().toLowerCase();

    // 🔥 ROLE CHECK
    if (!["student", "teacher"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    // =====================================
    // 🔥 TEACHER SECRET PASSKEY CHECK
    // =====================================
    if (role === "teacher") {

      if (!teacherPasskey) {
        return res.status(400).json({
          message: "Teacher passkey required",
        });
      }

      if (teacherPasskey !== TEACHER_PASSKEY) {
        return res.status(403).json({
          message: "Invalid teacher passkey",
        });
      }
    }

    // 🔍 CHECK EXISTING USER
    const existing = await User.findOne({ username });

    if (existing) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // 🧾 CREATE USER
    const user = new User({
      username,
      password,
      role,
    });

    await user.save();

    // ✅ RESPONSE
    res.status(201).json({
      message: "✅ User registered successfully",
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
      },
    });

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};


// ===============================
// ✅ LOGIN
// ===============================
exports.login = async (req, res) => {
  try {
    let { username, password } = req.body;

    // 🔥 VALIDATION
    if (!username || !password) {
      return res.status(400).json({
        message: "All fields required",
      });
    }

    username = username.trim().toLowerCase();

    // 🔍 FIND USER
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    // 🔐 PASSWORD CHECK
    if (user.password !== password) {
      return res.status(400).json({
        message: "Wrong password",
      });
    }

    // ✅ FINAL RESPONSE
    res.status(200).json({
      _id: user._id,
      username: user.username,
      role: user.role.toLowerCase(),
    });

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};