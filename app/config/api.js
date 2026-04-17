// PetYupp API Configuration
const PRODUCTION_URL = process.env.REACT_APP_API_URL || 'https://api.petyupp.com';
const DEVELOPMENT_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const API_BASE_URL = process.env.NODE_ENV === 'production' ? PRODUCTION_URL : DEVELOPMENT_URL;
export default API_BASE_URL;
