import React from 'react';
import { Star } from 'lucide-react';

const FavoriteButton = ({ symbol, isFavorite, onToggle, disabled }) => {
    return (
        <button
            onClick={() => onToggle(symbol)}
            disabled={disabled}
            className={`p-2 rounded-lg transition-all ${isFavorite
                    ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-yellow-400'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
        >
            <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
    );
};

export default FavoriteButton;
