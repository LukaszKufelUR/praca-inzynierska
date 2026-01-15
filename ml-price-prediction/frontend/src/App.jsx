import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { TrendingUp, Loader2, AlertCircle, BarChart3, User, Save, Wallet, Activity, FileText } from 'lucide-react';
import { api } from './services/api';
import PriceChart from './components/PriceChart';
import MetricsPanel from './components/MetricsPanel';
import TechnicalAnalysis from './components/TechnicalAnalysis';
import CorrelationComparison from './components/CorrelationMatrix';
import InfoTooltip from './components/InfoTooltip';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AuthModal from './components/AuthModal';
import UserDropdown from './components/UserDropdown';
import ChangePasswordModal from './components/ChangePasswordModal';
import FavoriteButton from './components/FavoriteButton';
import PredictionHistoryModal from './components/PredictionHistoryModal';
import SavePredictionModal from './components/SavePredictionModal';
import Sidebar from './components/Sidebar';
import AdminPanel from './components/AdminPanel';


function AppContent() {
    const { user, logout, isAuthenticated } = useAuth();
    const [assets, setAssets] = useState([]);
    const [selectedAsset, setSelectedAsset] = useState('');
    const [predictionPeriod, setPredictionPeriod] = useState(30);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [predictionData, setPredictionData] = useState(null);
    const [correlationData, setCorrelationData] = useState(null);
    const [indicators, setIndicators] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [favorites, setFavorites] = useState([]);
    const [savingPrediction, setSavingPrediction] = useState(false);
    const [historicalDataRange, setHistoricalDataRange] = useState(90);

    useEffect(() => {
        loadAssets();
        loadCorrelation();
        if (isAuthenticated) {
            loadFavorites();
            loadUserSettings();
        }
    }, [isAuthenticated]);

    const loadAssets = async () => {
        try {
            const data = await api.getAssets();
            setAssets(data);
            if (data.length > 0) {
                setSelectedAsset(data[0].symbol);
            }
        } catch (err) {
            setError('Nie udało się pobrać listy aktywów');
        }
    };

    const loadCorrelation = async () => {
        try {
            const data = await api.getCorrelation();
            setCorrelationData(data);
        } catch (err) {
            console.error("Failed to load correlation matrix", err);
        }
    };

    const loadFavorites = async () => {
        try {
            const data = await api.getFavorites();
            setFavorites(data.map(f => f.asset_symbol));
        } catch (err) {
            console.error('Failed to load favorites', err);
        }
    };

    const loadUserSettings = async () => {
        try {
            const settings = await api.getSettings();
            setPredictionPeriod(settings.default_prediction_period);
        } catch (err) {
            console.error('Failed to load settings', err);
        }
    };

    const handleToggleFavorite = async (symbol) => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }

        try {
            if (favorites.includes(symbol)) {
                await api.removeFavorite(symbol);
                setFavorites(favorites.filter(s => s !== symbol));
            } else {
                await api.addFavorite(symbol);
                setFavorites([...favorites, symbol]);
            }
        } catch (err) {
            console.error('Failed to toggle favorite', err);
        }
    };

    const handleSavePrediction = async (customName = null) => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }

        if (!predictionData) return;

        setSavingPrediction(true);
        try {
            await api.savePrediction({
                asset_symbol: selectedAsset,
                asset_name: selectedAssetInfo?.name || selectedAsset,
                custom_name: customName,
                prediction_period: predictionPeriod,
                prophet_data: JSON.stringify(predictionData.prophet),
                lstm_data: JSON.stringify(predictionData.lstm)
            });
            alert('Prognoza została zapisana!');
            setShowSaveModal(false);
        } catch (err) {
            console.error('Failed to save prediction', err);
            alert('Nie udało się zapisać prognozy');
        } finally {
            setSavingPrediction(false);
        }
    };

    const handleLoadPrediction = (historyItem) => {
        try {
            const prophetData = JSON.parse(historyItem.prophet_data);
            const lstmData = JSON.parse(historyItem.lstm_data);

            setSelectedAsset(historyItem.asset_symbol);
            setPredictionPeriod(historyItem.prediction_period);
            setPredictionData({
                name: historyItem.asset_name,
                prophet: prophetData,
                lstm: lstmData,
                historical_data: []
            });

            api.getHistoricalData(historyItem.asset_symbol).then(response => {
                setPredictionData(prev => ({
                    ...prev,
                    historical_data: response.data
                }));
            });

            api.getIndicators(historyItem.asset_symbol).then(data => {
                setIndicators(data.indicators);
            });

            setShowHistoryModal(false);
        } catch (err) {
            console.error('Failed to load prediction', err);
            alert('Nie udało się załadować prognozy');
        }
    };

    const generatePredictionReport = () => {
        if (!predictionData) return;

        const reportDate = new Date().toLocaleString('pl-PL');
        const prophetMetrics = predictionData.prophet?.metrics || {};
        const lstmMetrics = predictionData.lstm?.metrics || {};

        const historicalData = predictionData.historical_data || [];
        let filteredHistoricalData = historicalData;

        if (historicalDataRange > 0 && historicalData.length > 0) {
            const lastDate = new Date(historicalData[historicalData.length - 1].Date);
            const cutoffDate = new Date(lastDate);
            cutoffDate.setDate(cutoffDate.getDate() - historicalDataRange);

            filteredHistoricalData = historicalData.filter(d => {
                const itemDate = new Date(d.Date);
                return itemDate >= cutoffDate;
            });
        }

        const htmlContent = `
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Raport Prognozy - ${predictionData.name}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 { font-size: 32px; margin-bottom: 10px; font-weight: 600; }
        .header p { opacity: 0.9; font-size: 14px; }
        .content { padding: 40px; }
        .asset-info {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 30px;
        }
        .asset-name { font-size: 24px; font-weight: 700; margin-bottom: 5px; }
        .asset-symbol { font-size: 14px; opacity: 0.9; }
        .section-title {
            font-size: 20px;
            color: #667eea;
            margin: 30px 0 15px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
            font-weight: 600;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .metric-title {
            font-size: 14px;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 10px;
        }
        .metric-value {
            font-size: 24px;
            color: #212529;
            font-weight: 700;
        }
        .model-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .model-name {
            font-size: 18px;
            font-weight: 600;
            color: #667eea;
            margin-bottom: 15px;
        }
        .metric-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #dee2e6;
        }
        .metric-row:last-child { border-bottom: none; }
        .metric-label { color: #6c757d; }
        .metric-val { font-weight: 600; color: #212529; }
        .footer {
            text-align: center;
            padding: 20px;
            color: #6c757d;
            font-size: 12px;
            border-top: 1px solid #dee2e6;
        }
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📈 Raport Prognozy Cen</h1>
            <p>Giełdomat - System Prognozowania Cen</p>
            <p style="margin-top: 10px; font-size: 12px;">Wygenerowano: ${reportDate}</p>
        </div>
        
        <div class="content">
            <div class="asset-info">
                <div class="asset-name">${selectedAssetInfo.name}</div>
                <div class="asset-symbol">Symbol: ${selectedAssetInfo.symbol} | Typ: ${selectedAssetInfo.type === 'crypto' ? 'Kryptowaluta' : selectedAssetInfo.type === 'stock' ? 'Akcje' : 'Indeks'}</div>
                <div style="margin-top: 15px; font-size: 14px;">Okres prognozy: ${predictionPeriod} dni</div>
            </div>

            <h2 class="section-title">Wykres Prognozy</h2>
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <canvas id="predictionChart"></canvas>
            </div>

            <h2 class="section-title">Podsumowanie Metryk</h2>
            
            <div class="model-section">
                <div class="model-name">🔮 Model Prophet</div>
                <div class="metric-row">
                    <span class="metric-label">MAE (Mean Absolute Error)</span>
                    <span class="metric-val">${(prophetMetrics.mae || 0).toFixed(2)}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">RMSE (Root Mean Square Error)</span>
                    <span class="metric-val">${(prophetMetrics.rmse || 0).toFixed(2)}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">MAPE (Mean Absolute Percentage Error)</span>
                    <span class="metric-val">${(prophetMetrics.mape || 0).toFixed(2)}%</span>
                </div>
            </div>

            <div class="model-section">
                <div class="model-name">🤖 Model LSTM</div>
                <div class="metric-row">
                    <span class="metric-label">MAE (Mean Absolute Error)</span>
                    <span class="metric-val">${(lstmMetrics.mae || 0).toFixed(2)}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">RMSE (Root Mean Square Error)</span>
                    <span class="metric-val">${(lstmMetrics.rmse || 0).toFixed(2)}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">MAPE (Mean Absolute Percentage Error)</span>
                    <span class="metric-val">${(lstmMetrics.mape || 0).toFixed(2)}%</span>
                </div>
            </div>

            <h2 class="section-title">Interpretacja Wyników</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; line-height: 1.6;">
                <p><strong>MAE (Mean Absolute Error):</strong> Średni błąd bezwzględny - im niższa wartość, tym lepiej.</p>
                <p style="margin-top: 10px;"><strong>RMSE (Root Mean Square Error):</strong> Pierwiastek ze średniego błędu kwadratowego - bardziej karze duże błędy.</p>
                <p style="margin-top: 10px;"><strong>MAPE:</strong> Średni procentowy błąd bezwzględny - pokazuje błąd jako procent rzeczywistej wartości.</p>
            </div>

            <h2 class="section-title">Podsumowanie</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                <p>Raport wygenerowany dla aktywa <strong>${predictionData.name}</strong> (${predictionData.symbol}).</p>
                <p style="margin-top: 10px;">Prognoza obejmuje okres <strong>${predictionPeriod} dni</strong> z wykorzystaniem dwóch modeli uczenia maszynowego:</p>
                <ul style="margin-left: 20px; margin-top: 10px;">
                    <li><strong>Prophet</strong> - model szeregów czasowych od Facebook</li>
                    <li><strong>LSTM</strong> - sieć neuronowa z pamięcią długoterminową</li>
                </ul>
            </div>
        </div>

        <div class="footer">
            <p>© 2025 Giełdomat - System Prognozowania Cen</p>
            <p style="margin-top: 5px;">Ten raport został wygenerowany automatycznie</p>
        </div>
    </div>

    <script>
        const historicalData = ${JSON.stringify(filteredHistoricalData)};
        const prophetPredictions = ${JSON.stringify(predictionData.prophet?.predictions || [])};
        const lstmPredictions = ${JSON.stringify(predictionData.lstm?.predictions || [])};

        const historicalDates = historicalData.map(d => d.Date);
        const historicalPrices = historicalData.map(d => d.Close);
        
        const prophetDates = prophetPredictions.map(d => d.ds);
        const prophetPrices = prophetPredictions.map(d => d.yhat);
        
        const lstmDates = lstmPredictions.map(d => d.ds || d.date);
        const lstmPrices = lstmPredictions.map(d => d.yhat || d.price);

        const allDates = [...historicalDates, ...prophetDates];

        const historicalDataset = [...historicalPrices, ...Array(prophetDates.length).fill(null)];
        const prophetDataset = [...Array(historicalDates.length).fill(null), ...prophetPrices];
        const lstmDataset = [...Array(historicalDates.length).fill(null), ...lstmPrices];

        const ctx = document.getElementById('predictionChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: allDates,
                datasets: [
                    {
                        label: 'Dane Historyczne',
                        data: historicalDataset,
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.1,
                        spanGaps: false
                    },
                    {
                        label: 'Prognoza Prophet',
                        data: prophetDataset,
                        borderColor: 'rgb(153, 102, 255)',
                        backgroundColor: 'rgba(153, 102, 255, 0.1)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        tension: 0.1,
                        spanGaps: false
                    },
                    {
                        label: 'Prognoza LSTM',
                        data: lstmDataset,
                        borderColor: 'rgb(255, 159, 64)',
                        backgroundColor: 'rgba(255, 159, 64, 0.1)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        tension: 0.1,
                        spanGaps: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                plugins: {
                    title: {
                        display: true,
                        text: 'Prognoza Cen - ${selectedAssetInfo.name}',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        type: 'category',
                        title: {
                            display: true,
                            text: 'Data'
                        },
                        ticks: {
                            maxTicksLimit: 15,
                            autoSkip: true
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Cena (USD)'
                        },
                        beginAtZero: false
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    </script>
</body>
</html>
        `.trim();

        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `raport_prognozy_${selectedAssetInfo.symbol}_${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        if (isAuthenticated && predictionPeriod) {
            const saveSettings = async () => {
                try {
                    await api.updateSettings({ default_prediction_period: predictionPeriod });
                } catch (err) {
                    console.error('Failed to save settings', err);
                }
            };
            saveSettings();
        }
    }, [predictionPeriod, isAuthenticated]);

    const handlePredict = async () => {
        if (!selectedAsset) return;

        setLoading(true);
        setError(null);

        try {
            const [predData, indData] = await Promise.all([
                api.getPredictions(selectedAsset, predictionPeriod),
                api.getIndicators(selectedAsset)
            ]);
            setPredictionData(predData);
            setIndicators(indData.indicators);
        } catch (err) {
            setError(err.response?.data?.detail || 'Nie udało się wygenerować prognozy');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const selectedAssetInfo = assets.find(a => a.symbol === selectedAsset);

    return (
        <div className="min-h-screen bg-gray-950 dark:bg-gray-50 text-white dark:text-gray-900 flex">
            {/* Sidebar */}
            <Sidebar
                selectedAsset={selectedAsset}
                onSelect={(asset) => {
                    setSelectedAsset(asset.symbol);
                    if (!assets.find(a => a.symbol === asset.symbol)) {
                        setAssets(prev => [...prev, asset]);
                    }
                }}
                assets={assets}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                isAuthenticated={isAuthenticated}
                onLogin={() => { setAuthMode('login'); setShowAuthModal(true); }}
                onRegister={() => { setAuthMode('register'); setShowAuthModal(true); }}
                onOpenSettings={() => setShowPasswordModal(true)}
                onOpenHistory={() => setShowHistoryModal(true)}
                onOpenAdmin={() => setShowAdminPanel(true)}
            />

            {/* Main Content */}
            <div className="flex-1 ml-80 p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-50 dark:via-white dark:to-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Karta Informacji o Aktywie (Pełna Szerokość) */}
                    {selectedAssetInfo ? (
                        <div className="bg-gray-800/50 dark:bg-white/80 backdrop-blur-sm border border-gray-700 dark:border-gray-200 rounded-2xl p-6 shadow-xl animate-fade-in">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-blue-500/10 dark:bg-blue-500/20 p-2 rounded-lg">
                                    <Wallet className="w-5 h-5 text-blue-500" />
                                </div>
                                <h2 className="text-lg font-semibold text-white dark:text-gray-900">Informacje o Aktywie</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                <div className="bg-gray-700/30 dark:bg-gray-100 rounded-lg p-3">
                                    <span className="text-gray-400 dark:text-gray-600 block mb-1">Symbol</span>
                                    <span className="text-white dark:text-gray-900 font-medium text-lg">{selectedAsset}</span>
                                </div>
                                <div className="bg-gray-700/30 dark:bg-gray-100 rounded-lg p-3 min-w-0">
                                    <span className="text-gray-400 dark:text-gray-600 block mb-1">Nazwa</span>
                                    <span className="text-white dark:text-gray-900 font-medium text-lg break-words block leading-tight">{selectedAssetInfo.name}</span>
                                </div>
                                <div className="bg-gray-700/30 dark:bg-gray-100 rounded-lg p-3">
                                    <span className="text-gray-400 dark:text-gray-600 block mb-1">Typ</span>
                                    <span className="text-white dark:text-gray-900 font-medium">
                                        {selectedAssetInfo.type === 'index' ? 'Indeks Giełdowy' :
                                            selectedAssetInfo.type === 'crypto' ? 'Kryptowaluta' :
                                                selectedAssetInfo.type === 'etf' ? 'Fundusz ETF' :
                                                    'Akcja Giełdowa'}
                                    </span>
                                </div>
                                <div className="bg-gray-700/30 rounded-lg p-3">
                                    <span className="text-gray-400 block mb-1">Źródło Danych</span>
                                    <span className="text-green-400 font-medium flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                        Live API
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 text-center animate-fade-in">
                            <p className="text-gray-400 text-lg">Wybierz aktywo z paska bocznego, aby zobaczyć szczegóły.</p>
                        </div>
                    )}

                    {/* Sekcja Wykresu i Kontroli */}
                    <div className="space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <div className="bg-gray-800/50 dark:bg-white/80 backdrop-blur-sm border border-gray-700 dark:border-gray-200 rounded-2xl p-6 shadow-xl min-h-[500px]">
                            {/* Nagłówek Wykresu ze Zintegrowanymi Kontrolkami */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-500/10 p-2 rounded-lg">
                                        <BarChart3 className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-white dark:text-gray-900">Wykres Cen i Prognoza</h2>
                                </div>
                                {/* Zintegrowane Kontrolki */}
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <select
                                            value={historicalDataRange}
                                            onChange={(e) => setHistoricalDataRange(Number(e.target.value))}
                                            className="appearance-none bg-gray-700 dark:bg-gray-100 border border-gray-600 dark:border-gray-300 rounded-lg pl-4 pr-10 py-2 text-sm text-white dark:text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all cursor-pointer hover:bg-gray-600 dark:hover:bg-gray-200"
                                        >
                                            <option value={30}>30 dni historii</option>
                                            <option value={60}>60 dni historii</option>
                                            <option value={90}>90 dni historii</option>
                                            <option value={180}>180 dni historii</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <select
                                            value={predictionPeriod}
                                            onChange={(e) => setPredictionPeriod(Number(e.target.value))}
                                            className="appearance-none bg-gray-700 dark:bg-gray-100 border border-gray-600 dark:border-gray-300 rounded-lg pl-4 pr-10 py-2 text-sm text-white dark:text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all cursor-pointer hover:bg-gray-600 dark:hover:bg-gray-200"
                                        >
                                            <option value={7}>7 Dni</option>
                                            <option value={14}>14 Dni</option>
                                            <option value={30}>30 Dni</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handlePredict}
                                        disabled={loading || !selectedAsset}
                                        className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-primary-500/20"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Generowanie prognozy...
                                            </>
                                        ) : (
                                            <>
                                                <TrendingUp className="w-4 h-4" />
                                                Generuj
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {error ? (
                                <div className="h-[400px] flex items-center justify-center text-red-400 bg-red-500/5 rounded-xl border border-red-500/10">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5" />
                                        {error}
                                    </div>
                                </div>
                            ) : predictionData ? (
                                <PriceChart
                                    historicalData={predictionData.historical_data}
                                    prophetPredictions={predictionData.prophet.predictions}
                                    lstmPredictions={predictionData.lstm.predictions}
                                    indicators={indicators}
                                    assetName={predictionData.name}
                                    historicalDataRange={historicalDataRange}
                                />
                            ) : (
                                <div className="h-[400px] flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-700 rounded-xl">
                                    <BarChart3 className="w-12 h-12 mb-3 opacity-50" />
                                    <p>Kliknij "Generuj", aby zobaczyć prognozę</p>
                                </div>
                            )}
                        </div>

                        {/* Metryki i Analiza */}
                        {predictionData && (
                            <>
                                <MetricsPanel
                                    prophetMetrics={predictionData.prophet.metrics}
                                    lstmMetrics={predictionData.lstm.metrics}
                                />
                                {indicators && <TechnicalAnalysis indicators={indicators} />}

                                {isAuthenticated && (
                                    <div className="flex justify-center gap-3 pt-4">
                                        <button
                                            onClick={() => setShowSaveModal(true)}
                                            disabled={savingPrediction}
                                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg transition-all shadow-lg"
                                        >
                                            <Save className="w-5 h-5" />
                                            Zapisz Prognozę
                                        </button>
                                        <button
                                            onClick={generatePredictionReport}
                                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-all shadow-lg"
                                        >
                                            <FileText className="w-5 h-5" />
                                            Wygeneruj Raport
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Sekcja Korelacji */}
                    <div className="mt-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white dark:text-gray-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-primary-400" />
                                Korelacja Aktywów
                            </h2>
                        </div>

                        <CorrelationComparison data={correlationData} />
                    </div>


                </div>
            </div>

            {/* Modale */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                initialMode={authMode}
            />
            <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
            <PredictionHistoryModal
                isOpen={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
                onLoadPrediction={handleLoadPrediction}
            />
            <SavePredictionModal
                isOpen={showSaveModal}
                onClose={() => setShowSaveModal(false)}
                onSave={handleSavePrediction}
                defaultName={selectedAssetInfo?.name || selectedAsset}
                isSaving={savingPrediction}
            />
            <AdminPanel
                isOpen={showAdminPanel}
                onClose={() => setShowAdminPanel(false)}
            />
        </div>
    );
}

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
