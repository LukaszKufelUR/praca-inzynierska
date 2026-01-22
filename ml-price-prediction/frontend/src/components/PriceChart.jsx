import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ReferenceArea, ReferenceLine } from 'recharts';
import InfoTooltip from './InfoTooltip';

const PriceChart = ({ historicalData, prophetPredictions, lstmPredictions, indicators, assetName, historicalDataRange = 0, setHistoricalDataRange, trainingStartDate }) => {
    const [showBollinger, setShowBollinger] = useState(false);
    const [visibleLines, setVisibleLines] = useState({
        historical: true,
        prophet: true,
        lstm: true
    });

    const combineData = () => {
        let filteredHistoricalData = historicalData;
        if (historicalDataRange > 0 && historicalData.length > 0) {
            const lastDate = new Date(historicalData[historicalData.length - 1].Date);
            const cutoffDate = new Date(lastDate);
            cutoffDate.setDate(cutoffDate.getDate() - historicalDataRange);

            filteredHistoricalData = historicalData.filter(item => {
                const itemDate = new Date(item.Date);
                return itemDate >= cutoffDate;
            });
        }

        const indicatorMap = new Map();
        if (indicators) {
            indicators.forEach(item => {
                indicatorMap.set(item.Date, item);
            });
        }

        const historical = filteredHistoricalData.map(item => {
            const ind = indicatorMap.get(item.Date) || {};
            return {
                date: item.Date,
                actual: item.Close,
                prophet: null,
                lstm: null,
                bbUpper: ind.BB_Upper,
                bbMiddle: ind.BB_Middle,
                bbLower: ind.BB_Lower
            };
        });

        const prophetData = prophetPredictions.map(item => ({
            date: item.ds,
            actual: null,
            prophet: item.yhat,
            prophetLower: item.yhat_lower,
            prophetUpper: item.yhat_upper,
            lstm: null
        }));

        const combinedPredictions = prophetData.map((item, index) => {
            const lstmItem = lstmPredictions && lstmPredictions[index];
            return {
                ...item,
                lstm: lstmItem ? lstmItem.yhat : null
            };
        });

        return [...historical, ...combinedPredictions];
    };

    const chartData = useMemo(() => combineData(), [historicalData, prophetPredictions, lstmPredictions, indicators, historicalDataRange]);

    const [left, setLeft] = useState(0);
    const [right, setRight] = useState(chartData.length - 1);
    const [refAreaLeft, setRefAreaLeft] = useState('');
    const [refAreaRight, setRefAreaRight] = useState('');

    const toggleLine = (line) => {
        setVisibleLines(prev => ({
            ...prev,
            [line]: !prev[line]
        }));
    };

    useEffect(() => {
        setLeft(0);
        setRight(chartData.length - 1);
        setRefAreaLeft('');
        setRefAreaRight('');
    }, [chartData.length]);

    const zoom = () => {
        if (refAreaLeft === refAreaRight || refAreaRight === '') {
            setRefAreaLeft('');
            setRefAreaRight('');
            return;
        }

        const leftIndex = chartData.findIndex(d => d.date === refAreaLeft);
        const rightIndex = chartData.findIndex(d => d.date === refAreaRight);

        if (leftIndex === -1 || rightIndex === -1) {
            setRefAreaLeft('');
            setRefAreaRight('');
            return;
        }

        let leftVal = Math.min(leftIndex, rightIndex);
        let rightVal = Math.max(leftIndex, rightIndex);

        setRefAreaLeft('');
        setRefAreaRight('');
        setLeft(leftVal);
        setRight(rightVal);
    };

    const zoomOut = () => {
        setLeft(0);
        setRight(chartData.length - 1);
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
        <div className="bg-gray-800/50 dark:bg-gray-100 backdrop-blur-sm rounded-xl p-6 border border-gray-700 dark:border-gray-300 shadow-2xl select-none">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white dark:text-gray-900 flex items-center gap-2">
                    <span className="text-primary-400">📈</span>
                    {assetName} - Prognoza Cen
                    <InfoTooltip text="Wykres przedstawia historyczne ceny zamknięcia oraz przewidywania wygenerowane przez modele AI na przyszłość. Możesz zaznaczyć obszar na wykresie, aby go przybliżyć." />
                </h3>
                <div className="flex gap-1 items-center">
                    <button
                        onClick={zoomOut}
                        className="px-3 py-1 rounded text-sm font-medium bg-gray-700 dark:bg-gray-200 text-white dark:text-gray-900 hover:bg-gray-600 dark:hover:bg-gray-300 transition-colors flex items-center gap-1"
                    >
                        <span>🔍</span> Resetuj Zoom
                    </button>
                    <InfoTooltip text="Wstęgi Bollingera pokazują zmienność rynku. Cena zazwyczaj porusza się wewnątrz wstęg. Wyjście poza nie może sugerować odwrócenie trendu." />
                    <button
                        onClick={() => setShowBollinger(!showBollinger)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${showBollinger ? 'bg-blue-600 text-white' : 'bg-gray-700 dark:bg-gray-200 text-gray-300 dark:text-gray-700 hover:bg-gray-600 dark:hover:bg-gray-300'}`}
                    >
                        {showBollinger ? 'Ukryj Wstęgi Bollingera' : 'Pokaż Wstęgi Bollingera'}
                    </button>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={400}>
                <LineChart
                    data={chartData.slice(left, right + 1)}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel)}
                    onMouseMove={(e) => e && refAreaLeft && setRefAreaRight(e.activeLabel)}
                    onMouseUp={zoom}
                >
                    <defs>
                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorProphet" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorLSTM" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ffc658" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#ffc658" stopOpacity={0} />
                        </linearGradient>
                    </defs>
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
                    < YAxis
                        stroke="#9ca3af"
                        tick={{ fill: '#9ca3af' }}
                        tickFormatter={(value) => `$${value.toFixed(0)}`}
                    />
                    < Tooltip content={< CustomTooltip />} />
                    < Legend
                        wrapperStyle={{ color: '#fff' }}
                        iconType="line"
                    />

                    {showBollinger && (
                        <>
                            <Area type="monotone" dataKey="bbUpper" stroke="none" fill="#60a5fa" fillOpacity={0.1} />
                            <Area type="monotone" dataKey="bbLower" stroke="none" fill="#60a5fa" fillOpacity={0.1} />
                            <Line type="monotone" dataKey="bbMiddle" stroke="#60a5fa" strokeWidth={1} dot={false} strokeDasharray="3 3" name="Średnia BB" />
                            <Line type="monotone" dataKey="bbUpper" stroke="#60a5fa" strokeWidth={1} dot={false} strokeOpacity={0.3} name="Górna Wstęga" />
                            <Line type="monotone" dataKey="bbLower" stroke="#60a5fa" strokeWidth={1} dot={false} strokeOpacity={0.3} name="Dolna Wstęga" />
                        </>
                    )}

                    {
                        visibleLines.historical && (
                            <Line
                                type="monotone"
                                dataKey="actual"
                                stroke="#8884d8"
                                strokeWidth={2}
                                dot={false}
                                name="Dane Historyczne"
                                connectNulls
                            />
                        )
                    }
                    {
                        visibleLines.prophet && (
                            <Line
                                type="monotone"
                                dataKey="prophet"
                                stroke="#82ca9d"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                                name="Prognoza Prophet"
                                connectNulls
                            />
                        )
                    }
                    {
                        visibleLines.lstm && (
                            <Line
                                type="monotone"
                                dataKey="lstm"
                                stroke="#ffc658"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                                name="Prognoza LSTM"
                                connectNulls
                            />
                        )
                    }

                    {
                        refAreaLeft && refAreaRight && (
                            <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="#6366f1" fillOpacity={0.3} />
                        )
                    }
                    {trainingStartDate && historicalData && historicalData.length > 0 && (
                        <>
                            <ReferenceArea
                                x1={trainingStartDate}
                                x2={historicalData[historicalData.length - 1].Date}
                                fill="#a5b4fc"
                                fillOpacity={0.06}
                            />
                            <ReferenceLine
                                x={trainingStartDate}
                                stroke="#818cf8"
                                strokeDasharray="3 3"
                                label={{
                                    value: "Początek trenowania modelu",
                                    position: 'insideTopLeft',
                                    fill: '#818cf8',
                                    fontSize: 12,
                                    fontWeight: 500
                                }}
                            />
                        </>
                    )}
                </LineChart >
            </ResponsiveContainer >

            <div className="mt-4 flex gap-4 text-sm text-gray-400 select-none">
                <div
                    onClick={() => toggleLine('historical')}
                    className={`flex items-center gap-2 cursor-pointer transition-opacity ${visibleLines.historical ? 'opacity-100' : 'opacity-40'}`}
                >
                    <div className="w-4 h-0.5 bg-blue-500"></div>
                    <span>Dane Historyczne</span>
                </div>
                <div
                    onClick={() => toggleLine('prophet')}
                    className={`flex items-center gap-2 cursor-pointer transition-opacity ${visibleLines.prophet ? 'opacity-100' : 'opacity-40'}`}
                >
                    <div className="w-4 h-0.5 bg-green-500 border-dashed"></div>
                    <span>Prophet (Szeregi Czasowe)</span>
                </div>
                <div
                    onClick={() => toggleLine('lstm')}
                    className={`flex items-center gap-2 cursor-pointer transition-opacity ${visibleLines.lstm ? 'opacity-100' : 'opacity-40'}`}
                >
                    <div className="w-4 h-0.5 bg-yellow-500 border-dashed"></div>
                    <span>LSTM (Sieć Neuronowa)</span>
                </div>
            </div>
        </div >
    );
};

export default PriceChart;
