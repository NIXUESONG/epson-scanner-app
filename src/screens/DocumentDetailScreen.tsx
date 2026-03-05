/**
 * 文档详情页面
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useScannerStore } from '../store';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

export const DocumentDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { documents, deleteDocument, exportDocument } = useScannerStore();

  const { documentId } = route.params as { documentId: string };
  const document = documents.find(d => d.id === documentId);

  if (!document) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← 返回</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>文档不存在</Text>
        </View>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      '删除文档',
      `确定要删除"${document.name}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            deleteDocument(document.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleExport = async () => {
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>文档详情</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleExport}>
            <Text style={styles.headerButtonText}>导出</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
            <Text style={styles.headerButtonText}>删除</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.documentName}>{document.name}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>格式:</Text>
            <Text style={styles.infoValue}>{document.format.toUpperCase()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>页数:</Text>
            <Text style={styles.infoValue}>{document.pages.length} 页</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>大小:</Text>
            <Text style={styles.infoValue}>{formatFileSize(document.fileSize)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>创建时间:</Text>
            <Text style={styles.infoValue}>
              {format(new Date(document.createdAt), 'yyyy-MM-dd HH:mm')}
            </Text>
          </View>
          {document.ocrText && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>OCR:</Text>
              <Text style={styles.infoValue}>已识别</Text>
            </View>
          )}
        </View>

        <View style={styles.pagesSection}>
          <Text style={styles.sectionTitle}>扫描页面 ({document.pages.length})</Text>
          {document.pages.map((page, index) => (
            <View key={page.id} style={styles.pageItem}>
              <View style={styles.pageThumbnail}>
                <Text style={styles.pageNumber}>{index + 1}</Text>
              </View>
              <View style={styles.pageInfo}>
                <Text style={styles.pageDimensions}>
                  {page.width} x {page.height} px
                </Text>
                <Text style={styles.pageSize}>
                  {formatFileSize(page.fileSize)}
                </Text>
              </View>
            </View>
          ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#003399',
    paddingTop: 48,
  },
  backButton: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 16,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 16,
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  documentName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  pagesSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  pageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pageThumbnail: {
    width: 48,
    height: 64,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  pageInfo: {
    marginLeft: 12,
    flex: 1,
  },
  pageDimensions: {
    fontSize: 14,
    color: '#333',
  },
  pageSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default DocumentDetailScreen;