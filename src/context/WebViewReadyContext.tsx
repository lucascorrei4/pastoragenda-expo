import React, { createContext, useCallback, useContext, useState } from 'react';

interface WebViewReadyContextType {
  isWebViewReady: boolean;
  setWebViewReady: (ready: boolean) => void;
  onWebViewReady: () => void;
}

const WebViewReadyContext = createContext<WebViewReadyContextType | undefined>(undefined);

export const useWebViewReady = () => {
  const context = useContext(WebViewReadyContext);
  if (!context) {
    throw new Error('useWebViewReady must be used within a WebViewReadyProvider');
  }
  return context;
};

interface WebViewReadyProviderProps {
  children: React.ReactNode;
  onReady?: () => void;
}

export const WebViewReadyProvider: React.FC<WebViewReadyProviderProps> = ({ 
  children, 
  onReady 
}) => {
  const [isWebViewReady, setIsWebViewReady] = useState(false);

  const setWebViewReady = useCallback((ready: boolean) => {
    setIsWebViewReady(ready);
  }, []);

  const handleWebViewReady = useCallback(() => {
    console.log('WebView ready signal received in context');
    setIsWebViewReady(true);
    onReady?.();
  }, [onReady]);

  const value: WebViewReadyContextType = {
    isWebViewReady,
    setWebViewReady,
    onWebViewReady: handleWebViewReady,
  };

  return (
    <WebViewReadyContext.Provider value={value}>
      {children}
    </WebViewReadyContext.Provider>
  );
};
