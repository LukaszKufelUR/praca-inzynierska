import React, { useState, useEffect } from 'react';
import { X, Loader2, Users, TrendingUp, Star, UserPlus, Key, Download } from 'lucide-react';
import { api } from '../services/api';
import AdminChangePasswordModal from './AdminChangePasswordModal';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const AdminPanel = ({ isOpen, onClose }) => {
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [activeTab, setActiveTab] = useState('users'); // 'users' | 'pending'

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [usersData, statsData] = await Promise.all([
                api.getUsers(),
                api.getAdminStats()
            ]);
            setUsers(usersData);
            setStats(statsData);
        } catch (err) {
            setError('Nie udało się pobrać danych');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString, includeTime = true) => {
        if (!dateString) return '-';
        // Backend zwraca UTC bez 'Z', więc dodajemy 'Z' żeby przeglądarka wiedziała że to UTC
        const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
        return includeTime ? date.toLocaleString('pl-PL') : date.toLocaleDateString('pl-PL');
    };

    const handlePasswordChanged = () => {
        setSelectedUser(null);
    };

    const handleApproveUser = async (user) => {
        try {
            await api.approveUser(user.id);
            alert(`Użytkownik ${user.email} został zatwierdzony.`);
            loadData();
        } catch (err) {
            alert(err.response?.data?.detail || 'Nie udało się zatwierdzić użytkownika');
            console.error(err);
        }
    };

    const handleDeleteUser = async (user) => {
        if (user.is_admin) {
            alert('Nie można usunąć administratora!');
            return;
        }

        const message = user.is_approved
            ? `Czy na pewno chcesz usunąć użytkownika ${user.email}?\n\nTa operacja jest nieodwracalna i usunie również wszystkie prognozy i ulubione tego użytkownika.`
            : `Czy na pewno chcesz odrzucić rejestrację użytkownika ${user.email}?`;

        if (!confirm(message)) {
            return;
        }

        try {
            await api.deleteUser(user.id);
            const action = user.is_approved ? 'usunięty' : 'odrzucony';
            alert(`Użytkownik ${user.email} został ${action}`);
            loadData();
        } catch (err) {
            alert(err.response?.data?.detail || 'Nie udało się usunąć użytkownika');
            console.error(err);
        }
    };

    const generateUserReport = (user) => {
        const reportDate = new Date().toLocaleString('pl-PL');
        const registrationDate = formatDate(user.created_at);

        const htmlContent = `
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Raport Użytkownika - ${user.email}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 800px;
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
        .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
            font-weight: 600;
        }
        .header p {
            opacity: 0.9;
            font-size: 14px;
        }
        .content {
            padding: 40px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 20px;
            color: #667eea;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
            font-weight: 600;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 15px;
        }
        .info-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .info-label {
            font-size: 12px;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        .info-value {
            font-size: 18px;
            color: #212529;
            font-weight: 600;
        }
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            line-height: 1.2;
        }
        .badge-admin {
            background: #e0d4fc;
            color: #764ba2;
        }
        .badge-user {
            background: #d4e4fc;
            color: #4a76ba;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 15px;
        }
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
        }
        .stat-number {
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 5px;
        }
        .stat-label {
            font-size: 14px;
            opacity: 0.9;
        }
        .summary {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            line-height: 1.6;
            color: #495057;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #6c757d;
            font-size: 12px;
            border-top: 1px solid #dee2e6;
        }
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .container {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Raport Użytkownika</h1>
            <p>Giełdomat - System Prognozowania Cen</p>
            <p style="margin-top: 10px; font-size: 12px;">Wygenerowano: ${reportDate}</p>
        </div>
        
        <div class="content">
            <div class="section">
                <h2 class="section-title">Informacje Podstawowe</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Email</div>
                        <div class="info-value">${user.email}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Rola</div>
                        <div class="info-value">
                            <span class="badge ${user.is_admin ? 'badge-admin' : 'badge-user'}">
                                ${user.is_admin ? '👑 Administrator' : '👤 Użytkownik'}
                            </span>
                        </div>
                    </div>
                    <div class="info-item" style="grid-column: 1 / -1;">
                        <div class="info-label">Data Rejestracji</div>
                        <div class="info-value">${registrationDate}</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2 class="section-title">Statystyki Aktywności</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">${user.prediction_count}</div>
                        <div class="stat-label">📈 Zapisane Prognozy</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${user.favorite_count}</div>
                        <div class="stat-label">⭐ Ulubione Aktywa</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2 class="section-title">Podsumowanie</h2>
                <div class="summary">
                    <p><strong>${user.email}</strong> jest ${user.is_admin ? 'administratorem' : 'aktywnym użytkownikiem'} 
                    systemu Giełdomat.</p>
                    <p style="margin-top: 10px;">Konto zostało utworzone <strong>${registrationDate}</strong>.</p>
                    <p style="margin-top: 15px;">Aktywność użytkownika:</p>
                    <ul style="margin-left: 20px; margin-top: 10px;">
                        <li>Zapisane prognozy: <strong>${user.prediction_count}</strong></li>
                        <li>Ulubione aktywa: <strong>${user.favorite_count}</strong></li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>© 2025 Giełdomat - System Prognozowania Cen</p>
            <p style="margin-top: 5px;">Ten raport został wygenerowany automatycznie</p>
        </div>
    </div>
</body>
</html>
        `.trim();

        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '800px';
        iframe.style.height = '1200px';
        iframe.style.left = '-9999px';
        iframe.style.top = '0';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();

        setTimeout(() => {
            const bodyHeight = iframeDoc.body.scrollHeight;
            iframe.style.height = bodyHeight + 'px';

            html2canvas(iframeDoc.body, { scale: 1.5, useCORS: true, windowWidth: 800, height: bodyHeight }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`raport_uzytkownika_${user.email.replace('@', '_')}_${new Date().toISOString().split('T')[0]}.pdf`);

                document.body.removeChild(iframe);
            });
        }, 500);
    };

    const generateAllUsersReport = () => {
        const reportDate = new Date().toLocaleString('pl-PL');

        const htmlContent = `
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Raport Wszystkich Użytkowników - Giełdomat</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
        }
        .container {
            max-width: 1200px;
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
        .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
            font-weight: 600;
        }
        .header p {
            opacity: 0.9;
            font-size: 14px;
        }
        .content {
            padding: 40px;
        }
        .stats-overview {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
        }
        .stat-number {
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 5px;
        }
        .stat-label {
            font-size: 14px;
            opacity: 0.9;
        }
        .section-title {
            font-size: 24px;
            color: #667eea;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
            font-weight: 600;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        thead {
            background: #667eea;
            color: white;
        }
        th {
            padding: 15px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        tbody tr {
            border-bottom: 1px solid #dee2e6;
        }
        tbody tr:hover {
            background: #f8f9fa;
        }
        td {
            padding: 15px;
            font-size: 14px;
        }
        .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        .badge-admin {
            background: #e0d4fc;
            color: #764ba2;
        }
        .badge-user {
            background: #d4e4fc;
            color: #4a76ba;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #6c757d;
            font-size: 12px;
            border-top: 1px solid #dee2e6;
        }
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .container {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Raport Wszystkich Użytkowników</h1>
            <p>Giełdomat - System Prognozowania Cen</p>
            <p style="margin-top: 10px; font-size: 12px;">Wygenerowano: ${reportDate}</p>
        </div>
        
        <div class="content">
            <div class="stats-overview">
                <div class="stat-card">
                    <div class="stat-number">${stats?.total_users || 0}</div>
                    <div class="stat-label">👥 Użytkownicy</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats?.total_predictions || 0}</div>
                    <div class="stat-label">📈 Prognozy</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats?.total_favorites || 0}</div>
                    <div class="stat-label">⭐ Ulubione</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats?.recent_users || 0}</div>
                    <div class="stat-label">🆕 Nowi (7 dni)</div>
                </div>
            </div>

            <h2 class="section-title">Lista Użytkowników</h2>
            
            <table>
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Rola</th>
                        <th>Data Rejestracji</th>
                        <th>Prognozy</th>
                        <th>Ulubione</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.email}</td>
                            <td>
                                <span class="badge ${user.is_admin ? 'badge-admin' : 'badge-user'}">
                                    ${user.is_admin ? '👑 Admin' : '👤 User'}
                                </span>
                            </td>
                            <td>${formatDate(user.created_at)}</td>
                            <td>${user.prediction_count}</td>
                            <td>${user.favorite_count}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p>© 2025 Giełdomat - System Prognozowania Cen</p>
            <p style="margin-top: 5px;">Ten raport został wygenerowany automatycznie</p>
        </div>
    </div>
</body>
</html>
        `.trim();

        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '1200px';
        iframe.style.height = '1200px';
        iframe.style.left = '-9999px';
        iframe.style.top = '0';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();

        setTimeout(() => {
            const bodyHeight = iframeDoc.body.scrollHeight;
            iframe.style.height = bodyHeight + 'px';

            html2canvas(iframeDoc.body, { scale: 1.5, useCORS: true, windowWidth: 1200, height: bodyHeight }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('l', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

                if (pdfHeight > pdf.internal.pageSize.getHeight()) {
                    const pageHeight = pdf.internal.pageSize.getHeight();
                    let heightLeft = pdfHeight;
                    let position = 0;

                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                    heightLeft -= pageHeight;

                    while (heightLeft >= 0) {
                        position = heightLeft - pdfHeight;
                        pdf.addPage();
                        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                        heightLeft -= pageHeight;
                    }
                } else {
                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                }

                pdf.save(`raport_wszystkich_uzytkownikow_${new Date().toISOString().split('T')[0]}.pdf`);

                document.body.removeChild(iframe);
            });
        }, 500);
    };

    if (!isOpen) return null;

    const activeUsers = users.filter(u => u.is_approved || u.is_admin);
    const pendingUsers = users.filter(u => !u.is_approved && !u.is_admin);

    return (
        <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 dark:bg-white rounded-xl w-full max-w-6xl border border-gray-700 dark:border-gray-200 shadow-2xl flex flex-col max-h-[90vh]">
                    <div className="flex items-center justify-between p-6 border-b border-gray-700 dark:border-gray-200">
                        <div className="flex items-center gap-3">
                            <Users className="w-6 h-6 text-primary-400" />
                            <h2 className="text-2xl font-bold text-white dark:text-gray-900">Panel Administracyjny</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={generateAllUsersReport}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 dark:text-green-600 rounded-lg transition-colors border border-green-500/30"
                                title="Pobierz raport wszystkich użytkowników"
                            >
                                <Download className="w-5 h-5" />
                                <span className="font-medium">Raport Wszystkich</span>
                            </button>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white dark:hover:text-gray-900 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                                <p>Ładowanie danych...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-12 text-red-400">
                                <p>{error}</p>
                                <button
                                    onClick={loadData}
                                    className="mt-4 text-sm text-primary-400 hover:text-primary-300 underline"
                                >
                                    Spróbuj ponownie
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {stats && (
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="bg-gray-700/30 dark:bg-gray-100 rounded-lg p-4 border border-gray-600 dark:border-gray-300">
                                            <div className="flex items-center gap-3">
                                                <Users className="w-8 h-8 text-blue-400" />
                                                <div>
                                                    <p className="text-sm text-gray-400 dark:text-gray-600">Użytkownicy</p>
                                                    <p className="text-2xl font-bold text-white dark:text-gray-900">{activeUsers.length}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-gray-700/30 dark:bg-gray-100 rounded-lg p-4 border border-gray-600 dark:border-gray-300">
                                            <div className="flex items-center gap-3">
                                                <TrendingUp className="w-8 h-8 text-green-400" />
                                                <div>
                                                    <p className="text-sm text-gray-400 dark:text-gray-600">Prognozy</p>
                                                    <p className="text-2xl font-bold text-white dark:text-gray-900">{stats.total_predictions}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-gray-700/30 dark:bg-gray-100 rounded-lg p-4 border border-gray-600 dark:border-gray-300">
                                            <div className="flex items-center gap-3">
                                                <Star className="w-8 h-8 text-yellow-400" />
                                                <div>
                                                    <p className="text-sm text-gray-400 dark:text-gray-600">Ulubione</p>
                                                    <p className="text-2xl font-bold text-white dark:text-gray-900">{stats.total_favorites}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-gray-700/30 dark:bg-gray-100 rounded-lg p-4 border border-gray-600 dark:border-gray-300">
                                            <div className="flex items-center gap-3">
                                                <UserPlus className="w-8 h-8 text-purple-400" />
                                                <div>
                                                    <p className="text-sm text-gray-400 dark:text-gray-600">Nowi (7 dni)</p>
                                                    <p className="text-2xl font-bold text-white dark:text-gray-900">{stats.recent_users}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <div className="flex border-b border-gray-700 dark:border-gray-200 mb-6">
                                        <button
                                            onClick={() => setActiveTab('users')}
                                            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'users'
                                                ? 'border-blue-500 text-blue-500'
                                                : 'border-transparent text-gray-400 hover:text-gray-300'
                                                }`}
                                        >
                                            Użytkownicy ({activeUsers.length})
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('pending')}
                                            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'pending'
                                                ? 'border-blue-500 text-blue-500'
                                                : 'border-transparent text-gray-400 hover:text-gray-300'
                                                }`}
                                        >
                                            Oczekujące Rejestracje
                                            {pendingUsers.length > 0 && (
                                                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                    {pendingUsers.length}
                                                </span>
                                            )}
                                        </button>
                                    </div>

                                    <div className="bg-gray-700/30 dark:bg-gray-100 rounded-lg border border-gray-600 dark:border-gray-300 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            {activeTab === 'users' ? (
                                                <table className="w-full">
                                                    <thead className="bg-gray-800 dark:bg-gray-200">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 dark:text-gray-700 uppercase tracking-wider">Email</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 dark:text-gray-700 uppercase tracking-wider">Rola</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 dark:text-gray-700 uppercase tracking-wider">Data rejestracji</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 dark:text-gray-700 uppercase tracking-wider">Prognozy</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 dark:text-gray-700 uppercase tracking-wider">Ulubione</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 dark:text-gray-700 uppercase tracking-wider">Akcje</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-700 dark:divide-gray-300">
                                                        {activeUsers.map((user) => (
                                                            <tr key={user.id} className="hover:bg-gray-700/50 dark:hover:bg-gray-200">
                                                                <td className="px-4 py-3 text-sm text-gray-200 dark:text-gray-900">{user.email}</td>
                                                                <td className="px-4 py-3 text-sm">
                                                                    {user.is_admin ? (
                                                                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 dark:text-purple-600 rounded text-xs font-medium">Admin</span>
                                                                    ) : (
                                                                        <span className="px-2 py-1 bg-gray-500/20 text-gray-400 dark:text-gray-600 rounded text-xs font-medium">User</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-300 dark:text-gray-700">
                                                                    {formatDate(user.created_at)}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-300 dark:text-gray-700">{user.prediction_count}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-300 dark:text-gray-700">{user.favorite_count}</td>
                                                                <td className="px-4 py-3 text-sm">
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => generateUserReport(user)}
                                                                            className="flex items-center gap-1 px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 dark:text-green-600 rounded transition-colors"
                                                                            title="Pobierz raport użytkownika"
                                                                        >
                                                                            <Download className="w-4 h-4" />
                                                                            Raport
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setSelectedUser(user)}
                                                                            className="flex items-center gap-1 px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 dark:text-indigo-600 rounded transition-colors"
                                                                        >
                                                                            <Key className="w-4 h-4" />
                                                                            Zmień hasło
                                                                        </button>
                                                                        {!user.is_admin && (
                                                                            <button
                                                                                onClick={() => handleDeleteUser(user)}
                                                                                className="flex items-center gap-1 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 dark:text-red-600 rounded transition-colors"
                                                                            >
                                                                                <X className="w-4 h-4" />
                                                                                Usuń
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <table className="w-full">
                                                    <thead className="bg-gray-800 dark:bg-gray-200">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 dark:text-gray-700 uppercase tracking-wider">Email</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 dark:text-gray-700 uppercase tracking-wider">Data rejestracji</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 dark:text-gray-700 uppercase tracking-wider">Akcje</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-700 dark:divide-gray-300">
                                                        {pendingUsers.length === 0 ? (
                                                            <tr>
                                                                <td colSpan="3" className="px-4 py-8 text-center text-gray-400 dark:text-gray-600">
                                                                    Brak oczekujących rejestracji
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            pendingUsers.map((user) => (
                                                                <tr key={user.id} className="hover:bg-gray-700/50 dark:hover:bg-gray-200">
                                                                    <td className="px-4 py-3 text-sm text-gray-200 dark:text-gray-900 font-medium">{user.email}</td>
                                                                    <td className="px-4 py-3 text-sm text-gray-300 dark:text-gray-700">
                                                                        {formatDate(user.created_at)}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-sm">
                                                                        <div className="flex items-center gap-2">
                                                                            <button
                                                                                onClick={() => handleApproveUser(user)}
                                                                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-sm"
                                                                            >
                                                                                <UserPlus className="w-4 h-4" />
                                                                                Zatwierdź
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteUser(user)}
                                                                                className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 dark:text-red-600 rounded-lg transition-colors border border-red-500/20"
                                                                            >
                                                                                <X className="w-4 h-4" />
                                                                                Odrzuć
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AdminChangePasswordModal
                isOpen={!!selectedUser}
                onClose={() => setSelectedUser(null)}
                user={selectedUser}
                onPasswordChanged={handlePasswordChanged}
            />
        </>
    );
};

export default AdminPanel;
