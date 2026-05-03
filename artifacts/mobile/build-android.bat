@echo off
echo ========================================
echo  CleanSnap - Android APK Builder
echo ========================================
echo.

REM Step 1: Install dependencies
echo [1/4] Installing dependencies...
call pnpm install
if %errorlevel% neq 0 (
    echo ERROR: pnpm install failed. Make sure pnpm is installed: npm install -g pnpm
    pause
    exit /b 1
)

REM Step 2: Prebuild (generate android folder)
echo.
echo [2/4] Generating Android project...
call pnpm exec expo prebuild --platform android --clean
if %errorlevel% neq 0 (
    echo ERROR: expo prebuild failed.
    pause
    exit /b 1
)

REM Step 3: Create assets folder and bundle JS
echo.
echo [3/4] Bundling JavaScript...
if not exist "android\app\src\main\assets" mkdir "android\app\src\main\assets"
call pnpm exec react-native bundle --platform android --dev false --entry-file node_modules/expo-router/entry.js --bundle-output android\app\src\main\assets\index.android.bundle --assets-dest android\app\src\main\res
if %errorlevel% neq 0 (
    echo ERROR: JS bundling failed.
    pause
    exit /b 1
)

REM Step 4: Build debug APK
echo.
echo [4/4] Building APK...
cd android
call .\gradlew.bat assembleDebug -x createBundleDebugJsAndAssets
if %errorlevel% neq 0 (
    echo ERROR: Gradle build failed. Run with --stacktrace for details.
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo  BUILD SUCCESSFUL!
echo ========================================
echo.
echo APK location:
echo   artifacts\mobile\android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo Copy the APK to your phone and install it.
echo (Enable "Install from unknown sources" in Android Settings first)
echo.
pause
