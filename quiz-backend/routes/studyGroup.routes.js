const express = require('express');
const router = express.Router();
const StudyGroup = require('../models/studyGroup.model');
const Result = require('../models/result.model');

const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

router.post('/create', async (req, res) => {
  try {
    const { name, subject, description, createdBy } = req.body;
    if (!name || !createdBy) {
      return res.status(400).json({ message: 'Name and creator required' });
    }

    let code;
    let exists = true;
    while (exists) {
      code = generateCode();
      exists = await StudyGroup.findOne({ code });
    }

    const group = new StudyGroup({
      name,
      subject: subject || 'General',
      description: description || '',
      createdBy,
      code,
      members: [{ username: createdBy }]
    });

    await group.save();
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/join', async (req, res) => {
  try {
    const { code, username } = req.body;
    if (!code || !username) {
      return res.status(400).json({ message: 'Code and username required' });
    }

    const group = await StudyGroup.findOne({ code: code.toUpperCase() });
    if (!group) {
      return res.status(404).json({ message: 'Group not found. Check the code.' });
    }

    const alreadyMember = group.members.some(m => m.username === username);
    if (alreadyMember) {
      return res.json({ message: 'Already a member', group });
    }

    group.members.push({ username });
    await group.save();
    res.json({ message: 'Joined successfully', group });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/my-groups/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const groups = await StudyGroup.find({ 'members.username': username }).sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:code', async (req, res) => {
  try {
    const group = await StudyGroup.findOne({ code: req.params.code.toUpperCase() });
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:code/leaderboard', async (req, res) => {
  try {
    const group = await StudyGroup.findOne({ code: req.params.code.toUpperCase() });
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const usernames = group.members.map(m => m.username);
    const results = await Result.find({ username: { $in: usernames } });

    const statsMap = {};
    usernames.forEach(u => {
      statsMap[u] = { username: u, totalQuizzes: 0, totalScore: 0, totalMax: 0 };
    });

    results.forEach(r => {
      if (statsMap[r.username]) {
        statsMap[r.username].totalQuizzes++;
        statsMap[r.username].totalScore += r.score;
        statsMap[r.username].totalMax += r.total;
      }
    });

    const leaderboard = Object.values(statsMap)
      .map(s => ({
        ...s,
        avgPercent: s.totalMax > 0 ? Math.round((s.totalScore / s.totalMax) * 100) : 0
      }))
      .sort((a, b) => b.avgPercent - a.avgPercent);

    res.json({ group, leaderboard });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/leave', async (req, res) => {
  try {
    const { code, username } = req.body;
    const group = await StudyGroup.findOne({ code: code.toUpperCase() });
    if (!group) return res.status(404).json({ message: 'Group not found' });

    group.members = group.members.filter(m => m.username !== username);
    if (group.members.length === 0) {
      await StudyGroup.deleteOne({ code: code.toUpperCase() });
      return res.json({ message: 'Group deleted (no members left)' });
    }
    await group.save();
    res.json({ message: 'Left group successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
