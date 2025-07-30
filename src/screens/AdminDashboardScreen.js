import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { collection, query, where, onSnapshot, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';
import { useTheme } from '../context/ThemeContext';

export default function AdminDashboardScreen({ navigation }) {
    const { themeData } = useTheme();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stores, setStores] = useState([]);
    const [selectedStoreId, setSelectedStoreId] = useState(null);
    const employeeUnsubscribeRef = useRef(null);
    const adminUnsubscribeRef = useRef(null); // YENİ: Admin dinleyicisi için ref

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const adminDocRef = doc(db, 'users', user.uid);
        adminUnsubscribeRef.current = onSnapshot(adminDocRef, async (adminDoc) => {
            if (adminDoc.exists() && adminDoc.data().storeIds) {
                const storeIds = adminDoc.data().storeIds;
                const storesData = [];
                for (const id of storeIds) {
                    const storeDoc = await getDoc(doc(db, 'stores', id));
                    if (storeDoc.exists()) storesData.push({ id: storeDoc.id, ...storeDoc.data() });
                }
                setStores(storesData);
                
                if (!storeIds.includes(selectedStoreId)) {
                    setSelectedStoreId(storeIds.length > 0 ? storeIds[0] : null);
                }
            } else {
                setStores([]);
                setSelectedStoreId(null);
            }
        });

        return () => {
            if (adminUnsubscribeRef.current) adminUnsubscribeRef.current();
        };
    }, []);

    useEffect(() => {
        if (employeeUnsubscribeRef.current) employeeUnsubscribeRef.current();
        if (!selectedStoreId) { setEmployees([]); setLoading(false); return; };
        
        setLoading(true);
        const q = query(collection(db, 'users'), where('role', '==', 'employee'), where('storeId', '==', selectedStoreId));
        employeeUnsubscribeRef.current = onSnapshot(q, async (querySnapshot) => {
            const employeesData = await Promise.all(querySnapshot.docs.map(async (userDoc) => {
                const employee = { id: userDoc.id, ...userDoc.data() };
                const lastCheckQuery = query(collection(db, 'checkIns'), where('userId', '==', userDoc.id), orderBy('timestamp', 'desc'), limit(1));
                const lastCheckSnapshot = await getDocs(lastCheckQuery);
                employee.lastStatus = !lastCheckSnapshot.empty ? lastCheckSnapshot.docs[0].data().type : 'unknown';
                return employee;
            }));
            setEmployees(employeesData);
            setLoading(false);
        }, (error) => {
            console.error("Firestore sorgu hatası:", error);
            Alert.alert("Hata", "Çalışan verileri yüklenemedi. Lütfen Firestore indekslerinizi kontrol edin.");
            setLoading(false);
        });
        return () => { if (employeeUnsubscribeRef.current) employeeUnsubscribeRef.current(); };
    }, [selectedStoreId]);
    
    const handleLogout = () => {
        // Çıkış yapmadan ÖNCE tüm dinleyicileri durdur
        if (adminUnsubscribeRef.current) adminUnsubscribeRef.current();
        if (employeeUnsubscribeRef.current) employeeUnsubscribeRef.current();
        signOut(auth);
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={[styles.itemContainer, { backgroundColor: themeData.card }]}
            onPress={() => navigation.navigate('EmployeeDetail', { employeeId: item.id, employeeName: item.username })}
        >
            <View>
                <Text style={[styles.itemName, { color: themeData.text }]}>{item.username}</Text>
                <Text style={[styles.itemEmail, { color: themeData.subtext }]}>{item.email}</Text>
            </View>
            <View style={[styles.statusIndicator, item.lastStatus === 'in' ? styles.statusIn : styles.statusOut]}>
                <Text style={[styles.statusText, item.lastStatus === 'in' ? styles.statusTextIn : styles.statusTextOut]}>
                    {item.lastStatus === 'in' ? 'İçeride' : 'Dışarıda'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: themeData.background }]}>
            <View style={[styles.header, { borderBottomColor: themeData.border }]}>
                <Text style={[styles.headerTitle, { color: themeData.text }]}>Yönetici Paneli</Text>
                <TouchableOpacity onPress={handleLogout}><Text style={{color: '#ef4444', fontWeight: 'bold'}}>Çıkış</Text></TouchableOpacity>
            </View>
            <View style={[styles.storeSelector, { borderBottomColor: themeData.border }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {stores.map(store => (
                        <TouchableOpacity key={store.id} style={[styles.storeTab, {backgroundColor: themeData.tabInactive}, selectedStoreId === store.id && {backgroundColor: themeData.tabActive}]} onPress={() => setSelectedStoreId(store.id)}>
                            <Text style={[styles.storeTabText, { color: themeData.text }]}>{store.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
            <View style={styles.managementButtons}>
                <TouchableOpacity style={styles.managementButton} onPress={() => navigation.navigate('StoreManagement')}><Text style={styles.managementButtonText}>Mağazaları Yönet</Text></TouchableOpacity>
                <TouchableOpacity style={styles.managementButton} onPress={() => navigation.navigate('Reports', { stores: stores })}><Text style={styles.managementButtonText}>Raporlar</Text></TouchableOpacity>
            </View>
            {loading ? <ActivityIndicator size="large" color={themeData.primary} /> : 
                <FlatList data={employees} renderItem={renderItem} keyExtractor={item => item.id} ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20, color: themeData.subtext}}>Bu mağazada çalışan bulunmuyor.</Text>} />
            }
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 60 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1 },
    headerTitle: { fontSize: 28, fontWeight: 'bold' },
    storeSelector: { paddingVertical: 10, borderBottomWidth: 1 },
    storeTab: { paddingVertical: 10, paddingHorizontal: 15, marginHorizontal: 5, borderRadius: 10 },
    storeTabText: { fontWeight: 'bold', fontSize: 16 },
    managementButtons: { flexDirection: 'row', justifyContent: 'space-around', padding: 15 },
    managementButton: { padding: 12, backgroundColor: '#4f46e5', borderRadius: 8 },
    managementButtonText: { color: 'white', fontWeight: 'bold' },
    itemContainer: { padding: 20, marginVertical: 8, marginHorizontal: 10, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itemName: { fontSize: 18, fontWeight: '600' },
    itemEmail: { fontSize: 14, marginTop: 2 },
    statusIndicator: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
    statusIn: { backgroundColor: '#dcfce7' }, statusOut: { backgroundColor: '#fee2e2' },
    statusText: { fontWeight: 'bold', fontSize: 12 },
    statusTextIn: { color: '#166534' }, statusTextOut: { color: '#991b1b' },
});