import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, X, Check, Trash2 } from 'lucide-react';

interface ProfileData {
    id: string;
    name: string;
    avatar: string;
    color: string;
    isKids: boolean;
}

const AVATAR_COLORS = [
    'from-[#E50914] to-[#8B0000]',
    'from-violet-600 to-purple-900',
    'from-sky-500 to-blue-800',
    'from-emerald-500 to-teal-800',
    'from-amber-500 to-orange-800',
    'from-pink-500 to-rose-800',
    'from-cyan-400 to-sky-800',
    'from-lime-400 to-green-800',
];

const AVATAR_EMOJIS = ['😎', '🦊', '🐺', '🎮', '🚀', '👻', '🔥', '💎', '🎬', '🌙', '⚡', '🎯', '🦁', '🐉', '🌊', '🎸'];

const DEFAULT_PROFILES: ProfileData[] = [
    { id: '1', name: 'Admin', avatar: '😎', color: AVATAR_COLORS[0], isKids: false },
    { id: '2', name: 'Guest', avatar: '👻', color: AVATAR_COLORS[1], isKids: false },
    { id: '3', name: 'Kids', avatar: '🦊', color: AVATAR_COLORS[2], isKids: true },
];

export default function Profile() {
    const navigate = useNavigate();
    const [profiles, setProfiles] = useState<ProfileData[]>(() => {
        const stored = localStorage.getItem('streamx_profiles');
        return stored ? JSON.parse(stored) : DEFAULT_PROFILES;
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editingProfile, setEditingProfile] = useState<ProfileData | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newAvatar, setNewAvatar] = useState('🎮');
    const [newColor, setNewColor] = useState(AVATAR_COLORS[3]);
    const [newIsKids, setNewIsKids] = useState(false);

    useEffect(() => {
        localStorage.setItem('streamx_profiles', JSON.stringify(profiles));
    }, [profiles]);

    const handleSelectProfile = (profile: ProfileData) => {
        if (isEditing) {
            setEditingProfile(profile);
            setNewName(profile.name);
            setNewAvatar(profile.avatar);
            setNewColor(profile.color);
            setNewIsKids(profile.isKids);
            return;
        }
        localStorage.setItem('streamx_active_profile', JSON.stringify(profile));
        navigate('/');
    };

    const handleSaveEdit = () => {
        if (!editingProfile || !newName.trim()) return;
        setProfiles(prev => prev.map(p =>
            p.id === editingProfile.id ? { ...p, name: newName.trim(), avatar: newAvatar, color: newColor, isKids: newIsKids } : p
        ));
        setEditingProfile(null);
    };

    const handleDeleteProfile = (id: string) => {
        setProfiles(prev => prev.filter(p => p.id !== id));
        setEditingProfile(null);
    };

    const handleAddProfile = () => {
        if (!newName.trim()) return;
        const newProfile: ProfileData = {
            id: Date.now().toString(),
            name: newName.trim(),
            avatar: newAvatar,
            color: newColor,
            isKids: newIsKids,
        };
        setProfiles(prev => [...prev, newProfile]);
        setShowAddModal(false);
        setNewName('');
        setNewAvatar('🎮');
        setNewColor(AVATAR_COLORS[3]);
        setNewIsKids(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-[#040404] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden"
        >
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#E50914]/5 blur-[200px]" />
            </div>

            {/* Title */}
            <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-5xl font-black mb-3 tracking-tight text-center relative z-10"
            >
                Who's watching?
            </motion.h1>
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-white/30 mb-12 md:mb-16"
            >
                Select your profile to continue
            </motion.p>

            {/* Profiles Grid */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-12 relative z-10">
                {profiles.map((p, i) => (
                    <motion.div
                        key={p.id}
                        initial={{ opacity: 0, scale: 0.7, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.15 + i * 0.08, type: 'spring', stiffness: 100 }}
                        onClick={() => handleSelectProfile(p)}
                        className="group flex flex-col items-center gap-4 cursor-pointer relative"
                    >
                        {/* Avatar */}
                        <div className={`
                            w-28 h-28 md:w-36 md:h-36 rounded-3xl flex items-center justify-center
                            bg-gradient-to-br ${p.color}
                            border-4 border-transparent group-hover:border-white/80
                            transition-all duration-300 group-hover:scale-105
                            shadow-xl group-hover:shadow-2xl
                            ${isEditing ? 'animate-pulse' : ''}
                            relative overflow-hidden
                        `}>
                            <span className="text-4xl md:text-5xl select-none relative z-10">{p.avatar}</span>
                            {/* Shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            {/* Kids badge */}
                            {p.isKids && (
                                <div className="absolute top-2 right-2 bg-yellow-400 text-black text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider z-20">
                                    Kids
                                </div>
                            )}

                            {/* Edit overlay */}
                            {isEditing && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                                    <Pencil className="w-6 h-6 text-white" />
                                </div>
                            )}
                        </div>

                        {/* Name */}
                        <span className={`text-lg font-semibold transition-colors ${isEditing ? 'text-white/50' : 'text-white/50 group-hover:text-white'}`}>
                            {p.name}
                        </span>
                    </motion.div>
                ))}

                {/* Add Profile */}
                {profiles.length < 6 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.7, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.15 + profiles.length * 0.08, type: 'spring', stiffness: 100 }}
                        onClick={() => { setShowAddModal(true); setNewName(''); setNewAvatar('🎮'); setNewColor(AVATAR_COLORS[3]); setNewIsKids(false); }}
                        className="group flex flex-col items-center gap-4 cursor-pointer"
                    >
                        <div className="w-28 h-28 md:w-36 md:h-36 rounded-3xl bg-white/[0.04] border-2 border-dashed border-white/10 flex items-center justify-center group-hover:bg-white/[0.08] group-hover:border-white/25 transition-all duration-300 group-hover:scale-105">
                            <Plus className="w-10 h-10 text-white/20 group-hover:text-white/50 transition-colors" />
                        </div>
                        <span className="text-lg font-semibold text-white/20 group-hover:text-white/50 transition-colors">Add Profile</span>
                    </motion.div>
                )}
            </div>

            {/* Manage Profiles Button */}
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={() => setIsEditing(!isEditing)}
                className={`mt-14 md:mt-16 px-8 py-3 rounded-xl text-sm font-bold uppercase tracking-[0.15em] transition-all border ${
                    isEditing
                        ? 'bg-white text-black border-white hover:bg-gray-200'
                        : 'bg-transparent text-white/40 border-white/15 hover:text-white hover:border-white/40'
                }`}
            >
                {isEditing ? 'Done' : 'Manage Profiles'}
            </motion.button>

            {/* Edit Profile Modal */}
            <AnimatePresence>
                {editingProfile && (
                    <ProfileModal
                        title="Edit Profile"
                        name={newName}
                        avatar={newAvatar}
                        color={newColor}
                        isKids={newIsKids}
                        onNameChange={setNewName}
                        onAvatarChange={setNewAvatar}
                        onColorChange={setNewColor}
                        onKidsChange={setNewIsKids}
                        onSave={handleSaveEdit}
                        onClose={() => setEditingProfile(null)}
                        onDelete={() => handleDeleteProfile(editingProfile.id)}
                        canDelete={profiles.length > 1}
                    />
                )}
            </AnimatePresence>

            {/* Add Profile Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <ProfileModal
                        title="Add Profile"
                        name={newName}
                        avatar={newAvatar}
                        color={newColor}
                        isKids={newIsKids}
                        onNameChange={setNewName}
                        onAvatarChange={setNewAvatar}
                        onColorChange={setNewColor}
                        onKidsChange={setNewIsKids}
                        onSave={handleAddProfile}
                        onClose={() => setShowAddModal(false)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

/* ── Profile Modal ── */
function ProfileModal({
    title, name, avatar, color, isKids,
    onNameChange, onAvatarChange, onColorChange, onKidsChange,
    onSave, onClose, onDelete, canDelete
}: {
    title: string;
    name: string;
    avatar: string;
    color: string;
    isKids: boolean;
    onNameChange: (v: string) => void;
    onAvatarChange: (v: string) => void;
    onColorChange: (v: string) => void;
    onKidsChange: (v: boolean) => void;
    onSave: () => void;
    onClose: () => void;
    onDelete?: () => void;
    canDelete?: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-[#141414] border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black">{title}</h2>
                    <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Preview */}
                <div className="flex justify-center mb-8">
                    <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${color} flex items-center justify-center shadow-xl`}>
                        <span className="text-4xl select-none">{avatar}</span>
                    </div>
                </div>

                {/* Name */}
                <div className="mb-6">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 block">Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                        maxLength={20}
                        className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white font-medium outline-none focus:border-[#E50914]/50 transition-all"
                        placeholder="Profile name"
                        autoFocus
                    />
                </div>

                {/* Avatar Picker */}
                <div className="mb-6">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 block">Avatar</label>
                    <div className="grid grid-cols-8 gap-2">
                        {AVATAR_EMOJIS.map(emoji => (
                            <button
                                key={emoji}
                                onClick={() => onAvatarChange(emoji)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                                    avatar === emoji ? 'bg-white/20 ring-2 ring-[#E50914] scale-110' : 'bg-white/[0.04] hover:bg-white/10'
                                }`}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Color Picker */}
                <div className="mb-6">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 block">Color</label>
                    <div className="flex gap-3 flex-wrap">
                        {AVATAR_COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => onColorChange(c)}
                                className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c} transition-all ${
                                    color === c ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-60 hover:opacity-100'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Kids toggle */}
                <div className="flex items-center justify-between mb-8 bg-white/[0.03] rounded-xl px-4 py-3.5 border border-white/[0.06]">
                    <div>
                        <p className="text-sm font-bold">Kids Profile</p>
                        <p className="text-xs text-white/30">Only show content rated for children</p>
                    </div>
                    <button
                        onClick={() => onKidsChange(!isKids)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${isKids ? 'bg-[#E50914]' : 'bg-white/20'}`}
                    >
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isKids ? 'translate-x-6' : ''}`} />
                    </button>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    {onDelete && canDelete && (
                        <button
                            onClick={onDelete}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold text-sm transition-all"
                        >
                            <Trash2 className="w-4 h-4" /> Delete
                        </button>
                    )}
                    <button
                        onClick={onSave}
                        disabled={!name.trim()}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#E50914] hover:bg-[#f40612] text-white font-bold py-3 rounded-xl transition-all disabled:opacity-30 shadow-lg shadow-[#E50914]/20"
                    >
                        <Check className="w-4 h-4" /> Save
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
