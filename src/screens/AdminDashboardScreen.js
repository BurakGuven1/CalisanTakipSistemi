import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { collection, query, where, onSnapshot, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';
import { exportToExcel, exportToPdf } from '../utils/fileExporter';
import { useTheme } from '../context/ThemeContext';

export default function AdminDashboardScreen({ navigation }) {
    const { themeData } = useTheme();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stores, setStores] = useState([]);
    const [selectedStoreId, setSelectedStoreId] = useState(null);
    const unsubscribeRef = useRef(null); // Dinleyiciyi tutmak için ref

    const selectedStore = useMemo(() => stores.find(s => s.id === selectedStoreId), [stores, selectedStoreId]);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const adminDocRef = doc(db, 'users', user.uid);
        getDoc(adminDocRef).then(async (adminDoc) => {
            if (adminDoc.exists() && adminDoc.data().storeIds) {
                const storeIds = adminDoc.data().storeIds;
                const storesData = [];
                for (const id of storeIds) {
                    const storeDoc = await getDoc(doc(db, 'stores', id));
                    if (storeDoc.exists()) {
                        storesData.push({ id: storeDoc.id, ...storeDoc.data() });
                    }
                }
                setStores(storesData);
                if (storesData.length > 0) {
                    setSelectedStoreId(storesData[0].id);
                } else {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        });
    }, []);

    useEffect(() => {
        // Önceki dinleyiciyi temizle
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
        }

        if (!selectedStoreId) {
            setEmployees([]);
            setLoading(false);
            return;
        };
        setLoading(true);
        
        const q = query(collection(db, 'users'), where('role', '==', 'employee'), where('storeId', '==', selectedStoreId));
        
        unsubscribeRef.current = onSnapshot(q, 
            async (querySnapshot) => {
                const employeesData = [];
                for (const userDoc of querySnapshot.docs) {
                    const employee = { id: userDoc.id, ...userDoc.data() };
                    const lastCheckQuery = query(collection(db, 'checkIns'), where('userId', '==', userDoc.id), orderBy('timestamp', 'desc'), limit(1));
                    const lastCheckSnapshot = await getDocs(lastCheckQuery);
                    employee.lastStatus = !lastCheckSnapshot.empty ? lastCheckSnapshot.docs[0].data().type : 'unknown';
                    employeesData.push(employee);
                }
                setEmployees(employeesData);
                setLoading(false);
            },
            (error) => {
                console.error("Firestore sorgu hatası:", error);
                Alert.alert("Hata", "Çalışan verileri yüklenemedi. Lütfen Firestore indekslerinizi kontrol edin.");
                setLoading(false);
            }
        );
        
        // Component unmount olduğunda son dinleyiciyi temizle
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, [selectedStoreId]);

    const handleExport = async (format) => {
        if (!selectedStore || employees.length === 0) {
            Alert.alert("Hata", "Rapor oluşturmak için önce bir mağaza seçmeli ve o mağazada çalışan olmalıdır.");
            return;
        }
        
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        const checkInsSnapshot = await getDocs(query(collection(db, 'checkIns'), where('timestamp', '>=', startOfMonth), where('timestamp', '<=', endOfMonth)));
        const allCheckIns = checkInsSnapshot.docs.map(d => ({...d.data(), timestamp: d.data().timestamp.toDate()}));
        
        const reportData = employees.map(emp => {
            const empCheckIns = allCheckIns.filter(c => c.userId === emp.id).sort((a, b) => a.timestamp - b.timestamp);
            let totalMillis = 0;
            for (let i = 0; i < empCheckIns.length - 1; i++) {
                if (empCheckIns[i].type === 'in' && empCheckIns[i+1].type === 'out') {
                    totalMillis += empCheckIns[i+1].timestamp - empCheckIns[i].timestamp;
                    i++;
                }
            }
            return { name: emp.fullName, totalHours: (totalMillis / 3600000).toFixed(2) };
        });

        if (format === 'excel') {
            exportToExcel(reportData, `${selectedStore.name}_rapor`);
        } else {
            exportToPdf(reportData, selectedStore.name, "Bu Ay");
        }
    };
    
    const handleLogout = () => {
        // Çıkış yapmadan ÖNCE dinleyiciyi durdur
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
        }
        signOut(auth);
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={[styles.itemContainer, { backgroundColor: themeData.card }]}
            onPress={() => navigation.navigate('EmployeeDetail', { employeeId: item.id, employeeName: item.fullName })}
        >
            <View>
                <Text style={[styles.itemName, { color: themeData.text }]}>{item.fullName}</Text>
                <Text style={[styles.itemEmail, { color: themeData.subtext }]}>{item.email}</Text>
            </View>
            <View style={[
                styles.statusIndicator, 
                item.lastStatus === 'in' ? styles.statusIn : styles.statusOut
            ]}>
                <Text style={[
                    styles.statusText,
                    item.lastStatus === 'in' ? styles.statusTextIn : styles.statusTextOut
                ]}>
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
                        <TouchableOpacity 
                            key={store.id} 
                            style={[styles.storeTab, {backgroundColor: themeData.tabInactive}, selectedStoreId === store.id && {backgroundColor: themeData.tabActive}]}
                            onPress={() => setSelectedStoreId(store.id)}
                        >
                            <Text style={[styles.storeTabText, { color: themeData.text }]}>{store.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.exportButtons}>
                <TouchableOpacity style={styles.exportButton} onPress={() => handleExport('excel')}><Text style={styles.exportButtonText}>Excel'e Aktar</Text></TouchableOpacity>
                <TouchableOpacity style={styles.exportButton} onPress={() => handleExport('pdf')}><Text style={styles.exportButtonText}>PDF'e Aktar</Text></TouchableOpacity>
            </View>

            {loading ? <ActivityIndicator size="large" color={themeData.primary} /> : 
                <FlatList 
                    data={employees} 
                    renderItem={renderItem} 
                    keyExtractor={item => item.id} 
                    ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20, color: themeData.subtext}}>Bu mağazada çalışan bulunmuyor.</Text>}
                />
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
    exportButtons: { flexDirection: 'row', justifyContent: 'space-around', padding: 15 },
    exportButton: { padding: 10, backgroundColor: '#5a67d8', borderRadius: 8 },
    exportButtonText: { color: 'white', fontWeight: 'bold' },
    itemContainer: { padding: 20, marginVertical: 8, marginHorizontal: 10, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itemName: { fontSize: 18, fontWeight: '600' },
    itemEmail: { fontSize: 14, marginTop: 2 },
    statusIndicator: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
    statusIn: { backgroundColor: '#dcfce7' },
    statusOut: { backgroundColor: '#fee2e2' },
    statusText: { fontWeight: 'bold', fontSize: 12 },
    statusTextIn: { color: '#166534' },
    statusTextOut: { color: '#991b1b' },
});