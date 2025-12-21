import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Create axios instance with default config
const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
});

// Add auth token to requests if available
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const api = {
    // Get all available assets
    getAssets: async () => {
        const response = await axios.get(`${API_BASE_URL}/api/assets`);
        return response.data;
    },

    // Get historical data for an asset
    getHistoricalData: async (symbol, period = '2y') => {
        const response = await axios.get(`${API_BASE_URL}/api/data/${symbol}`, {
            params: { period }
        });
        return response.data;
    },

    // Get predictions from both models
    getPredictions: async (symbol, periods = 30) => {
        const response = await axios.post(`${API_BASE_URL}/api/predict/both`, {
            symbol,
            periods
        });
        return response.data;
    },

    // Get Prophet predictions only
    getProphetPredictions: async (symbol, periods = 30) => {
        const response = await axios.post(`${API_BASE_URL}/api/predict/prophet`, {
            symbol,
            periods
        });
        return response.data;
    },

    // Get LSTM predictions only
    getLSTMPredictions: async (symbol, periods = 30) => {
        const response = await axios.post(`${API_BASE_URL}/api/predict/lstm`, {
            symbol,
            periods
        });
        return response.data;
    },

    // Get technical indicators
    getIndicators: async (symbol, period = '2y') => {
        const response = await axios.get(`${API_BASE_URL}/api/indicators/${symbol}`, {
            params: { period }
        });
        return response.data;
    },

    // Get correlation matrix
    getCorrelation: async () => {
        const response = await axios.get(`${API_BASE_URL}/api/correlation`);
        return response.data;
    },

    // ============================================================================
    // FAVORITES API
    // ============================================================================

    // Get user's favorite assets
    getFavorites: async () => {
        const response = await axiosInstance.get('/api/favorites');
        return response.data;
    },

    // Add asset to favorites
    addFavorite: async (symbol) => {
        const response = await axiosInstance.post(`/api/favorites/${symbol}`);
        return response.data;
    },

    // Remove asset from favorites
    removeFavorite: async (symbol) => {
        const response = await axiosInstance.delete(`/api/favorites/${symbol}`);
        return response.data;
    },

    // ============================================================================
    // PREDICTION HISTORY API
    // ============================================================================

    // Get prediction history
    getPredictionHistory: async (limit = 10) => {
        const response = await axiosInstance.get('/api/predictions/history', {
            params: { limit }
        });
        return response.data;
    },

    // Save prediction to history
    savePrediction: async (predictionData) => {
        const response = await axiosInstance.post('/api/predictions/save', predictionData);
        return response.data;
    },

    // Delete prediction from history
    deletePrediction: async (predictionId) => {
        const response = await axiosInstance.delete(`/api/predictions/${predictionId}`);
        return response.data;
    },

    // Verify prediction
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

    // ============================================================================
    // USER SETTINGS API
    // ============================================================================

    // Get user settings
    getSettings: async () => {
        const response = await axiosInstance.get('/api/settings');
        return response.data;
    },

    // Update user settings
    updateSettings: async (settings) => {
        const response = await axiosInstance.put('/api/settings', settings);
        return response.data;
    },

    // ============================================================================
    // PASSWORD CHANGE API
    // ============================================================================

    // Change password
    changePassword: async (oldPassword, newPassword) => {
        const response = await axiosInstance.put('/api/auth/change-password', {
            old_password: oldPassword,
            new_password: newPassword
        });
        return response.data;
    },

    // ============================================================================
    // ADMIN API
    // ============================================================================

    // Get all users (admin only)
    getUsers: async () => {
        const response = await axiosInstance.get('/api/admin/users');
        return response.data;
    },

    // Change user password (admin only)
    changeUserPassword: async (userId, newPassword) => {
        const response = await axiosInstance.put(`/api/admin/users/${userId}/password`, {
            new_password: newPassword
        });
        return response.data;
    },

    // Get admin stats (admin only)
    getAdminStats: async () => {
        const response = await axiosInstance.get('/api/admin/stats');
        return response.data;
    },

    // Delete user (admin only)
    deleteUser: async (userId) => {
        const response = await axiosInstance.delete(`/api/admin/users/${userId}`);
        return response.data;
    }
};
