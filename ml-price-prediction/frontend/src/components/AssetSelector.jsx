import React, { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, Bitcoin, Globe, Loader2 } from 'lucide-react';
import { api } from '../services/api';

const AssetSelector = ({ selectedAsset, onSelect, assets }) => {
    const [activeTab, setActiveTab] = useState('stock');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                setIsSearching(true);
                try {
                    const results = await api.searchAssets(searchQuery);
                    setSearchResults(results);
                } catch (error) {
                    console.error("Search failed", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const defaultAssets = assets.filter(a => {
        if (activeTab === 'stock') return a.type === 'index' || a.type === 'stock';
        if (activeTab === 'crypto') return a.type === 'crypto';
        return true;
    });

    const handleSelect = (asset) => {
        onSelect(asset);
        setIsOpen(false);
        setSearchQuery('');
    };

    const getSelectedAssetName = () => {
        if (!selectedAsset) return 'Wybierz aktywo';
        const asset = assets.find(a => a.symbol === selectedAsset);
        return asset ? `${asset.name} (${asset.symbol})` : selectedAsset;
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="block text-sm font-medium text-gray-300 mb-2">
                Wybierz Aktywo
            </label>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-left flex items-center justify-between hover:bg-gray-600 transition-colors focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
                <span className="truncate">{getSelectedAssetName()}</span>
                <Search className="w-4 h-4 text-gray-400" />
            </button>

            {isOpen && (
                <div className="absolute z-[100] w-full mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
                    <div className="flex border-b border-gray-700">
                        <button
                            onClick={() => setActiveTab('stock')}
                            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'stock'
                                ? 'bg-gray-700 text-white border-b-2 border-primary-500'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                                }`}
                        >
                            <Globe className="w-4 h-4" />
                            Akcje / Indeksy
                        </button>
                        <button
                            onClick={() => setActiveTab('crypto')}
                            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'crypto'
                                ? 'bg-gray-700 text-white border-b-2 border-primary-500'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                                }`}
                        >
                            <Bitcoin className="w-4 h-4" />
                            Kryptowaluty
                        </button>
                    </div>

                    <div className="p-3 border-b border-gray-700">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Szukaj (np. Apple, BTC)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                autoFocus
                            />
                            {isSearching && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400 animate-spin" />
                            )}
                        </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto">
                        {searchQuery.length >= 2 ? (
                            <div>
                                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                                    Wyniki wyszukiwania
                                </div>
                                {searchResults.length > 0 ? (
                                    searchResults.map((asset) => (
                                        <button
                                            key={asset.symbol}
                                            onClick={() => handleSelect(asset)}
                                            className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors flex items-center justify-between group"
                                        >
                                            <div>
                                                <div className="text-white font-medium">{asset.symbol}</div>
                                                <div className="text-xs text-gray-400">{asset.name}</div>
                                            </div>
                                            <span className="text-xs text-gray-500 group-hover:text-gray-300">
                                                {asset.type === 'crypto' ? 'Krypto' : 'Akcja'}
                                            </span>
                                        </button>
                                    ))
                                ) : (
                                    !isSearching && (
                                        <div className="px-4 py-8 text-center text-gray-500 text-sm">
                                            Brak wyników
                                        </div>
                                    )
                                )}
                            </div>
                        ) : (
                            <div>
                                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                                    Popularne
                                </div>
                                {defaultAssets.map((asset) => (
                                    <button
                                        key={asset.symbol}
                                        onClick={() => handleSelect(asset)}
                                        className={`w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors flex items-center justify-between group ${selectedAsset === asset.symbol ? 'bg-gray-700/50' : ''
                                            }`}
                                    >
                                        <div>
                                            <div className="text-white font-medium">{asset.name}</div>
                                            <div className="text-xs text-gray-400">{asset.symbol}</div>
                                        </div>
                                        {selectedAsset === asset.symbol && (
                                            <TrendingUp className="w-4 h-4 text-primary-400" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssetSelector;
