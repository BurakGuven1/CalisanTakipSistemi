import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';


// Ekranları Import Et
import LoginScreen from './src/screens/LoginScreen';
import AuthChoiceScreen from './src/screens/AuthChoiceScreen';
import AdminSignUpScreen from './src/screens/AdminSignUpScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import EmployeeHomeScreen from './src/screens/EmployeeHomeScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import EmployeeDetailScreen from './src/screens/EmployeeDetailScreen';
import StoreManagementScreen from './src/screens/StoreManagementScreen';
import EditStoreScreen from './src/screens/EditStoreScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import EmployeeHistoryScreen from './src/screens/EmployeeHistoryScreen';

import { View, ActivityIndicator, StyleSheet } from 'react-native';

// AppWrapper artık tek default export olacak
export default function AppWrapper() {
    return (
        <ThemeProvider>
            <App />
        </ThemeProvider>
    );
}

const Stack = createStackNavigator();

const SplashScreen = () => (
  <View style={styles.splashContainer}>
    <ActivityIndicator size="large" color="#ffffff" />
  </View>
);

// Bu fonksiyon artık default olarak export edilmiyor
function App() {
    const { themeData } = useTheme(); // Temayı al
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
                    headerStyle: { backgroundColor: themeData.header },
                    headerTintColor: themeData.headerText,
                    headerTitleStyle: { fontWeight: 'bold' },
                }}>

                {!user ? (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="AuthChoice" component={AuthChoiceScreen} options={{ title: 'Kayıt Türünü Seçin' }} />
                        <Stack.Screen name="AdminSignUp" component={AdminSignUpScreen} options={{ title: 'Yönetici Kaydı' }} />
                        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Çalışan Kaydı' }} />
                    </>
                ) : userRole === 'admin' ? (
                    <>
                        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="EmployeeDetail" component={EmployeeDetailScreen} options={{ title: 'Çalışan Detayları' }} />
                        <Stack.Screen name="StoreManagement" component={StoreManagementScreen} options={{ title: 'Mağaza Yönetimi' }} />
                        <Stack.Screen name="EditStore" component={EditStoreScreen} />
                        <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Raporlar' }} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="EmployeeHome" component={EmployeeHomeScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="QRScanner" component={QRScannerScreen} options={{ title: 'QR Kodu Tara' }} />
                        <Stack.Screen name="EmployeeHistory" component={EmployeeHistoryScreen} options={{ title: 'Giriş/Çıkış Geçmişim' }} />
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
