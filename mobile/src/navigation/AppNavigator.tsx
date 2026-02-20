/**
 * App Navigator
 * Main navigation structure - Auth disabled for now
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { MainTabParamList } from './types';

// Screens
import HomeScreen from '../screens/home/HomeScreen';
import NewsScreen from '../screens/news/NewsScreen';
import MemberCardScreen from '../screens/member/MemberCardScreen';
import LoanHistoryScreen from '../screens/loans/LoanHistoryScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const MainTab = createBottomTabNavigator<MainTabParamList>();

// Main Tab Navigator
function MainNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'News') {
            iconName = focused ? 'newspaper' : 'newspaper-outline';
          } else if (route.name === 'MemberCard') {
            iconName = focused ? 'qr-code' : 'qr-code-outline';
          } else if (route.name === 'LoanHistory') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#1e293b',
          borderTopColor: '#334155',
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#1e293b',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <MainTab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          title: 'Katalog',
          headerTitle: 'Katalog Perpustakaan',
        }}
      />
      <MainTab.Screen 
        name="News" 
        component={NewsScreen}
        options={{ title: 'Berita' }}
      />
      <MainTab.Screen 
        name="MemberCard" 
        component={MemberCardScreen}
        options={{ 
          title: 'Kartu',
          headerTitle: 'Kartu Member',
        }}
      />
      <MainTab.Screen 
        name="LoanHistory" 
        component={LoanHistoryScreen}
        options={{ 
          title: 'Riwayat',
          headerTitle: 'Riwayat Peminjaman',
        }}
      />
      <MainTab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profil' }}
      />
    </MainTab.Navigator>
  );
}

// Root Navigator
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <MainNavigator />
    </NavigationContainer>
  );
}
