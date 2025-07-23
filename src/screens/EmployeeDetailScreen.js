import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export default function EmployeeDetailScreen({ route }) {
    const { employeeId, employeeName } = route.params;
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'checkIns'), where('userId', '==', employeeId), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const recordsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                time: doc.data().timestamp.toDate().toLocaleString('tr-TR'),
            }));
            setRecords(recordsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [employeeId]);

    const renderItem = ({ item }) => (
        <View style={styles.recordItem}>
            <Text style={styles.recordType(item.type)}>
                {item.type === 'in' ? 'GİRİŞ' : 'ÇIKIŞ'}
            </Text>
            <Text style={styles.recordTime}>{item.time}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {loading ? <ActivityIndicator /> : (
                <FlatList
                    data={records}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 10, backgroundColor: '#f1f5f9' },
    recordItem: { backgroundColor: '#fff', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginHorizontal: 10 },
    recordType: (type) => ({ fontSize: 16, fontWeight: 'bold', color: type === 'in' ? '#22c55e' : '#ef4444' }),
    recordTime: { fontSize: 16, color: '#475569' },
});
