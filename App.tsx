import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useScannerStore } from './src/store';
import epsonScannerService from './src/services/EpsonScannerService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THUMBNAIL_SIZE = (SCREEN_WIDTH - 48) / 3;

export default function App() {
  const [currentScreen, setCurrentScreen] = React.useState('home');
  const [selectedDocId, setSelectedDocId] = React.useState(null);

  const {
    scanners,
    selectedScanner,
    isScanning,
    scanProgress,
    scannedPages,
    documents,
    isLoading,
    discoverScanners,
    selectScanner,
    startScan,
    scanSettings,
    updateScanSettings,
  } = useScannerStore();

  React.useEffect(() => {
    if (currentScreen === 'home') {
      discoverScanners();
    }
  }, [currentScreen]);

  const connectScanner = async (scanner) => {
    if (scanner.status !== 'online') {
      Alert.alert('错误', '该扫描仪当前离线');
      return;
    }
    await selectScanner(scanner);
    setCurrentScreen('scan');
  };

  const handleStartScan = async () => {
    if (!selectedScanner) {
      Alert.alert('错误', '请先选择扫描仪');
      return;
    }
    await startScan();
  };

  const openImage = async (page) => {
    try {
      const filePath = page.path || page.uri.replace('file://', '');
      await epsonScannerService.openInGallery(filePath);
    } catch (e) {
      Alert.alert('提示', '无法打开图片');
    }
  };

  const openFolder = async () => {
    try {
      await epsonScannerService.openFolderInGallery();
    } catch (e) {
      Alert.alert('提示', '无法打开文件管理器');
    }
  };

  const renderHomeScreen = () => (
    <View style={styles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Epson 扫描仪</Text>
        <Text style={styles.headerSubtitle}>发现并连接您的扫描仪</Text>
      </View>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#003399" />
          <Text style={styles.loadingText}>正在搜索扫描仪...</Text>
        </View>
      ) : scanners.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>未发现扫描仪</Text>
          <TouchableOpacity style={styles.retryButton} onPress={discoverScanners}>
            <Text style={styles.retryButtonText}>重新搜索</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scannerList}>
          {scanners.map(scanner => (
            <TouchableOpacity key={scanner.id} style={styles.scannerItem} onPress={() => connectScanner(scanner)}>
              <View style={styles.scannerHeader}>
                <Text style={styles.scannerIcon}>{scanner.connectionType === 'usb' ? 'USB' : 'NET'}</Text>
                <View style={styles.scannerInfo}>
                  <Text style={styles.scannerName}>{scanner.name}</Text>
                  <Text style={styles.scannerIP}>{scanner.connectionType === 'usb' ? 'USB连接' : scanner.ipAddress}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: scanner.status === 'online' ? '#4CAF50' : '#F44336' }]}>
                  <Text style={styles.statusText}>{scanner.status === 'online' ? '在线' : '离线'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderScanScreen = () => (
    <View style={styles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>扫描文档</Text>
        <Text style={styles.headerSubtitle}>{selectedScanner ? '已连接: ' + selectedScanner.name : '未连接扫描仪'}</Text>
      </View>
      {!selectedScanner ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>请先连接扫描仪</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => setCurrentScreen('home')}>
            <Text style={styles.retryButtonText}>前往连接</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.scanContent}>
          <View style={styles.scanPreview}>
            {isScanning ? (
              <View style={styles.scanningContainer}>
                <ActivityIndicator size="large" color="#003399" />
                <Text style={styles.scanningText}>正在扫描...</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: scanProgress + '%' }]} />
                </View>
              </View>
            ) : (
              <View style={styles.emptyPreview}>
                <Text style={styles.emptyText}>已扫描 {scannedPages.length} 页</Text>
              </View>
            )}
          </View>
          <View style={styles.scanActions}>
            <TouchableOpacity style={[styles.scanButton, isScanning && styles.scanButtonDisabled]} onPress={handleStartScan} disabled={isScanning}>
              <Text style={styles.scanButtonText}>{isScanning ? '扫描中...' : '开始扫描'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const renderDocsScreen = () => (
    <View style={styles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>我的文档</Text>
        <Text style={styles.headerSubtitle}>共 {documents.length} 个文档</Text>
      </View>
      <ScrollView style={styles.documentList}>
        {documents.map(doc => (
          <TouchableOpacity 
            key={doc.id} 
            style={styles.documentCard} 
            onPress={() => {
              setSelectedDocId(doc.id);
              setCurrentScreen('docDetail');
            }}>
            <View style={styles.documentCardHeader}>
              <Text style={styles.documentIcon}>DOC</Text>
              <View style={styles.documentInfo}>
                <Text style={styles.documentName}>{doc.name}</Text>
                <Text style={styles.documentMeta}>{doc.pages?.length || 0} 页</Text>
              </View>
            </View>
         
            <View style={styles.thumbnailGrid}>
              {doc.pages?.slice(0, 6).map((page, index) => (
                page.uri.endsWith('.pdf') ? (
                  <View key={page.id} style={[styles.gridThumbnail, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 16, color: '#003399' }}>PDF</Text>
                  </View>
                ) : (
                  <Image key={page.id} source={{ uri: page.uri }} style={styles.gridThumbnail} resizeMode="cover" />
                )       
              ))}
            </View>

          </TouchableOpacity>
        ))}
        {documents.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无文档</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderDocDetailScreen = () => {
    const doc = documents.find(d => d.id === selectedDocId);
    if (!doc) {
      return (
        <View style={styles.screenContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setCurrentScreen('docs')}>
              <Text style={styles.backButton}>返回</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>文档详情</Text>
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.emptyText}>文档不存在</Text>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.screenContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentScreen('docs')}>
            <Text style={styles.backButton}>返回</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{doc.name}</Text>
        </View>
        <View style={styles.galleryInfo}>
          <Text style={styles.galleryInfoText}>共 {doc.pages?.length || 0} 页 - 点击图片查看</Text>
          <TouchableOpacity style={styles.galleryButton} onPress={openFolder}>
            <Text style={styles.galleryButtonText}>在文件管理器中查看</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.galleryContainer}>
          <View style={styles.galleryGrid}>
            {doc.pages?.map((page, index) => (
              <TouchableOpacity 
                key={page.id} 
                style={styles.galleryItem}
                onPress={() => openImage(page)}>
                {page.uri.endsWith('.pdf') ? (
                  <View style={[styles.galleryThumbnail, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 24, color: '#003399' }}>PDF</Text>
                  </View>
                ) : (
                  <Image source={{ uri: page.uri }} style={styles.galleryThumbnail} resizeMode="cover" />
             )}

                <View style={styles.pageNumberBadge}>
                  <Text style={styles.pageNumberText}>{index + 1}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderSettingsScreen = () => (
    <View style={styles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>设置</Text>
      </View>
      <ScrollView style={styles.settingsList}>
        <View style={styles.settingItem}>
          <Text style={styles.settingTitle}>分辨率</Text>
          <View style={styles.settingOptions}>
            {[150, 200, 300, 600].map(dpi => (
              <TouchableOpacity key={dpi} style={[styles.optionButton, scanSettings.resolution === dpi && styles.optionButtonActive]} onPress={() => updateScanSettings({ resolution: dpi })}>
                <Text style={[styles.optionText, scanSettings.resolution === dpi && styles.optionTextActive]}>{dpi} DPI</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingTitle}>颜色模式</Text>
          <View style={styles.settingOptions}>
            {[{value: 'color', label: '彩色'}, {value: 'grayscale', label: '灰度'}, {value: 'mono', label: '黑白'}].map(mode => (
              <TouchableOpacity key={mode.value} style={[styles.optionButton, scanSettings.colorMode === mode.value && styles.optionButtonActive]} onPress={() => updateScanSettings({ colorMode: mode.value })}>
                <Text style={[styles.optionText, scanSettings.colorMode === mode.value && styles.optionTextActive]}>{mode.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingTitle}>双面扫描</Text>
          <View style={styles.settingOptions}>
            <TouchableOpacity style={[styles.optionButton, !scanSettings.duplex && styles.optionButtonActive]} onPress={() => updateScanSettings({ duplex: false })}>
              <Text style={[styles.optionText, !scanSettings.duplex && styles.optionTextActive]}>单面</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.optionButton, scanSettings.duplex && styles.optionButtonActive]} onPress={() => updateScanSettings({ duplex: true })}>
              <Text style={[styles.optionText, scanSettings.duplex && styles.optionTextActive]}>双面</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingTitle}>保存格式</Text>
          <View style={styles.settingOptions}>
            {[{value: 'jpeg', label: 'JPEG'}, {value: 'pdf', label: 'PDF'}, {value: 'pnm', label: 'PNM'}].map(format => (
              <TouchableOpacity key={format.value} style={[styles.optionButton, scanSettings.saveFormat === format.value && styles.optionButtonActive]} onPress={() => updateScanSettings({ saveFormat: format.value })}>
                <Text style={[styles.optionText, scanSettings.saveFormat === format.value && styles.optionTextActive]}>{format.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );

  const renderBottomNav = () => (
    <View style={styles.bottomNav}>
      {[
        {id:'home',label:'扫描仪'},
        {id:'scan',label:'扫描'},
        {id:'docs',label:'文档'},
        {id:'settings',label:'设置'}
      ].map(item => (
        <TouchableOpacity key={item.id} style={styles.navItem} onPress={() => setCurrentScreen(item.id)}>
          <Text style={[styles.navLabel, currentScreen === item.id && styles.navLabelActive]}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        {currentScreen === 'home' && renderHomeScreen()}
        {currentScreen === 'scan' && renderScanScreen()}
        {currentScreen === 'docs' && renderDocsScreen()}
        {currentScreen === 'settings' && renderSettingsScreen()}
        {currentScreen === 'docDetail' && renderDocDetailScreen()}
        {renderBottomNav()}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  screenContainer: { flex: 1 },
  header: { backgroundColor: '#003399', padding: 20, paddingTop: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 14, color: '#FFFFFF', opacity: 0.8, marginTop: 4 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  emptyText: { fontSize: 16, color: '#333' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyPreview: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  retryButton: { backgroundColor: '#003399', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 16 },
  retryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  scannerList: { flex: 1, padding: 16 },
  scannerItem: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12 },
  scannerHeader: { flexDirection: 'row', alignItems: 'center' },
  scannerIcon: { fontSize: 16, marginRight: 12, fontWeight: 'bold', color: '#003399' },
  scannerInfo: { flex: 1 },
  scannerName: { fontSize: 16, fontWeight: '600', color: '#333' },
  scannerIP: { fontSize: 12, color: '#666', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, color: '#FFFFFF', fontWeight: '500' },
  scanContent: { flex: 1 },
  scanPreview: { height: 200, backgroundColor: '#FFFFFF', margin: 16, borderRadius: 12 },
  scanningContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanningText: { fontSize: 16, color: '#333', marginTop: 12 },
  progressBar: { width: '80%', height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, marginTop: 16, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#003399' },
  scanActions: { flexDirection: 'row', padding: 16 },
  scanButton: { flex: 1, backgroundColor: '#003399', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  scanButtonDisabled: { backgroundColor: '#9E9E9E' },
  scanButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  documentList: { flex: 1, padding: 16 },
  documentCard: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  documentCardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  documentIcon: { fontSize: 16, marginRight: 12, fontWeight: 'bold', color: '#003399' },
  documentInfo: { flex: 1 },
  documentName: { fontSize: 16, fontWeight: '600', color: '#333' },
  documentMeta: { fontSize: 12, color: '#666', marginTop: 2 },
  thumbnailGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 4 },
  gridThumbnail: { width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE, margin: 2 },
  galleryInfo: { backgroundColor: '#E3F2FD', padding: 12, alignItems: 'center' },
  galleryInfoText: { fontSize: 14, color: '#003399' },
  galleryButton: { backgroundColor: '#003399', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
  galleryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  galleryContainer: { flex: 1, padding: 8 },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  galleryItem: { width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE, margin: 4, borderRadius: 8, overflow: 'hidden' },
  galleryThumbnail: { width: '100%', height: '100%' },
  pageNumberBadge: { position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,51,153,0.8)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  pageNumberText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  settingsList: { flex: 1, padding: 16 },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 8 },
  settingTitle: { fontSize: 16, color: '#333' },
  settingValue: { fontSize: 14, color: '#666' },
    settingOptions: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
    optionButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F0F0F0', marginRight: 8, marginBottom: 8 },
    optionButtonActive: { backgroundColor: '#003399' },
    optionText: { fontSize: 14, color: '#333' },
    optionTextActive: { color: '#FFFFFF', fontWeight: '600' },
  bottomNav: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E0E0E0', paddingVertical: 12, paddingBottom: 24 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  navLabel: { fontSize: 14, color: '#999' },
  navLabelActive: { color: '#003399', fontWeight: '600' },
  backButton: { color: '#FFFFFF', fontSize: 16, marginRight: 16 },
});