import React, { useState, useEffect } from 'react';
import { X, Calendar, Trash2, ExternalLink, Loader2, TrendingUp, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import VerificationModal from './VerificationModal';

const PredictionHistoryModal = ({ isOpen, onClose, onLoadPrediction }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [verificationId, setVerificationId] = useState(null);

    useEffect(() => {
        if (isOpen) {
            loadHistory();
        }
    }, [isOpen]);

    const loadHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getPredictionHistory(50);
            setHistory(data);
        } catch (err) {
            setError('Nie udało się pobrać historii prognoz');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Czy na pewno chcesz usunąć tę prognozę?')) return;

        setDeletingId(id);
        try {
            await api.deletePrediction(id);
            setHistory(history.filter(item => item.id !== id));
        } catch (err) {
            console.error('Failed to delete prediction', err);
        } finally {
            setDeletingId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 dark:bg-white rounded-xl w-full max-w-2xl border border-gray-700 dark:border-gray-200 shadow-2xl flex flex-col max-h-[80vh]">
                    <div className="flex items-center justify-between p-6 border-b border-gray-700 dark:border-gray-200">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-6 h-6 text-primary-400" />
                            <h2 className="text-2xl font-bold text-white dark:text-gray-900">Historia Prognoz</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                                <p>Ładowanie historii...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-12 text-red-400">
                                <p>{error}</p>
                                <button
                                    onClick={loadHistory}
                                    className="mt-4 text-sm text-primary-400 hover:text-primary-300 underline"
                                >
                                    Spróbuj ponownie
                                </button>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <p>Brak zapisanych prognoz.</p>
                                <p className="text-sm mt-2">Wygeneruj i zapisz prognozę, aby zobaczyć ją tutaj.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {history.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => onLoadPrediction(item)}
                                        className="bg-gray-700/50 dark:bg-gray-100 hover:bg-gray-700 dark:hover:bg-gray-200 border border-gray-600 dark:border-gray-300 rounded-lg p-4 flex items-center justify-between group cursor-pointer transition-all hover:border-primary-500/50"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="bg-gray-800 dark:bg-white p-3 rounded-lg">
                                                <span className="text-lg font-bold text-white dark:text-gray-900">{item.asset_symbol}</span>
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-200 dark:text-gray-900">{item.custom_name || item.asset_name}</h3>
                                                <div className="flex items-center gap-4 text-sm text-gray-400 dark:text-gray-600 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <span className="bg-gray-600/50 px-2 py-0.5 rounded text-xs">
                                                        {item.prediction_period} dni
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setVerificationId(item.id); }}
                                                className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                                                title="Sprawdź dokładność"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onLoadPrediction(item); }}
                                                className="p-2 text-primary-400 hover:bg-primary-500/20 rounded-lg transition-colors"
                                                title="Załaduj prognozę"
                                            >
                                                <ExternalLink className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(item.id, e)}
                                                disabled={deletingId === item.id}
                                                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                                                title="Usuń prognozę"
                                            >
                                                {deletingId === item.id ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <VerificationModal
                isOpen={!!verificationId}
                onClose={() => setVerificationId(null)}
                predictionId={verificationId}
            />
        </>
    );
};

export default PredictionHistoryModal;
