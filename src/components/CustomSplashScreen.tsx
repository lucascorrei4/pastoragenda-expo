import React from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface CustomSplashScreenProps {
  visible: boolean;
}

export const CustomSplashScreen: React.FC<CustomSplashScreenProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/images/splash-icon.png')} 
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  logo: {
    width: 400,
    height: 400,
  },
});
