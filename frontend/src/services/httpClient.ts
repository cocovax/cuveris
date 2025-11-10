import axios, { AxiosHeaders } from 'axios'
import { appConfig } from '../config/app'
import { useAuthStore } from '../store/authStore'

export const httpClient = axios.create({
  baseURL: appConfig.apiUrl ?? undefined,
  timeout: 8000,
})

httpClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    const headers = new AxiosHeaders(config.headers)
    headers.set('Authorization', `Bearer ${token}`)
    config.headers = headers
  }
  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  },
)

