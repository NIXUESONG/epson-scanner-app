/**
 * 扫描屏幕 - 扫描控制和预览
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useScannerStore } from '../store';
import { ColorMode, PaperSize } from '../types';

export const ScanScreen: React.FC = () => {
  const navigation = useNavigation();
  const [showSettings, setShowSettings] = useState(false);
  
  const {
    selectedScanner,
    scanSettings,
    scannedPages,
    isScanning,
    scanProgress,
    updateScanSettings,
    startScan,
    cancelScan,
    removeScannedPage,
    clearScannedPages,
    saveDocument,
  } = useScannerStore();

  const handleScan = async () => {
    await startScan();
  };

  const handleSave = async () => {
    if (scannedPages.length === 0) {
      Alert.alert('提示', '没有可保存的页面');
      return;
    }

    const name = `扫描文档_${new Date().toLocaleDateString()}`;
    try {
      await saveDocument(name, 'pdf');
      Alert.alert('成功', '文档已保存', [
        { text: '确定', onPress: () => navigation.navigate('Documents' as never) }
      ]);
    } catch (error) {
      Alert.alert('错误', '保存失败');
    }
  };

  const paperSizes: PaperSize[] = [
    { name: 'A4', width: 210, height: 297 },
    { name: 'A3', width: 297, height: 420 },
    { name: 'Letter', width: 215.9, height: 279.4 },
    { name: 'Legal', width: 215.9, height: 355.6 },
    { name: 'A5', width: 148, height: 210 },
  ];

  const resolutions = [75, 100, 150, 200, 300, 400, 600];

  const colorModes: { value: ColorMode; label: string }[] = [
    { value: 'color', label: '彩色' },
    { value: 'grayscale', label: '灰度' },
    { value: 'blackwhite', label: '黑白' },
  ];

  return (
    <View style={styles.container}>
      {/* 扫描仪信息 */}
      <View style={styles.scannerInfo}>
        <Text style={styles.scannerName}>
          📄 {selectedScanner?.name || '未选择扫描仪'}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.changeScanner}>更换</Text>
        </TouchableOpacity>
      </View>

      {/* 扫描预览区域 */}
      <View style={styles.previewContainer}>
        {isScanning ? (
          <View style={styles.scanningContainer}>
            <ActivityIndicator size="large" color="#003399" />
            <Text style={styles.scanningText}>正在扫描...</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${scanProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{scanProgress}%</Text>
            <TouchableOpacity style={styles.cancelButton} onPress={cancelScan}>
              <Text style={styles.cancelButtonText}>取消扫描</Text>
            </TouchableOpacity>
          </View>
        ) : scannedPages.length > 0 ? (
          <ScrollView horizontal style={styles.pagesPreview}>
            {scannedPages.map((page, index) => (
              <TouchableOpacity
                key={page.id}
                style={styles.pageThumbnail}
                onLongPress={() => {
                  Alert.alert(
                    '删除页面',
                    '确定要删除此页面吗？',
                    [
                      { text: '取消', style: 'cancel' },
                      { text: '删除', onPress: () => removeScannedPage(page.id), style: 'destructive' },
                    ]
                  );
                }}
              >
                <View style={styles.thumbnailPlaceholder}>
                  <Text style={styles.thumbnailIcon}>📄</Text>
                </View>
                <Text style={styles.pageNumber}>第 {index + 1} 页</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.addPageButton}
              onPress={handleScan}
            >
              <Text style={styles.addPageIcon}>+</Text>
              <Text style={styles.addPageText}>添加页面</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <View style={styles.emptyPreview}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyText}>点击下方按钮开始扫描</Text>
          </View>
        )}
      </View>

      {/* 扫描设置 */}
      <TouchableOpacity
        style={styles.settingsHeader}
        onPress={() => setShowSettings(!showSettings)}
      >
        <Text style={styles.settingsTitle}>扫描设置</Text>
        <Text style={styles.settingsToggle}>{showSettings ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {showSettings && (
        <ScrollView style={styles.settingsContainer}>
          {/* 分辨率 */}
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>分辨率 (DPI)</Text>
            <View style={styles.optionButtons}>
              {resolutions.slice(2, 6).map((res) => (
                <TouchableOpacity
                  key={res}
                  style={[
                    styles.optionButton,
                    scanSettings.resolution === res && styles.optionButtonActive,
                  ]}
                  onPress={() => updateScanSettings({ resolution: res })}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      scanSettings.resolution === res && styles.optionButtonTextActive,
                    ]}
                  >
                    {res}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 颜色模式 */}
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>颜色模式</Text>
            <View style={styles.optionButtons}>
              {colorModes.map((mode) => (
                <TouchableOpacity
                  key={mode.value}
                  style={[
                    styles.optionButton,
                    scanSettings.colorMode === mode.value && styles.optionButtonActive,
                  ]}
                  onPress={() => updateScanSettings({ colorMode: mode.value })}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      scanSettings.colorMode === mode.value && styles.optionButtonTextActive,
                    ]}
                  >
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 纸张大小 */}
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>纸张大小</Text>
            <View style={styles.optionButtons}>
              {paperSizes.map((size) => (
                <TouchableOpacity
                  key={size.name}
                  style={[
                    styles.optionButton,
                    scanSettings.paperSize.name === size.name && styles.optionButtonActive,
                  ]}
                  onPress={() => updateScanSettings({ paperSize: size })}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      scanSettings.paperSize.name === size.name && styles.optionButtonTextActive,
                    ]}
                  >
                    {size.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 双面扫描 */}
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>双面扫描</Text>
            <TouchableOpacity
              style={[styles.toggleButton, scanSettings.duplex && styles.toggleButtonActive]}
              onPress={() => updateScanSettings({ duplex: !scanSettings.duplex })}
            >
              <Text style={styles.toggleButtonText}>
                {scanSettings.duplex ? '开启' : '关闭'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 自动裁剪 */}
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>自动裁剪</Text>
            <TouchableOpacity
              style={[styles.toggleButton, scanSettings.autoCrop && styles.toggleButtonActive]}
              onPress={() => updateScanSettings({ autoCrop: !scanSettings.autoCrop })}
            >
              <Text style={styles.toggleButtonText}>
                {scanSettings.autoCrop ? '开启' : '关闭'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 自动纠偏 */}
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>自动纠偏</Text>
            <TouchableOpacity
              style={[styles.toggleButton, scanSettings.deskew && styles.toggleButtonActive]}
              onPress={() => updateScanSettings({ deskew: !scanSettings.deskew })}
            >
              <Text style={styles.toggleButtonText}>
                {scanSettings.deskew ? '开启' : '关闭'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* 操作按钮 */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => {
            Alert.alert(
              '清空页面',
              '确定要清空所有已扫描的页面吗？',
              [
                { text: '取消', style: 'cancel' },
                { text: '清空', onPress: clearScannedPages, style: 'destructive' },
              ]
            );
          }}
        >
          <Text style={styles.clearButtonText}>清空</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
          onPress={handleScan}
          disabled={isScanning}
        >
          <Text style={styles.scanButtonText}>
            {isScanning ? '扫描中...' : '扫描'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, scannedPages.length === 0 && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={scannedPages.length === 0}
        >
          <Text style={styles.saveButtonText}>
            保存 ({scannedPages.length})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scannerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#003399',
  },
  scannerName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  changeScanner: {
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
  previewContainer: {
    height: 200,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  scanningContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scanningText: {
    fontSize: 18,
    color: '#333',
    marginTop: 12,
  },
  progressBar: {
    width: '80%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#003399',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  cancelButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  cancelButtonText: {
    color: '#F44336',
    fontSize: 14,
  },
  emptyPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  pagesPreview: {
    flex: 1,
    padding: 12,
  },
  pageThumbnail: {
    width: 100,
    marginRight: 12,
    alignItems: 'center',
  },
  thumbnailPlaceholder: {
    width: 80,
    height: 100,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#003399',
  },
  thumbnailIcon: {
    fontSize: 32,
  },
  pageNumber: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  addPageButton: {
    width: 80,
    height: 100,
    borderWidth: 2,
    borderColor: '#003399',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPageIcon: {
    fontSize: 32,
    color: '#003399',
  },
  addPageText: {
    fontSize: 12,
    color: '#003399',
    marginTop: 4,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingsToggle: {
    fontSize: 14,
    color: '#003399',
  },
  settingsContainer: {
    backgroundColor: '#FFFFFF',
    maxHeight: 250,
    padding: 16,
  },
  settingItem: {
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  optionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 8,
    marginBottom: 8,
  },
  optionButtonActive: {
    backgroundColor: '#003399',
    borderColor: '#003399',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#333',
  },
  optionButtonTextActive: {
    color: '#FFFFFF',
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignSelf: 'flex-start',
  },
  toggleButtonActive: {
    backgroundColor: '#003399',
    borderColor: '#003399',
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F44336',
    marginRight: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '500',
  },
  scanButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#003399',
    marginHorizontal: 8,
    alignItems: 'center',
  },
  scanButtonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ScanScreen;
