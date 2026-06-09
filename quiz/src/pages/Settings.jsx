import { useEffect, useState } from "react";
import { Eye, EyeOff, Bot } from "lucide-react";
import axios from "axios";
import {
  PROFILE_UPDATED_EVENT,
  readStoredProfile,
  readStoredUser,
  saveProfileSnapshot,
} from "../utils/profileSync";
import "./settings.css";

const defaultSettings = {
  theme: "light",
  quizTimer: 60,
  sound: true,
  reminders: true,
  showHints: false,
  difficulty: "Medium",
  geminiApiKey: "",
  aiPersonality: "Friendly Tutor",
};

const defaultProfile = {
  fullName: "",
  email: "",
  phone: "",
  className: "",
  city: "",
  bio: "",
  photo: "",
};

const readSettings = () => {
  try {
    return JSON.parse(localStorage.getItem("quizSettings")) || {};
  } catch (error) {
    console.error("Invalid quiz settings:", error);
    return {};
  }
};

const getInitialSettings = () => ({
  ...defaultSettings,
  ...readSettings(),
});

const getInitialProfile = () => {
  const storedUser = readStoredUser();
  const localProfile = readStoredProfile(storedUser?._id);

  return Object.keys(localProfile).length
    ? { ...defaultProfile, ...localProfile }
    : defaultProfile;
};

export default function Settings() {
  const [user] = useState(readStoredUser);
  const [profile, setProfile] = useState(getInitialProfile);
  const [settings, setSettings] = useState(getInitialSettings);
  const [saved, setSaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    const storedUser = readStoredUser();

    if (storedUser?._id) {
      axios
        .get(`/api/profile/${storedUser._id}`)
        .then((res) => {
          const syncedProfile = saveProfileSnapshot(
            {
              ...res.data,
              userId: storedUser._id,
            },
            storedUser
          );

          setProfile({ ...defaultProfile, ...syncedProfile });
        })
        .catch((err) => console.log("Settings profile error:", err.message));
    }
  }, []);

  useEffect(() => {
    document.body.dataset.theme = settings.theme || "light";
  }, [settings.theme]);

  useEffect(() => {
    const syncProfile = (event) => {
      const nextProfile = event?.detail || readStoredProfile(user?._id);

      if (nextProfile && Object.keys(nextProfile).length) {
        setProfile({ ...defaultProfile, ...nextProfile });
      }
    };

    window.addEventListener(PROFILE_UPDATED_EVENT, syncProfile);
    window.addEventListener("storage", syncProfile);

    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, syncProfile);
      window.removeEventListener("storage", syncProfile);
    };
  }, [user?._id]);

  const updateSetting = (key, value) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };

      if (key === "theme") {
        document.body.dataset.theme = value;
      }

      return next;
    });
    setSaved(false);
  };

  const saveSettings = () => {
    localStorage.setItem("quizSettings", JSON.stringify(settings));
    document.body.dataset.theme = settings.theme;
    setSaved(true);

    setTimeout(() => setSaved(false), 1800);
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.setItem("quizSettings", JSON.stringify(defaultSettings));
    document.body.dataset.theme = "light";
    setSaved(true);

    setTimeout(() => setSaved(false), 1800);
  };

  const displayName =
    profile.fullName || user?.fullName || user?.username || "Quiz User";
  const profilePhoto = profile.photo || user?.photo || "";
  const profileInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="settings-page">
      <section className="settings-hero">
        <div>
          <p className="settings-eyebrow">Account settings</p>
          <h1>Personalize QuizApp</h1>
          <p>
            Manage your profile, quiz preferences, theme, reminders, and study
            experience from one place.
          </p>
        </div>

        <div className="profile-card">
          <span className="settings-profile-avatar">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profile" />
            ) : (
              profileInitial
            )}
          </span>
          <div>
            <strong>{displayName}</strong>
            <small>{user?.role || "Student"}</small>
          </div>
        </div>
      </section>

      <section className="settings-grid">
        <article className="settings-panel">
          <div className="panel-head">
            <span>Appearance</span>
            <h2>Theme</h2>
          </div>

          <div className="theme-switch">
            <button
              className={settings.theme === "light" ? "active" : ""}
              onClick={() => updateSetting("theme", "light")}
              type="button"
            >
              Light
            </button>
            <button
              className={settings.theme === "dark" ? "active" : ""}
              onClick={() => updateSetting("theme", "dark")}
              type="button"
            >
              Dark
            </button>
          </div>
        </article>

        <article className="settings-panel">
          <div className="panel-head">
            <span>Quiz preferences</span>
            <h2>Practice setup</h2>
          </div>

          <label className="setting-field">
            Default timer
            <select
              value={settings.quizTimer}
              onChange={(e) => updateSetting("quizTimer", Number(e.target.value))}
            >
              <option value={30}>30 seconds</option>
              <option value={60}>60 seconds</option>
              <option value={90}>90 seconds</option>
              <option value={120}>120 seconds</option>
            </select>
          </label>

          <label className="setting-field">
            Difficulty
            <select
              value={settings.difficulty}
              onChange={(e) => updateSetting("difficulty", e.target.value)}
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </label>
        </article>

        <article className="settings-panel wide">
          <div className="panel-head">
            <span>AI Companion</span>
            <h2>
              QuizCopilot Configuration
              <span className="ai-panel-badge">
                <Bot size={14} /> AI
              </span>
            </h2>
          </div>

          <label className="setting-field">
            Gemini API Key
            <div className="ai-key-field">
              <input
                type={showApiKey ? "text" : "password"}
                value={settings.geminiApiKey}
                onChange={(e) => updateSetting("geminiApiKey", e.target.value)}
                placeholder="Enter your Gemini API key"
              />
              <button
                type="button"
                className="ai-key-toggle"
                onClick={() => setShowApiKey((v) => !v)}
                aria-label={showApiKey ? "Hide API key" : "Show API key"}
              >
                {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="ai-helper-text">
              Get your free API key from{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
              >
                Google AI Studio
              </a>
              . QuizCopilot works offline too with built-in smart responses!
            </p>
          </label>

          <label className="setting-field">
            AI Personality
            <select
              value={settings.aiPersonality}
              onChange={(e) => updateSetting("aiPersonality", e.target.value)}
            >
              <option>Friendly Tutor</option>
              <option>Strict Mentor</option>
              <option>Fun Coach</option>
            </select>
          </label>
        </article>

        <article className="settings-panel wide">
          <div className="panel-head">
            <span>Preferences</span>
            <h2>Learning options</h2>
          </div>

          <div className="toggle-list">
            <label className="toggle-row">
              <span>
                Sound effects
                <small>Play small feedback sounds during quizzes.</small>
              </span>
              <input
                checked={settings.sound}
                onChange={(e) => updateSetting("sound", e.target.checked)}
                type="checkbox"
              />
            </label>

            <label className="toggle-row">
              <span>
                Study reminders
                <small>Keep reminders enabled for consistent practice.</small>
              </span>
              <input
                checked={settings.reminders}
                onChange={(e) => updateSetting("reminders", e.target.checked)}
                type="checkbox"
              />
            </label>

            <label className="toggle-row">
              <span>
                Show hints
                <small>Allow helpful hints before choosing an answer.</small>
              </span>
              <input
                checked={settings.showHints}
                onChange={(e) => updateSetting("showHints", e.target.checked)}
                type="checkbox"
              />
            </label>
          </div>
        </article>
      </section>

      <section className="settings-actions">
        <button className="save-btn" onClick={saveSettings}>
          Save Settings
        </button>
        <button className="reset-btn" onClick={resetSettings}>
          Reset
        </button>
        {saved && <span>Settings saved</span>}
      </section>
    </div>
  );
}
