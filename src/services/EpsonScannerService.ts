import { NativeModules } from 'react-native';
import { Scanner, ScanSettings, ScannedPage } from '../types';

const { EpsonScannerModule } = NativeModules;

class EpsonScannerService {
  private isAvailable(): boolean {
    console.log('EpsonScannerNative.isAvailable():', !!EpsonScannerModule);
    return !!EpsonScannerModule;
  }

  async discoverScanners(timeout: number = 10000): Promise<Scanner[]> {
    console.log('EpsonScannerService: Starting discovery...');
    
    if (!this.isAvailable()) {
      throw new Error('EpsonScannerModule not available');
    }

    console.log('EpsonScannerService: Calling native discoverScanners...');
    console.log('EpsonScannerNative.discoverScanners called, timeout:', timeout);
    console.log('EpsonScannerNative.isAvailable():', this.isAvailable());
    console.log('Calling EpsonScannerModule.discoverScanners...');

    const result = await EpsonScannerModule.discoverScanners(timeout);
    console.log('discoverScanners result:', result);

    const scanners: Scanner[] = [];
    
    try {
      const parsed = JSON.parse(result);
      console.log('EpsonScannerService: Native result:', parsed);

      for (const device of parsed) {
        scanners.push({
          id: device.id || device.devicePath,
          name: device.name || device.model || 'Unknown Scanner',
          model: device.model || device.name || 'Unknown',
          ipAddress: device.ipAddress,
          macAddress: device.macAddress,
          connectionType: device.connectionType || 'usb',
          status: device.status || 'offline',
          capabilities: {
            resolutions: [75, 100, 150, 200, 300, 400, 600],
            colorModes: ['color', 'grayscale', 'blackwhite'],
            paperSizes: [
              { name: 'A4', width: 210, height: 297 },
              { name: 'A3', width: 297, height: 420 },
              { name: 'Letter', width: 215.9, height: 279.4 },
            ],
            duplex: true,
            adf: true,
            maxScanArea: { width: 216, height: 356 },
          },
        });
      }
    } catch (e) {
      console.error('Failed to parse scanner result:', e);
    }

    console.log('EpsonScannerService: Found scanners:', scanners);
    return scanners;
  }

  async connect(scannerId: string): Promise<boolean> {
    console.log('EpsonScannerService: Connecting to:', scannerId);
    
    if (!this.isAvailable()) {
      throw new Error('EpsonScannerModule not available');
    }

    console.log('EpsonScannerNative.connect called, scannerId:', scannerId);
    console.log('EpsonScannerNative.isAvailable():', this.isAvailable());

    const result = await EpsonScannerModule.connect(scannerId);
    console.log('connect result:', result);
    console.log('EpsonScannerService: Connect result:', result === 'success');
    return result === 'success';
  }

  async disconnect(): Promise<void> {
    if (!this.isAvailable()) return;
    await EpsonScannerModule.disconnect();
  }

  async startScan(settings: ScanSettings): Promise<ScannedPage[]> {
    console.log('EpsonScannerService: Starting scan with settings:', settings);
    
    if (!this.isAvailable()) {
      throw new Error('EpsonScannerModule not available');
    }

    console.log('EpsonScannerNative.isAvailable():', this.isAvailable());

    const settingsJson = JSON.stringify(settings);
    const result = await EpsonScannerModule.startScan(settingsJson);
    
    console.log('EpsonScannerService: Scan result:', result);

    const pages: ScannedPage[] = [];

    try {
      const parsed = JSON.parse(result);
      console.log('EpsonScannerService: Parsed scan data:', parsed);

      if (parsed.pages && Array.isArray(parsed.pages)) {
        for (const page of parsed.pages) {
          pages.push({
            id: 'page-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            uri: page.uri,
            width: page.width || 2480,
            height: page.height || 3508,
            fileSize: page.fileSize || 0,
            createdAt: new Date(),
            rotation: 0,
          });
        }
      }
    } catch (e) {
      console.error('Failed to parse scan result:', e);
    }

    console.log('EpsonScannerService: Returning pages:', pages);
    return pages;
  }

  async stopScan(): Promise<void> {
    if (!this.isAvailable()) return;
    await EpsonScannerModule.stopScan();
  }

  async openInGallery(filePath: string): Promise<boolean> {
    if (!this.isAvailable()) {
      throw new Error('EpsonScannerModule not available');
    }
    return await EpsonScannerModule.openInGallery(filePath);
  }

  async openFolderInGallery(): Promise<boolean> {
    if (!this.isAvailable()) {
      throw new Error('EpsonScannerModule not available');
    }
    return await EpsonScannerModule.openFolderInGallery();
  }
}

export const epsonScannerService = new EpsonScannerService();
export default epsonScannerService;