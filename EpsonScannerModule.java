package com.epson.scannerapp.modules;

import android.content.Context;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.os.Environment;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import com.epson.epsonscansdk.EpsonScanner;
import com.epson.epsonscansdk.EpsonScannerEventListner;
import com.epson.epsonscansdk.ErrorCode;
import com.epson.epsonscansdk.usb.UsbFinder;
import com.epson.epsonscansdk.usb.UsbProfile;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.util.ArrayList;
import java.util.Dictionary;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class EpsonScannerModule extends ReactContextBaseJavaModule {
    private static final String TAG = "EpsonScannerModule";

    private static final Map<Integer, String> SCANNER_MODELS = new HashMap<>();
    static {
        SCANNER_MODELS.put(0x0124, "WorkForce DS-870");
        SCANNER_MODELS.put(0x0170, "DS-870");
    }

    private final ReactApplicationContext reactContext;
    private EpsonScanner scanner;
    private String currentDevicePath;
    private boolean isConnected = false;
    private List<String> scannedFiles = new ArrayList<>();

    public EpsonScannerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return "EpsonScannerModule";
    }

    private String getScannerModelName(int productId) {
        String modelName = SCANNER_MODELS.get(productId);
        if (modelName != null) {
            return modelName;
        }
        return "EPSON Scanner (PID:0x" + Integer.toHexString(productId).toUpperCase() + ")";
    }

    @ReactMethod
    public void discoverScanners(double timeout, Promise promise) {
        try {
            Log.d(TAG, "discoverScanners called");
            WritableArray scanners = Arguments.createArray();

            List<UsbProfile> deviceList = UsbFinder.getDeviceProfileList(reactContext);
            Log.d(TAG, "Found " + (deviceList != null ? deviceList.size() : 0) + " USB devices");

            UsbManager usbManager = (UsbManager) reactContext.getSystemService(Context.USB_SERVICE);
            Map<String, UsbDevice> usbDevices = usbManager.getDeviceList();

            if (deviceList != null) {
                for (UsbProfile device : deviceList) {
                    String devicePath = device.getDevicePath();
                    int productId = 0;
                    String modelName = device.getProductName();

                    for (UsbDevice usbDevice : usbDevices.values()) {
                        if (usbDevice.getDeviceName() != null && usbDevice.getDeviceName().equals(devicePath)) {
                            productId = usbDevice.getProductId();
                            modelName = getScannerModelName(productId);
                            Log.d(TAG, "Found USB device: PID=0x" + Integer.toHexString(productId) + " Model=" + modelName);
                            break;
                        }
                    }

                    WritableMap deviceInfo = Arguments.createMap();
                    deviceInfo.putString("id", devicePath);
                    deviceInfo.putString("name", modelName);
                    deviceInfo.putString("model", modelName);
                    deviceInfo.putString("devicePath", devicePath);
                    deviceInfo.putString("connectionType", "usb");
                    deviceInfo.putString("status", "online");
                    deviceInfo.putInt("productId", productId);
                    scanners.pushMap(deviceInfo);
                }
            }

            promise.resolve(scanners.toString());
        } catch (Exception e) {
            Log.e(TAG, "discoverScanners error: " + e.getMessage());
            promise.reject("DISCOVERY_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopDiscovery(Promise promise) {
        promise.resolve(null);
    }

    @ReactMethod
    public void connect(String scannerId, Promise promise) {
        try {
            Log.d(TAG, "connect called with scannerId: " + scannerId);

            if (scanner != null && isConnected) {
                scanner.close();
                scanner.destory();
                scanner = null;
                isConnected = false;
            }

            scanner = new EpsonScanner();
            scanner.setDevicePath(scannerId);
            currentDevicePath = scannerId;

            if (!scanner.init(true, reactContext.getCurrentActivity())) {
                Log.e(TAG, "Scanner init failed");
                promise.reject("INIT_FAILED", "Failed to initialize scanner");
                return;
            }

            ErrorCode err = scanner.open();
            if (err != ErrorCode.kEPSErrorNoError) {
                Log.e(TAG, "Failed to open scanner: " + err.getCode());
                promise.reject("OPEN_FAILED", "Failed to open scanner: " + err.getCode());
                scanner.destory();
                scanner = null;
                return;
            }

            isConnected = true;
            Log.d(TAG, "Scanner connected successfully");
            promise.resolve("success");

        } catch (Exception e) {
            Log.e(TAG, "connect error: " + e.getMessage());
            promise.reject("CONNECTION_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void disconnect(Promise promise) {
        try {
            if (scanner != null) {
                if (isConnected) {
                    scanner.close();
                }
                scanner.destory();
                scanner = null;
                isConnected = false;
            }
            currentDevicePath = null;
            promise.resolve(null);
        } catch (Exception e) {
            Log.e(TAG, "disconnect error: " + e.getMessage());
            promise.reject("DISCONNECT_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void isConnected(Promise promise) {
        promise.resolve(isConnected);
    }

    @ReactMethod
    public void startScan(String settingsJson, Promise promise) {
        try {
            if (scanner == null || !isConnected) {
                promise.reject("NOT_CONNECTED", "No scanner connected");
                return;
            }

            Log.d(TAG, "startScan called with settingsJson: " + settingsJson);

            // Parse scan settings from JSON
            int resolution = 300;
            int colorFormat = EpsonScanner.kEPSColorFormatRGB24;
            int duplex = 0;
            
            try {
                JSONObject settings = new JSONObject(settingsJson);
                if (settings.has("resolution")) {
                    resolution = settings.getInt("resolution");
                    Log.d(TAG, "Parsed resolution: " + resolution);
                }
                if (settings.has("colorMode")) {
                    String colorMode = settings.getString("colorMode");
                    Log.d(TAG, "Parsed colorMode: " + colorMode);
                    if ("grayscale".equals(colorMode)) {
                        colorFormat = EpsonScanner.kEPSColorFormatMono8;
                    } else if ("blackwhite".equals(colorMode)) {
                        colorFormat = EpsonScanner.kEPSColorFormatMono1;
                    }
                }
                if (settings.has("duplex")) {
                    boolean duplexEnabled = settings.getBoolean("duplex");
                    Log.d(TAG, "Parsed duplex: " + duplexEnabled);
                    duplex = duplexEnabled ? 1 : 0;
                }
                Log.d(TAG, "Final scan settings: resolution=" + resolution + " colorFormat=" + colorFormat + " duplex=" + duplex);
            } catch (Exception e) {
                Log.e(TAG, "Failed to parse settings: " + e.getMessage());
            }

            File scanDir = new File(reactContext.getExternalFilesDir(Environment.DIRECTORY_PICTURES), "Scans");
            if (!scanDir.exists()) {
                scanDir.mkdirs();
            }

            final String savePath = scanDir.getAbsolutePath();
            scannedFiles.clear();

            scanner.registerEventListner(new EpsonScannerEventListner() {
                @Override
                public void onSaveToPath(String path, boolean isBackSide, int pageNumber, Dictionary<String, Integer> pageInfo) {
                    Log.d(TAG, "Image saved to: " + path + " pageNumber: " + pageNumber);
                    scannedFiles.add(path);
                }

                @Override
                public void onPressScannerButton() {
                    Log.d(TAG, "Scanner button pressed");
                }

                @Override
                public void onCancelScanning() {
                    Log.d(TAG, "Scanning cancelled");
                }
            });

            // Apply scan settings
            scanner.setValueInt(EpsonScanner.kEPSXResolution, resolution);
            scanner.setValueInt(EpsonScanner.kEPSYResolution, resolution);
            scanner.setValueInt(EpsonScanner.kEPSColorFormat, colorFormat);
            scanner.setValueInt(EpsonScanner.kEPSImageFormat, EpsonScanner.kEPSImageFormatJPEG);
            scanner.setValueInt(EpsonScanner.kEPSFunctionalUnitType, EpsonScanner.kEPSFunctionalUnitDocumentFeeder);
            scanner.setValueInt(EpsonScanner.kEPSDuplex, duplex);

            ErrorCode result = scanner.scan(savePath);

            if (result == ErrorCode.kEPSErrorNoError) {
                JSONArray filesArray = new JSONArray();
                for (String filePath : scannedFiles) {
                    File file = new File(filePath);
                    JSONObject fileInfo = new JSONObject();
                    fileInfo.put("uri", "file://" + filePath);
                    fileInfo.put("path", filePath);
                    fileInfo.put("fileName", file.getName());
                    fileInfo.put("fileSize", file.length());
                    fileInfo.put("width", 2480);
                    fileInfo.put("height", 3508);
                    filesArray.put(fileInfo);
                }

                JSONObject scanResult = new JSONObject();
                scanResult.put("id", "scan-" + System.currentTimeMillis());
                scanResult.put("status", "success");
                scanResult.put("pages", filesArray);
                scanResult.put("pageCount", scannedFiles.size());

                promise.resolve(scanResult.toString());
            } else {
                Log.e(TAG, "Scan failed with error: " + result.getCode());
                promise.reject("SCAN_ERROR", "Scan failed with error code: " + result.getCode());
            }

        } catch (Exception e) {
            Log.e(TAG, "startScan error: " + e.getMessage());
            promise.reject("SCAN_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopScan(Promise promise) {
        if (scanner != null) {
            scanner.cancel();
        }
        promise.resolve(null);
    }

    @ReactMethod
    public void getScannerInfo(String scannerId, Promise promise) {
        if (scanner != null && isConnected) {
            WritableMap info = Arguments.createMap();
            info.putString("devicePath", currentDevicePath != null ? currentDevicePath : "");
            promise.resolve(info.toString());
        } else {
            promise.resolve("{}");
        }
    }

    @ReactMethod
    public void getCapabilities(String scannerId, Promise promise) {
        try {
            if (scanner == null || !isConnected) {
                promise.reject("NOT_CONNECTED", "Scanner not connected");
                return;
            }

            WritableMap capabilities = Arguments.createMap();

            List<Integer> resolutions = scanner.getAvailableList(EpsonScanner.kEPSXResolution);
            if (resolutions != null) {
                WritableArray resArray = Arguments.createArray();
                for (Integer res : resolutions) {
                    resArray.pushInt(res);
                }
                capabilities.putArray("resolutions", resArray);
            }

            List<Integer> colorModes = scanner.getAvailableList(EpsonScanner.kEPSColorFormat);
            if (colorModes != null) {
                WritableArray colorArray = Arguments.createArray();
                for (Integer mode : colorModes) {
                    if (mode == EpsonScanner.kEPSColorFormatRGB24) {
                        colorArray.pushString("color");
                    } else if (mode == EpsonScanner.kEPSColorFormatMono8) {
                        colorArray.pushString("grayscale");
                    } else if (mode == EpsonScanner.kEPSColorFormatMono1) {
                        colorArray.pushString("blackwhite");
                    }
                }
                capabilities.putArray("colorModes", colorArray);
            }

            List<Integer> duplexModes = scanner.getAvailableList(EpsonScanner.kEPSDuplex);
            capabilities.putBoolean("duplex", duplexModes != null && duplexModes.size() > 0);

            List<Integer> functionalUnits = scanner.getAvailableList(EpsonScanner.kEPSFunctionalUnitType);
            capabilities.putBoolean("adf", functionalUnits != null && functionalUnits.contains(EpsonScanner.kEPSFunctionalUnitDocumentFeeder));

            promise.resolve(capabilities.toString());
        } catch (Exception e) {
            Log.e(TAG, "getCapabilities error: " + e.getMessage());
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void openInGallery(String filePath, Promise promise) {
        try {
            android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_VIEW);
            java.io.File file = new java.io.File(filePath);
            android.net.Uri uri = androidx.core.content.FileProvider.getUriForFile(
                reactContext,
                reactContext.getPackageName() + ".fileprovider",
                file
            );
            intent.setDataAndType(uri, "image/*");
            intent.addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "openInGallery error: " + e.getMessage());
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void checkStatus(Promise promise) {
        promise.resolve(isConnected ? "online" : "offline");
    }
}