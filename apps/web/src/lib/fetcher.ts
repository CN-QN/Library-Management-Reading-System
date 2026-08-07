import apiClient from './api-client';

/**
 * Hàm fetcher dùng chung cho SWR hook
 * @param url Đường dẫn endpoint API (tương đối so với baseURL)
 */
export const fetcher = (url: string) => apiClient.get(url).then((res) => res.data.data);
