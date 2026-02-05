import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Loader2, ChevronRight, ChevronDown, Layers, Globe, Bitcoin } from 'lucide-react';

const MarketMovers = ({ activeTab, onSelect, isFullView = false }) => {
    const [movers, setMovers] = useState({ gainers: [], losers: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeSection, setActiveSection] = useState('gainers');
    const [isExpanded, setIsExpanded] = useState(true);
    const [assetFilter, setAssetFilter] = useState('all');

    useEffect(() => {
        const fetchMovers = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/market/movers');
                if (!response.ok) throw new Error('Failed to fetch market movers');
                const data = await response.json();
                setMovers(data);
            } catch (err) {
                console.error("Error fetching movers:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMovers();
        const interval = setInterval(fetchMovers, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const getEffectiveFilter = (item) => {
        if (activeTab === 'crypto') return item.type === 'crypto';
        if (activeTab === 'stock') return item.type !== 'crypto';

        if (assetFilter === 'crypto') return item.type === 'crypto';
        if (assetFilter === 'stock') return item.type !== 'crypto';
        return true;
    };

    const displayedGainers = movers.gainers ? movers.gainers.filter(getEffectiveFilter) : [];
    const displayedLosers = movers.losers ? movers.losers.filter(getEffectiveFilter) : [];

    const displayedMovers = activeSection === 'gainers' ? displayedGainers : displayedLosers;

    let limit = 3;
    if (isFullView) {
        limit = 10;
    }

    const visibleMovers = displayedMovers.slice(0, limit);

    if (loading) return (
        <div className="p-4 flex justify-center">
            <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
        </div>
    );
    if (error) return null;

    const Container = isFullView ? 'div' : 'div';
    const containerClasses = isFullView
        ? "space-y-4"
        : "px-4 py-2 border-t border-gray-800 dark:border-gray-200";

    return (
        <Container className={containerClasses}>
            {!isFullView && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between mb-2 group"
                >
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary-500" />
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider group-hover:text-primary-500 transition-colors">
                            Trendy (24h)
                        </span>
                    </div>
                    {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                </button>
            )}

            {(isExpanded || isFullView) && (
                <div className={!isFullView ? "animate-in slide-in-from-top-2 duration-200" : ""}>

                    {isFullView && (
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
                            <button
                                onClick={() => setAssetFilter('all')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${assetFilter === 'all'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-800 dark:bg-gray-100 text-gray-400 dark:text-gray-600 hover:bg-gray-700 dark:hover:bg-gray-200'
                                    }`}
                            >
                                <Layers className="w-3 h-3" />
                                Wszystkie
                            </button>
                            <button
                                onClick={() => setAssetFilter('stock')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${assetFilter === 'stock'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-800 dark:bg-gray-100 text-gray-400 dark:text-gray-600 hover:bg-gray-700 dark:hover:bg-gray-200'
                                    }`}
                            >
                                <Globe className="w-3 h-3" />
                                Giełda
                            </button>
                            <button
                                onClick={() => setAssetFilter('crypto')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${assetFilter === 'crypto'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-800 dark:bg-gray-100 text-gray-400 dark:text-gray-600 hover:bg-gray-700 dark:hover:bg-gray-200'
                                    }`}
                            >
                                <Bitcoin className="w-3 h-3" />
                                Krypto
                            </button>
                        </div>
                    )}

                    <div className="flex bg-gray-900/50 dark:bg-gray-100 rounded-lg p-1 mb-2">
                        <button
                            onClick={() => setActiveSection('gainers')}
                            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${activeSection === 'gainers'
                                ? 'bg-green-500/10 text-green-500 shadow-sm'
                                : 'text-gray-500 hover:text-gray-300 dark:hover:text-gray-700'
                                }`}
                        >
                            <TrendingUp className="w-3 h-3" />
                            Wzrosty
                        </button>
                        <button
                            onClick={() => setActiveSection('losers')}
                            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${activeSection === 'losers'
                                ? 'bg-red-500/10 text-red-500 shadow-sm'
                                : 'text-gray-500 hover:text-gray-300 dark:hover:text-gray-700'
                                }`}
                        >
                            <TrendingDown className="w-3 h-3" />
                            Spadki
                        </button>
                    </div>

                    <div className="space-y-2">
                        {visibleMovers.length > 0 ? (
                            visibleMovers.map((mover) => (
                                <div
                                    key={mover.symbol}
                                    onClick={() => onSelect(mover.symbol)}
                                    className="group flex flex-col p-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 cursor-pointer transition-colors border border-transparent hover:border-gray-700 dark:hover:border-gray-200"
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm text-white dark:text-gray-900 group-hover:text-primary-400 transition-colors">
                                                {mover.symbol}
                                            </span>
                                            {isFullView && (
                                                <span className="text-[10px] uppercase text-gray-500 bg-gray-800 dark:bg-gray-200 px-1 rounded">
                                                    {mover.type}
                                                </span>
                                            )}
                                        </div>

                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${mover.change >= 0
                                            ? 'bg-green-500/10 text-green-500'
                                            : 'bg-red-500/10 text-red-500'
                                            }`}>
                                            {mover.change >= 0 ? '+' : ''}{mover.change.toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-500">
                                        <span className="truncate max-w-[150px]">{mover.name}</span>
                                        <span className="font-mono">
                                            ${mover.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-xs text-gray-500">
                                Brak dynamicznych zmian w tej kategorii
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Container>
    );
};

export default MarketMovers;
