import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useTokenNotification } from '../context/TokenNotificationContext';
import { env } from '../env';
import { webViewStyles } from './styles';
import { BridgeMessage, WebViewBridge } from './WebViewBridge';

interface WebViewContainerProps {
  onNavigationStateChange?: (navState: any) => void;
  onMessage?: (message: any) => void;
  onError?: (error: any) => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onWebViewReady?: () => void;
  initialUrl?: string;
}

export const WebViewContainer: React.FC<WebViewContainerProps> = ({
  onNavigationStateChange,
  onMessage,
  onError,
  onLoadStart,
  onLoadEnd,
  onWebViewReady,
  initialUrl = env.APP_URL,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isWebViewMounted, setIsWebViewMounted] = useState(false);
  const [isWebViewReady, setIsWebViewReady] = useState(false);
  const [bridge, setBridge] = useState<WebViewBridge | null>(null);
  const { pushToken, isRegistered } = useTokenNotification();
  const insets = useSafeAreaInsets();

  // Initialize bridge
  useEffect(() => {
    const webViewBridge = new WebViewBridge(webViewRef, onMessage);
    setBridge(webViewBridge);
  }, [onMessage]);

  // Send push token to web app when available
  useEffect(() => {
    if (pushToken && isRegistered && bridge) {
      const message: BridgeMessage = {
        type: 'PUSH_TOKEN',
        data: { token: pushToken, isRegistered }
      };
      bridge.sendToWebView(message);
    }
  }, [pushToken, isRegistered, bridge]);

  // Handle user authentication from web app
  const handleUserAuth = useCallback(async (userData: any) => {
    console.log('User authentication received from web app:', userData);
    
    // Update device registration with user info
    if (bridge) {
      const message: BridgeMessage = {
        type: 'UPDATE_USER_INFO',
        data: {
          userId: userData.userId,
          userEmail: userData.userEmail,
          userToken: userData.userToken
        }
      };
      await bridge.handleMessage(message);
    }
  }, [bridge]);

  // WebView mounting detection
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsWebViewMounted(true);
      console.log('WebView mounted');
    }, 100); // Small delay to ensure WebView is mounted

    return () => clearTimeout(timer);
  }, []);

  // Notify when WebView is ready
  React.useEffect(() => {
    if (isWebViewMounted && !isLoading && !hasError && onWebViewReady) {
      setIsWebViewReady(true);
      onWebViewReady();
      console.log('WebView ready - notifying parent');
    }
  }, [isWebViewMounted, isLoading, hasError, onWebViewReady]);

  // Add timeout to prevent infinite loading
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('WebView loading timeout - forcing load end');
        setIsLoading(false);
        setHasError(true);
      }
    }, 15000); // Increased to 15 second timeout

    return () => clearTimeout(timeout);
  }, [isLoading]);

  // Handle Android back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      };

      if (Platform.OS === 'android') {
        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
      }
    }, [canGoBack])
  );

  const handleNavigationStateChange = (navState: any) => {
    console.log('Navigation state changed:', navState);
    setCanGoBack(navState.canGoBack);
    setIsLoading(navState.loading);
    onNavigationStateChange?.(navState);
  };

  const handleMessage = async (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as BridgeMessage;
      console.log('WebView message received:', message);
      
      // Handle special user authentication messages
      if (message.type === 'USER_AUTH') {
        await handleUserAuth(message.data);
        return;
      }
      
      // Handle message through bridge
      if (bridge) {
        await bridge.handleMessage(message);
      }
      
      // Also call the original onMessage callback
      onMessage?.(message);
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const handleError = (error: any) => {
    console.error('WebView error:', error);
    setHasError(true);
    setIsLoading(false);
    onError?.(error);
    
    // Auto-retry up to 3 times
    if (retryCount < 3) {
      console.log(`Auto-retrying... attempt ${retryCount + 1}`);
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setHasError(false);
        setIsLoading(true);
        webViewRef.current?.reload();
      }, 2000);
    } else {
      Alert.alert(
        'Loading Error',
        'There was an error loading the Pastor Agenda website. Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: () => {
            setRetryCount(0);
            setHasError(false);
            setIsLoading(true);
            webViewRef.current?.reload();
          }},
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleLoadStart = () => {
    console.log('WebView load started for URL:', initialUrl);
    setIsLoading(true);
    setHasError(false);
    onLoadStart?.();
  };

  const handleLoadEnd = () => {
    console.log('WebView load completed for URL:', initialUrl);
    setIsLoading(false);
    onLoadEnd?.();
    
    // Additional check to ensure WebView is truly ready
    setTimeout(() => {
      if (isWebViewMounted && !hasError && onWebViewReady && !isWebViewReady) {
        setIsWebViewReady(true);
        onWebViewReady();
        console.log('WebView load end - notifying ready');
      }
    }, 500); // Small delay to ensure content is rendered
  };

  // Enhanced JavaScript bridge for comprehensive communication
  const bridgeScript = `
    (function() {
      console.log('WebView bridge initialized');
      
      // Create a global bridge object for the web app to use
      window.ReactNativeBridge = {
        // Send message to React Native
        sendMessage: function(type, data) {
          const message = {
            type: type,
            data: data,
            id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
          };
          window.ReactNativeWebView.postMessage(JSON.stringify(message));
        },
        
        // Request permissions
        requestPermissions: function(permissions) {
          return new Promise((resolve) => {
            const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const message = {
              type: 'REQUEST_PERMISSIONS',
              data: { permissions: permissions },
              id: messageId
            };
            
            // Set up listener for response
            const originalPostMessage = window.ReactNativeWebView.postMessage;
            const listener = function(event) {
              try {
                const response = JSON.parse(event.data);
                if (response.id === messageId) {
                  window.removeEventListener('message', listener);
                  resolve(response.data);
                }
              } catch (e) {
                // Ignore parsing errors
              }
            };
            window.addEventListener('message', listener);
            
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
          });
        },
        
        // Take photo
        takePhoto: function(options) {
          return new Promise((resolve) => {
            const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const message = {
              type: 'TAKE_PHOTO',
              data: { ...options },
              id: messageId
            };
            
            const listener = function(event) {
              try {
                const response = JSON.parse(event.data);
                if (response.id === messageId) {
                  window.removeEventListener('message', listener);
                  resolve(response.data);
                }
              } catch (e) {
                // Ignore parsing errors
              }
            };
            window.addEventListener('message', listener);
            
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
          });
        },
        
        // Pick image from gallery
        pickImage: function(options) {
          return new Promise((resolve) => {
            const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const message = {
              type: 'PICK_IMAGE',
              data: { ...options },
              id: messageId
            };
            
            const listener = function(event) {
              try {
                const response = JSON.parse(event.data);
                if (response.id === messageId) {
                  window.removeEventListener('message', listener);
                  resolve(response.data);
                }
              } catch (e) {
                // Ignore parsing errors
              }
            };
            window.addEventListener('message', listener);
            
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
          });
        },
        
        // Record audio
        recordAudio: function(options) {
          return new Promise((resolve) => {
            const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const message = {
              type: 'RECORD_AUDIO',
              data: { ...options },
              id: messageId
            };
            
            const listener = function(event) {
              try {
                const response = JSON.parse(event.data);
                if (response.id === messageId) {
                  window.removeEventListener('message', listener);
                  resolve(response.data);
                }
              } catch (e) {
                // Ignore parsing errors
              }
            };
            window.addEventListener('message', listener);
            
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
          });
        },
        
        // Get location
        getLocation: function(options) {
          return new Promise((resolve) => {
            const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const message = {
              type: 'GET_LOCATION',
              data: { ...options },
              id: messageId
            };
            
            const listener = function(event) {
              try {
                const response = JSON.parse(event.data);
                if (response.id === messageId) {
                  window.removeEventListener('message', listener);
                  resolve(response.data);
                }
              } catch (e) {
                // Ignore parsing errors
              }
            };
            window.addEventListener('message', listener);
            
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
          });
        },
        
        // Download file
        downloadFile: function(url, fileName) {
          return new Promise((resolve) => {
            const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const message = {
              type: 'DOWNLOAD_FILE',
              data: { url: url, fileName: fileName },
              id: messageId
            };
            
            const listener = function(event) {
              try {
                const response = JSON.parse(event.data);
                if (response.id === messageId) {
                  window.removeEventListener('message', listener);
                  resolve(response.data);
                }
              } catch (e) {
                // Ignore parsing errors
              }
            };
            window.addEventListener('message', listener);
            
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
          });
        },
        
        // Share file
        shareFile: function(uri, mimeType) {
          return new Promise((resolve) => {
            const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const message = {
              type: 'SHARE_FILE',
              data: { uri: uri, mimeType: mimeType },
              id: messageId
            };
            
            const listener = function(event) {
              try {
                const response = JSON.parse(event.data);
                if (response.id === messageId) {
                  window.removeEventListener('message', listener);
                  resolve(response.data);
                }
              } catch (e) {
                // Ignore parsing errors
              }
            };
            window.addEventListener('message', listener);
            
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
          });
        },
        
        // Vibrate device
        vibrate: function(pattern) {
          return new Promise((resolve) => {
            const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const message = {
              type: 'VIBRATE',
              data: { pattern: pattern },
              id: messageId
            };
            
            const listener = function(event) {
              try {
                const response = JSON.parse(event.data);
                if (response.id === messageId) {
                  window.removeEventListener('message', listener);
                  resolve(response.data);
                }
              } catch (e) {
                // Ignore parsing errors
              }
            };
            window.addEventListener('message', listener);
            
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
          });
        },
        
        // Show alert
        showAlert: function(title, message, buttons) {
          return new Promise((resolve) => {
            const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const message = {
              type: 'SHOW_ALERT',
              data: { title: title, message: message, buttons: buttons },
              id: messageId
            };
            
            const listener = function(event) {
              try {
                const response = JSON.parse(event.data);
                if (response.id === messageId) {
                  window.removeEventListener('message', listener);
                  resolve(response.data);
                }
              } catch (e) {
                // Ignore parsing errors
              }
            };
            window.addEventListener('message', listener);
            
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
          });
        },
        
        // Update user authentication info
        updateUserAuth: function(userId, userEmail, userToken) {
          const message = {
            type: 'USER_AUTH',
            data: {
              userId: userId,
              userEmail: userEmail,
              userToken: userToken
            }
          };
          window.ReactNativeWebView.postMessage(JSON.stringify(message));
        },
        
        // Get current push token
        getPushToken: function() {
          return new Promise((resolve) => {
            const listener = function(event) {
              try {
                const response = JSON.parse(event.data);
                if (response.type === 'PUSH_TOKEN') {
                  window.removeEventListener('message', listener);
                  resolve(response.data);
                }
              } catch (e) {
                // Ignore parsing errors
              }
            };
            window.addEventListener('message', listener);
            
            // Request push token
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'GET_PUSH_TOKEN',
              data: {}
            }));
          });
        }
      };
      
      // Notify that bridge is ready
      window.ReactNativeBridge.sendMessage('BRIDGE_READY', {});
      
      console.log('ReactNativeBridge object created and ready');
    })();
    true;
  `;

  if (hasError) {
    return (
      <View style={[webViewStyles.container, { paddingTop: insets.top }]}>
        <View style={webViewStyles.errorContainer}>
          <View style={webViewStyles.errorContent}>
            <Text style={webViewStyles.errorTitle}>Loading Error</Text>
            <Text style={webViewStyles.errorMessage}>
              Failed to load the Pastor Agenda website. Please check your internet connection and try again.
            </Text>
            {retryCount > 0 && (
              <Text style={webViewStyles.retryText}>
                Retry attempt: {retryCount}/3
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  }

  // Show loading state until WebView is ready
  if (!isWebViewMounted || isLoading) {
    return (
      <View style={[webViewStyles.container, { paddingTop: insets.top }]}>
        <View style={[webViewStyles.loadingContainer, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={env.PRIMARY_COLOR} />
        </View>
      </View>
    );
  }

  return (
    <View style={[webViewStyles.container, { paddingTop: insets.top }]}>
      <WebView
        ref={webViewRef}
        source={{ uri: initialUrl }}
        style={webViewStyles.webView}
        onShouldStartLoadWithRequest={(request) => {
          console.log('Should start load with request:', request);
          return true;
        }}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleMessage}
        onError={handleError}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.log('WebView HTTP error:', nativeEvent);
          setHasError(true);
          setIsLoading(false);
        }}
        onLoadProgress={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.log('WebView load progress:', nativeEvent.progress);
        }}
        injectedJavaScript={bridgeScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo={true}
        mixedContentMode="compatibility"
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        cacheEnabled={true}
        incognito={false}
        userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36 PastorAgendaApp/1.0.0"
      />
    </View>
  );
};
