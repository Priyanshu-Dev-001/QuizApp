import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  Camera,
  CheckCircle2,
  LogOut,
  Mail,
  MapPin,
  Moon,
  Phone,
  Save,
  Sparkles,
  Sun,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import {
  PROFILE_UPDATED_EVENT,
  emitProfileUpdated,
  readStoredProfile,
  readStoredUser,
  saveProfileSnapshot,
} from "../utils/profileSync";
import "./nav.css";

const defaultProfile = {
  fullName: "",
  email: "",
  phone: "",
  className: "",
  city: "",
  bio: "",
  photo: "",
};

export default function Navbar({ logout }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState("light");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState(defaultProfile);
  const [loading, setLoading] = useState(false);

  const profileRef = useRef(null);

  useEffect(() => {
    const storedUser = readStoredUser();
    const storedSettings =
      JSON.parse(localStorage.getItem("quizSettings")) || {};

    const activeTheme = storedSettings.theme || "light";

    setUser(storedUser);
    setTheme(activeTheme);
    document.body.dataset.theme = activeTheme;

    const storedProfile = readStoredProfile(storedUser?._id);

    if (Object.keys(storedProfile).length) {
      setProfile({ ...defaultProfile, ...storedProfile });
    }

    if (storedUser?._id) {
      axios
        .get(`http://localhost:5000/api/profile/${storedUser._id}`)
        .then((res) => {
          const loadedProfile = {
            ...defaultProfile,
            ...res.data,
            userId: storedUser._id,
          };

          setProfile(loadedProfile);
          saveProfileSnapshot(loadedProfile, storedUser);
        })
        .catch((err) => console.log("Profile load error:", err));
    }
  }, []);

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

  useEffect(() => {
    const closeProfile = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", closeProfile);
    return () => document.removeEventListener("mousedown", closeProfile);
  }, []);

  const initial = user?.username
    ? user.username.charAt(0).toUpperCase()
    : "?";

  const avatar = profile.photo || "";

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    const storedSettings =
      JSON.parse(localStorage.getItem("quizSettings")) || {};

    localStorage.setItem(
      "quizSettings",
      JSON.stringify({ ...storedSettings, theme: nextTheme })
    );

    document.body.dataset.theme = nextTheme;
    setTheme(nextTheme);
  };

  const updateProfile = (key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => updateProfile("photo", reader.result);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    updateProfile("photo", "");
  };

  const saveProfile = async () => {
    if (!user?._id) {
      alert("User not found");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post("http://localhost:5000/api/profile", {
        userId: user._id,
        ...profile,
      });

      const savedProfile = saveProfileSnapshot(
        {
          ...profile,
          ...(res.data || {}),
          userId: user._id,
        },
        user
      );

      setProfile({ ...defaultProfile, ...savedProfile });
      emitProfileUpdated(savedProfile);

      setProfileOpen(false);
      alert("✅ Profile saved");
    } catch (err) {
      console.log("Save error:", err);
      alert("❌ Error saving profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (logout) {
      logout();
      return;
    }

    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <header className="q-navbar">
      <div className="q-nav-glow"></div>

      <div className="q-nav-spacer" />

      <div className="q-nav-actions">
        <button className="q-theme-btn" onClick={toggleTheme} type="button">
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>

        <button className="q-logout-btn" onClick={handleLogout} type="button">
          <LogOut size={18} />
          <span>Logout</span>
        </button>

        <div className="q-profile-wrap" ref={profileRef}>
          <button
            className="q-profile-btn"
            onClick={() => setProfileOpen((prev) => !prev)}
            title={user?.username || "User"}
            type="button"
          >
            {avatar ? <img src={avatar} alt="Profile" /> : <span>{initial}</span>}
          </button>

          {profileOpen && (
            <div className="q-profile-panel">
              <div className="q-profile-panel-glow"></div>

              <div className="q-profile-topbar">
                <span>Profile</span>
                <button
                  onClick={() => setProfileOpen(false)}
                  type="button"
                  aria-label="Close profile"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="q-profile-head">
                <div className="q-profile-preview">
                  {avatar ? <img src={avatar} alt="Profile" /> : <span>{initial}</span>}
                </div>

                <div>
                  <strong>{profile.fullName || user?.username || "Quiz User"}</strong>
                  <small>{user?.role || "Student"}</small>
                </div>
              </div>

              <div className="q-profile-quick">
                <div>
                  <CheckCircle2 size={16} />
                  Account Active
                </div>
                <div>
                  <UserRound size={16} />
                  {user?.username || "User"}
                </div>
              </div>

              <div className="q-photo-actions">
                <label className="q-upload-box">
                  <Camera size={17} />
                  Upload photo
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} />
                </label>

                {avatar && (
                  <button className="q-remove-photo" onClick={removePhoto} type="button">
                    <Trash2 size={17} />
                    Remove
                  </button>
                )}
              </div>

              <div className="q-profile-form">
                <label>
                  Full name
                  <div>
                    <UserRound size={17} />
                    <input
                      value={profile.fullName}
                      placeholder="Enter full name"
                      onChange={(e) => updateProfile("fullName", e.target.value)}
                    />
                  </div>
                </label>

                <label>
                  Email
                  <div>
                    <Mail size={17} />
                    <input
                      type="email"
                      value={profile.email}
                      placeholder="Enter email"
                      onChange={(e) => updateProfile("email", e.target.value)}
                    />
                  </div>
                </label>

                <label>
                  Phone
                  <div>
                    <Phone size={17} />
                    <input
                      value={profile.phone}
                      placeholder="Enter phone"
                      onChange={(e) => updateProfile("phone", e.target.value)}
                    />
                  </div>
                </label>

                <label>
                  Class / Department
                  <div>
                    <Sparkles size={17} />
                    <input
                      value={profile.className}
                      placeholder="Class or department"
                      onChange={(e) => updateProfile("className", e.target.value)}
                    />
                  </div>
                </label>

                <label>
                  City
                  <div>
                    <MapPin size={17} />
                    <input
                      value={profile.city}
                      placeholder="Enter city"
                      onChange={(e) => updateProfile("city", e.target.value)}
                    />
                  </div>
                </label>

                <label>
                  Bio
                  <textarea
                    rows="3"
                    value={profile.bio}
                    placeholder="Write something about you"
                    onChange={(e) => updateProfile("bio", e.target.value)}
                  />
                </label>
              </div>

              <button
                className="q-save-profile"
                onClick={saveProfile}
                disabled={loading}
                type="button"
              >
                <Save size={18} />
                {loading ? "Saving..." : "Save Profile"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
