import * as Audio from 'expo-av';
import * as Camera from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import React from 'react';
import { Alert, Platform, Vibration } from 'react-native';
import { WebView } from 'react-native-webview';
import { env } from '../env';

export interface WebViewBridgeProps {
  webViewRef: React.RefObject<WebView>;
  onMessage?: (message: any) => void;
}

export interface BridgeMessage {
  type: string;
  data?: any;
  id?: string;
}

export class WebViewBridge {
  private webViewRef: React.RefObject<WebView | null>;
  private onMessage?: (message: any) => void;
  private messageId = 0;

  constructor(webViewRef: React.RefObject<WebView | null>, onMessage?: (message: any) => void) {
    this.webViewRef = webViewRef;
    this.onMessage = onMessage;
  }

  private generateMessageId(): string {
    return `msg_${++this.messageId}_${Date.now()}`;
  }

  public sendToWebView(message: BridgeMessage) {
    if (this.webViewRef.current) {
      const script = `
        window.ReactNativeWebView.postMessage(${JSON.stringify(message)});
        true;
      `;
      this.webViewRef.current.injectJavaScript(script);
    }
  }

  private async requestPermissions(permissions: string[]): Promise<boolean> {
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

  public async handleMessage(message: BridgeMessage): Promise<void> {
    console.log('Bridge handling message:', message);

    try {
      switch (message.type) {
        case 'REQUEST_PERMISSIONS':
          await this.handleRequestPermissions(message.data);
          break;
        case 'TAKE_PHOTO':
          await this.handleTakePhoto(message.data);
          break;
        case 'PICK_IMAGE':
          await this.handlePickImage(message.data);
          break;
        case 'RECORD_AUDIO':
          await this.handleRecordAudio(message.data);
          break;
        case 'GET_LOCATION':
          await this.handleGetLocation(message.data);
          break;
        case 'DOWNLOAD_FILE':
          await this.handleDownloadFile(message.data);
          break;
        case 'SAVE_TO_GALLERY':
          await this.handleSaveToGallery(message.data);
          break;
        case 'SHARE_FILE':
          await this.handleShareFile(message.data);
          break;
        case 'PICK_DOCUMENT':
          await this.handlePickDocument(message.data);
          break;
        case 'VIBRATE':
          await this.handleVibrate(message.data);
          break;
        case 'SHOW_ALERT':
          await this.handleShowAlert(message.data);
          break;
        case 'GET_DEVICE_INFO':
          await this.handleGetDeviceInfo(message.data);
          break;
        case 'UPDATE_USER_INFO':
          await this.handleUpdateUserInfo(message.data);
          break;
        case 'OPEN_URL':
          await this.handleOpenUrl(message.data);
          break;
        default:
          console.warn('Unknown message type:', message.type);
          this.sendToWebView({
            type: 'ERROR',
            data: { error: 'Unknown message type', type: message.type },
            id: message.id
          });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.sendToWebView({
        type: 'ERROR',
        data: { error: error.message, type: message.type },
        id: message.id
      });
    }
  }

  private async handleRequestPermissions(data: any) {
    const { permissions, id } = data;
    const granted = await this.requestPermissions(permissions);
    
    this.sendToWebView({
      type: 'PERMISSIONS_RESULT',
      data: { granted, permissions },
      id
    });
  }

  private async handleTakePhoto(data: any) {
    const { id } = data;
    
    try {
      const hasPermission = await this.requestPermissions(['camera']);
      if (!hasPermission) {
        this.sendToWebView({
          type: 'PHOTO_RESULT',
          data: { success: false, error: 'Camera permission denied' },
          id
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        this.sendToWebView({
          type: 'PHOTO_RESULT',
          data: {
            success: true,
            uri: asset.uri,
            width: asset.width,
            height: asset.height,
            type: asset.type,
            fileName: asset.fileName,
            fileSize: asset.fileSize
          },
          id
        });
      } else {
        this.sendToWebView({
          type: 'PHOTO_RESULT',
          data: { success: false, error: 'Photo capture cancelled' },
          id
        });
      }
    } catch (error) {
      this.sendToWebView({
        type: 'PHOTO_RESULT',
        data: { success: false, error: error.message },
        id
      });
    }
  }

  private async handlePickImage(data: any) {
    const { id } = data;
    
    try {
      const hasPermission = await this.requestPermissions(['media_library']);
      if (!hasPermission) {
        this.sendToWebView({
          type: 'IMAGE_PICK_RESULT',
          data: { success: false, error: 'Media library permission denied' },
          id
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        this.sendToWebView({
          type: 'IMAGE_PICK_RESULT',
          data: {
            success: true,
            uri: asset.uri,
            width: asset.width,
            height: asset.height,
            type: asset.type,
            fileName: asset.fileName,
            fileSize: asset.fileSize
          },
          id
        });
      } else {
        this.sendToWebView({
          type: 'IMAGE_PICK_RESULT',
          data: { success: false, error: 'Image selection cancelled' },
          id
        });
      }
    } catch (error) {
      this.sendToWebView({
        type: 'IMAGE_PICK_RESULT',
        data: { success: false, error: error.message },
        id
      });
    }
  }

  private async handleRecordAudio(data: any) {
    const { id } = data;
    
    try {
      const hasPermission = await this.requestPermissions(['microphone']);
      if (!hasPermission) {
        this.sendToWebView({
          type: 'AUDIO_RECORD_RESULT',
          data: { success: false, error: 'Microphone permission denied' },
          id
        });
        return;
      }

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      // For now, we'll record for 10 seconds max, but this could be controlled by the web app
      setTimeout(async () => {
        try {
          await recording.stopAndUnloadAsync();
          const uri = recording.getURI();
          
          this.sendToWebView({
            type: 'AUDIO_RECORD_RESULT',
            data: {
              success: true,
              uri: uri,
              duration: 10000 // 10 seconds
            },
            id
          });
        } catch (error) {
          this.sendToWebView({
            type: 'AUDIO_RECORD_RESULT',
            data: { success: false, error: error.message },
            id
          });
        }
      }, 10000);

    } catch (error) {
      this.sendToWebView({
        type: 'AUDIO_RECORD_RESULT',
        data: { success: false, error: error.message },
        id
      });
    }
  }

  private async handleGetLocation(data: any) {
    const { id } = data;
    
    try {
      const hasPermission = await this.requestPermissions(['location']);
      if (!hasPermission) {
        this.sendToWebView({
          type: 'LOCATION_RESULT',
          data: { success: false, error: 'Location permission denied' },
          id
        });
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      this.sendToWebView({
        type: 'LOCATION_RESULT',
        data: {
          success: true,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          altitude: location.coords.altitude,
          heading: location.coords.heading,
          speed: location.coords.speed,
          timestamp: location.timestamp
        },
        id
      });
    } catch (error) {
      this.sendToWebView({
        type: 'LOCATION_RESULT',
        data: { success: false, error: error.message },
        id
      });
    }
  }

  private async handleDownloadFile(data: any) {
    const { url, fileName, id } = data;
    
    try {
      const fileUri = FileSystem.documentDirectory + `${env.DOWNLOADS_DIR}/${fileName || 'download'}`;
      const downloadResult = await FileSystem.downloadAsync(url, fileUri);
      
      this.sendToWebView({
        type: 'DOWNLOAD_RESULT',
        data: {
          success: true,
          uri: downloadResult.uri,
          fileName: fileName,
          status: downloadResult.status
        },
        id
      });
    } catch (error) {
      this.sendToWebView({
        type: 'DOWNLOAD_RESULT',
        data: { success: false, error: error.message },
        id
      });
    }
  }

  private async handleSaveToGallery(data: any) {
    const { uri, id } = data;
    
    try {
      const hasPermission = await this.requestPermissions(['media_library']);
      if (!hasPermission) {
        this.sendToWebView({
          type: 'SAVE_GALLERY_RESULT',
          data: { success: false, error: 'Media library permission denied' },
          id
        });
        return;
      }

      const asset = await MediaLibrary.createAssetAsync(uri);
      
      this.sendToWebView({
        type: 'SAVE_GALLERY_RESULT',
        data: {
          success: true,
          assetId: asset.id,
          uri: asset.uri
        },
        id
      });
    } catch (error) {
      this.sendToWebView({
        type: 'SAVE_GALLERY_RESULT',
        data: { success: false, error: error.message },
        id
      });
    }
  }

  private async handleShareFile(data: any) {
    const { uri, mimeType, id } = data;
    
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        this.sendToWebView({
          type: 'SHARE_RESULT',
          data: { success: false, error: 'Sharing not available on this device' },
          id
        });
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: mimeType || 'application/octet-stream',
        dialogTitle: 'Share file'
      });
      
      this.sendToWebView({
        type: 'SHARE_RESULT',
        data: { success: true },
        id
      });
    } catch (error) {
      this.sendToWebView({
        type: 'SHARE_RESULT',
        data: { success: false, error: error.message },
        id
      });
    }
  }

  private async handlePickDocument(data: any) {
    const { id } = data;
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        this.sendToWebView({
          type: 'DOCUMENT_PICK_RESULT',
          data: {
            success: true,
            uri: asset.uri,
            name: asset.name,
            size: asset.size,
            mimeType: asset.mimeType
          },
          id
        });
      } else {
        this.sendToWebView({
          type: 'DOCUMENT_PICK_RESULT',
          data: { success: false, error: 'Document selection cancelled' },
          id
        });
      }
    } catch (error) {
      this.sendToWebView({
        type: 'DOCUMENT_PICK_RESULT',
        data: { success: false, error: error.message },
        id
      });
    }
  }

  private async handleVibrate(data: any) {
    const { pattern = env.VIBRATION_PATTERN } = data;
    
    try {
      if (Platform.OS === 'ios') {
        Vibration.vibrate();
      } else {
        Vibration.vibrate(pattern);
      }
      
      this.sendToWebView({
        type: 'VIBRATE_RESULT',
        data: { success: true },
        id: data.id
      });
    } catch (error) {
      this.sendToWebView({
        type: 'VIBRATE_RESULT',
        data: { success: false, error: error.message },
        id: data.id
      });
    }
  }

  private async handleShowAlert(data: any) {
    const { title, message, buttons, id } = data;
    
    try {
      Alert.alert(title || 'Alert', message || '', buttons || [{ text: 'OK' }]);
      
      this.sendToWebView({
        type: 'ALERT_RESULT',
        data: { success: true },
        id
      });
    } catch (error) {
      this.sendToWebView({
        type: 'ALERT_RESULT',
        data: { success: false, error: error.message },
        id
      });
    }
  }

  private async handleGetDeviceInfo(data: any) {
    const { id } = data;
    
    try {
      const deviceInfo = {
        platform: Platform.OS,
        version: Platform.Version,
        isDevice: true, // You might want to use expo-device for more detailed info
      };
      
      this.sendToWebView({
        type: 'DEVICE_INFO_RESULT',
        data: { success: true, deviceInfo },
        id
      });
    } catch (error) {
      this.sendToWebView({
        type: 'DEVICE_INFO_RESULT',
        data: { success: false, error: error.message },
        id
      });
    }
  }

  private async handleUpdateUserInfo(data: any) {
    const { userId, userEmail, userToken, id } = data;
    
    try {
      // Import the push notification service
      const { pushNotificationService } = await import('../services/pushNotificationService');
      
      // Update the device registration with user info
      await pushNotificationService.updateUserInfo({
        userId,
        userEmail,
        userToken
      });
      
      this.sendToWebView({
        type: 'USER_INFO_UPDATED',
        data: { 
          success: true, 
          userId, 
          userEmail 
        },
        id
      });
    } catch (error) {
      this.sendToWebView({
        type: 'USER_INFO_UPDATE_ERROR',
        data: { 
          success: false, 
          error: error.message 
        },
        id
      });
    }
  }

  private async handleOpenUrl(data: any) {
    const { url, id } = data;
    
    try {
      // This would typically use expo-web-browser
      // For now, we'll just send a success response
      this.sendToWebView({
        type: 'OPEN_URL_RESULT',
        data: { success: true, url },
        id
      });
    } catch (error) {
      this.sendToWebView({
        type: 'OPEN_URL_RESULT',
        data: { success: false, error: error.message },
        id
      });
    }
  }
}
