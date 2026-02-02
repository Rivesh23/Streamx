// Authentication Helper Functions
const AUTH_STORAGE_KEY = 'netflix_profiles';
const ACTIVE_PROFILE_KEY = 'netflix_active_profile';

// Default avatars (Netflix-style)
const AVATARS = [
    '👤', '🎭', '🎨', '🎮', '🎸', '🎬',
    '🚀', '🦸', '🧙', '🐱', '🐶', '🦊'
];

function getProfiles() {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

function saveProfiles(profiles) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profiles));
}

function getActiveProfile() {
    const profileId = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (!profileId) return null;

    const profiles = getProfiles();
    return profiles.find(p => p.id === profileId) || null;
}

function setActiveProfile(profileId) {
    localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
}

function createProfile(name, avatar, isKid = false) {
    const profiles = getProfiles();
    const newProfile = {
        id: Date.now().toString(),
        name: name,
        avatar: avatar,
        isKid: isKid,
        createdAt: new Date().toISOString()
    };
    profiles.push(newProfile);
    saveProfiles(profiles);
    return newProfile;
}

function updateProfile(profileId, updates) {
    const profiles = getProfiles();
    const index = profiles.findIndex(p => p.id === profileId);
    if (index !== -1) {
        profiles[index] = { ...profiles[index], ...updates };
        saveProfiles(profiles);
        return profiles[index];
    }
    return null;
}

function deleteProfile(profileId) {
    let profiles = getProfiles();
    profiles = profiles.filter(p => p.id !== profileId);
    saveProfiles(profiles);

    // Clear active profile if it was deleted
    if (localStorage.getItem(ACTIVE_PROFILE_KEY) === profileId) {
        localStorage.removeItem(ACTIVE_PROFILE_KEY);
    }
}

function logout() {
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
    window.location.href = 'login.html';
}

function requireAuth() {
    const profile = getActiveProfile();
    if (!profile) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}
