import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { env } from '../env';

export interface DownloadResult {
  success: boolean;
  uri?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  error?: string;
}

export interface ShareResult {
  success: boolean;
  error?: string;
}

class FileDownloadService {
  private downloadsDir: string;
  private cacheDir: string;

  constructor() {
    this.downloadsDir = `${FileSystem.documentDirectory}${env.DOWNLOADS_DIR}/`;
    this.cacheDir = `${FileSystem.cacheDirectory}${env.CACHE_DIR}/`;
    this.initializeDirectories();
  }

  private async initializeDirectories(): Promise<void> {
    try {
      // Create downloads directory
      const downloadsDirInfo = await FileSystem.getInfoAsync(this.downloadsDir);
      if (!downloadsDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.downloadsDir, { intermediates: true });
        console.log('Downloads directory created');
      }

      // Create cache directory
      const cacheDirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      if (!cacheDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
        console.log('Cache directory created');
      }
    } catch (error) {
      console.error('Error initializing directories:', error);
    }
  }

  async downloadFile(
    url: string,
    fileName?: string,
    options?: {
      useCache?: boolean;
      headers?: Record<string, string>;
      onProgress?: (progress: number) => void;
    }
  ): Promise<DownloadResult> {
    try {
      // Generate filename if not provided
      const finalFileName = fileName || this.generateFileName(url);
      const targetDir = options?.useCache ? this.cacheDir : this.downloadsDir;
      const fileUri = `${targetDir}${finalFileName}`;

      console.log('Downloading file:', url, 'to:', fileUri);

      const downloadResult = await FileSystem.downloadAsync(url, fileUri, {
        headers: options?.headers,
        progressCallback: (progress) => {
          const progressPercent = (progress.totalBytesWritten / progress.totalBytesExpectedToWrite) * 100;
          options?.onProgress?.(progressPercent);
        },
      });

      if (downloadResult.status === 200) {
        // Get file info
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        
        return {
          success: true,
          uri: downloadResult.uri,
          fileName: finalFileName,
          fileSize: fileInfo.size,
          mimeType: this.getMimeTypeFromUrl(url)
        };
      } else {
        return {
          success: false,
          error: `Download failed with status: ${downloadResult.status}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async shareFile(
    uri: string,
    options?: {
      mimeType?: string;
      dialogTitle?: string;
      UTI?: string;
    }
  ): Promise<ShareResult> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Sharing not available on this device'
        };
      }

      await Sharing.shareAsync(uri, {
        mimeType: options?.mimeType || this.getMimeTypeFromUrl(uri),
        dialogTitle: options?.dialogTitle || 'Share file',
        UTI: options?.UTI,
      });

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async saveToGallery(uri: string, albumName?: string): Promise<DownloadResult> {
    try {
      // First, ensure we have media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        return {
          success: false,
          error: 'Media library permission denied'
        };
      }

      // Create asset in media library
      const asset = await MediaLibrary.createAssetAsync(uri);
      
      // Add to specific album if provided
      if (albumName) {
        const albums = await MediaLibrary.getAlbumsAsync();
        let album = albums.find(a => a.title === albumName);
        
        if (!album) {
          album = await MediaLibrary.createAlbumAsync(albumName);
        }
        
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      return {
        success: true,
        uri: asset.uri,
        fileName: asset.filename,
        mimeType: this.getMimeTypeFromUrl(uri)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getFileInfo(uri: string): Promise<{
    success: boolean;
    exists?: boolean;
    size?: number;
    modificationTime?: number;
    uri?: string;
    error?: string;
  }> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      return {
        success: true,
        exists: fileInfo.exists,
        size: fileInfo.size,
        modificationTime: fileInfo.modificationTime,
        uri: fileInfo.uri
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async deleteFile(uri: string): Promise<{ success: boolean; error?: string }> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(uri);
        return { success: true };
      } else {
        return {
          success: false,
          error: 'File does not exist'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async listFiles(directory?: string): Promise<{
    success: boolean;
    files?: Array<{
      name: string;
      uri: string;
      size: number;
      modificationTime: number;
    }>;
    error?: string;
  }> {
    try {
      const targetDir = directory || this.downloadsDir;
      const files = await FileSystem.readDirectoryAsync(targetDir);
      
      const fileInfos = await Promise.all(
        files.map(async (fileName) => {
          const fileUri = `${targetDir}${fileName}`;
          const fileInfo = await FileSystem.getInfoAsync(fileUri);
          
          return {
            name: fileName,
            uri: fileUri,
            size: fileInfo.size || 0,
            modificationTime: fileInfo.modificationTime || 0,
          };
        })
      );

      return {
        success: true,
        files: fileInfos
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async clearCache(): Promise<{ success: boolean; error?: string }> {
    try {
      const cacheFiles = await FileSystem.readDirectoryAsync(this.cacheDir);
      
      await Promise.all(
        cacheFiles.map(fileName => 
          FileSystem.deleteAsync(`${this.cacheDir}${fileName}`)
        )
      );

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private generateFileName(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const fileName = pathname.split('/').pop() || 'download';
      
      // Add timestamp to avoid conflicts
      const timestamp = Date.now();
      const extension = fileName.includes('.') ? '' : '.bin';
      
      return `${fileName}${extension}`;
    } catch (error) {
      return `download_${Date.now()}.bin`;
    }
  }

  private getMimeTypeFromUrl(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    
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
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    return mimeTypes[extension || ''] || 'application/octet-stream';
  }

  getDownloadsDirectory(): string {
    return this.downloadsDir;
  }

  getCacheDirectory(): string {
    return this.cacheDir;
  }
}

export const fileDownloadService = new FileDownloadService();
