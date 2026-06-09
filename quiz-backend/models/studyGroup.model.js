const mongoose = require('mongoose');

const studyGroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  createdBy: { type: String, required: true },
  subject: { type: String, default: 'General' },
  description: { type: String, default: '' },
  members: [
    {
      username: { type: String },
      joinedAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StudyGroup', studyGroupSchema);
