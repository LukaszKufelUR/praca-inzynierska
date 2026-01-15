import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart } from 'recharts';
import InfoTooltip from './InfoTooltip';

const TechnicalAnalysis = ({ data }) => {
    if (!data || data.length === 0) return null;

    const chartData = data.filter(item => item.RSI !== null && item.MACD !== null);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 shadow-xl">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-purple-400">📊</span>
                    RSI (Wskaźnik Siły Względnej)
                    <InfoTooltip text="RSI mierzy prędkość i zmiany ruchów cenowych. Wartości powyżej 70 oznaczają 'wykupienie' (możliwy spadek), a poniżej 30 'wyprzedanie' (możliwy wzrost)." />
                </h4>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                            dataKey="Date"
                            hide
                        />
                        <YAxis
                            domain={[0, 100]}
                            stroke="#9ca3af"
                            tick={{ fill: '#9ca3af' }}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6' }}
                            itemStyle={{ color: '#d1d5db' }}
                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Wykupienie', position: 'insideTopRight', fill: '#ef4444', fontSize: 10 }} />
                        <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Wyprzedanie', position: 'insideBottomRight', fill: '#10b981', fontSize: 10 }} />
                        <Line type="monotone" dataKey="RSI" stroke="#8b5cf6" dot={false} strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 shadow-xl">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-blue-400">📉</span>
                    MACD (Zbieżność/Rozbieżność Średnich)
                    <InfoTooltip text="MACD to wskaźnik śledzący trend. Gdy linia MACD (pomarańczowa) przecina linię sygnałową (czerwona) od dołu, jest to sygnał kupna. Od góry - sygnał sprzedaży." />
                </h4>
                <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                            dataKey="Date"
                            hide
                        />
                        <YAxis
                            stroke="#9ca3af"
                            tick={{ fill: '#9ca3af' }}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6' }}
                            itemStyle={{ color: '#d1d5db' }}
                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Bar dataKey="MACD_Histogram" fill="#60a5fa" opacity={0.5} name="Histogram" />
                        <Line type="monotone" dataKey="MACD" stroke="#f59e0b" dot={false} strokeWidth={2} name="MACD" />
                        <Line type="monotone" dataKey="Signal_Line" stroke="#ef4444" dot={false} strokeWidth={2} name="Sygnał" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TechnicalAnalysis;
