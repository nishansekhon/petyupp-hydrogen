# API Configuration Service - Usage Examples

This service provides dynamic API configuration fetching from Admin API Settings instead of hardcoding credentials.

## Why Use This?

✅ **Single Source of Truth**: All API configs in Admin Settings UI
✅ **No Hardcoded Secrets**: API keys stored securely in database
✅ **Easy Updates**: Change API config in Admin UI without code changes
✅ **Better Security**: No credentials committed to code repository
✅ **Environment Agnostic**: Same code works in dev/staging/prod

---

## Installation

```javascript
import apiConfigService from '@/services/apiConfigService';
```

---

## Usage Examples

### Example 1: Google Places API

**❌ BEFORE (Hardcoded):**
```javascript
// DON'T DO THIS
const GOOGLE_API_KEY = "AIzaSyC9x1234567890nshE"; // Hardcoded!
const GOOGLE_ENDPOINT = "https://maps.googleapis.com/maps/api/place";

async function searchPlaces(query) {
  const response = await fetch(
    `${GOOGLE_ENDPOINT}/textsearch/json?query=${query}&key=${GOOGLE_API_KEY}`
  );
  return response.json();
}
```

**✅ AFTER (Dynamic Config):**
```javascript
// DO THIS INSTEAD
import apiConfigService from '@/services/apiConfigService';

async function searchPlaces(query) {
  // Fetch config from Admin Settings
  const googleConfig = await apiConfigService.getConfig('Google Places API');
  
  if (!googleConfig || !googleConfig.apiKey) {
    throw new Error('Google Places API not configured');
  }

  const response = await fetch(
    `${googleConfig.endpoint}/textsearch/json?query=${query}&key=${googleConfig.apiKey}`
  );
  return response.json();
}
```

---

### Example 2: Metricool API

**❌ BEFORE (Hardcoded):**
```javascript
// DON'T DO THIS
const METRICOOL_TOKEN = "LUDB...VXGZ"; // Hardcoded!
const METRICOOL_ENDPOINT = "https://app.metricool.com/api";

async function getMetrics() {
  const response = await fetch(`${METRICOOL_ENDPOINT}/metrics/profiles`, {
    headers: {
      'X-Mc-Auth': METRICOOL_TOKEN
    }
  });
  return response.json();
}
```

**✅ AFTER (Dynamic Config):**
```javascript
// DO THIS INSTEAD
import apiConfigService from '@/services/apiConfigService';

async function getMetrics() {
  // Fetch config from Admin Settings
  const metricoolConfig = await apiConfigService.getMetricoolConfig();
  
  if (!metricoolConfig || !metricoolConfig.apiKey) {
    throw new Error('Metricool API not configured');
  }

  const response = await fetch(`${metricoolConfig.endpoint}/metrics/profiles`, {
    headers: {
      'X-Mc-Auth': metricoolConfig.apiKey
    }
  });
  return response.json();
}
```

---

### Example 3: Stripe API

**❌ BEFORE (Hardcoded):**
```javascript
// DON'T DO THIS
const STRIPE_SECRET = "sk_test_1234567890"; // Hardcoded!

async function createPayment(amount) {
  const response = await fetch('https://api.stripe.com/v1/charges', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET}`
    },
    body: JSON.stringify({ amount })
  });
  return response.json();
}
```

**✅ AFTER (Dynamic Config):**
```javascript
// DO THIS INSTEAD
import apiConfigService from '@/services/apiConfigService';

async function createPayment(amount) {
  // Fetch config from Admin Settings
  const stripeConfig = await apiConfigService.getConfig('Stripe API');
  
  if (!stripeConfig || !stripeConfig.apiKey) {
    throw new Error('Stripe API not configured');
  }

  const response = await fetch(`${stripeConfig.endpoint}/v1/charges`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeConfig.apiKey}`
    },
    body: JSON.stringify({ amount })
  });
  return response.json();
}
```

---

## Available Methods

### `getConfig(apiName)`
Generic method to get any API configuration by name.

```javascript
const config = await apiConfigService.getConfig('Google Places API');
// Returns: { endpoint, apiKey, apiName, type, status, lastTested }
```

### `getMetricoolConfig()`
Specific method for Metricool API.

```javascript
const config = await apiConfigService.getMetricoolConfig();
// Returns: { endpoint, apiKey, apiName, type, status, lastTested }
```

### `getGooglePlacesConfig()`
Specific method for Google Places API.

```javascript
const config = await apiConfigService.getGooglePlacesConfig();
// Returns: { endpoint, apiKey, apiName, type, status, lastTested }
```

### `getAllAPIs()`
Get all configured APIs.

```javascript
const apis = await apiConfigService.getAllAPIs();
// Returns: Array of all API configs
```

### `isMetricoolConfigured()`
Check if Metricool API is configured and active.

```javascript
const isConfigured = await apiConfigService.isMetricoolConfigured();
// Returns: true/false
```

### `isGooglePlacesConfigured()`
Check if Google Places API is configured and active.

```javascript
const isConfigured = await apiConfigService.isGooglePlacesConfigured();
// Returns: true/false
```

---

## Config Object Structure

All methods return a config object with this structure:

```javascript
{
  endpoint: "https://api.example.com",    // API base URL
  apiKey: "secret_key_here",              // API key/token (masked in some contexts)
  apiName: "Example API",                 // Human-readable API name
  type: "LOCATION",                       // API type (LOCATION, ANALYTICS, PAYMENT, etc.)
  status: "active",                       // Status (active, inactive, error)
  lastTested: "2025-01-10T12:34:56Z"     // Last test timestamp
}
```

---

## Error Handling

Always check if config is valid before using:

```javascript
const config = await apiConfigService.getConfig('Some API');

if (!config) {
  console.error('Failed to load API configuration');
  // Handle error - show message to user, use fallback, etc.
  return;
}

if (!config.apiKey) {
  console.error('API key not configured');
  // Handle missing API key
  return;
}

if (config.status !== 'active') {
  console.warn('API is not active:', config.status);
  // Proceed with caution or block usage
}

// Safe to use config now
const response = await fetch(`${config.endpoint}/some/path`, {
  headers: { 'Authorization': `Bearer ${config.apiKey}` }
});
```

---

## Caching (Optional)

For frequently accessed configs, consider caching:

```javascript
let cachedConfig = null;

async function getConfigWithCache() {
  if (!cachedConfig) {
    cachedConfig = await apiConfigService.getConfig('My API');
  }
  return cachedConfig;
}

// Invalidate cache when needed
function invalidateCache() {
  cachedConfig = null;
}
```

---

## Adding New API Configs

To add a new API configuration:

1. **Go to Admin Dashboard**: https://oyebark.com/admin
2. **Navigate to API Settings**: Admin → Settings → API Settings
3. **Add New API**:
   - API Name: "My New API"
   - Type: Select type (LOCATION, ANALYTICS, etc.)
   - Endpoint URL: "https://api.example.com"
   - API Key: "your_secret_key"
   - Status: Active
4. **Save**
5. **Use in code**:
```javascript
const myApiConfig = await apiConfigService.getConfig('My New API');
```

---

## Testing

To verify your API config is working:

1. Check Admin Settings UI shows the API as "SUCCESS"
2. Check browser console for config loading logs
3. Verify API calls are using correct endpoint
4. Check for authentication errors (401/403)

---

## Migration Checklist

When migrating from hardcoded to dynamic config:

- [ ] Identify all hardcoded API keys/endpoints in code
- [ ] Add API config to Admin Settings UI
- [ ] Update code to use `apiConfigService.getConfig()`
- [ ] Remove hardcoded credentials from code
- [ ] Test API calls work with dynamic config
- [ ] Verify config updates in Admin UI reflect immediately
- [ ] Check error handling for missing/invalid configs
- [ ] Update environment variables (if any)
- [ ] Document which APIs are now dynamic

---

## Benefits Summary

| Aspect | Hardcoded ❌ | Dynamic Config ✅ |
|--------|-------------|------------------|
| **Security** | Keys in code | Keys in database |
| **Updates** | Requires code deploy | Update in UI |
| **Visibility** | Scattered in files | Centralized in Admin |
| **Testing** | Requires env files | Test in Admin UI |
| **Rotation** | Code change needed | UI change only |
| **Auditability** | Git history | Admin logs |

---

## Support

For issues or questions:
- Check Admin API Settings status
- Review browser console logs
- Verify API credentials in third-party dashboard
- Check backend logs for API test results
