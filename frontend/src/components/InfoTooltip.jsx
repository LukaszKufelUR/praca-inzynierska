import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

const InfoTooltip = ({ text }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative inline-flex items-center ml-2 group">
            <HelpCircle
                className="w-4 h-4 text-gray-400 hover:text-primary-400 cursor-help transition-colors"
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
            />

            {isVisible && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 dark:bg-white border border-gray-700 dark:border-gray-300 rounded-lg shadow-xl z-50 animate-fade-in">
                    <p className="text-xs text-gray-300 dark:text-gray-900 leading-relaxed text-center">
                        {text}
                    </p>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-white"></div>
                </div>
            )}
        </div>
    );
};

export default InfoTooltip;
