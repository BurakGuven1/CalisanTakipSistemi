import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

// Ekranları Import Et
import LoginScreen from './src/screens/LoginScreen';
import EmployeeHomeScreen from './src/screens/EmployeeHomeScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import EmployeeDetailScreen from './src/screens/EmployeeDetailScreen';

import { View, ActivityIndicator, StyleSheet } from 'react-native';

const Stack = createStackNavigator();

const SplashScreen = () => (
  <View style={styles.splashContainer}>
    <ActivityIndicator size="large" color="#ffffff" />
  </View>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
      setUser(authenticatedUser);
      if (authenticatedUser) {
        const userDocRef = doc(db, 'users', authenticatedUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      } else {
        setUserRole(null);
      }
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  if (initializing) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
            headerStyle: { backgroundColor: '#1e3a8a' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : userRole === 'admin' ? (
          <>
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ headerShown: false }} />
            {/* DÜZELTME: Geri butonunun görünmesi için headerShown: true eklendi */}
            <Stack.Screen name="EmployeeDetail" component={EmployeeDetailScreen} options={{ title: 'Çalışan Detayları', headerShown: true }} />
          </>
        ) : (
          <>
            <Stack.Screen name="EmployeeHome" component={EmployeeHomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="QRScanner" component={QRScannerScreen} options={{ title: 'QR Kodu Tara' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
    splashContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        backgroundColor: '#1a237e' 
    }
});