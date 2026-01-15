import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Settings, LogOut, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const UserDropdown = ({ onOpenSettings, onOpenHistory, onOpenAdmin, isDropUp = false }) => {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSettingsClick = () => {
        setIsOpen(false);
        onOpenSettings();
    };

    const handleLogoutClick = () => {
        setIsOpen(false);
        logout();
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-2 bg-gray-800 dark:bg-gray-200 hover:bg-gray-700 dark:hover:bg-gray-300 text-white dark:text-gray-900 px-3 py-2 rounded-lg transition-colors border border-gray-700 dark:border-gray-300"
            >
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {user?.email?.[0].toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm truncate">{user?.email}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className={`absolute right-0 left-0 ${isDropUp ? 'bottom-full mb-2' : 'top-full mt-2'} bg-gray-800 dark:bg-white border border-gray-700 dark:border-gray-300 rounded-lg shadow-xl z-50 overflow-hidden`}>
                    <button
                        onClick={handleSettingsClick}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 dark:text-gray-700 hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors text-left"
                    >
                        <Settings className="w-4 h-4" />
                        <span>Ustawienia</span>
                    </button>
                    <button
                        onClick={() => { setIsOpen(false); onOpenHistory(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 dark:text-gray-700 hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors text-left"
                    >
                        <TrendingUp className="w-4 h-4" />
                        <span>Historia prognoz</span>
                    </button>
                    {user?.is_admin === 1 && (
                        <>
                            <div className="border-t border-gray-700 dark:border-gray-300"></div>
                            <button
                                onClick={() => { setIsOpen(false); onOpenAdmin(); }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-purple-400 dark:text-purple-600 hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors text-left"
                            >
                                <Users className="w-4 h-4" />
                                <span>Admin Panel</span>
                            </button>
                        </>
                    )}
                    <div className="border-t border-gray-700 dark:border-gray-300"></div>
                    <button
                        onClick={handleLogoutClick}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-400 dark:text-red-600 hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors text-left"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Wyloguj</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserDropdown;
