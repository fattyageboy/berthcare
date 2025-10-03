# iOS Setup Guide - BerthCare Mobile

## Current Status

✅ **Completed:**
- React Native project initialized
- npm dependencies installed (930 packages)
- Bundle (Ruby gems) installed
- CocoaPods installed

⚠️ **Pending:**
- Xcode installation (currently downloading)
- iOS pod dependencies installation
- iOS simulator setup

## Prerequisites

### 1. Xcode Installation

Xcode is currently downloading (`Xcode.appdownload` found in `/Applications/`).

**After Xcode download completes:**

1. Open Xcode from Applications
2. Accept the license agreement
3. Wait for additional components to install
4. Set Xcode as the active developer directory:
   ```bash
   sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
   ```

5. Verify Xcode is properly configured:
   ```bash
   xcode-select -p
   # Should output: /Applications/Xcode.app/Contents/Developer
   ```

### 2. Install iOS Simulator

1. Open Xcode
2. Go to **Xcode > Settings > Platforms**
3. Download iOS simulators (recommended: latest iOS version)

### 3. Accept Xcode License

```bash
sudo xcodebuild -license accept
```

## iOS Pod Installation

Once Xcode is properly installed, run these commands:

```bash
cd mobile/ios

# Install CocoaPods dependencies
bundle exec pod install

# This will:
# - Download and compile native iOS dependencies
# - Create BerthCareMobile.xcworkspace
# - Link React Native modules
```

**Expected output:**
```
Installing DoubleConversion (1.1.6)
Installing FBLazyVector (0.81.4)
Installing RCT-Folly (2024.11.18.00)
... (many more pods)
Pod installation complete! There are X dependencies from the Podfile and Y total pods installed.
```

## Running on iOS Simulator

### Method 1: Using npm script (Recommended)

```bash
cd mobile
npm run ios
```

This will:
1. Start Metro bundler
2. Build the iOS app
3. Launch iOS simulator
4. Install and run the app

### Method 2: Using Xcode

```bash
cd mobile/ios
open BerthCareMobile.xcworkspace
```

Then in Xcode:
1. Select a simulator from the device dropdown (e.g., iPhone 15 Pro)
2. Click the Play button (▶️) or press `Cmd + R`

### Method 3: Specific Simulator

```bash
cd mobile
npx react-native run-ios --simulator="iPhone 15 Pro"
```

## Troubleshooting

### Issue: "xcode-select: error: tool 'xcodebuild' requires Xcode"

**Solution:**
```bash
# Check current developer directory
xcode-select -p

# If it shows /Library/Developer/CommandLineTools, switch to Xcode:
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

# Reset if needed
sudo xcode-select --reset
```

### Issue: Pod install fails with "C compiler cannot create executables"

**Solution:**
1. Ensure Xcode is fully installed (not just downloading)
2. Open Xcode and accept license
3. Install Command Line Tools:
   ```bash
   xcode-select --install
   ```
4. Clean and retry:
   ```bash
   cd mobile/ios
   pod deintegrate
   pod install
   ```

### Issue: "No simulators available"

**Solution:**
1. Open Xcode
2. Go to **Window > Devices and Simulators**
3. Click the **+** button to add a simulator
4. Or download from **Xcode > Settings > Platforms**

### Issue: Build fails with "Command PhaseScriptExecution failed"

**Solution:**
```bash
cd mobile/ios
rm -rf Pods
rm Podfile.lock
pod install
```

### Issue: Metro bundler port conflict

**Solution:**
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Or start on different port
npm start -- --port 8082
```

### Issue: "Unable to boot simulator"

**Solution:**
```bash
# Reset simulator
xcrun simctl erase all

# Or restart simulator service
sudo killall -9 com.apple.CoreSimulator.CoreSimulatorService
```

## Verification Checklist

Once Xcode is installed, verify each step:

- [ ] Xcode fully installed and opened
- [ ] Xcode license accepted
- [ ] Developer directory set to Xcode
- [ ] iOS simulator downloaded
- [ ] CocoaPods dependencies installed (`pod install` successful)
- [ ] `BerthCareMobile.xcworkspace` created
- [ ] iOS app builds successfully
- [ ] iOS simulator launches
- [ ] App runs on simulator

## Quick Start (After Xcode Setup)

```bash
# 1. Install pods
cd mobile/ios
bundle exec pod install
cd ..

# 2. Run on iOS
npm run ios

# The app should launch in the iOS simulator!
```

## Expected First Run

When the app successfully launches, you should see:

1. **Metro Bundler** terminal output showing bundle progress
2. **iOS Simulator** launching automatically
3. **BerthCare Mobile** app installing on simulator
4. **Login Screen** displaying with "BerthCare" title

## Next Steps After iOS Setup

1. ✅ Verify iOS app runs successfully
2. Set up Android emulator (see `ANDROID_SETUP_GUIDE.md`)
3. Configure environment variables (`.env` file)
4. Start implementing features

## Additional Resources

- [React Native iOS Setup](https://reactnative.dev/docs/environment-setup?platform=ios)
- [Xcode Download](https://developer.apple.com/xcode/)
- [CocoaPods Guides](https://guides.cocoapods.org/)
- [iOS Simulator Guide](https://developer.apple.com/documentation/xcode/running-your-app-in-simulator-or-on-a-device)

## Support

If you encounter issues not covered here:

1. Check the error message carefully
2. Search React Native GitHub issues
3. Check Stack Overflow
4. Refer to the main `README.md` for general troubleshooting

---

**Note:** The iOS setup requires macOS. If you're on Windows or Linux, focus on Android development instead.
