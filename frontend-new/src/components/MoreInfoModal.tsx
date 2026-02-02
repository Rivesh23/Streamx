import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Play, Plus, ThumbsUp, Check } from 'lucide-react';
import { api } from '../api';
import type { MediaItem } from '../api';

interface MoreInfoModalProps {
    item: MediaItem;
    onClose: () => void;
    onPlay: (item: MediaItem) => void;
}

export default function MoreInfoModal({ item, onClose, onPlay }: MoreInfoModalProps) {
    const [isListed, setIsListed] = useState(false);
    const [isLiked, setIsLiked] = useState(false);

    // Simulate initial state check (would be API call)
    useState(() => {
        // Check local storage or API
    });


    const handleList = () => {
        setIsListed(!isListed);
        api.addToLibrary(item); // Actually adds to DB
    };

    const handleLike = () => {
        setIsLiked(!isLiked);
        api.like(item);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8">
            <div className="absolute inset-0" onClick={onClose} />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative w-full max-w-4xl bg-[#181818] rounded-md overflow-hidden shadow-2xl mx-4"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 bg-[#181818] rounded-full p-2 hover:bg-zinc-800 transition"
                >
                    <X className="w-6 h-6 text-white" />
                </button>

                <div className="relative h-96">
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${item.backdrop || item.poster})` }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#181818] to-transparent" />

                    <div className="absolute bottom-12 left-12">
                        <h2 className="text-5xl font-extrabold mb-6 drop-shadow-lg">{item.title}</h2>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => onPlay(item)}
                                className="flex items-center gap-2 bg-white text-black px-8 py-2 rounded font-bold hover:bg-gray-200 transition"
                            >
                                <Play className="fill-black w-6 h-6" /> Play
                            </button>
                            <button
                                onClick={handleList}
                                className={`p-2 border-2 border-gray-400 rounded-full hover:border-white transition ${isListed ? 'bg-white/20 border-white' : ''}`}
                            >
                                {isListed ? (
                                    <Check className="w-6 h-6 text-white" />
                                ) : (
                                    <Plus className="w-6 h-6 text-gray-300 hover:text-white" />
                                )}
                            </button>
                            <button
                                onClick={handleLike}
                                className={`p-2 border-2 border-gray-400 rounded-full hover:border-white transition ${isLiked ? 'bg-white/20 border-white' : ''}`}
                            >
                                <ThumbsUp className={`w-6 h-6 hover:text-white ${isLiked ? 'text-white fill-white' : 'text-gray-300'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-12 grid grid-cols-3 gap-8">
                    <div className="col-span-2">
                        <div className="flex items-center gap-4 mb-6 text-sm">
                            <span className="text-green-400 font-bold">98% Match</span>
                            <span className="text-gray-400 font-bold">2023</span>
                            <span className="border border-gray-500 px-1 text-xs">HD</span>
                        </div>
                        <p className="text-lg leading-relaxed text-gray-200">{item.overview}</p>
                    </div>

                    <div className="col-span-1 text-sm text-gray-400">
                        <div><span className="text-gray-500">Generes:</span> Sci-Fi, Action</div>
                        <div className="mt-4"><span className="text-gray-500">Original Language:</span> English</div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
