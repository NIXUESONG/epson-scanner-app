/**
 * Epson扫描仪原生模块接口
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

// 获取原生模块
const { EpsonScannerModule } = NativeModules;

// 调试：打印模块状态
console.log('=== EpsonScannerNative Debug ===');
console.log('Platform.OS:', Platform.OS);
console.log('EpsonScannerModule:', EpsonScannerModule);
console.log('EpsonScannerModule is null:', EpsonScannerModule == null);
console.log('All NativeModules:', Object.keys(NativeModules));
console.log('================================');

// 事件发射器
let eventEmitter: NativeEventEmitter | null = null;
if (EpsonScannerModule) {
  eventEmitter = new NativeEventEmitter(EpsonScannerModule);
}

export enum ScannerEventType {
  SCANNER_FOUND = 'onScannerFound',
  SCAN_COMPLETE = 'onScanComplete',
  SCAN_PROGRESS = 'onScanProgress',
  SCAN_ERROR = 'onScanError',
  CONNECTION_CHANGED = 'onConnectionChanged',
}

export type ScannerEventListener = (data: unknown) => void;

class EpsonScannerNative {
  private listeners: Map<string, ScannerEventListener[]> = new Map();

  isAvailable(): boolean {
    const available = Platform.OS === 'android' && EpsonScannerModule != null;
    console.log('EpsonScannerNative.isAvailable():', available);
    return available;
  }

  async discoverScanners(timeout: number = 10000): Promise<unknown[]> {
    console.log('EpsonScannerNative.discoverScanners called, timeout:', timeout);
    
    if (!this.isAvailable()) {
      console.warn('Epson Scanner native module not available');
      return [];
    }

    try {
      console.log('Calling EpsonScannerModule.discoverScanners...');
      const result = await EpsonScannerModule.discoverScanners(timeout);
      console.log('discoverScanners result:', result);
      return JSON.parse(result);
    } catch (error) {
      console.error('Discovery failed:', error);
      return [];
    }
  }

  async stopDiscovery(): Promise<void> {
    if (!this.isAvailable()) return;
    await EpsonScannerModule.stopDiscovery();
  }

  async connect(scannerId: string): Promise<boolean> {
    console.log('EpsonScannerNative.connect called, scannerId:', scannerId);
    
    if (!this.isAvailable()) {
      console.warn('Native module not available');
      return false;
    }

    try {
      const result = await EpsonScannerModule.connect(scannerId);
      console.log('connect result:', result);
      return result === 'success';
    } catch (error) {
      console.error('Connection failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isAvailable()) return;
    await EpsonScannerModule.disconnect();
  }

  async isConnected(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    return await EpsonScannerModule.isConnected();
  }

  async startScan(settings: Record<string, unknown>): Promise<unknown> {
    if (!this.isAvailable()) {
      throw new Error('Native module not available');
    }

    try {
      const result = await EpsonScannerModule.startScan(JSON.stringify(settings));
      return JSON.parse(result);
    } catch (error) {
      console.error('Scan failed:', error);
      throw error;
    }
  }

  async stopScan(): Promise<void> {
    if (!this.isAvailable()) return;
    await EpsonScannerModule.stopScan();
  }

  async getScannerInfo(scannerId: string): Promise<unknown> {
    if (!this.isAvailable()) return null;

    try {
      const result = await EpsonScannerModule.getScannerInfo(scannerId);
      return JSON.parse(result);
    } catch (error) {
      console.error('Failed to get scanner info:', error);
      return null;
    }
  }

  async getCapabilities(scannerId: string): Promise<unknown> {
    if (!this.isAvailable()) return null;

    try {
      const result = await EpsonScannerModule.getCapabilities(scannerId);
      return JSON.parse(result);
    } catch (error) {
      console.error('Failed to get capabilities:', error);
      return null;
    }
  }

  addEventListener(event: ScannerEventType, listener: ScannerEventListener): void {
    if (!this.isAvailable() || !eventEmitter) return;

    const existingListeners = this.listeners.get(event) || [];
    existingListeners.push(listener);
    this.listeners.set(event, existingListeners);

    eventEmitter.addListener(event, listener);
  }

  removeEventListener(event: ScannerEventType, listener?: ScannerEventListener): void {
    if (!this.isAvailable() || !eventEmitter) return;

    if (listener) {
      eventEmitter.removeListener(event, listener);
      const existingListeners = this.listeners.get(event) || [];
      const index = existingListeners.indexOf(listener);
      if (index > -1) {
        existingListeners.splice(index, 1);
        this.listeners.set(event, existingListeners);
      }
    } else {
      const existingListeners = this.listeners.get(event) || [];
      existingListeners.forEach(l => eventEmitter.removeListener(event, l));
      this.listeners.delete(event);
    }
  }

  removeAllListeners(): void {
    if (!eventEmitter) return;
    this.listeners.forEach((_, event) => {
      eventEmitter.removeAllListeners(event);
    });
    this.listeners.clear();
  }
}

export const epsonScannerNative = new EpsonScannerNative();
export default epsonScannerNative;