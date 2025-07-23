import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, query, where, onSnapshot, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';

export default function AdminDashboardScreen({ navigation }) {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [storeName, setStoreName] = useState('');
    const unsubscribeRef = useRef(null); // Dinleyiciyi tutmak için ref

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const fetchAdminData = async () => {
            const adminDocRef = doc(db, 'users', user.uid);
            const adminDoc = await getDoc(adminDocRef);
            if (adminDoc.exists() && adminDoc.data().storeId) {
                const storeDocRef = doc(db, 'stores', adminDoc.data().storeId);
                const storeDoc = await getDoc(storeDocRef);
                if (storeDoc.exists()) {
                    setStoreName(storeDoc.data().name);
                }
            }
        };
        fetchAdminData();
        
        const q = query(collection(db, 'users'), where('role', '==', 'employee'));
        // Dinleyiciyi ref'e ata
        unsubscribeRef.current = onSnapshot(q, async (querySnapshot) => {
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
        signOut(auth);
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.itemContainer} 
            onPress={() => navigation.navigate('EmployeeDetail', { employeeId: item.id, employeeName: item.fullName })}
        >
            <View>
                <Text style={styles.itemName}>{item.fullName}</Text>
                <Text style={styles.itemEmail}>{item.email}</Text>
            </View>
            <View style={[styles.statusIndicator, item.lastStatus === 'in' ? styles.statusIn : styles.statusOut]}>
                <Text style={styles.statusText}>
                    {item.lastStatus === 'in' ? 'İçeride' : 'Dışarıda'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) return <ActivityIndicator style={{flex: 1, justifyContent: 'center'}} size="large" />;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Yönetici Paneli</Text>
                    <Text style={styles.storeName}>{storeName}</Text>
                </View>
                <TouchableOpacity onPress={handleLogout}>
                    <Text style={styles.logoutText}>Çıkış</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={employees}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingHorizontal: 10 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc', paddingTop: 60 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    headerTitle: { fontSize: 28, fontWeight: 'bold' },
    storeName: { fontSize: 16, color: '#64748b', marginTop: 4 },
    logoutText: { fontSize: 16, color: '#ef4444', fontWeight: '600' },
    itemContainer: { backgroundColor: '#fff', padding: 20, marginVertical: 8, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    itemName: { fontSize: 18, fontWeight: '600' },
    itemEmail: { fontSize: 14, color: '#64748b' },
    statusIndicator: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
    statusIn: { backgroundColor: '#dcfce7' },
    statusOut: { backgroundColor: '#fee2e2' },
    statusText: { fontWeight: 'bold', fontSize: 12 },
});