import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Globe, Bitcoin, Search, Star, Clock, TrendingUp, User, UserPlus, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import UserDropdown from './UserDropdown';
import ThemeToggle from './ThemeToggle';
import MarketMovers from './MarketMovers';

const Sidebar = ({ selectedAsset, onSelect, assets, favorites = [], onToggleFavorite, isAuthenticated, onLogin, onRegister, onOpenSettings, onOpenHistory, onOpenAdmin }) => {
    const [activeTab, setActiveTab] = useState('stock');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const [marketMovers, setMarketMovers] = useState({});
    const [searchPrices, setSearchPrices] = useState({});

    useEffect(() => {
        const fetchMarketData = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/market/movers');
                if (response.ok) {
                    const data = await response.json();
                    if (data.all) {
                        setMarketMovers(data.all);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch sidebar market data", e);
            }
        };

        fetchMarketData();
        const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const [recentSearches, setRecentSearches] = useState([]);

    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse recent searches", e);
            }
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                setIsSearching(true);
                try {
                    const apiResults = await api.searchAssets(searchQuery);

                    const query = searchQuery.toLowerCase();
                    const localMatches = assets.filter(asset =>
                        asset.name.toLowerCase().includes(query) ||
                        asset.symbol.toLowerCase().includes(query)
                    );

                    const apiSymbols = new Set(apiResults.map(a => a.symbol));
                    const uniqueLocalMatches = localMatches.filter(a => !apiSymbols.has(a.symbol));

                    setSearchResults([...uniqueLocalMatches, ...apiResults]);
                } catch (error) {
                    console.error("Search failed", error);
                    const query = searchQuery.toLowerCase();
                    const localMatches = assets.filter(asset =>
                        asset.name.toLowerCase().includes(query) ||
                        asset.symbol.toLowerCase().includes(query)
                    );
                    setSearchResults(localMatches);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, assets]);

    useEffect(() => {
        if (searchResults.length === 0) return;

        const fetchPrices = async () => {
            const missingAssets = searchResults.filter(asset =>
                !marketMovers[asset.symbol] && !searchPrices[asset.symbol]
            );

            if (missingAssets.length === 0) return;

            const toFetch = missingAssets.slice(0, 5);

            const newPrices = {};
            await Promise.all(toFetch.map(async (asset) => {
                try {
                    const response = await api.getHistoricalData(asset.symbol, '5d');
                    if (response && response.data && response.data.length >= 2) {
                        const history = response.data;
                        const current = history[history.length - 1];
                        const prev = history[history.length - 2];

                        if (current && prev && prev.Close > 0) {
                            const change = current.Close - prev.Close;
                            const changePercent = (change / prev.Close) * 100;

                            newPrices[asset.symbol] = {
                                symbol: asset.symbol,
                                price: current.Close,
                                change: changePercent,
                                change_amount: change,
                            };
                        }
                    }
                } catch (err) {
                }
            }));

            if (Object.keys(newPrices).length > 0) {
                setSearchPrices(prev => ({ ...prev, ...newPrices }));
            }
        };

        const timeout = setTimeout(fetchPrices, 500);
        return () => clearTimeout(timeout);
    }, [searchResults, marketMovers, searchPrices]);

    const addToRecent = (asset) => {
        const newRecent = [asset, ...recentSearches.filter(a => a.symbol !== asset.symbol)].slice(0, 5);
        setRecentSearches(newRecent);
        localStorage.setItem('recentSearches', JSON.stringify(newRecent));
    };

    const handleSelect = (asset) => {
        onSelect(asset);
        addToRecent(asset);
    };

    const isCrypto = (asset) => asset.type === 'crypto';
    const isStock = (asset) => asset.type === 'index' || asset.type === 'stock';
    const matchesTab = (asset) => activeTab === 'stock' ? isStock(asset) : isCrypto(asset);

    const favoriteAssets = assets.filter(a => favorites.includes(a.symbol) && matchesTab(a));
    const popularAssets = assets.filter(a => matchesTab(a) && !favorites.includes(a.symbol));
    const recentAssets = recentSearches.filter(a => matchesTab(a) && !favorites.includes(a.symbol));


    const getAssetProps = (asset) => ({
        asset: asset,
        marketData: marketMovers[asset.symbol] || searchPrices[asset.symbol],
        isSelected: selectedAsset === asset.symbol,
        onSelect: () => handleSelect(asset),
        onToggleFavorite: onToggleFavorite
    });

    return (
        <div className="w-80 border-r border-gray-800 dark:border-gray-200 bg-gray-900/50 dark:bg-white backdrop-blur-xl flex flex-col h-screen fixed left-0 top-0 z-50 transition-colors duration-300">
            <div className="p-6 border-b border-gray-800 dark:border-gray-200">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary-500/10 p-2 rounded-lg">
                            <LayoutDashboard className="w-6 h-6 text-primary-500" />
                        </div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 dark:from-gray-900 dark:to-gray-600 bg-clip-text text-transparent">
                            Giełdomat
                        </h1>
                    </div>
                    <ThemeToggle />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-600 ml-11">Inteligentna Analiza Rynków</p>
            </div>

            <div className="flex border-b border-gray-800 dark:border-gray-200">
                <button
                    onClick={() => setActiveTab('stock')}
                    className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative ${activeTab === 'stock'
                        ? 'text-white dark:text-gray-900'
                        : 'text-gray-500 dark:text-gray-600 hover:text-gray-300 dark:hover:text-gray-800'
                        }`}
                >
                    <Globe className="w-4 h-4" />
                    Giełda
                    {activeTab === 'stock' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('crypto')}
                    className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative ${activeTab === 'crypto'
                        ? 'text-white dark:text-gray-900'
                        : 'text-gray-500 dark:text-gray-600 hover:text-gray-300 dark:hover:text-gray-800'
                        }`}
                >
                    <Bitcoin className="w-4 h-4" />
                    Krypto
                    {activeTab === 'crypto' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('trending')}
                    className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative ${activeTab === 'trending'
                        ? 'text-white dark:text-gray-900'
                        : 'text-gray-500 dark:text-gray-600 hover:text-gray-300 dark:hover:text-gray-800'
                        }`}
                >
                    <TrendingUp className="w-4 h-4" />
                    Trendy
                    {activeTab === 'trending' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    )}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                {activeTab === 'trending' ? (
                    <div className="p-4">
                        <MarketMovers activeTab={activeTab} onSelect={onSelect} isFullView={true} />
                    </div>
                ) : (
                    <div className="pb-4 space-y-2">
                        <div className="px-4 py-3 sticky top-0 bg-gray-900/95 dark:bg-white/95 backdrop-blur z-10">
                            <div className="relative group mb-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Szukaj aktywa..."
                                    value={searchQuery}
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-gray-800/50 dark:bg-gray-100 border border-gray-700 dark:border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white dark:text-gray-900 placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 outline-none transition-all"
                                />
                                {isSearching && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500 animate-spin" />
                                )}
                            </div>
                        </div>

                        {searchQuery.length >= 2 ? (
                            <div>
                                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-600 uppercase tracking-wider mb-1">
                                    Wyniki wyszukiwania
                                </div>
                                {searchResults.filter(matchesTab).length > 0 ? (
                                    searchResults.filter(matchesTab).map((asset) => (
                                        <AssetItem
                                            key={asset.symbol}
                                            {...getAssetProps(asset)}
                                            isFavorite={favorites.includes(asset.symbol)}
                                        />
                                    ))
                                ) : (
                                    !isSearching && (
                                        <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-600 text-sm">
                                            Brak wyników w tej kategorii
                                        </div>
                                    )
                                )}
                            </div>
                        ) : isSearchFocused && recentAssets.length > 0 ? (
                            <div>
                                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-600 uppercase tracking-wider flex items-center gap-2 mb-1">
                                    <Clock className="w-3 h-3" />
                                    Ostatnio wyszukiwane
                                </div>
                                {recentAssets.map((asset) => (
                                    <AssetItem
                                        key={asset.symbol}
                                        {...getAssetProps(asset)}
                                        isFavorite={favorites.includes(asset.symbol)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <>
                                {favoriteAssets.length > 0 && (
                                    <div>
                                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-600 uppercase tracking-wider flex items-center gap-2 mb-1">
                                            <Star className="w-3 h-3" />
                                            Ulubione
                                        </div>
                                        {favoriteAssets.map((asset) => (
                                            <AssetItem
                                                key={asset.symbol}
                                                {...getAssetProps(asset)}
                                                isFavorite={true}
                                            />
                                        ))}
                                    </div>
                                )}

                                <div>
                                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-600 uppercase tracking-wider mb-1">
                                        Popularne
                                    </div>
                                    {popularAssets.map((asset) => (
                                        <AssetItem
                                            key={asset.symbol}
                                            {...getAssetProps(asset)}
                                            isFavorite={false}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-gray-800 dark:border-gray-200">
                {isAuthenticated ? (
                    <UserDropdown
                        onOpenSettings={onOpenSettings}
                        onOpenHistory={onOpenHistory}
                        onOpenAdmin={onOpenAdmin}
                        isDropUp={true}
                    />
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={onLogin}
                            className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-lg transition-colors shadow-lg shadow-primary-900/20 text-sm font-medium"
                        >
                            <User className="w-4 h-4" />
                            Zaloguj
                        </button>
                        <button
                            onClick={onRegister}
                            className="flex-1 flex items-center justify-center gap-2 bg-gray-800 dark:bg-gray-200 hover:bg-gray-700 dark:hover:bg-gray-300 text-gray-300 dark:text-gray-700 hover:text-white dark:hover:text-gray-900 px-3 py-2 rounded-lg transition-colors border border-gray-700 dark:border-gray-300 text-sm font-medium"
                        >
                            <UserPlus className="w-4 h-4" />
                            Rejestracja
                        </button>
                    </div>
                )}
            </div>
        </div >
    );
};

const AssetItem = ({ asset, isSelected, onSelect, isFavorite, onToggleFavorite, marketData }) => (
    <button
        onClick={onSelect}
        className={`w-full px-4 py-3 text-left rounded-xl transition-all duration-200 flex items-center justify-between group ${isSelected
            ? 'bg-primary-500/10 text-primary-400 ring-1 ring-primary-500/20'
            : 'text-gray-400 dark:text-gray-600 hover:bg-gray-800 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900'
            }`}
    >
        <div className="min-w-0 flex-1 mr-3">
            <div className={`font-medium truncate flex items-center gap-2 ${isSelected ? 'text-white dark:text-primary-600' : 'text-gray-300 dark:text-gray-700 group-hover:text-white dark:group-hover:text-gray-900'}`}>
                {asset.name}
            </div>

            <div className="flex items-center gap-2 mt-1">
                <div className="text-xs opacity-70 flex items-center gap-2">
                    <span className="font-mono">{asset.symbol}</span>
                    {asset.type === 'crypto' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-800 dark:bg-gray-200 text-gray-400 dark:text-gray-600">CRYPTO</span>
                    )}
                </div>

                {marketData && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${marketData.change >= 0
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-rose-500/10 text-rose-500'
                        }`}>
                        {marketData.change >= 0 ? '+' : ''}{marketData.change.toFixed(1)}%
                    </span>
                )}
            </div>
        </div>

        <div className="flex items-center gap-2">
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(asset.symbol);
                }}
                className={`p-1.5 rounded-lg transition-colors ${isFavorite
                    ? 'text-yellow-500 hover:bg-yellow-500/10'
                    : 'text-gray-600 hover:text-yellow-500 hover:bg-yellow-500/10'
                    }`}
            >
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-yellow-500' : ''}`} />
            </div>
        </div>
    </button>
);

export default Sidebar;
