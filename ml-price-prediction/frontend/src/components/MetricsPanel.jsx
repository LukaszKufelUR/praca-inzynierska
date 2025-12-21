import React from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import InfoTooltip from './InfoTooltip';

const MetricsPanel = ({ prophetMetrics, lstmMetrics }) => {
    const MetricCard = ({ title, value, subtitle, color, icon: Icon, tooltip }) => (
        <div className={`bg-gradient-to-br ${color} rounded-xl p-6 shadow-lg border border-gray-700/50`}>
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-gray-300 dark:text-gray-600 text-sm font-medium flex items-center">
                    {title}
                    {tooltip && <InfoTooltip text={tooltip} />}
                </h4>
                <Icon className="w-5 h-5 text-white/80" />
            </div>
            <p className="text-3xl font-bold text-white dark:text-gray-900 mb-1">{value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-600">{subtitle}</p>
        </div>
    );

    const ComparisonCard = ({ metric, prophetValue, lstmValue }) => {
        const prophetBetter = prophetValue < lstmValue;

        return (
            <div className="bg-gray-800/50 dark:bg-gray-200 rounded-lg p-4 border border-gray-700 dark:border-gray-300">
                <h4 className="text-gray-300 dark:text-gray-700 text-sm font-semibold mb-3">{metric}</h4>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-400 dark:text-gray-600 text-sm">Prophet</span>
                        <div className="flex items-center gap-2">
                            <span className={`font-semibold ${prophetBetter ? 'text-green-400 dark:text-green-600' : 'text-gray-300 dark:text-gray-900'}`}>
                                {prophetValue.toFixed(2)}
                            </span>
                            {prophetBetter && <TrendingUp className="w-4 h-4 text-green-400" />}
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-400 dark:text-gray-600 text-sm">LSTM</span>
                        <div className="flex items-center gap-2">
                            <span className={`font-semibold ${!prophetBetter ? 'text-green-400 dark:text-green-600' : 'text-gray-300 dark:text-gray-900'}`}>
                                {lstmValue.toFixed(2)}
                            </span>
                            {!prophetBetter && <TrendingUp className="w-4 h-4 text-green-400" />}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Prophet Metrics */}
            <div className="bg-gray-800/50 dark:bg-gray-100 backdrop-blur-sm rounded-xl p-6 border border-gray-700 dark:border-gray-200 shadow-2xl">
                <h3 className="text-xl font-bold text-white dark:text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-green-400">🤖</span>
                    Metryki Modelu Prophet
                    <InfoTooltip text="Prophet to model opracowany przez Facebooka, specjalizujący się w analizie szeregów czasowych z sezonowością." />
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <MetricCard
                        title="RMSE"
                        value={prophetMetrics.rmse.toFixed(2)}
                        subtitle="Błąd Średniokwadratowy"
                        color="from-blue-600/20 to-blue-800/20"
                        icon={Activity}
                        tooltip="RMSE (Root Mean Square Error) - miara dokładności modelu. Im niższa wartość, tym lepiej model dopasował się do danych historycznych."
                    />
                    <MetricCard
                        title="MAE"
                        value={prophetMetrics.mae.toFixed(2)}
                        subtitle="Średni Błąd Bezwzględny"
                        color="from-purple-600/20 to-purple-800/20"
                        icon={Activity}
                        tooltip="MAE (Mean Absolute Error) - średnia różnica między przewidywaną a rzeczywistą ceną. Mówi nam, o ile średnio myli się model."
                    />
                    <MetricCard
                        title="MAPE"
                        value={`${prophetMetrics.mape.toFixed(2)}%`}
                        subtitle="Średni Błąd Procentowy"
                        color="from-pink-600/20 to-pink-800/20"
                        icon={Activity}
                        tooltip="MAPE (Mean Absolute Percentage Error) - błąd wyrażony w procentach. Mówi nam, o jaki procent średnio myli się model."
                    />
                </div>
            </div>

            {/* LSTM Metrics */}
            <div className="bg-gray-800/50 dark:bg-gray-100 backdrop-blur-sm rounded-xl p-6 border border-gray-700 dark:border-gray-200 shadow-2xl">
                <h3 className="text-xl font-bold text-white dark:text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-yellow-400">🧠</span>
                    Metryki Modelu LSTM
                    <InfoTooltip text="LSTM (Long Short-Term Memory) to rodzaj sieci neuronowej zdolnej do uczenia się długoterminowych zależności w danych." />
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <MetricCard
                        title="RMSE"
                        value={lstmMetrics.rmse.toFixed(2)}
                        subtitle="Błąd Średniokwadratowy"
                        color="from-blue-600/20 to-blue-800/20"
                        icon={Activity}
                        tooltip="RMSE (Root Mean Square Error) - miara dokładności modelu. Im niższa wartość, tym lepiej model dopasował się do danych historycznych."
                    />
                    <MetricCard
                        title="MAE"
                        value={lstmMetrics.mae.toFixed(2)}
                        subtitle="Średni Błąd Bezwzględny"
                        color="from-purple-600/20 to-purple-800/20"
                        icon={Activity}
                        tooltip="MAE (Mean Absolute Error) - średnia różnica między przewidywaną a rzeczywistą ceną. Mówi nam, o ile średnio myli się model."
                    />
                    <MetricCard
                        title="MAPE"
                        value={`${lstmMetrics.mape.toFixed(2)}%`}
                        subtitle="Średni Błąd Procentowy"
                        color="from-pink-600/20 to-pink-800/20"
                        icon={Activity}
                        tooltip="MAPE (Mean Absolute Percentage Error) - błąd wyrażony w procentach. Mówi nam, o jaki procent średnio myli się model."
                    />
                </div>
            </div>

            {/* Model Comparison */}
            <div className="bg-gray-800/50 dark:bg-gray-100 backdrop-blur-sm rounded-xl p-6 border border-gray-700 dark:border-gray-200 shadow-2xl">
                <h3 className="text-xl font-bold text-white dark:text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-primary-400">⚖️</span>
                    Porównanie Modeli
                    <InfoTooltip text="Zestawienie wyników obu modeli. Zielony kolor wskazuje model, który osiągnął lepszy wynik (mniejszy błąd) w danej kategorii." />
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ComparisonCard
                        metric="RMSE"
                        prophetValue={prophetMetrics.rmse}
                        lstmValue={lstmMetrics.rmse}
                    />
                    <ComparisonCard
                        metric="MAE"
                        prophetValue={prophetMetrics.mae}
                        lstmValue={lstmMetrics.mae}
                    />
                    <ComparisonCard
                        metric="MAPE"
                        prophetValue={prophetMetrics.mape}
                        lstmValue={lstmMetrics.mape}
                    />
                </div>
            </div>
        </div>
    );
};

export default MetricsPanel;

