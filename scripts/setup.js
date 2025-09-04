#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Pastor Agenda App...\n');

// Check if required files exist
const requiredFiles = [
  'src/env.ts',
  'src/services/pushNotificationService.ts',
  'src/services/mediaService.ts',
  'src/components/WebViewContainer.tsx',
  'app.json',
  'package.json'
];

console.log('📋 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - Missing!`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing. Please check the setup.');
  process.exit(1);
}

console.log('\n✅ All required files are present!');

// Check package.json dependencies
console.log('\n📦 Checking dependencies...');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

const requiredDeps = [
  'expo',
  'react-native-webview',
  'expo-notifications',
  'expo-camera',
  'expo-image-picker',
  'expo-location',
  'expo-file-system',
  'expo-media-library'
];

let allDepsInstalled = true;
requiredDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(`✅ ${dep} - ${packageJson.dependencies[dep]}`);
  } else {
    console.log(`❌ ${dep} - Missing!`);
    allDepsInstalled = false;
  }
});

if (!allDepsInstalled) {
  console.log('\n❌ Some required dependencies are missing. Please run: npm install');
  process.exit(1);
}

console.log('\n✅ All dependencies are installed!');

// Check app.json configuration
console.log('\n⚙️  Checking app configuration...');
const appJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'app.json'), 'utf8'));

const requiredConfig = [
  'expo.name',
  'expo.slug',
  'expo.ios.bundleIdentifier',
  'expo.android.package',
  'expo.plugins'
];

let configValid = true;
requiredConfig.forEach(config => {
  const keys = config.split('.');
  let value = appJson;
  for (const key of keys) {
    value = value?.[key];
  }
  
  if (value) {
    console.log(`✅ ${config} - ${typeof value === 'object' ? 'Configured' : value}`);
  } else {
    console.log(`❌ ${config} - Missing!`);
    configValid = false;
  }
});

if (!configValid) {
  console.log('\n❌ App configuration is incomplete. Please check app.json');
  process.exit(1);
}

console.log('\n✅ App configuration is valid!');

console.log('\n🎉 Setup complete! You can now run:');
console.log('  npm start     - Start the development server');
console.log('  npm run ios   - Run on iOS simulator');
console.log('  npm run android - Run on Android emulator');
console.log('  npm run web   - Run on web browser');

console.log('\n📚 Next steps:');
console.log('1. Update src/env.ts with your API endpoints');
console.log('2. Update app.json with your app bundle identifier');
console.log('3. Configure push notification settings');
console.log('4. Test the app on a physical device for full functionality');

console.log('\n🔗 Useful links:');
console.log('- Expo Documentation: https://docs.expo.dev/');
console.log('- React Native WebView: https://github.com/react-native-webview/react-native-webview');
console.log('- Expo Notifications: https://docs.expo.dev/versions/latest/sdk/notifications/');