const express = require("express");
const router = express.Router();
const Profile = require("../models/profile");

// ===============================
// 🔍 GET PROFILE
// ===============================
router.get("/:userId", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      userId: req.params.userId,
    });

    res.json(profile || {});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===============================
// 💾 SAVE / UPDATE PROFILE
// ===============================
router.post("/", async (req, res) => {
  try {
    const {
      userId,
      fullName,
      email,
      phone,
      className,
      city,
      bio,
      photo,
    } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId required" });
    }

    const updated = await Profile.findOneAndUpdate(
      { userId },
      {
        fullName,
        email,
        phone,
        className,
        city,
        bio,
        photo,
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;