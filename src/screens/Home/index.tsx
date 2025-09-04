import React from 'react';
import { WebViewContainer } from '../../components/WebViewContainer';
import { env } from '../../env';

export default function HomeScreen() {
  const handleNavigationStateChange = (navState: any) => {
    console.log('Navigation state changed:', navState);
  };

  const handleWebViewMessage = (message: any) => {
    console.log('WebView message received:', message);
    // Handle different message types
    switch (message.type) {
      case 'SHOW_ALERT':
        // Handle alert from web app
        console.log('Alert from web:', message.data);
        break;
      case 'VIBRATE':
        // Handle vibration request
        console.log('Vibrate request:', message.data);
        break;
      case 'NAVIGATE_TO':
        // Handle navigation request
        console.log('Navigate to:', message.data.url);
        break;
      case 'GO_BACK':
        // Handle go back request
        console.log('Go back requested');
        break;
      case 'RELOAD':
        // Handle reload request
        console.log('Reload requested');
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  };

  const handleWebViewError = (error: any) => {
    console.error('WebView error:', error);
  };

  const handleLoadStart = () => {
    console.log('WebView load started');
  };

  const handleLoadEnd = () => {
    console.log('WebView load completed');
  };

  return (
    <WebViewContainer
      onNavigationStateChange={handleNavigationStateChange}
      onMessage={handleWebViewMessage}
      onError={handleWebViewError}
      onLoadStart={handleLoadStart}
      onLoadEnd={handleLoadEnd}
      initialUrl={env.APP_URL}
    />
  );
}
