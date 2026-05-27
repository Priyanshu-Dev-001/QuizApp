export const PROFILE_STORAGE_KEY = "quizProfile";
export const PROFILE_UPDATED_EVENT = "profileUpdated";

export function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
}

export function readStoredProfile(userId) {
  try {
    const profile = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY)) || {};

    if (profile.userId && userId && profile.userId !== userId) {
      return {};
    }

    return profile;
  } catch {
    return {};
  }
}

export function saveProfileSnapshot(profile, user) {
  const nextProfile = {
    ...profile,
    userId: profile.userId || user?._id || "",
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));

  const storedUser = readStoredUser();

  if (storedUser) {
    localStorage.setItem(
      "user",
      JSON.stringify({
        ...storedUser,
        fullName: nextProfile.fullName || "",
        email: nextProfile.email || storedUser.email || "",
        photo: nextProfile.photo || "",
        profile: nextProfile,
      })
    );
  }

  return nextProfile;
}

export function emitProfileUpdated(profile) {
  window.dispatchEvent(
    new CustomEvent(PROFILE_UPDATED_EVENT, {
      detail: profile,
    })
  );
}
