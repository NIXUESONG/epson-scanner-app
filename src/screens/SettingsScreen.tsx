/**
 * 设置屏幕
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useScannerStore } from '../store';

export const SettingsScreen: React.FC = () => {
  const { settings, updateSettings } = useScannerStore();

  const renderSettingItem = (
    title: string,
    value: string,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.settingTitle}>{title}</Text>
      <View style={styles.settingValue}>
        <Text style={styles.settingValueText}>{value}</Text>
        {onPress && <Text style={styles.settingArrow}>›</Text>}
      </View>
    </TouchableOpacity>
  );

  const renderToggleItem = (
    title: string,
    description: string,
    value: boolean,
    onToggle: () => void
  ) => (
    <TouchableOpacity style={styles.toggleItem} onPress={onToggle}>
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleDescription}>{description}</Text>
      </View>
      <View style={[styles.toggleSwitch, value && styles.toggleSwitchActive]}>
        <View style={[styles.toggleKnob, value && styles.toggleKnobActive]} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>设置</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* 扫描设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>扫描设置</Text>
          <View style={styles.card}>
            {renderSettingItem(
              '默认分辨率',
              `${settings.defaultResolution} DPI`,
              () => {
                Alert.alert(
                  '选择分辨率',
                  '',
                  [
                    { text: '150 DPI', onPress: () => updateSettings({ defaultResolution: 150 }) },
                    { text: '200 DPI', onPress: () => updateSettings({ defaultResolution: 200 }) },
                    { text: '300 DPI', onPress: () => updateSettings({ defaultResolution: 300 }) },
                    { text: '600 DPI', onPress: () => updateSettings({ defaultResolution: 600 }) },
                    { text: '取消', style: 'cancel' },
                  ]
                );
              }
            )}
            {renderSettingItem(
              '默认颜色模式',
              settings.defaultColorMode === 'color' ? '彩色' :
              settings.defaultColorMode === 'grayscale' ? '灰度' : '黑白',
              () => {
                Alert.alert(
                  '选择颜色模式',
                  '',
                  [
                    { text: '彩色', onPress: () => updateSettings({ defaultColorMode: 'color' }) },
                    { text: '灰度', onPress: () => updateSettings({ defaultColorMode: 'grayscale' }) },
                    { text: '黑白', onPress: () => updateSettings({ defaultColorMode: 'blackwhite' }) },
                    { text: '取消', style: 'cancel' },
                  ]
                );
              }
            )}
            {renderSettingItem(
              '默认纸张大小',
              settings.defaultPaperSize.name,
              () => {
                Alert.alert(
                  '选择纸张大小',
                  '',
                  [
                    { text: 'A4', onPress: () => updateSettings({ defaultPaperSize: { name: 'A4', width: 210, height: 297 } }) },
                    { text: 'A3', onPress: () => updateSettings({ defaultPaperSize: { name: 'A3', width: 297, height: 420 } }) },
                    { text: 'Letter', onPress: () => updateSettings({ defaultPaperSize: { name: 'Letter', width: 215.9, height: 279.4 } }) },
                    { text: '取消', style: 'cancel' },
                  ]
                );
              }
            )}
          </View>
        </View>

        {/* 保存设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>保存设置</Text>
          <View style={styles.card}>
            {renderToggleItem(
              '自动保存',
              '扫描完成后自动保存文档',
              settings.autoSave,
              () => updateSettings({ autoSave: !settings.autoSave })
            )}
            {renderSettingItem(
              '保存路径',
              settings.savePath,
              () => Alert.alert('提示', '请在实际应用中实现路径选择')
            )}
            {renderSettingItem(
              '文件名格式',
              settings.fileNamePattern,
              () => Alert.alert('提示', '请在实际应用中实现格式编辑')
            )}
          </View>
        </View>

        {/* OCR设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OCR设置</Text>
          <View style={styles.card}>
            {renderToggleItem(
              '启用OCR',
              '扫描后自动识别文字',
              settings.ocrEnabled,
              () => updateSettings({ ocrEnabled: !settings.ocrEnabled })
            )}
            {renderSettingItem(
              'OCR语言',
              settings.ocrLanguage === 'chi_sim+eng' ? '中文+英文' : settings.ocrLanguage,
              () => {
                Alert.alert(
                  '选择OCR语言',
                  '',
                  [
                    { text: '中文', onPress: () => updateSettings({ ocrLanguage: 'chi_sim' }) },
                    { text: '英文', onPress: () => updateSettings({ ocrLanguage: 'eng' }) },
                    { text: '中文+英文', onPress: () => updateSettings({ ocrLanguage: 'chi_sim+eng' }) },
                    { text: '取消', style: 'cancel' },
                  ]
                );
              }
            )}
          </View>
        </View>

        {/* 外观设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>外观</Text>
          <View style={styles.card}>
            {renderSettingItem(
              '主题',
              settings.theme === 'light' ? '浅色' :
              settings.theme === 'dark' ? '深色' : '跟随系统',
              () => {
                Alert.alert(
                  '选择主题',
                  '',
                  [
                    { text: '浅色', onPress: () => updateSettings({ theme: 'light' }) },
                    { text: '深色', onPress: () => updateSettings({ theme: 'dark' }) },
                    { text: '跟随系统', onPress: () => updateSettings({ theme: 'system' }) },
                    { text: '取消', style: 'cancel' },
                  ]
                );
              }
            )}
          </View>
        </View>

        {/* 关于 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>关于</Text>
          <View style={styles.card}>
            {renderSettingItem('版本', '1.0.0')}
            {renderSettingItem('支持的扫描仪', 'Epson DS/ES/GT系列')}
          </View>
        </View>

        {/* 底部信息 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Epson Scanner App for Android
          </Text>
          <Text style={styles.footerSubtext}>
            类似NAPS2的文档扫描解决方案
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#003399',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValueText: {
    fontSize: 16,
    color: '#666',
  },
  settingArrow: {
    fontSize: 20,
    color: '#CCC',
    marginLeft: 8,
  },
  toggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    color: '#333',
  },
  toggleDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: '#003399',
  },
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});

export default SettingsScreen;
