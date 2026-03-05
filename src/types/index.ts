// 鎵弿浠被鍨嬪畾涔?
export interface Scanner {
  id: string;
  name: string;
  model: string;
  ipAddress?: string;
  macAddress?: string;
  connectionType: 'wifi' | 'usb' | 'bluetooth';
  status: 'online' | 'offline' | 'busy' | 'error';
  capabilities: ScannerCapabilities;
}

// 鎵弿浠兘鍔?
export interface ScannerCapabilities {
  resolutions: number[];
  colorModes: ColorMode[];
  paperSizes: PaperSize[];
  duplex: boolean;
  saveFormat: 'jpeg' | 'pdf' | 'pnm';
    adf: boolean; // 鑷姩鏂囨。杩涚焊鍣?
  maxScanArea: { width: number; height: number };
}

// 棰滆壊妯″紡
export type ColorMode = 'color' | 'grayscale' | 'blackwhite';

// 绾稿紶灏哄
export interface PaperSize {
  name: string;
  width: number;
  height: number;
}

// 鎵弿璁剧疆
export interface ScanSettings {
  resolution: number;
  colorMode: ColorMode;
  paperSize: PaperSize;
  duplex: boolean;
    brightness: number;
  contrast: number;
  autoCrop: boolean;
  deskew: boolean;
  removeBlankPages: boolean;
}

// 鎵弿椤甸潰
export interface ScannedPage {
  id: string;
  uri: string;
  thumbnail?: string;
  width: number;
  height: number;
  fileSize: number;
  createdAt: Date;
  rotation: number;
  cropArea?: CropArea;
}

// 瑁佸壀鍖哄煙
export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 鏂囨。
export interface Document {
  id: string;
  name: string;
  pages: ScannedPage[];
  createdAt: Date;
  updatedAt: Date;
  format: 'pdf' | 'tiff' | 'jpeg' | 'png';
  fileSize: number;
  ocrText?: string;
}

// 鎵弿鍘嗗彶璁板綍
export interface ScanHistory {
  id: string;
  scannerId: string;
  scannerName: string;
  pagesCount: number;
  settings: ScanSettings;
  timestamp: Date;
  documentId?: string;
}

// 搴旂敤鐘舵€?
export interface AppState {
  scanners: Scanner[];
  selectedScanner: Scanner | null;
  currentDocument: Document | null;
  documents: Document[];
  scanHistory: ScanHistory[];
  settings: AppSettings;
  isScanning: boolean;
  scanProgress: number;
}

// 搴旂敤璁剧疆
export interface AppSettings {
  defaultResolution: number;
  defaultColorMode: ColorMode;
  defaultPaperSize: PaperSize;
  autoSave: boolean;
  savePath: string;
  fileNamePattern: string;
  ocrEnabled: boolean;
  ocrLanguage: string;
  theme: 'light' | 'dark' | 'system';
}

// Epson鎵弿浠搷搴?
export interface EpsonScannerResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

// 缃戠粶鍙戠幇缁撴灉
export interface NetworkDiscoveryResult {
  found: boolean;
  scanners: Scanner[];
  scanTime: number;
}
