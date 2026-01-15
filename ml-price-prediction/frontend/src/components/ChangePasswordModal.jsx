import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';

const ChangePasswordModal = ({ isOpen, onClose }) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (newPassword.length < 6) {
            setError('Nowe hasło musi mieć minimum 6 znaków');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Nowe hasła nie są identyczne');
            return;
        }

        setLoading(true);

        try {
            await api.changePassword(oldPassword, newPassword);
            setSuccess(true);
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');

            setTimeout(() => {
                onClose();
                setSuccess(false);
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Nie udało się zmienić hasła');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 dark:bg-white rounded-xl p-6 w-full max-w-md border border-gray-700 dark:border-gray-200 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white dark:text-gray-900">Zmień hasło</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 dark:text-gray-700 mb-2">
                            Aktualne hasło
                        </label>
                        <div className="relative">
                            <input
                                type={showOldPassword ? "text" : "password"}
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                className="w-full bg-gray-700 dark:bg-gray-100 border border-gray-600 dark:border-gray-300 rounded-lg px-4 py-2 pr-10 text-white dark:text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowOldPassword(!showOldPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                            >
                                {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 dark:text-gray-700 mb-2">
                            Nowe hasło
                        </label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-gray-700 dark:bg-gray-100 border border-gray-600 dark:border-gray-300 rounded-lg px-4 py-2 pr-10 text-white dark:text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                            >
                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 dark:text-gray-700 mb-2">
                            Potwierdź nowe hasło
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-gray-700 dark:bg-gray-100 border border-gray-600 dark:border-gray-300 rounded-lg px-4 py-2 pr-10 text-white dark:text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                            >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500 rounded-lg p-3">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-500/10 border border-green-500 rounded-lg p-3">
                            <p className="text-green-400 text-sm">Hasło zostało zmienione!</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Zmieniam...' : 'Zmień hasło'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
