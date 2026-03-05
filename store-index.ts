import { create } from 'zustand';
import {
  Scanner,
  ScanSettings,
  ScannedPage,
  Document,
  ScanHistory,
  AppSettings,
} from '../types';
import epsonScannerService from '../services/EpsonScannerService';
import pdfService from '../services/PDFService';
import { format } from 'date-fns';

const defaultSettings: AppSettings = {
  defaultResolution: 300,
  defaultColorMode: 'color',
  defaultPaperSize: { name: 'A4', width: 210, height: 297 },
  autoSave: true,
  savePath: '/Documents/Scans',
  fileNamePattern: 'Scan_{date}_{time}',
  ocrEnabled: false,
  ocrLanguage: 'chi_sim+eng',
  theme: 'system',
};

const defaultScanSettings: ScanSettings = {
  resolution: 300,
  colorMode: 'color',
  paperSize: { name: 'A4', width: 210, height: 297 },
  duplex: false,
  brightness: 0,
  contrast: 0,
  autoCrop: true,
  deskew: true,
  removeBlankPages: false,
};

interface ScannerStore {
  scanners: Scanner[];
  selectedScanner: Scanner | null;
  currentDocument: Document | null;
  documents: Document[];
  scanHistory: ScanHistory[];
  settings: AppSettings;
  scanSettings: ScanSettings;
  isScanning: boolean;
  scanProgress: number;
  scannedPages: ScannedPage[];
  isLoading: boolean;
  error: string | null;
  
  // User settings
  scanResolution: number;
  colorMode: string;
  duplexMode: boolean;

  discoverScanners: () => Promise<void>;
  selectScanner: (scanner: Scanner) => Promise<void>;
  disconnectScanner: () => Promise<void>;
  startScan: () => Promise<void>;
  cancelScan: () => void;
  addScannedPage: (page: ScannedPage) => void;
  removeScannedPage: (pageId: string) => void;
  clearScannedPages: () => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;
  saveDocument: (name: string, format: 'pdf' | 'tiff' | 'jpeg' | 'png') => Promise<Document>;
  loadDocuments: () => Promise<void>;
  deleteDocument: (documentId: string) => void;
  exportDocument: (documentId: string, format: string) => Promise<string>;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateScanSettings: (settings: Partial<ScanSettings>) => void;
  setScanResolution: (resolution: number) => void;
  setColorMode: (mode: string) => void;
  setDuplexMode: (duplex: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useScannerStore = create<ScannerStore>((set, get) => ({
  scanners: [],
  selectedScanner: null,
  currentDocument: null,
  documents: [],
  scanHistory: [],
  settings: defaultSettings,
  scanSettings: defaultScanSettings,
  isScanning: false,
  scanProgress: 0,
  scannedPages: [],
  isLoading: false,
  error: null,
  
  // User settings with defaults
  scanResolution: 300,
  colorMode: 'color',
  duplexMode: false,

  discoverScanners: async () => {
    set({ isLoading: true, error: null });
    try {
      const scanners = await epsonScannerService.discoverScanners();
      set({ scanners, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to discover scanners',
        isLoading: false
      });
    }
  },

  selectScanner: async (scanner: Scanner) => {
    set({ isLoading: true, error: null });
    try {
      const connected = await epsonScannerService.connect(scanner.id);
      if (connected) {
        set({ selectedScanner: scanner, isLoading: false });
      } else {
        throw new Error('Failed to connect to scanner');
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to connect to scanner',
        isLoading: false
      });
    }
  },

  disconnectScanner: async () => {
    await epsonScannerService.disconnect();
    set({ selectedScanner: null });
  },

  startScan: async () => {
    const { selectedScanner, scanSettings, scanResolution, colorMode, duplexMode } = get();
    if (!selectedScanner) {
      set({ error: 'No scanner selected' });
      return;
    }

    console.log('startScan with user settings:', { scanResolution, colorMode, duplexMode });

    set({ isScanning: true, scanProgress: 0, error: null });

    try {
      const progressInterval = setInterval(() => {
        const currentProgress = get().scanProgress;
        if (currentProgress < 90) {
          set({ scanProgress: currentProgress + 10 });
        }
      }, 200);

      const pages = await epsonScannerService.startScan(scanSettings, {
        resolution: scanResolution,
        colorMode: colorMode,
        duplex: duplexMode,
      });

      clearInterval(progressInterval);
      set({
        scanProgress: 100,
        isScanning: false,
        scannedPages: [...get().scannedPages, ...pages],
      });

      if (pages.length > 0) {
        const documentName = 'Scan_' + format(new Date(), 'yyyyMMdd_HHmmss');
        try {
          await get().saveDocument(documentName, 'pdf');
          console.log('Document saved automatically:', documentName);
        } catch (saveError) {
          console.error('Failed to save document:', saveError);
        }
      }

      setTimeout(() => set({ scanProgress: 0 }), 500);
    } catch (error) {
      set({
        isScanning: false,
        scanProgress: 0,
        error: error instanceof Error ? error.message : 'Scan failed'
      });
    }
  },

  cancelScan: () => {
    set({ isScanning: false, scanProgress: 0 });
  },

  addScannedPage: (page: ScannedPage) => {
    set({ scannedPages: [...get().scannedPages, page] });
  },

  removeScannedPage: (pageId: string) => {
    set({
      scannedPages: get().scannedPages.filter(p => p.id !== pageId)
    });
  },

  clearScannedPages: () => {
    set({ scannedPages: [] });
  },

  reorderPages: (fromIndex: number, toIndex: number) => {
    const pages = [...get().scannedPages];
    const [removed] = pages.splice(fromIndex, 1);
    pages.splice(toIndex, 0, removed);
    set({ scannedPages: pages });
  },

  saveDocument: async (name: string, format: 'pdf' | 'tiff' | 'jpeg' | 'png') => {
    const { scannedPages } = get();

    if (scannedPages.length === 0) {
      throw new Error('No pages to save');
    }

    const document = await pdfService.createFromPages(scannedPages, {
      quality: 'high',
      compression: true,
      metadata: { title: name },
      pageSize: 'a4',
      orientation: 'portrait',
    });

    document.name = name;
    document.format = format;

    set({
      documents: [...get().documents, document],
      currentDocument: document,
      scannedPages: [],
    });

    return document;
  },

  loadDocuments: async () => {
    set({ documents: [] });
  },

  deleteDocument: (documentId: string) => {
    set({
      documents: get().documents.filter(d => d.id !== documentId)
    });
  },

  exportDocument: async (documentId: string, format: string) => {
    const document = get().documents.find(d => d.id === documentId);
    if (!document) {
      throw new Error('Document not found');
    }
    return 'file://export/' + document.name + '.' + format;
  },

  updateSettings: (newSettings: Partial<AppSettings>) => {
    set({ settings: { ...get().settings, ...newSettings } });
  },

  updateScanSettings: (newSettings: Partial<ScanSettings>) => {
    set({ scanSettings: { ...get().scanSettings, ...newSettings } });
  },

  setScanResolution: (resolution: number) => {
    console.log('Setting scan resolution:', resolution);
    set({ scanResolution: resolution });
  },

  setColorMode: (mode: string) => {
    console.log('Setting color mode:', mode);
    set({ colorMode: mode });
  },

  setDuplexMode: (duplex: boolean) => {
    console.log('Setting duplex mode:', duplex);
    set({ duplexMode: duplex });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useScannerStore;