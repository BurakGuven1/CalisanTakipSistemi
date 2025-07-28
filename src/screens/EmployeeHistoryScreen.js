import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { useTheme } from '../context/ThemeContext';

export default function EmployeeHistoryScreen() {
    const { themeData } = useTheme();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;
        const q = query(collection(db, 'checkIns'), where('userId', '==', user.uid), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const recordsData = querySnapshot.docs
                .map(doc => {
                    const data = doc.data();
                    // DÜZELTME: Timestamp null olabilir, kontrol ekle
                    return data.timestamp ? {
                        id: doc.id, 
                        ...data, 
                        time: data.timestamp.toDate().toLocaleString('tr-TR'),
                    } : null;
                })
                .filter(item => item !== null); // Null olanları filtrele
            
            setRecords(recordsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const renderItem = ({ item }) => (
        <View style={[styles_history.recordItem, {backgroundColor: themeData.card}]}>
            <Text style={[styles_history.recordType(item.type), {color: item.type === 'in' ? '#22c55e' : '#ef4444'}]}>
                {item.type === 'in' ? 'GİRİŞ' : 'ÇIKIŞ'}
            </Text>
            <Text style={[styles_history.recordTime, {color: themeData.subtext}]}>{item.time}</Text>
        </View>
    );

    if (loading) return <ActivityIndicator style={{flex: 1}} size="large" color={themeData.primary} />;

    return (
        <View style={[styles_history.container, {backgroundColor: themeData.background}]}>
            {records.length === 0 ? (
                <Text style={{textAlign: 'center', marginTop: 50, fontSize: 16, color: themeData.subtext}}>Henüz bir kayıt bulunmuyor.</Text>
            ) : (
                <FlatList data={records} renderItem={renderItem} keyExtractor={item => item.id} />
            )}
        </View>
    );
}
const styles_history = StyleSheet.create({
    container: { flex: 1, paddingTop: 10 },
    recordItem: { padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginHorizontal: 10 },
    recordType: type => ({ fontSize: 16, fontWeight: 'bold' }),
    recordTime: { fontSize: 16 },
});