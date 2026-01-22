import React, { useState } from 'react';
import { X, Eye, EyeOff, Trash2, AlertTriangle, Shield, Key } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const SettingsModal = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showDeletePassword, setShowDeletePassword] = useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordError('');
            setPasswordSuccess(false);
            setPasswordLoading(false);
            setShowOldPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
            setDeletePassword('');
            setDeleteError('');
            setDeleteLoading(false);
            setShowDeletePassword(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess(false);

        if (newPassword.length < 6) {
            setPasswordError('Nowe hasło musi mieć minimum 6 znaków');
            return;
        }

        if (oldPassword === newPassword) {
            setPasswordError('Nowe hasło musi być różne od aktualnego hasła');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('Nowe hasła nie są identyczne');
            return;
        }

        setPasswordLoading(true);

        try {
            await api.changePassword(oldPassword, newPassword);
            setPasswordSuccess(true);
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');

            setTimeout(() => {
                setPasswordSuccess(false);
            }, 3000);
        } catch (err) {
            setPasswordError(err.response?.data?.detail || 'Nie udało się zmienić hasła');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleDeleteAccount = async (e) => {
        e.preventDefault();
        setDeleteError('');

        if (!deletePassword) {
            setDeleteError('Wprowadź hasło aby potwierdzić usunięcie konta');
            return;
        }

        if (!window.confirm('Czy na pewno chcesz usunąć swoje konto? Tej operacji nie można cofnąć.')) {
            return;
        }

        setDeleteLoading(true);

        try {
            await api.deleteAccount(deletePassword);
            logout(); 
            onClose();
        } catch (err) {
            setDeleteError(err.response?.data?.detail || 'Nie udało się usunąć konta');
            setDeleteLoading(false);
        }
    };

    const handleClose = () => {
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
        setPasswordSuccess(false);
        setDeletePassword('');
        setDeleteError('');
        setDeleteLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 dark:bg-white rounded-xl w-full max-w-lg border border-gray-700 dark:border-gray-200 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700 dark:border-gray-200 sticky top-0 bg-gray-800 dark:bg-white z-10">
                    <h2 className="text-2xl font-bold text-white dark:text-gray-900 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-primary-500" />
                        Ustawienia Konta
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-white dark:hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Change Password Section */}
                    <section>
                        <h3 className="text-lg font-semibold text-white dark:text-gray-900 mb-4 flex items-center gap-2">
                            <Key className="w-5 h-5 text-indigo-400" />
                            Zmiana Hasła
                        </h3>

                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 dark:text-gray-700 mb-1">
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
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 dark:text-gray-700 mb-1">
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
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 dark:text-gray-700 mb-1">
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
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {passwordError && (
                                <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 text-red-400 text-sm">
                                    {passwordError}
                                </div>
                            )}

                            {passwordSuccess && (
                                <div className="bg-green-500/10 border border-green-500 rounded-lg p-3 text-green-400 text-sm">
                                    Hasło zostało zmienione pomyślnie!
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={passwordLoading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {passwordLoading ? 'Zmieniam...' : 'Zmień hasło'}
                            </button>
                        </form>
                    </section>

                    <div className="border-t border-gray-700 dark:border-gray-200"></div>

                    {/* Delete Account Section - Hide for Admins */}
                    {user?.is_admin !== 1 && (
                        <section>
                            <h3 className="text-lg font-semibold text-red-500 mb-2 flex items-center gap-2">
                                <Trash2 className="w-5 h-5" />
                                Usuwanie konta
                            </h3>

                            <p className="text-gray-400 dark:text-gray-600 text-sm mb-4">
                                Ta operacja jest nieodwracalna. Wszystkie Twoje dane, w tym historia prognoz i ulubione aktywa, zostaną trwale usunięte.
                            </p>

                            <form onSubmit={handleDeleteAccount} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 dark:text-gray-700 mb-1">
                                        Wpisz hasło, aby potwierdzić usunięcie konta
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showDeletePassword ? "text" : "password"}
                                            value={deletePassword}
                                            onChange={(e) => setDeletePassword(e.target.value)}
                                            className="w-full bg-gray-700 dark:bg-gray-100 border border-gray-600 dark:border-gray-300 rounded-lg px-4 py-2 pr-10 text-white dark:text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowDeletePassword(!showDeletePassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showDeletePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {deleteError && (
                                    <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 text-red-400 text-sm">
                                        {deleteError}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={deleteLoading}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {deleteLoading ? 'Usuwanie...' : 'Usuń konto'}
                                </button>
                            </form>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
