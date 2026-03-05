/**
 * 应用主入口
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './screens/HomeScreen';
import ScanScreen from './screens/ScanScreen';
import DocumentsScreen from './screens/DocumentsScreen';
import SettingsScreen from './screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 底部标签导航
const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let icon = '';
          switch (route.name) {
            case 'Home':
              icon = '🏠';
              break;
            case 'Scan':
              icon = '📄';
              break;
            case 'Documents':
              icon = '📁';
              break;
            case 'Settings':
              icon = '⚙️';
              break;
          }
          return <span style={{ fontSize: size }}>{icon}</span>;
        },
        tabBarActiveTintColor: '#003399',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: '扫描仪' }}
      />
      <Tab.Screen 
        name="Scan" 
        component={ScanScreen}
        options={{ tabBarLabel: '扫描' }}
      />
      <Tab.Screen 
        name="Documents" 
        component={DocumentsScreen}
        options={{ tabBarLabel: '文档' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ tabBarLabel: '设置' }}
      />
    </Tab.Navigator>
  );
};

// 主应用组件
const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={TabNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
