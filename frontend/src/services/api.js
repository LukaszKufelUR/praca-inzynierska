import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
});

axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const api = {
    getAssets: async () => {
        const response = await axios.get(`${API_BASE_URL}/api/assets`);
        return response.data;
    },

    getHistoricalData: async (symbol, period = '2y') => {
        const response = await axios.get(`${API_BASE_URL}/api/data/${symbol}`, {
            params: { period }
        });
        return response.data;
    },

    getPredictions: async (symbol, periods = 30, trainingPeriod = '2y') => {
        const response = await axios.post(`${API_BASE_URL}/api/predict/both`, {
            symbol,
            periods,
            training_period: trainingPeriod
        });
        return response.data;
    },

    getProphetPredictions: async (symbol, periods = 30) => {
        const response = await axios.post(`${API_BASE_URL}/api/predict/prophet`, {
            symbol,
            periods
        });
        return response.data;
    },

    getLSTMPredictions: async (symbol, periods = 30) => {
        const response = await axios.post(`${API_BASE_URL}/api/predict/lstm`, {
            symbol,
            periods
        });
        return response.data;
    },

    getIndicators: async (symbol, period = '2y') => {
        const response = await axios.get(`${API_BASE_URL}/api/indicators/${symbol}`, {
            params: { period }
        });
        return response.data;
    },

    getCorrelation: async () => {
        const response = await axios.get(`${API_BASE_URL}/api/correlation`);
        return response.data;
    },

    getFavorites: async () => {
        const response = await axiosInstance.get('/api/favorites');
        return response.data;
    },

    addFavorite: async (symbol) => {
        const response = await axiosInstance.post(`/api/favorites/${symbol}`);
        return response.data;
    },

    removeFavorite: async (symbol) => {
        const response = await axiosInstance.delete(`/api/favorites/${symbol}`);
        return response.data;
    },

    getPredictionHistory: async (limit = 10) => {
        const response = await axiosInstance.get('/api/predictions/history', {
            params: { limit }
        });
        return response.data;
    },

    savePrediction: async (predictionData) => {
        const response = await axiosInstance.post('/api/predictions/save', predictionData);
        return response.data;
    },

    deletePrediction: async (predictionId) => {
        const response = await axiosInstance.delete(`/api/predictions/${predictionId}`);
        return response.data;
    },

    verifyPrediction: async (predictionId) => {
        const response = await axiosInstance.get(`/api/predictions/${predictionId}/verify`);
        return response.data;
    },

    searchAssets: async (query) => {
        const response = await axiosInstance.get(`/api/assets/search`, {
            params: { query }
        });
        return response.data;
    },

    getSettings: async () => {
        const response = await axiosInstance.get('/api/settings');
        return response.data;
    },

    updateSettings: async (settings) => {
        const response = await axiosInstance.put('/api/settings', settings);
        return response.data;
    },

    changePassword: async (oldPassword, newPassword) => {
        const response = await axiosInstance.put('/api/auth/change-password', {
            old_password: oldPassword,
            new_password: newPassword
        });
        return response.data;
    },

    getUsers: async () => {
        const response = await axiosInstance.get('/api/admin/users');
        return response.data;
    },

    changeUserPassword: async (userId, newPassword) => {
        const response = await axiosInstance.put(`/api/admin/users/${userId}/password`, {
            new_password: newPassword
        });
        return response.data;
    },

    approveUser: async (userId) => {
        const response = await axiosInstance.put(`/api/admin/users/${userId}/approve`);
        return response.data;
    },

    getAdminStats: async () => {
        const response = await axiosInstance.get('/api/admin/stats');
        return response.data;
    },

    deleteUser: async (userId) => {
        const response = await axiosInstance.delete(`/api/admin/users/${userId}`);
        return response.data;
    },

    deleteAccount: async (password) => {
        const response = await axiosInstance.delete('/api/auth/me', {
            data: { password }
        });
        return response.data;
    }
};
