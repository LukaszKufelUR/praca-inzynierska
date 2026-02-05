import React, { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

const SavePredictionModal = ({ isOpen, onClose, onSave, defaultName, isSaving }) => {
    const [customName, setCustomName] = useState('');

    const handleSave = () => {
        onSave(customName.trim() || null);
        setCustomName('');
    };

    const handleClose = () => {
        setCustomName('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl w-full max-w-md border border-gray-700 shadow-2xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Zapisz Prognozę</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Nazwa prognozy (opcjonalnie)
                        </label>
                        <input
                            type="text"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            placeholder={defaultName}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            maxLength={100}
                            autoFocus
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Zostaw puste dla domyślnej nazwy: <span className="text-gray-400 font-medium">"{defaultName}"</span>
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleClose}
                            disabled={isSaving}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-all"
                        >
                            Anuluj
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Zapisywanie...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Zapisz
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SavePredictionModal;
