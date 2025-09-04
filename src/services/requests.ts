import { env } from '../env';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

class RequestService {
  private baseUrl: string;
  private defaultTimeout: number;

  constructor() {
    this.baseUrl = env.API_URL;
    this.defaultTimeout = 10000; // 10 seconds
  }

  async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    try {
      const {
        method = 'GET',
        headers = {},
        body,
        timeout = this.defaultTimeout
      } = options;

      const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
      
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers,
      };

      // Add authorization header if available
      const token = await this.getAuthToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseData = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: responseData,
          status: response.status,
        };
      } else {
        return {
          success: false,
          error: responseData.message || `HTTP ${response.status}`,
          status: response.status,
        };
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'Request timeout',
          };
        }
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: 'Unknown error occurred',
      };
    }
  }

  async get<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async delete<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async patch<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  // Upload file with progress tracking
  async uploadFile<T = any>(
    endpoint: string,
    fileUri: string,
    fieldName: string = 'file',
    additionalData?: Record<string, any>,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
      
      const formData = new FormData();
      formData.append(fieldName, {
        uri: fileUri,
        type: this.getMimeTypeFromUri(fileUri),
        name: this.getFileNameFromUri(fileUri),
      } as any);

      // Add additional form data
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, String(value));
        });
      }

      const token = await this.getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const responseData = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: responseData,
          status: response.status,
        };
      } else {
        return {
          success: false,
          error: responseData.message || `HTTP ${response.status}`,
          status: response.status,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Download file with progress tracking
  async downloadFile(
    endpoint: string,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<{ uri: string; fileName: string }>> {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
      
      const token = await this.getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}`,
          status: response.status,
        };
      }

      // Get filename from Content-Disposition header or URL
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = 'download';
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (fileNameMatch) {
          fileName = fileNameMatch[1];
        }
      } else {
        fileName = this.getFileNameFromUri(url);
      }

      // For now, we'll return the URL as the URI
      // In a real implementation, you might want to save the file locally
      return {
        success: true,
        data: {
          uri: url,
          fileName,
        },
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private async getAuthToken(): Promise<string | null> {
    // In a real implementation, you would retrieve the auth token from secure storage
    // For now, we'll return null
    return null;
  }

  private getMimeTypeFromUri(uri: string): string {
    const extension = uri.split('.').pop()?.toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'mp4': 'video/mp4',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'txt': 'text/plain',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    return mimeTypes[extension || ''] || 'application/octet-stream';
  }

  private getFileNameFromUri(uri: string): string {
    try {
      const url = new URL(uri);
      const pathname = url.pathname;
      return pathname.split('/').pop() || 'download';
    } catch (error) {
      return 'download';
    }
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  setDefaultTimeout(timeout: number): void {
    this.defaultTimeout = timeout;
  }
}

export const requestService = new RequestService();
