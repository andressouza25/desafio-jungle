import axios from 'axios';
export const HTTP_TIMEOUT_MS = 2000;
export const httpClient = axios.create({ baseURL: '/api', timeout: HTTP_TIMEOUT_MS });
