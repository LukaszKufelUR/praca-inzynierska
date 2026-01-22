import React, { useState } from 'react';
import { X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { api } from '../services/api';

const AdminChangePasswordModal = ({ isOpen, onClose, user, onPasswordChanged }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('Hasło musi mieć minimum 6 znaków');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Hasła nie są identyczne');
            return;
        }

        setLoading(true);
        try {
            await api.changeUserPassword(user.id, newPassword);
            setNewPassword('');
            setConfirmPassword('');
            setSuccess(true);

            setTimeout(() => {
                setSuccess(false);
                onPasswordChanged();
                onClose();
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Nie udało się zmienić hasła');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-gray-800 dark:bg-white rounded-xl p-6 w-full max-w-md border border-gray-700 dark:border-gray-200 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white dark:text-gray-900">Zmień hasło użytkownika</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white dark:hover:text-gray-900 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="mb-6 p-3 bg-gray-700/30 dark:bg-gray-100 rounded-lg border border-gray-600 dark:border-gray-300">
                    <p className="text-sm text-gray-400 dark:text-gray-600">Użytkownik</p>
                    <p className="text-white dark:text-gray-900 font-semibold">{user.email}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 dark:text-gray-700 mb-2">
                            Nowe hasło
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-gray-700 dark:bg-gray-100 border border-gray-600 dark:border-gray-300 rounded-lg px-4 py-2 pr-10 text-white dark:text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 dark:text-gray-700 mb-2">
                            Potwierdź nowe hasło
                        </label>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-gray-700 dark:bg-gray-100 border border-gray-600 dark:border-gray-300 rounded-lg px-4 py-2 text-white dark:text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            required
                            minLength={6}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-500/10 border border-green-500 rounded-lg p-3 text-green-400 text-sm">
                            Hasło zostało zmienione pomyślnie!
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-700 dark:bg-gray-200 hover:bg-gray-600 dark:hover:bg-gray-300 text-white dark:text-gray-900 rounded-lg transition-colors"
                        >
                            Anuluj
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Zmień hasło
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminChangePasswordModal;
