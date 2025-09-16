const fs = require('fs');
const path = require('path');
const axios = require('axios');

class ACLEDTokenManager {
    constructor() {
        this.tokenFilePath = path.join(__dirname, 'ACLED_tokens.json');
        this.tokenData = null;
        this.refreshInProgress = false;
        this.loadTokens();
    }

    // Load tokens from environment variables or file
    loadTokens() {
        try {
            // First, try to load from environment variables (for production)
            if (process.env.ACLED_ACCESS_TOKEN && process.env.ACLED_REFRESH_TOKEN) {
                this.tokenData = {
                    access_token: process.env.ACLED_ACCESS_TOKEN,
                    refresh_token: process.env.ACLED_REFRESH_TOKEN,
                    expires_at: process.env.ACLED_EXPIRES_AT || new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString(),
                    last_updated: process.env.ACLED_LAST_UPDATED || new Date().toISOString()
                };
                console.log('✅ ACLED tokens loaded from environment variables');
                return;
            }

            // Fallback to file-based loading (for development)
            if (fs.existsSync(this.tokenFilePath)) {
                const data = fs.readFileSync(this.tokenFilePath, 'utf-8');
                this.tokenData = JSON.parse(data);
                console.log('✅ ACLED tokens loaded from file');
            } else {
                console.warn('⚠️ ACLED tokens not found in environment variables or file');
                this.tokenData = null;
            }
        } catch (error) {
            console.error('❌ Error loading ACLED tokens:', error.message);
            this.tokenData = null;
        }
    }

    // Save tokens to file or environment (in memory)
    saveTokens(tokenData) {
        try {
            const dataToSave = {
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                expires_at: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString(), // 24 hours from now
                last_updated: new Date().toISOString()
            };

            // If using environment variables, update in memory only
            if (process.env.ACLED_ACCESS_TOKEN && process.env.ACLED_REFRESH_TOKEN) {
                this.tokenData = dataToSave;
                console.log('✅ ACLED tokens updated in memory (environment variable mode)');
                console.log(`🕒 Token expires at: ${dataToSave.expires_at}`);
                return;
            }

            // Otherwise save to file (development mode)
            fs.writeFileSync(this.tokenFilePath, JSON.stringify(dataToSave, null, 2));
            this.tokenData = dataToSave;
            console.log('✅ ACLED tokens saved to file');
            console.log(`🕒 Token expires at: ${dataToSave.expires_at}`);
        } catch (error) {
            console.error('❌ Error saving ACLED tokens:', error.message);
        }
    }

    // Check if token is expired or will expire soon (within 1 hour)
    isTokenExpired() {
        if (!this.tokenData || !this.tokenData.expires_at) {
            console.log('🔍 No token expiration data - considering expired');
            return true;
        }

        const expiresAt = new Date(this.tokenData.expires_at);
        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + (60 * 60 * 1000)); // 1 hour buffer

        const isExpired = expiresAt <= oneHourFromNow;

        if (isExpired) {
            console.log(`⏰ ACLED token expired or expires soon. Expires: ${expiresAt}, Current: ${now}`);
        } else {
            console.log(`✅ ACLED token is valid until: ${expiresAt}`);
        }

        return isExpired;
    }

    // Refresh the access token using the refresh token
    async refreshToken() {
        if (this.refreshInProgress) {
            console.log('🔄 Token refresh already in progress, waiting...');
            // Wait for ongoing refresh to complete
            while (this.refreshInProgress) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return this.tokenData?.access_token;
        }

        this.refreshInProgress = true;

        try {
            if (!this.tokenData || !this.tokenData.refresh_token) {
                throw new Error('No refresh token available');
            }

            console.log('🔄 Refreshing ACLED access token...');

            const formData = new FormData();
            formData.append('refresh_token', this.tokenData.refresh_token);
            formData.append('grant_type', 'refresh_token');
            formData.append('client_id', 'acled');

            const response = await axios.post('https://acleddata.com/oauth/token', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 30000
            });

            if (response.data && response.data.access_token) {
                console.log('✅ ACLED token refreshed successfully');

                // Save the new tokens
                this.saveTokens({
                    access_token: response.data.access_token,
                    refresh_token: response.data.refresh_token || this.tokenData.refresh_token // Keep old refresh token if new one not provided
                });

                return response.data.access_token;
            } else {
                throw new Error('Invalid token refresh response');
            }

        } catch (error) {
            console.error('❌ Error refreshing ACLED token:', error.message);
            console.error('Token refresh response:', error.response?.data);

            // If refresh fails, we might need to re-authenticate
            throw new Error(`ACLED token refresh failed: ${error.message}. Please update the refresh token manually.`);
        } finally {
            this.refreshInProgress = false;
        }
    }

    // Get a valid access token (refresh if needed)
    async getValidAccessToken() {
        try {
            // Load tokens if not already loaded
            if (!this.tokenData) {
                this.loadTokens();
            }

            // Check if we have a token and if it's expired
            if (!this.tokenData || !this.tokenData.access_token) {
                throw new Error('No ACLED access token found. Please configure ACLED_tokens.json with valid tokens.');
            }

            // Refresh token if expired
            if (this.isTokenExpired()) {
                console.log('🔄 Token expired, attempting refresh...');
                return await this.refreshToken();
            }

            console.log('✅ Using existing valid ACLED token');
            return this.tokenData.access_token;

        } catch (error) {
            console.error('❌ Error getting valid ACLED token:', error.message);
            throw error;
        }
    }

    // Update token data (useful for manual token updates)
    updateTokens(accessToken, refreshToken) {
        try {
            this.saveTokens({
                access_token: accessToken,
                refresh_token: refreshToken
            });
            console.log('✅ ACLED tokens updated manually');
        } catch (error) {
            console.error('❌ Error updating ACLED tokens:', error.message);
            throw error;
        }
    }

    // Get token status information
    getTokenStatus() {
        if (!this.tokenData) {
            return {
                hasToken: false,
                hasRefreshToken: false,
                isExpired: true,
                expiresAt: null,
                lastUpdated: null
            };
        }

        return {
            hasToken: !!this.tokenData.access_token,
            hasRefreshToken: !!this.tokenData.refresh_token,
            isExpired: this.isTokenExpired(),
            expiresAt: this.tokenData.expires_at,
            lastUpdated: this.tokenData.last_updated
        };
    }
}

// Create singleton instance
const acledTokenManager = new ACLEDTokenManager();

module.exports = acledTokenManager;