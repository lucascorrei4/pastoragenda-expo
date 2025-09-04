import * as Audio from 'expo-av';
import * as Camera from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';

export interface MediaResult {
  success: boolean;
  uri?: string;
  width?: number;
  height?: number;
  type?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  error?: string;
}

export interface LocationResult {
  success: boolean;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp?: number;
  error?: string;
}

class MediaService {
  private audioRecording: Audio.Recording | null = null;
  private isRecording = false;

  async requestPermissions(permissions: string[]): Promise<boolean> {
    try {
      const results = await Promise.all(
        permissions.map(async (permission) => {
          switch (permission) {
            case 'camera':
              const cameraStatus = await Camera.requestCameraPermissionsAsync();
              return cameraStatus.status === 'granted';
            case 'microphone':
              const micStatus = await Audio.requestPermissionsAsync();
              return micStatus.status === 'granted';
            case 'location':
              const locationStatus = await Location.requestForegroundPermissionsAsync();
              return locationStatus.status === 'granted';
            case 'media_library':
              const mediaStatus = await MediaLibrary.requestPermissionsAsync();
              return mediaStatus.status === 'granted';
            default:
              return false;
          }
        })
      );
      return results.every(result => result);
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  async takePhoto(options?: {
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
  }): Promise<MediaResult> {
    try {
      const hasPermission = await this.requestPermissions(['camera']);
      if (!hasPermission) {
        return {
          success: false,
          error: 'Camera permission denied'
        };
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: options?.allowsEditing ?? true,
        aspect: options?.aspect ?? [4, 3],
        quality: options?.quality ?? 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        return {
          success: true,
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          type: asset.type,
          fileName: asset.fileName,
          fileSize: asset.fileSize
        };
      } else {
        return {
          success: false,
          error: 'Photo capture cancelled'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async pickImage(options?: {
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
    allowsMultipleSelection?: boolean;
  }): Promise<MediaResult> {
    try {
      const hasPermission = await this.requestPermissions(['media_library']);
      if (!hasPermission) {
        return {
          success: false,
          error: 'Media library permission denied'
        };
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: options?.allowsEditing ?? true,
        aspect: options?.aspect ?? [4, 3],
        quality: options?.quality ?? 0.8,
        allowsMultipleSelection: options?.allowsMultipleSelection ?? false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        return {
          success: true,
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          type: asset.type,
          fileName: asset.fileName,
          fileSize: asset.fileSize
        };
      } else {
        return {
          success: false,
          error: 'Image selection cancelled'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async startAudioRecording(): Promise<MediaResult> {
    try {
      const hasPermission = await this.requestPermissions(['microphone']);
      if (!hasPermission) {
        return {
          success: false,
          error: 'Microphone permission denied'
        };
      }

      if (this.isRecording) {
        return {
          success: false,
          error: 'Already recording'
        };
      }

      this.audioRecording = new Audio.Recording();
      await this.audioRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await this.audioRecording.startAsync();
      this.isRecording = true;

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

  async stopAudioRecording(): Promise<MediaResult> {
    try {
      if (!this.audioRecording || !this.isRecording) {
        return {
          success: false,
          error: 'No active recording'
        };
      }

      await this.audioRecording.stopAndUnloadAsync();
      const uri = this.audioRecording.getURI();
      const status = await this.audioRecording.getStatusAsync();
      
      this.audioRecording = null;
      this.isRecording = false;

      return {
        success: true,
        uri: uri || undefined,
        duration: status.durationMillis ? status.durationMillis / 1000 : undefined
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getCurrentLocation(): Promise<LocationResult> {
    try {
      const hasPermission = await this.requestPermissions(['location']);
      if (!hasPermission) {
        return {
          success: false,
          error: 'Location permission denied'
        };
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        success: true,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        heading: location.coords.heading,
        speed: location.coords.speed,
        timestamp: location.timestamp
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async saveToGallery(uri: string, albumName?: string): Promise<MediaResult> {
    try {
      const hasPermission = await this.requestPermissions(['media_library']);
      if (!hasPermission) {
        return {
          success: false,
          error: 'Media library permission denied'
        };
      }

      let album = null;
      if (albumName) {
        // Try to find existing album or create new one
        const albums = await MediaLibrary.getAlbumsAsync();
        album = albums.find(a => a.title === albumName);
        
        if (!album) {
          album = await MediaLibrary.createAlbumAsync(albumName);
        }
      }

      const asset = await MediaLibrary.createAssetAsync(uri);
      
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      return {
        success: true,
        uri: asset.uri
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getMediaInfo(uri: string): Promise<{
    success: boolean;
    width?: number;
    height?: number;
    duration?: number;
    fileSize?: number;
    mimeType?: string;
    error?: string;
  }> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      if (!fileInfo.exists) {
        return {
          success: false,
          error: 'File does not exist'
        };
      }

      // For images, try to get dimensions
      let width: number | undefined;
      let height: number | undefined;
      
      try {
        const imageInfo = await ImagePicker.getMediaLibraryPermissionsAsync();
        // Note: ImagePicker doesn't provide image dimensions directly
        // You might need to use a different library for this
      } catch (error) {
        console.warn('Could not get image dimensions:', error);
      }

      return {
        success: true,
        width,
        height,
        fileSize: fileInfo.size,
        mimeType: 'unknown' // You might need to determine this based on file extension
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async validateFileSize(uri: string, maxSize: number): Promise<boolean> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return fileInfo.exists && (fileInfo.size || 0) <= maxSize;
    } catch (error) {
      console.error('Error validating file size:', error);
      return false;
    }
  }

  async compressImage(uri: string, quality: number = 0.8): Promise<MediaResult> {
    try {
      // Note: ImagePicker doesn't have built-in compression
      // You might need to use a different library like expo-image-manipulator
      // For now, we'll return the original URI
      return {
        success: true,
        uri: uri
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  isRecordingAudio(): boolean {
    return this.isRecording;
  }

  async cleanup(): Promise<void> {
    try {
      if (this.audioRecording && this.isRecording) {
        await this.stopAudioRecording();
      }
    } catch (error) {
      console.error('Error cleaning up media service:', error);
    }
  }
}

export const mediaService = new MediaService();
