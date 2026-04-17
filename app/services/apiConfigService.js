import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

const API_URL = API_BASE_URL;

class APIConfigService {
  /**
   * Fetch Metricool API configuration from Admin API Settings
   * @returns {Promise<Object>} Metricool config with endpoint, token, status
   */
  async getMetricoolConfig() {
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        console.warn('No admin token found - cannot fetch API config');
        return null;
      }

      const response = await axios.get(
        `${API_URL}/api/admin/settings/apis/Metricool API`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.success && response.data.api) {
        const api = response.data.api;
        return {
          endpoint: api.endpoint,  // Fixed: backend returns 'endpoint', not 'endpoint_url'
          apiKey: api.api_key,
          apiName: api.api_name,
          type: api.api_type,  // Fixed: backend returns 'api_type', not 'type'
          status: api.status,
          lastTested: api.last_tested,
          userId: api.user_id,  // Added: include userId
          blogId: api.blog_id   // Added: include blogId
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to fetch Metricool config:', error);
      
      // Return fallback config if API call fails
      return {
        endpoint: 'https://app.metricool.com/api',
        apiKey: null,
        apiName: 'Metricool API',
        type: 'ANALYTICS',
        status: 'unknown',
        lastTested: null
      };
    }
  }

  /**
   * Fetch all API configurations
   * @returns {Promise<Array>} Array of all API configs
   */
  async getAllAPIs() {
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        return [];
      }

      const response = await axios.get(
        `${API_URL}/api/admin/settings/apis`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.success) {
        return response.data.apis || [];
      }

      return [];
    } catch (error) {
      console.error('Failed to fetch API configs:', error);
      return [];
    }
  }

  /**
   * Test if Metricool config is available and valid
   * @returns {Promise<boolean>} true if config is valid
   */
  async isMetricoolConfigured() {
    const config = await this.getMetricoolConfig();
    return config && config.apiKey && config.endpoint && config.status === 'active';
  }

  /**
   * Fetch Google Places API configuration from Admin API Settings
   * @returns {Promise<Object>} Google Places config with endpoint, token, status
   */
  async getGooglePlacesConfig() {
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        console.warn('No admin token found - cannot fetch API config');
        return null;
      }

      const response = await axios.get(
        `${API_URL}/api/admin/settings/apis/Google Places API`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.success && response.data.api) {
        const api = response.data.api;
        return {
          endpoint: api.endpoint,  // Fixed: backend returns 'endpoint', not 'endpoint_url'
          apiKey: api.api_key,
          apiName: api.api_name,
          type: api.api_type,  // Fixed: backend returns 'api_type', not 'type'
          status: api.status,
          lastTested: api.last_tested,
          userId: api.user_id,  // Added: include userId
          blogId: api.blog_id   // Added: include blogId
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to fetch Google Places config:', error);
      
      // Return fallback config if API call fails
      return {
        endpoint: 'https://maps.googleapis.com/maps/api/place',
        apiKey: null,
        apiName: 'Google Places API',
        type: 'LOCATION',
        status: 'unknown',
        lastTested: null
      };
    }
  }

  /**
   * Generic method to get any API configuration by name
   * @param {string} apiName - The name of the API (e.g., 'Google Places API', 'Metricool API')
   * @returns {Promise<Object>} API config with endpoint, token, status
   */
  async getConfig(apiName) {
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        console.warn('No admin token found - cannot fetch API config');
        return null;
      }

      const response = await axios.get(
        `${API_URL}/api/admin/settings/apis/${encodeURIComponent(apiName)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.success && response.data.api) {
        const api = response.data.api;
        return {
          endpoint: api.endpoint,  // Fixed: backend returns 'endpoint', not 'endpoint_url'
          apiKey: api.api_key,
          apiName: api.api_name,
          type: api.api_type,  // Fixed: backend returns 'api_type', not 'type'
          status: api.status,
          lastTested: api.last_tested,
          userId: api.user_id,  // Added: include userId
          blogId: api.blog_id   // Added: include blogId
        };
      }

      return null;
    } catch (error) {
      console.error(`Failed to fetch ${apiName} config:`, error);
      return null;
    }
  }

  /**
   * Test if Google Places config is available and valid
   * @returns {Promise<boolean>} true if config is valid
   */
  async isGooglePlacesConfigured() {
    const config = await this.getGooglePlacesConfig();
    return config && config.apiKey && config.endpoint && config.status === 'active';
  }
}

// Export singleton instance
const apiConfigService = new APIConfigService();
export default apiConfigService;
