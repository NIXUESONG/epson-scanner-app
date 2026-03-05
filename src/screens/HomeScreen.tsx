/**
 * 主屏幕 - 扫描仪发现和选择
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useScannerStore } from '../store';
import { Scanner } from '../types';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    scanners,
    selectedScanner,
    isLoading,
    error,
    discoverScanners,
    selectScanner,
    clearError,
  } = useScannerStore();

  useEffect(() => {
    discoverScanners();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await discoverScanners();
    setRefreshing(false);
  };

  const handleScannerSelect = async (scanner: Scanner) => {
    await selectScanner(scanner);
    if (useScannerStore.getState().selectedScanner) {
      navigation.navigate('Scan' as never);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#4CAF50';
      case 'offline': return '#F44336';
      case 'busy': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'wifi': return '📶';
      case 'usb': return '🔌';
      case 'bluetooth': return '📡';
      default: return '📄';
    }
  };

  const renderScannerItem = ({ item }: { item: Scanner }) => (
    <TouchableOpacity
      style={[
        styles.scannerItem,
        selectedScanner?.id === item.id && styles.scannerItemSelected,
      ]}
      onPress={() => handleScannerSelect(item)}
    >
      <View style={styles.scannerHeader}>
        <Text style={styles.scannerIcon}>{getConnectionIcon(item.connectionType)}</Text>
        <View style={styles.scannerInfo}>
          <Text style={styles.scannerName}>{item.name}</Text>
          <Text style={styles.scannerModel}>{item.model}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      {item.ipAddress && (
        <Text style={styles.scannerIP}>IP: {item.ipAddress}</Text>
      )}
      <View style={styles.capabilities}>
        {item.capabilities.duplex && (
          <View style={styles.capabilityBadge}>
            <Text style={styles.capabilityText}>双面</Text>
          </View>
        )}
        {item.capabilities.adf && (
          <View style={styles.capabilityBadge}>
            <Text style={styles.capabilityText}>ADF</Text>
          </View>
        )}
        <View style={styles.capabilityBadge}>
          <Text style={styles.capabilityText}>{item.capabilities.resolutions[item.capabilities.resolutions.length - 1]} DPI</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Epson 扫描仪</Text>
        <Text style={styles.subtitle}>发现并连接您的扫描仪</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Text style={styles.errorDismiss}>关闭</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#003399" />
          <Text style={styles.loadingText}>正在搜索扫描仪...</Text>
        </View>
      ) : (
        <FlatList
          data={scanners}
          renderItem={renderScannerItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#003399']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>未发现扫描仪</Text>
              <Text style={styles.emptySubtext}>请确保扫描仪已开启并连接到同一网络</Text>
              <TouchableOpacity style={styles.retryButton} onPress={discoverScanners}>
                <Text style={styles.retryButtonText}>重新搜索</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.manualAddButton}
          onPress={() => navigation.navigate('ManualAdd' as never)}
        >
          <Text style={styles.manualAddText}>+ 手动添加扫描仪</Text>
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
  header: {
    padding: 20,
    backgroundColor: '#003399',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    padding: 16,
  },
  scannerItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scannerItemSelected: {
    borderWidth: 2,
    borderColor: '#003399',
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scannerIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  scannerInfo: {
    flex: 1,
  },
  scannerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  scannerModel: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  scannerIP: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  capabilities: {
    flexDirection: 'row',
    marginTop: 12,
    flexWrap: 'wrap',
  },
  capabilityBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  capabilityText: {
    fontSize: 12,
    color: '#003399',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#003399',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#C62828',
    flex: 1,
  },
  errorDismiss: {
    color: '#C62828',
    fontWeight: '600',
    marginLeft: 12,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  manualAddButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  manualAddText: {
    color: '#003399',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default HomeScreen;
