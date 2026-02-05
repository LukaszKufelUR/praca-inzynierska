import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, Search } from 'lucide-react';
import InfoTooltip from './InfoTooltip';
import { api } from '../services/api';

const calculateCorrelation = (x, y) => {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
};

const CorrelationComparison = ({ data }) => {
    const assets = data?.assets || [];
    const matrixData = data?.matrix || [];

    const [asset1, setAsset1] = useState('');
    const [asset2, setAsset2] = useState('');
    const [correlation, setCorrelation] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(false);

    const [searchQuery1, setSearchQuery1] = useState('');
    const [searchQuery2, setSearchQuery2] = useState('');
    const [searchResults1, setSearchResults1] = useState([]);
    const [searchResults2, setSearchResults2] = useState([]);
    const [isSearching1, setIsSearching1] = useState(false);
    const [isSearching2, setIsSearching2] = useState(false);
    const [showDropdown1, setShowDropdown1] = useState(false);
    const [showDropdown2, setShowDropdown2] = useState(false);
    const [selectedAssetName1, setSelectedAssetName1] = useState('');
    const [selectedAssetName2, setSelectedAssetName2] = useState('');

    const [showResult, setShowResult] = useState(false);

    useEffect(() => {
        setShowResult(false);
        setCorrelation(null);
        setChartData([]);
    }, [asset1, asset2]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery1.length >= 2) {
                setIsSearching1(true);
                try {
                    const apiResults = await api.searchAssets(searchQuery1);
                    const query = searchQuery1.toLowerCase();
                    const localMatches = assets.filter(asset =>
                        asset.name.toLowerCase().includes(query) ||
                        asset.symbol.toLowerCase().includes(query)
                    );
                    const apiSymbols = new Set(apiResults.map(a => a.symbol));
                    const uniqueLocalMatches = localMatches.filter(a => !apiSymbols.has(a.symbol));
                    setSearchResults1([...uniqueLocalMatches, ...apiResults]);
                } catch (error) {
                    const query = searchQuery1.toLowerCase();
                    const localMatches = assets.filter(asset =>
                        asset.name.toLowerCase().includes(query) ||
                        asset.symbol.toLowerCase().includes(query)
                    );
                    setSearchResults1(localMatches);
                } finally {
                    setIsSearching1(false);
                }
            } else {
                setSearchResults1([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery1, assets]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery2.length >= 2) {
                setIsSearching2(true);
                try {
                    const apiResults = await api.searchAssets(searchQuery2);
                    const query = searchQuery2.toLowerCase();
                    const localMatches = assets.filter(asset =>
                        asset.name.toLowerCase().includes(query) ||
                        asset.symbol.toLowerCase().includes(query)
                    );
                    const apiSymbols = new Set(apiResults.map(a => a.symbol));
                    const uniqueLocalMatches = localMatches.filter(a => !apiSymbols.has(a.symbol));
                    setSearchResults2([...uniqueLocalMatches, ...apiResults]);
                } catch (error) {
                    const query = searchQuery2.toLowerCase();
                    const localMatches = assets.filter(asset =>
                        asset.name.toLowerCase().includes(query) ||
                        asset.symbol.toLowerCase().includes(query)
                    );
                    setSearchResults2(localMatches);
                } finally {
                    setIsSearching2(false);
                }
            } else {
                setSearchResults2([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery2, assets]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.relative')) {
                setShowDropdown1(false);
                setShowDropdown2(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectAsset1 = (asset) => {
        setAsset1(asset.symbol);
        setSearchQuery1(asset.name);
        setSelectedAssetName1(asset.name);
        setShowDropdown1(false);
    };

    const handleSelectAsset2 = (asset) => {
        setAsset2(asset.symbol);
        setSearchQuery2(asset.name);
        setSelectedAssetName2(asset.name);
        setShowDropdown2(false);
    };

    const popularAssets = [
        { symbol: '^GSPC', name: 'S&P 500', type: 'index' },
        { symbol: '^IXIC', name: 'NASDAQ', type: 'index' },
        { symbol: 'BTC-USD', name: 'Bitcoin', type: 'crypto' },
        { symbol: 'ETH-USD', name: 'Ethereum', type: 'crypto' },
        { symbol: 'GC=F', name: 'Gold', type: 'commodity' },
    ];

    const handleCalculate = async () => {
        if (!asset1 || !asset2 || !matrixData.length) return;

        setLoading(true);
        setShowResult(true);

        const found = matrixData.find(
            item => (item.x === asset1 && item.y === asset2) || (item.x === asset2 && item.y === asset1)
        );
        setCorrelation(found ? found.value : null);

        try {
            const [data1Response, data2Response] = await Promise.all([
                fetch(`http://localhost:8000/api/data/${asset1}`),
                fetch(`http://localhost:8000/api/data/${asset2}`)
            ]);

            const response1 = await data1Response.json();
            const response2 = await data2Response.json();

            const data1 = response1?.data || [];
            const data2 = response2?.data || [];

            if (!data1.length || !data2.length) {
                setLoading(false);
                return;
            }

            const data2Map = new Map(data2.map(item => [item.Date, item]));

            const combined = data1.map((item, index) => {
                const item2 = data2Map.get(item.Date);
                const val1 = item.Close;
                const val2 = item2 ? item2.Close : null;

                let rollingCorr = null;

                return {
                    date: item.Date,
                    [asset1]: val1,
                    [asset2]: val2,
                    correlation: null
                };
            });

            const alignedData = [];

            const allDates = new Set([...data1.map(d => d.Date), ...data2.map(d => d.Date)]);
            const sortedDates = Array.from(allDates).sort();

            const data1Map = new Map(data1.map(item => [item.Date, item]));

            const finalCombined = sortedDates.map((date, index) => {
                const item1 = data1Map.get(date);
                const item2 = data2Map.get(date);

                const val1 = item1 ? item1.Close : null;
                const val2 = item2 ? item2.Close : null;

                let rollingCorr = null;
                if (index >= 29) {
                    const windowDates = sortedDates.slice(index - 29, index + 1);
                    const window1 = [];
                    const window2 = [];

                    windowDates.forEach(d => {
                        const i1 = data1Map.get(d);
                        const i2 = data2Map.get(d);
                        if (i1 && i2) {
                            window1.push(i1.Close);
                            window2.push(i2.Close);
                        }
                    });

                    if (window1.length >= 10) {
                        rollingCorr = calculateCorrelation(window1, window2);
                    }
                }

                return {
                    date: date,
                    [asset1]: val1,
                    [asset2]: val2,
                    correlation: rollingCorr
                };
            });

            setChartData(finalCombined);
        } catch (error) {
            console.error('Error fetching chart data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (assets.length === 0) return null;

    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload || !payload.length) return null;

        const data = payload[0].payload;
        const asset1Name = selectedAssetName1 || assets.find(a => a.symbol === asset1)?.name || asset1;
        const asset2Name = selectedAssetName2 || assets.find(a => a.symbol === asset2)?.name || asset2;

        return (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
                <p className="text-gray-400 text-xs mb-2">{data.date}</p>
                <p className="text-blue-400 text-sm font-semibold">
                    {asset1Name}: {data[asset1] !== null ? `$${Number(data[asset1]).toFixed(2)}` : 'Brak danych'}
                </p>
                <p className="text-green-400 text-sm font-semibold">
                    {asset2Name}: {data[asset2] !== null ? `$${Number(data[asset2]).toFixed(2)}` : 'Brak danych'}
                </p>
                {data.correlation !== null && (
                    <p className="text-indigo-400 text-sm font-semibold mt-2 pt-2 border-t border-gray-700">
                        Korelacja (30 dni): {data.correlation.toFixed(2)}
                    </p>
                )}
            </div>
        );
    };

    const getCorrelationLabel = (value) => {
        if (value === null) return { text: 'Brak danych', color: 'text-gray-400' };
        if (value > 0.7) return { text: 'Bardzo silna pozytywna', color: 'text-emerald-400' };
        if (value > 0.3) return { text: 'Umiarkowana pozytywna', color: 'text-green-400' };
        if (value > -0.3) return { text: 'Słaba / Neutralna', color: 'text-gray-400' };
        if (value > -0.7) return { text: 'Umiarkowana negatywna', color: 'text-orange-400' };
        return { text: 'Bardzo silna negatywna', color: 'text-red-400' };
    };

    const label = getCorrelationLabel(correlation);

    return (
        <div className="bg-gray-800/50 dark:bg-gray-100 backdrop-blur-sm rounded-xl p-6 border border-gray-700 dark:border-gray-200 shadow-xl">
            <h3 className="text-xl font-bold text-white dark:text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-indigo-400">🔗</span>
                Porównaj Korelację Aktywów
                <InfoTooltip text="Wybierz dwa aktywa, aby zobaczyć, jak silnie są ze sobą skorelowane. Korelacja 1.00 oznacza, że poruszają się identycznie, -1.00 to ruch w przeciwnych kierunkach." />
            </h3>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 dark:text-gray-700 mb-2">
                    Popularne Aktywa
                </label>
                <div className="flex flex-wrap gap-2">
                    {popularAssets.map((asset) => (
                        <button
                            key={asset.symbol}
                            onClick={() => {
                                if (!asset1) {
                                    handleSelectAsset1(asset);
                                } else if (!asset2) {
                                    handleSelectAsset2(asset);
                                } else {
                                    handleSelectAsset1(asset);
                                }
                            }}
                            className="px-3 py-1.5 bg-gray-700 dark:bg-gray-200 hover:bg-gray-600 dark:hover:bg-gray-300 text-white dark:text-gray-900 text-sm rounded-lg transition-colors"
                        >
                            {asset.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-300 dark:text-gray-700 mb-2">
                        Pierwsze Aktywo
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery1}
                            onChange={(e) => {
                                setSearchQuery1(e.target.value);
                                setShowDropdown1(true);
                            }}
                            onFocus={() => setShowDropdown1(true)}
                            placeholder="Szukaj aktywa..."
                            className="w-full bg-gray-700 dark:bg-gray-100 border border-gray-600 dark:border-gray-300 rounded-lg pl-10 pr-3 py-2 text-white dark:text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        />
                        {isSearching1 && (
                            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                        )}
                    </div>

                    {showDropdown1 && searchResults1.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-gray-700 dark:bg-white border border-gray-600 dark:border-gray-300 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                            {searchResults1.map((asset) => (
                                <button
                                    key={asset.symbol}
                                    onClick={() => handleSelectAsset1(asset)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-600 dark:hover:bg-gray-100 text-white dark:text-gray-900 text-sm transition-colors"
                                >
                                    <div className="font-medium">{asset.name}</div>
                                    <div className="text-xs text-gray-400 dark:text-gray-600">{asset.symbol}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="relative">
                    <label className="block text-sm font-medium text-gray-300 dark:text-gray-700 mb-2">
                        Drugie Aktywo
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery2}
                            onChange={(e) => {
                                setSearchQuery2(e.target.value);
                                setShowDropdown2(true);
                            }}
                            onFocus={() => setShowDropdown2(true)}
                            placeholder="Szukaj aktywa..."
                            className="w-full bg-gray-700 dark:bg-gray-100 border border-gray-600 dark:border-gray-300 rounded-lg pl-10 pr-3 py-2 text-white dark:text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        />
                        {isSearching2 && (
                            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                        )}
                    </div>

                    {showDropdown2 && searchResults2.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-gray-700 dark:bg-white border border-gray-600 dark:border-gray-300 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                            {searchResults2.map((asset) => (
                                <button
                                    key={asset.symbol}
                                    onClick={() => handleSelectAsset2(asset)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-600 dark:hover:bg-gray-100 text-white dark:text-gray-900 text-sm transition-colors"
                                >
                                    <div className="font-medium">{asset.name}</div>
                                    <div className="text-xs text-gray-400 dark:text-gray-600">{asset.symbol}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-center mb-6">
                <button
                    onClick={handleCalculate}
                    disabled={!asset1 || !asset2 || loading}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:bg-gray-300 dark:disabled:text-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Obliczanie...
                        </>
                    ) : (
                        <>
                            Porównaj
                        </>
                    )}
                </button>
            </div>

            {
                showResult && correlation !== null && (
                    <div className="bg-gray-900/50 dark:bg-gray-100 rounded-lg p-4 border border-gray-700 dark:border-gray-300 mb-6">
                        <div className="text-center">
                            <p className="text-gray-400 dark:text-gray-600 text-xs mb-1">Korelacja między</p>
                            <p className="text-white dark:text-gray-900 font-semibold text-sm mb-3">
                                {selectedAssetName1 || assets.find(a => a.symbol === asset1)?.name || asset1} ↔ {selectedAssetName2 || assets.find(a => a.symbol === asset2)?.name || asset2}
                            </p>
                            <div className="flex items-center justify-center gap-4">
                                <span className="text-4xl font-bold text-white dark:text-gray-900">{correlation.toFixed(2)}</span>
                                <div className="text-left">
                                    <p className={`text-base font-semibold ${label.color}`}>{label.text}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-600">Zakres: -1.00 do 1.00</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                loading && (
                    <div className="bg-gray-900/50 dark:bg-gray-100 rounded-lg p-8 border border-gray-700 dark:border-gray-300 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mr-2" />
                        <span className="text-gray-400">Ładowanie wykresu...</span>
                    </div>
                )
            }

            {
                showResult && !loading && chartData.length > 0 && (
                    <div className="bg-gray-900/50 dark:bg-gray-100 rounded-lg p-4 border border-gray-700 dark:border-gray-300">
                        <h4 className="text-sm font-semibold text-white dark:text-gray-900 mb-3">Porównanie Historycznych Cen</h4>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#9ca3af"
                                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                                    tickFormatter={(value) => {
                                        const date = new Date(value);
                                        return `${date.getMonth() + 1}/${date.getDate()}`;
                                    }}
                                />
                                <YAxis
                                    yAxisId="left"
                                    stroke="#8884d8"
                                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    stroke="#82ca9d"
                                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey={asset1}
                                    stroke="#8884d8"
                                    strokeWidth={2}
                                    dot={false}
                                    name={selectedAssetName1 || assets.find(a => a.symbol === asset1)?.name || asset1}
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey={asset2}
                                    stroke="#82ca9d"
                                    strokeWidth={2}
                                    dot={false}
                                    name={selectedAssetName2 || assets.find(a => a.symbol === asset2)?.name || asset2}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )
            }
        </div >
    );
};

export default CorrelationComparison;
