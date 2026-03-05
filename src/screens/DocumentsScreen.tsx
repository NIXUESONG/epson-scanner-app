/**
 * 文档列表屏幕
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useScannerStore } from '../store';
import { Document } from '../types';
import { format } from 'date-fns';

export const DocumentsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { documents, loadDocuments, deleteDocument, exportDocument } = useScannerStore();

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleDelete = (document: Document) => {
    Alert.alert(
      '删除文档',
      `确定要删除 "${document.name}" 吗？`,
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '删除', 
          style: 'destructive',
          onPress: () => deleteDocument(document.id)
        },
      ]
    );
  };

  const handleExport = async (document: Document) => {
    try {
      const exportPath = await exportDocument(document.id, 'pdf');
      Alert.alert('导出成功', `文档已导出至: ${exportPath}`);
    } catch (error) {
      Alert.alert('导出失败', '无法导出文档');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFormatIcon = (format: string): string => {
    switch (format) {
      case 'pdf': return '📕';
      case 'tiff': return '🖼️';
      case 'jpeg': return '📷';
      case 'png': return '🎨';
      default: return '📄';
    }
  };

  const renderDocumentItem = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={styles.documentItem}
      onPress={() => navigation.navigate('DocumentDetail' as never, { documentId: item.id } as never)}
    >
      <View style={styles.documentIcon}>
        <Text style={styles.iconText}>{getFormatIcon(item.format)}</Text>
      </View>
      <View style={styles.documentInfo}>
        <Text style={styles.documentName}>{item.name}</Text>
        <View style={styles.documentMeta}>
          <Text style={styles.metaText}>
            {item.pages.length} 页 • {formatFileSize(item.fileSize)}
          </Text>
          <Text style={styles.metaText}>
            {format(new Date(item.createdAt), 'yyyy-MM-dd HH:mm')}
          </Text>
        </View>
        {item.ocrText && (
          <View style={styles.ocrBadge}>
            <Text style={styles.ocrText}>OCR</Text>
          </View>
        )}
      </View>
      <View style={styles.documentActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleExport(item)}
        >
          <Text style={styles.actionIcon}>📤</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDelete(item)}
        >
          <Text style={styles.actionIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>我的文档</Text>
        <Text style={styles.subtitle}>
          共 {documents.length} 个文档
        </Text>
      </View>

      <FlatList
        data={documents}
        renderItem={renderDocumentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={loadDocuments}
            colors={['#003399']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📁</Text>
            <Text style={styles.emptyText}>暂无文档</Text>
            <Text style={styles.emptySubtext}>扫描文档后将显示在这里</Text>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => navigation.navigate('Scan' as never)}
            >
              <Text style={styles.scanButtonText}>开始扫描</Text>
            </TouchableOpacity>
          </View>
        }
      />
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
  listContent: {
    padding: 16,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  documentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  ocrBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  ocrText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
  },
  documentActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  actionIcon: {
    fontSize: 20,
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
  },
  scanButton: {
    marginTop: 24,
    backgroundColor: '#003399',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default DocumentsScreen;
