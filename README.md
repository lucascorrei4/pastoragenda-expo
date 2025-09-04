# Pastor Agenda PWA Wrapper

A comprehensive Expo React Native application that serves as a PWA wrapper for the Pastor Agenda web application (https://pastoragenda.com) with native capabilities including push notifications, media access, file management, and more.

## Features

### Core Features
- **WebView Container**: Full-screen WebView with native navigation support
- **JavaScript Bridge**: Bidirectional communication between web app and native app
- **Push Notifications**: Expo Notifications integration with device registration
- **Media Permissions**: Camera, photo library, audio recording, and location access
- **File Management**: Download, share, and save files to device storage
- **Deep Linking**: Support for navigation from notifications to specific web app sections

### Native Capabilities
- Camera access for photo/video capture
- Photo library access for media selection
- Audio recording capabilities
- Location services integration
- File download and sharing
- Document picker integration
- Device vibration and alerts
  - Background and foreground notification handling

## Project Structure

```
src/
├── components/
│   ├── WebViewContainer.tsx    # Main WebView component with bridge
│   ├── WebViewBridge.tsx       # JavaScript bridge implementation
│   └── styles.ts               # Common styles and themes
├── context/
│   └── TokenNotificationContext.tsx  # Push notification context
├── hooks/
│   └── useTokenNotification.ts       # Hook for notification context
├── services/
│   ├── pushNotificationService.ts    # Push notification management
│   ├── mediaService.ts               # Media capture and access
│   ├── fileDownloadService.ts        # File download and sharing
│   └── requests.ts                   # API request service
├── screens/
│   └── Home/
│       └── index.tsx                 # Main home screen
└── routes/
    └── index.tsx                     # Navigation configuration
```

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   Update `src/env.ts` with your specific configuration:
   ```typescript
   export const env = {
     APP_URL: "https://pastoragenda.com",
     API_URL: "https://api.pastoragenda.com/api",
     // ... other configuration
   };
   ```

3. **Configure push notifications**:
   Update the project ID in `src/services/pushNotificationService.ts`:
   ```typescript
   const token = await Notifications.getExpoPushTokenAsync({
     projectId: 'your-project-id-here',
   });
   ```

## Usage

### Web App Integration

The web application can communicate with the native app using the global `ReactNativeBridge` object:

```javascript
// Request permissions
const permissions = await window.ReactNativeBridge.requestPermissions(['camera', 'microphone']);

// Take a photo
const photoResult = await window.ReactNativeBridge.takePhoto({
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.8
});

// Pick image from gallery
const imageResult = await window.ReactNativeBridge.pickImage({
  allowsEditing: true,
  quality: 0.8
});

// Record audio
const audioResult = await window.ReactNativeBridge.recordAudio();

// Get device location
const locationResult = await window.ReactNativeBridge.getLocation();

// Download file
const downloadResult = await window.ReactNativeBridge.downloadFile(url, fileName);

// Share file
const shareResult = await window.ReactNativeBridge.shareFile(uri, mimeType);

// Vibrate device
await window.ReactNativeBridge.vibrate([0, 250, 250, 250]);

// Show native alert
await window.ReactNativeBridge.showAlert('Title', 'Message', [
  { text: 'OK', onPress: () => console.log('OK pressed') }
]);
```

### Push Notifications

The app automatically registers for push notifications on startup. The push token is sent to the web app via the bridge:

```javascript
// Listen for push token
window.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'PUSH_TOKEN') {
    console.log('Push token:', message.data.token);
    // Send token to your backend
  }
});
```

### Media Services

The app provides comprehensive media services:

```typescript
import { mediaService } from './src/services/mediaService';

// Take photo
const photoResult = await mediaService.takePhoto({
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.8
});

// Pick image
const imageResult = await mediaService.pickImage({
  allowsEditing: true,
  quality: 0.8
});

// Record audio
await mediaService.startAudioRecording();
// ... later
const audioResult = await mediaService.stopAudioRecording();

// Get location
const locationResult = await mediaService.getCurrentLocation();
```

### File Management

```typescript
import { fileDownloadService } from './src/services/fileDownloadService';

// Download file
const downloadResult = await fileDownloadService.downloadFile(
  'https://example.com/file.pdf',
  'document.pdf'
);

// Share file
const shareResult = await fileDownloadService.shareFile(
  fileUri,
  'application/pdf'
);

// Save to gallery
const saveResult = await fileDownloadService.saveToGallery(
  fileUri,
  'PastorAgenda'
);
```

## Configuration

### App Configuration (app.json)

The app is configured with all necessary permissions and plugins:

- **iOS**: Camera, microphone, location, photo library permissions
- **Android**: All required permissions for media access and notifications
- **Plugins**: Location, image picker, camera, media library, file system, notifications

### Configuration

The app configuration is managed through `app.json` and environment variables:

**App Configuration (`app.json`):**
- Contains all static app settings
- EAS project configuration
- Platform-specific settings
- Plugin configurations

**Environment Variables Setup:**

1. **Copy the example file:**
   ```bash
   cp env.example .env
   ```

2. **Edit `.env` with your actual values:**
   ```bash
   # .env
   API_URL=https://qllicbvfcggtveuzvbqu.supabase.co/functions/v1
   SUPABASE_ANON_KEY=your_actual_supabase_anon_key_here
   APP_URL=https://pastoragenda.com
   ```

3. **The `.env` file is already in `.gitignore`** - it won't be committed to version control

4. **Environment variables are loaded automatically** via `app.config.js` and `src/env.ts`

**⚠️ SECURITY WARNING**: Never commit your `.env` file! It contains sensitive API keys.

## Building and Deployment

### Development

```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

### Production Build

```bash
# Build for iOS
npm run build:ios

# Build for Android
npm run build:android

# Build for both platforms
npm run build:all
```

### EAS Build Configuration

The app is configured for EAS Build with:
- Development, preview, and production build profiles
- Proper signing certificates for iOS and Android
- App store deployment configuration

## Testing

### Manual Testing Checklist

- [ ] WebView loads Pastor Agenda website correctly
- [ ] JavaScript bridge communication works
- [ ] Push notifications register and receive
- [ ] Camera permission and photo capture
- [ ] Image picker from gallery
- [ ] Audio recording functionality
- [ ] Location services access
- [ ] File download and sharing
- [ ] Deep linking from notifications
- [ ] Android back button navigation
- [ ] Error handling and retry mechanisms

### Testing Commands

```bash
# Run linter
npm run lint

# Type checking
npx tsc --noEmit
```

## Troubleshooting

### Common Issues

1. **WebView not loading**: Check internet connection and URL configuration
2. **Permissions denied**: Ensure permissions are properly configured in app.json
3. **Push notifications not working**: Verify project ID and notification configuration
4. **Bridge communication issues**: Check JavaScript console for errors

### Debug Mode

Enable debug logging by setting:
```typescript
console.log('Debug mode enabled');
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the Expo documentation for specific features

## Changelog

### Version 1.0.0
- Initial release
- WebView container with JavaScript bridge
- Push notification integration
- Media services (camera, audio, location)
- File download and sharing
- Comprehensive permission management
- Deep linking support