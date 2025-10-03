# Android Setup Guide - BerthCare Mobile

## Current Status

✅ **Completed:**
- React Native project initialized
- npm dependencies installed
- Android native project created

⚠️ **Pending:**
- Android Studio installation
- Android SDK configuration
- Android emulator setup

## Prerequisites

### 1. Install Java Development Kit (JDK)

React Native requires JDK 17 (Azul Zulu recommended).

**Check if JDK is installed:**
```bash
java -version
```

**Install JDK 17 (if needed):**

**Using Homebrew (macOS):**
```bash
brew install --cask zulu@17
```

**Manual Download:**
- Download from [Azul Zulu](https://www.azul.com/downloads/?package=jdk#zulu)
- Install JDK 17

**Set JAVA_HOME:**
```bash
# Add to ~/.zshrc or ~/.bash_profile
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export PATH=$JAVA_HOME/bin:$PATH
```

### 2. Install Android Studio

**Download:**
- Visit [Android Studio Download](https://developer.android.com/studio)
- Download the latest stable version

**Installation Steps:**
1. Open the downloaded `.dmg` file (macOS) or installer
2. Drag Android Studio to Applications
3. Launch Android Studio
4. Follow the setup wizard:
   - Choose "Standard" installation
   - Accept licenses
   - Download SDK components

### 3. Install Android SDK

During Android Studio setup, ensure these are installed:

**Required SDK Components:**
- Android SDK Platform 34 (or latest)
- Android SDK Build-Tools
- Android SDK Platform-Tools
- Android SDK Tools
- Android Emulator
- Intel x86 Emulator Accelerator (HAXM) - for Intel Macs
- Google Play Services

**Manual Installation (if needed):**
1. Open Android Studio
2. Go to **Settings > Languages & Frameworks > Android SDK**
3. Select **SDK Platforms** tab
4. Check **Android 14.0 (API 34)** or latest
5. Select **SDK Tools** tab
6. Check all required tools above
7. Click **Apply** to install

### 4. Configure Environment Variables

Add these to your `~/.zshrc` or `~/.bash_profile`:

```bash
# Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

**Apply changes:**
```bash
source ~/.zshrc  # or source ~/.bash_profile
```

**Verify:**
```bash
echo $ANDROID_HOME
# Should output: /Users/[your-username]/Library/Android/sdk

adb --version
# Should show Android Debug Bridge version
```

### 5. Create Android Virtual Device (AVD)

**Using Android Studio:**
1. Open Android Studio
2. Click **More Actions > Virtual Device Manager**
3. Click **Create Device**
4. Select a device (e.g., Pixel 7)
5. Select a system image (e.g., Android 14.0 - API 34)
6. Click **Next** and **Finish**

**Using Command Line:**
```bash
# List available system images
sdkmanager --list | grep system-images

# Download system image
sdkmanager "system-images;android-34;google_apis;arm64-v8a"

# Create AVD
avdmanager create avd -n Pixel_7_API_34 -k "system-images;android-34;google_apis;arm64-v8a" -d "pixel_7"
```

## Running on Android Emulator

### Method 1: Using npm script (Recommended)

```bash
# 1. Start emulator (if not already running)
emulator -avd Pixel_7_API_34 &

# 2. Run the app
cd mobile
npm run android
```

This will:
1. Start Metro bundler
2. Build the Android app
3. Install on running emulator
4. Launch the app

### Method 2: Using Android Studio

```bash
cd mobile/android
open -a "Android Studio" .
```

Then in Android Studio:
1. Wait for Gradle sync to complete
2. Select an emulator from the device dropdown
3. Click the Play button (▶️) or press `Ctrl + R`

### Method 3: Using React Native CLI

```bash
cd mobile

# List available devices
adb devices

# Run on specific device
npx react-native run-android --deviceId=<device-id>
```

## Building the Android App

### Debug Build

```bash
cd mobile/android
./gradlew assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release Build

```bash
cd mobile/android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

## Troubleshooting

### Issue: "ANDROID_HOME is not set"

**Solution:**
```bash
# Add to ~/.zshrc
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Reload
source ~/.zshrc

# Verify
echo $ANDROID_HOME
```

### Issue: "SDK location not found"

**Solution:**
Create `mobile/android/local.properties`:
```properties
sdk.dir=/Users/[your-username]/Library/Android/sdk
```

### Issue: "Gradle build failed"

**Solution:**
```bash
cd mobile/android

# Clean build
./gradlew clean

# Rebuild
./gradlew assembleDebug

# Or from mobile root
cd ..
npm run android
```

### Issue: "Unable to load script from assets"

**Solution:**
```bash
# Clear Metro cache
npm start -- --reset-cache

# In another terminal
npm run android
```

### Issue: "No connected devices"

**Solution:**
```bash
# List emulators
emulator -list-avds

# Start emulator
emulator -avd Pixel_7_API_34

# Verify device connected
adb devices
```

### Issue: "Emulator won't start"

**Solution:**
```bash
# Check if HAXM is installed (Intel Macs)
kextstat | grep intel

# Or check virtualization
sysctl kern.hv_support

# Restart ADB
adb kill-server
adb start-server
```

### Issue: "Build fails with 'Could not resolve all dependencies'"

**Solution:**
```bash
cd mobile/android

# Clear Gradle cache
./gradlew clean
rm -rf ~/.gradle/caches/

# Rebuild
./gradlew assembleDebug
```

### Issue: "Metro bundler port conflict"

**Solution:**
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Or start on different port
npm start -- --port 8082
```

### Issue: "App crashes on launch"

**Solution:**
```bash
# Check logs
adb logcat | grep ReactNative

# Or use React Native CLI
npx react-native log-android
```

## Verification Checklist

- [ ] JDK 17 installed and configured
- [ ] Android Studio installed
- [ ] Android SDK installed (API 34 or latest)
- [ ] ANDROID_HOME environment variable set
- [ ] Android emulator created
- [ ] Emulator can start successfully
- [ ] `adb devices` shows connected device
- [ ] Gradle build completes successfully
- [ ] App installs on emulator
- [ ] App launches and displays login screen

## Quick Start (After Android Setup)

```bash
# 1. Start emulator
emulator -avd Pixel_7_API_34 &

# 2. Wait for emulator to boot (check with adb devices)
adb devices

# 3. Run the app
cd mobile
npm run android

# The app should launch in the Android emulator!
```

## Expected First Run

When the app successfully launches, you should see:

1. **Metro Bundler** terminal output showing bundle progress
2. **Android Emulator** running
3. **BerthCare Mobile** app installing
4. **Login Screen** displaying with "BerthCare" title

## Performance Tips

### Speed up Android builds:

1. **Enable Gradle daemon** (`~/.gradle/gradle.properties`):
```properties
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8
```

2. **Use Hermes engine** (already enabled in React Native 0.81.4)

3. **Enable fast refresh** (enabled by default)

## Testing on Physical Device

### Enable Developer Options:
1. Go to **Settings > About Phone**
2. Tap **Build Number** 7 times
3. Go back to **Settings > Developer Options**
4. Enable **USB Debugging**

### Connect Device:
```bash
# Connect via USB
adb devices

# Should show your device

# Run app
npm run android
```

## Next Steps After Android Setup

1. ✅ Verify Android app runs successfully
2. Configure environment variables (`.env` file)
3. Test on both iOS and Android
4. Start implementing features

## Additional Resources

- [React Native Android Setup](https://reactnative.dev/docs/environment-setup?platform=android)
- [Android Studio Download](https://developer.android.com/studio)
- [Android Emulator Guide](https://developer.android.com/studio/run/emulator)
- [Gradle Build Guide](https://developer.android.com/studio/build)

## Support

If you encounter issues not covered here:

1. Check the error message in terminal
2. Check Android Studio Logcat
3. Search React Native GitHub issues
4. Check Stack Overflow
5. Refer to the main `README.md`

---

**Note:** Android development works on macOS, Windows, and Linux.
