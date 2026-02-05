import React, { useState, useEffect } from 'react';
import { X, Loader2, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';

const VerificationModal = ({ isOpen, onClose, predictionId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [visibleLines, setVisibleLines] = useState({
        historical: true,
        actualFromPrediction: true,
        prophet: true,
        lstm: true
    });

    useEffect(() => {
        if (isOpen && predictionId) {
            loadVerification();
        }
    }, [isOpen, predictionId]);

    const loadVerification = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await api.verifyPrediction(predictionId);
            setData(result);
        } catch (err) {
            setError('Nie udało się zweryfikować prognozy. Spróbuj ponownie później.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const prepareChartData = () => {
        if (!data || !data.prediction) return [];

        const { actual_data, prediction } = data;

        let prophetData = [];
        try {
            const parsed = prediction.prophet_data ? JSON.parse(prediction.prophet_data) : [];
            if (Array.isArray(parsed)) {
                prophetData = parsed;
            } else if (parsed && parsed.predictions && Array.isArray(parsed.predictions)) {
                prophetData = parsed.predictions;
            }
        } catch (e) {
            console.error("Error parsing prophet data", e);
        }

        let lstmData = [];
        try {
            const parsed = prediction.lstm_data ? JSON.parse(prediction.lstm_data) : [];
            if (Array.isArray(parsed)) {
                lstmData = parsed;
            } else if (parsed && parsed.predictions && Array.isArray(parsed.predictions)) {
                lstmData = parsed.predictions;
            }
        } catch (e) {
            console.error("Error parsing lstm data", e);
        }

        const safeActualData = Array.isArray(actual_data) ? actual_data : [];

        const predictionDate = prediction.created_at ? new Date(prediction.created_at).toISOString().split('T')[0] : null;

        const dataMap = new Map();
        safeActualData.forEach(item => {
            if (item && item.Date) {
                const itemDate = item.Date;
                const isPastPrediction = predictionDate && itemDate < predictionDate;

                dataMap.set(item.Date, {
                    date: item.Date,
                    historical: isPastPrediction ? item.Close : null,
                    actualFromPrediction: !isPastPrediction ? item.Close : null
                });
            }
        });

        prophetData.forEach(item => {
            if (item && item.ds) {
                const date = item.ds.split('T')[0];
                if (!dataMap.has(date)) {
                    dataMap.set(date, { date });
                }
                const entry = dataMap.get(date);
                entry.prophet = item.yhat;
            }
        });

        lstmData.forEach(item => {
            if (item && item.ds) {
                const date = item.ds.split('T')[0];
                if (!dataMap.has(date)) {
                    dataMap.set(date, { date });
                }
                const entry = dataMap.get(date);
                entry.lstm = item.yhat;
            }
        });

        return Array.from(dataMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    const chartData = prepareChartData();

    const handleLegendClick = (e) => {
        const { dataKey } = e;
        setVisibleLines(prev => ({
            ...prev,
            [dataKey]: !prev[dataKey]
        }));
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-xl">
                    <p className="text-gray-300 font-semibold mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm">
                            {entry.name}: ${entry.value?.toFixed(2)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-gray-800 dark:bg-white rounded-xl w-full max-w-4xl border border-gray-700 dark:border-gray-200 shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-700 dark:border-gray-200">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                        <h2 className="text-2xl font-bold text-white dark:text-gray-900">Weryfikacja Prognozy</h2>
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
                            <p>Analizowanie danych...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-400">
                            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>{error}</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {data.metrics.prophet && (
                                    <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                                        <h3 className="text-green-400 font-bold mb-3 flex items-center gap-2">
                                            Prophet - Dokładność
                                        </h3>
                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <div>
                                                <p className="text-gray-400">MAE</p>
                                                <p className="text-white font-mono">${data.metrics.prophet.mae.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">RMSE</p>
                                                <p className="text-white font-mono">${data.metrics.prophet.rmse.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">Błąd %</p>
                                                <p className="text-white font-mono">{data.metrics.prophet.mape.toFixed(2)}%</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {data.metrics.lstm && (
                                    <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                                        <h3 className="text-yellow-400 font-bold mb-3 flex items-center gap-2">
                                            LSTM - Dokładność
                                        </h3>
                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <div>
                                                <p className="text-gray-400">MAE</p>
                                                <p className="text-white font-mono">${data.metrics.lstm.mae.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">RMSE</p>
                                                <p className="text-white font-mono">${data.metrics.lstm.rmse.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">Błąd %</p>
                                                <p className="text-white font-mono">{data.metrics.lstm.mape.toFixed(2)}%</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-gray-900/50 dark:bg-gray-100 rounded-lg p-4 border border-gray-700 dark:border-gray-300 h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#9ca3af"
                                            tick={{ fill: '#9ca3af' }}
                                            tickFormatter={(value) => {
                                                const date = new Date(value);
                                                return `${date.getMonth() + 1}/${date.getDate()}`;
                                            }}
                                        />
                                        <YAxis
                                            stroke="#9ca3af"
                                            tick={{ fill: '#9ca3af' }}
                                            domain={['auto', 'auto']}
                                            tickFormatter={(value) => `$${value.toFixed(0)}`}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend
                                            wrapperStyle={{ color: '#fff', cursor: 'pointer' }}
                                            onClick={handleLegendClick}
                                        />

                                        <Line
                                            type="monotone"
                                            dataKey="historical"
                                            stroke="#6b7280"
                                            strokeWidth={2}
                                            name="Dane Historyczne"
                                            dot={false}
                                            connectNulls
                                            hide={!visibleLines.historical}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="actualFromPrediction"
                                            stroke="#06b6d4"
                                            strokeWidth={3}
                                            name="Rzeczywista Cena"
                                            dot={false}
                                            connectNulls
                                            hide={!visibleLines.actualFromPrediction}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="prophet"
                                            stroke="#82ca9d"
                                            strokeWidth={2}
                                            strokeDasharray="5 5"
                                            name="Prognoza Prophet"
                                            dot={false}
                                            connectNulls
                                            hide={!visibleLines.prophet}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="lstm"
                                            stroke="#ffc658"
                                            strokeWidth={2}
                                            strokeDasharray="5 5"
                                            name="Prognoza LSTM"
                                            dot={false}
                                            connectNulls
                                            hide={!visibleLines.lstm}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerificationModal;
