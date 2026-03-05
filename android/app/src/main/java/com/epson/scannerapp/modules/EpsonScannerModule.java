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
import com.epson.epsonscansdk.EpsonPDFCreator;
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
        SCANNER_MODELS.put(0x0116, "DS-970");
        SCANNER_MODELS.put(0x0119, "DS-730N");
        SCANNER_MODELS.put(0x0120, "WorkForce DS-410");
        SCANNER_MODELS.put(0x0121, "WorkForce DS-530");
        SCANNER_MODELS.put(0x0122, "WorkForce DS-575W");
        SCANNER_MODELS.put(0x0123, "WorkForce DS-770");
        SCANNER_MODELS.put(0x0124, "WorkForce DS-870");
        SCANNER_MODELS.put(0x0125, "WorkForce DS-780N");
        SCANNER_MODELS.put(0x0126, "WorkForce DS-970");
        SCANNER_MODELS.put(0x0127, "WorkForce DS-1630");
        SCANNER_MODELS.put(0x0128, "WorkForce DS-1660W");
        SCANNER_MODELS.put(0x0129, "DS-730N");
        SCANNER_MODELS.put(0x012A, "WorkForce DS-940DW");
        SCANNER_MODELS.put(0x0170, "DS-870");
        SCANNER_MODELS.put(0x017E, "DS-730N");
        SCANNER_MODELS.put(0x0183, "DS-535II");
    }

    private final ReactApplicationContext reactContext;
    private EpsonScanner scanner;
    private String currentDevicePath;
    private boolean isConnected = false;
    private List<String> scannedFiles = new ArrayList<>();
    private String saveFormat = "jpeg";
    private int resolution = 300;


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

            Log.d(TAG, "startScan called");

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

            // Parse settings from JavaScript
            JSONObject settings = new JSONObject(settingsJson);
            Log.d(TAG, "Scan settings: " + settings.toString());

            // Resolution
            int resolution = settings.optInt("resolution", 300);
            scanner.setValueInt(EpsonScanner.kEPSXResolution, resolution);
            scanner.setValueInt(EpsonScanner.kEPSYResolution, resolution);
            Log.d(TAG, "Resolution set to: " + resolution);

            // Color mode
            String colorMode = settings.optString("colorMode", "color");
            int colorFormat = EpsonScanner.kEPSColorFormatRGB24;
            if ("grayscale".equals(colorMode)) {
                colorFormat = EpsonScanner.kEPSColorFormatMono8;
            } else if ("mono".equals(colorMode) || "blackwhite".equals(colorMode)) {
                colorFormat = EpsonScanner.kEPSColorFormatMono1;
            }
            scanner.setValueInt(EpsonScanner.kEPSColorFormat, colorFormat);
            Log.d(TAG, "Color mode set to: " + colorMode);

            // Duplex (double-sided scanning)
            boolean duplex = settings.optBoolean("duplex", false);
            scanner.setValueBool(EpsonScanner.kEPSDuplex, duplex);
            Log.d(TAG, "Duplex set to: " + duplex);

            // Save format (store for later use)
            saveFormat = settings.optString("saveFormat", "jpeg");
            Log.d(TAG, "Save format: " + saveFormat);
            resolution = settings.optInt("resolution", 300);
      
            // Image format (always JPEG for scanning)
            scanner.setValueInt(EpsonScanner.kEPSImageFormat, EpsonScanner.kEPSImageFormatJPEG);

            // Functional unit (use ADF by default)
            scanner.setValueInt(EpsonScanner.kEPSFunctionalUnitType, EpsonScanner.kEPSFunctionalUnitDocumentFeeder);

            ErrorCode result = scanner.scan(savePath);

            if (result == ErrorCode.kEPSErrorNoError) {
                // Convert to PDF if needed
                if ("pdf".equals(saveFormat) && scannedFiles.size() > 0) {
                    Log.d(TAG, "Converting scanned images to PDF...");
                    try {
                        String pdfPath = savePath + "/scan_" + System.currentTimeMillis() + ".pdf";
                        EpsonPDFCreator pdfCreator = new EpsonPDFCreator();
                        pdfCreator.initFilePath(pdfPath);
            
                        for (String filePath : scannedFiles) {
                            Log.d(TAG, "Adding to PDF: " + filePath);
                            pdfCreator.addJpegFile(filePath, resolution, resolution);
                        }
            
                        boolean pdfResult = pdfCreator.finish();
                        pdfCreator.destory();
            
                        if (pdfResult) {
                            Log.d(TAG, "PDF created successfully: " + pdfPath);
                            for (String filePath : scannedFiles) {
                                new File(filePath).delete();
                            }
                            scannedFiles.clear();
                            scannedFiles.add(pdfPath);
                        } else {
                            Log.e(TAG, "Failed to create PDF");
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "PDF creation error: " + e.getMessage());
                    }
                }
    
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
            java.io.File file = new java.io.File(filePath);
            android.net.Uri uri = androidx.core.content.FileProvider.getUriForFile(
                reactContext,
                reactContext.getPackageName() + ".fileprovider",
                file
            );
        
            String mimeType = "image/jpeg";
            if (filePath.toLowerCase().endsWith(".pdf")) {
                mimeType = "application/pdf";
            }
        
            android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_VIEW);
            intent.setDataAndType(uri, mimeType);
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
    public void openFolderInGallery(Promise promise) {
        try {
            // 方法1：尝试打开扫描目录
            android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_VIEW);
            intent.setData(android.net.Uri.parse("content://com.android.externalstorage.documents/document/primary%3AAndroid%2Fdata%2F" + reactContext.getPackageName() + "%2Ffiles%2FPictures%2FScans"));
            intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
        
            try {
                reactContext.startActivity(intent);
                promise.resolve(true);
                return;
            } catch (Exception e1) {
                Log.d(TAG, "Method 1 failed: " + e1.getMessage());
            }
        
            // 方法2：打开文件管理器主界面
            try {
                intent = new android.content.Intent(android.content.Intent.ACTION_VIEW);
                intent.setData(android.net.Uri.parse("content://com.android.externalstorage.documents/root/primary"));
                intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
                reactContext.startActivity(intent);
                promise.resolve(true);
                return;
            } catch (Exception e2) {
                Log.d(TAG, "Method 2 failed: " + e2.getMessage());
            }
        
            // 方法3：打开下载目录
            try {
                intent = new android.content.Intent(android.content.Intent.ACTION_VIEW);
                intent.setData(android.net.Uri.parse("content://com.android.externalstorage.documents/document/primary%3ADownload"));
                intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
                reactContext.startActivity(intent);
                promise.resolve(true);
            } catch (Exception e3) {
                Log.e(TAG, "All methods failed: " + e3.getMessage());
                promise.reject("ERROR", "无法打开文件管理器");
            }
        
        } catch (Exception e) {
            Log.e(TAG, "openFolderInGallery error: " + e.getMessage());
            promise.reject("ERROR", e.getMessage());
        }
    }


    @ReactMethod
    public void checkStatus(Promise promise) {
        promise.resolve(isConnected ? "online" : "offline");
    }
}