import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import { Pencil } from 'lucide-react';

export default function Profile() {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [profileName, setProfileName] = useState(localStorage.getItem('profileName') || 'User');
    const [avatar, setAvatar] = useState(localStorage.getItem('avatar') || "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png");

    const avatars = [
        "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png",
        "https://i.pinimg.com/originals/b6/77/cd/b677cd1cde292f261166533d6fe75872.png",
        "https://i.pinimg.com/564x/1b/a2/e6/1ba2e6d1d4874546c70c91f102422b03.jpg",
        "https://i.pinimg.com/736x/c5/9c/8c/c59c8c7b8970e5361a457494cb68987b.jpg"
    ];

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        navigate('/login');
    };

    const handleSave = () => {
        localStorage.setItem('profileName', profileName);
        localStorage.setItem('avatar', avatar);
        setIsEditing(false);
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar onSearch={() => { }} />
            <div className="flex flex-col items-center justify-center h-screen gap-8">
                <h1 className="text-5xl font-regular">{isEditing ? 'Edit Profile' : "Who's watching?"}</h1>

                <div className="flex flex-col items-center gap-8">
                    <div className="relative group flex flex-col items-center gap-4 cursor-pointer" onClick={() => !isEditing && navigate('/')}>
                        <div className="relative w-32 h-32 rounded-md bg-blue-600 overflow-hidden border-2 border-transparent group-hover:border-white">
                            <img src={avatar} alt="User" className="w-full h-full object-cover" />
                            {isEditing && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <Pencil className="w-8 h-8 text-white" />
                                </div>
                            )}
                        </div>
                        {isEditing ? (
                            <input
                                value={profileName}
                                onChange={e => setProfileName(e.target.value)}
                                className="bg-[#333] text-white px-2 py-1 text-center w-32 outline-none border border-gray-500 rounded"
                            />
                        ) : (
                            <span className="text-gray-400 group-hover:text-white text-xl">{profileName}</span>
                        )}
                    </div>

                    {isEditing && (
                        <div className="flex gap-4 mt-4">
                            {avatars.map(url => (
                                <img
                                    key={url}
                                    src={url}
                                    onClick={() => setAvatar(url)}
                                    className={`w-12 h-12 rounded-full cursor-pointer hover:scale-110 transition ${avatar === url ? 'ring-2 ring-white' : 'opacity-50'}`}
                                    alt="Avatar option"
                                />
                            ))}
                        </div>
                    )}

                    {!isEditing && (
                        <div className="flex gap-8">
                            {/* Existing profile is rendered in the main flex container above now */}

                            <div className="group flex flex-col items-center gap-4 cursor-pointer">
                                <div className="w-32 h-32 rounded-md bg-zinc-800 flex items-center justify-center border-2 border-transparent group-hover:border-white">
                                    <span className="text-4xl text-gray-500">+</span>
                                </div>
                                <span className="text-gray-400 group-hover:text-white text-xl">Add Profile</span>
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    className={`mt-12 px-8 py-2 border ${isEditing ? 'bg-white text-black border-white hover:bg-red-600 hover:text-white hover:border-red-600' : 'border-gray-500 text-gray-400 hover:text-white hover:border-white'} transition font-bold`}
                >
                    {isEditing ? 'Save' : 'Manage Profiles'}
                </button>

                {isEditing ? (
                    <button
                        onClick={() => setIsEditing(false)}
                        className="mt-4 px-8 py-2 border border-gray-500 text-gray-400 hover:text-white hover:border-white transition"
                    >
                        Cancel
                    </button>
                ) : (
                    <button
                        onClick={handleLogout}
                        className="mt-4 px-8 py-2 bg-red-600 text-white font-bold hover:bg-red-700 transition"
                    >
                        Sign Out
                    </button>
                )}
            </div>
        </div>
    );
}
