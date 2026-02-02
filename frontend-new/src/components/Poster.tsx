import { useState } from 'react';
import { motion } from 'framer-motion';
import type { MediaItem } from '../api';

interface PosterProps {
    item: MediaItem;
    onClick: (item: MediaItem) => void;
    onHover?: (item: MediaItem) => void;
    isLarge?: boolean;
}

export default function Poster({ item, onClick, onHover, isLarge = false }: PosterProps) {
    const [imgSrc, setImgSrc] = useState(item.poster || '');

    const handleError = () => {
        setImgSrc(`https://via.placeholder.com/200x300?text=${encodeURIComponent(item.title)}`);
    };

    return (
        <motion.div
            className={`relative cursor-pointer transition-transform duration-300 ${isLarge ? 'w-48' : 'w-36'} flex-shrink-0`}
            whileHover={{ scale: 1.05, zIndex: 10 }}
            onClick={() => onClick(item)}
            onMouseEnter={() => onHover && onHover(item)}
        >
            <img
                src={imgSrc}
                alt={item.title}
                onError={handleError}
                className="rounded-md object-cover w-full h-full shadow-lg"
                style={{ aspectRatio: '2/3' }}
            />
        </motion.div>
    );
}
