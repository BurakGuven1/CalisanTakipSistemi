import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';

export default function EmployeeHomeScreen({ navigation }) {
    const [userName, setUserName] = useState('');
    const [lastCheck, setLastCheck] = useState(null);
    const unsubscribeRef = useRef(null); // Dinleyiciyi tutmak için ref

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const userDocRef = doc(db, 'users', user.uid);
        getDoc(userDocRef).then(docSnap => {
            if (docSnap.exists()) {
                setUserName(docSnap.data().fullName);
            }
        });

        const q = query(collection(db, 'checkIns'), where('userId', '==', user.uid), orderBy('timestamp', 'desc'), limit(1));
        // Dinleyiciyi ref'e ata
        unsubscribeRef.current = onSnapshot(q, (querySnapshot) => {
            if (!querySnapshot.empty) {
                const lastCheckData = querySnapshot.docs[0].data();
                setLastCheck({
                    type: lastCheckData.type,
                    time: lastCheckData.timestamp.toDate().toLocaleTimeString('tr-TR')
                });
            } else {
                setLastCheck(null);
            }
        });

        // Component unmount olduğunda dinleyiciyi durdur
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, []);

    const handleLogout = () => {
        // Çıkış yapmadan ÖNCE dinleyiciyi durdur
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
        }
        signOut(auth).catch(error => Alert.alert('Hata', error.message));
    };
    
    const getButtonText = () => {
        if (!lastCheck || lastCheck.type === 'out') {
            return 'Mağazaya Giriş Yap (QR Tara)';
        }
        return 'Mağazadan Çıkış Yap (QR Tara)';
    };

    return (
        <LinearGradient colors={['#f3f4f6', '#e5e7eb']} style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.welcomeText}>Hoş Geldin,</Text>
                <Text style={styles.userName}>{userName}</Text>
            </View>
            <View style={styles.statusBox}>
                <Text style={styles.statusTitle}>Son İşlem Durumu</Text>
                {lastCheck ? (
                    <Text style={styles.statusText}>
                        {lastCheck.type === 'in' ? 'Giriş Yapıldı' : 'Çıkış Yapıldı'} - {lastCheck.time}
                    </Text>
                ) : (
                    <Text style={styles.statusText}>Bugün hiç işlem yapılmadı.</Text>
                )}
            </View>
            <TouchableOpacity style={styles.scanButton} onPress={() => navigation.navigate('QRScanner')}>
                <Text style={styles.scanButtonText}>{getButtonText()}</Text>
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
    welcomeText: { fontSize: 24, color: '#4b5563' },
    userName: { fontSize: 32, fontWeight: 'bold', color: '#1f2937' },
    statusBox: { backgroundColor: '#fff', borderRadius: 20, padding: 25, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
    statusTitle: { fontSize: 18, fontWeight: '600', color: '#6b7280', marginBottom: 10 },
    statusText: { fontSize: 22, fontWeight: 'bold', color: '#3b82f6' },
    scanButton: { backgroundColor: '#3b82f6', paddingVertical: 20, borderRadius: 20, alignItems: 'center', shadowColor: "#3b82f6", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
    scanButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    logoutButton: { alignSelf: 'center', padding: 10, marginTop: 20 },
    logoutButtonText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
});