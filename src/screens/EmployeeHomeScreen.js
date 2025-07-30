import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

export default function EmployeeHomeScreen({ navigation }) {
    const { themeData } = useTheme();
    const [userName, setUserName] = useState('');
    const [lastCheck, setLastCheck] = useState(null);
    const unsubscribeRef = useRef(null);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const userDocRef = doc(db, 'users', user.uid);
        getDoc(userDocRef).then(docSnap => {
            if (docSnap.exists()) {
                setUserName(docSnap.data().username);
            }
        });

        const q = query(collection(db, 'checkIns'), where('userId', '==', user.uid), orderBy('timestamp', 'desc'), limit(1));
        unsubscribeRef.current = onSnapshot(q, (querySnapshot) => {
            if (!querySnapshot.empty) {
                const data = querySnapshot.docs[0].data();
                if(data.timestamp) {
                    setLastCheck({ type: data.type, time: data.timestamp.toDate().toLocaleTimeString('tr-TR') });
                }
            } else {
                setLastCheck(null);
            }
        });
        return () => { if (unsubscribeRef.current) unsubscribeRef.current(); };
    }, []);

    const handleLogout = () => {
        // Çıkış yapmadan ÖNCE dinleyiciyi durdur
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
        }
        signOut(auth);
    };
    
    const getButtonText = () => !lastCheck || lastCheck.type === 'out' ? 'Mağazaya Giriş Yap (QR Tara)' : 'Mağazadan Çıkış Yap (QR Tara)';

    return (
        <LinearGradient colors={themeData.background === '#f8fafc' ? ['#f3f4f6', '#e5e7eb'] : ['#0f172a', '#1e293b']} style={[styles.container, {backgroundColor: themeData.background}]}>
            <View style={styles.header}>
                <Text style={[styles.welcomeText, {color: themeData.subtext}]}>Hoş Geldin,</Text>
                <Text style={[styles.userName, {color: themeData.text}]}>{userName}</Text>
            </View>
            <View style={[styles.statusBox, {backgroundColor: themeData.card}]}>
                <Text style={[styles.statusTitle, {color: themeData.subtext}]}>Son İşlem Durumu</Text>
                {lastCheck ? (
                    <Text style={[styles.statusText, {color: themeData.primary}]}>{`${lastCheck.type === 'in' ? 'Giriş Yapıldı' : 'Çıkış Yapıldı'} - ${lastCheck.time}`}</Text>
                ) : (
                    <Text style={[styles.statusText, {color: themeData.primary}]}>Bugün hiç işlem yapılmadı.</Text>
                )}
            </View>
            <TouchableOpacity style={styles.scanButton} onPress={() => navigation.navigate('QRScanner')}>
                <Text style={styles.scanButtonText}>{getButtonText()}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.historyButton} onPress={() => navigation.navigate('EmployeeHistory')}>
                <Text style={styles.historyButtonText}>Giriş/Çıkış Geçmişim</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
            </TouchableOpacity>
        </LinearGradient>
    );
}
const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: 'space-around' },
    header: { marginTop: 60, alignItems: 'center' },
    welcomeText: { fontSize: 24 },
    userName: { fontSize: 32, fontWeight: 'bold' },
    statusBox: { borderRadius: 20, padding: 25, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
    statusTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
    statusText: { fontSize: 22, fontWeight: 'bold' },
    scanButton: { backgroundColor: '#3b82f6', paddingVertical: 20, borderRadius: 20, alignItems: 'center', shadowColor: "#3b82f6", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
    scanButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    historyButton: { backgroundColor: '#fff', paddingVertical: 15, borderRadius: 20, alignItems: 'center', borderColor: '#d1d5db', borderWidth: 1, marginTop: 15 },
    historyButtonText: { color: '#374151', fontSize: 16, fontWeight: '600' },
    logoutButton: { alignSelf: 'center', padding: 10, marginTop: 20 },
    logoutButtonText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
});