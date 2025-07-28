import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { collection, onSnapshot, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { useTheme } from '../context/ThemeContext';

export default function StoreManagementScreen({ navigation }) {
    const { themeData } = useTheme();
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        // Adminin kendi mağazalarını çek
        const adminDocRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(adminDocRef, async (adminDoc) => {
            if (adminDoc.exists() && adminDoc.data().storeIds) {
                const storeIds = adminDoc.data().storeIds;
                if (storeIds.length === 0) {
                    setStores([]);
                    setLoading(false);
                    return;
                }
                const storesData = [];
                for (const id of storeIds) {
                    const storeDoc = await getDoc(doc(db, 'stores', id));
                    if (storeDoc.exists()) {
                        storesData.push({ id: storeDoc.id, ...storeDoc.data() });
                    }
                }
                setStores(storesData);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleDelete = (storeId) => {
        Alert.alert("Mağazayı Sil", "Emin misiniz?", [
            { text: "İptal", style: "cancel" },
            { text: "Sil", style: "destructive", onPress: () => deleteDoc(doc(db, "stores", storeId)) }
        ]);
    };

    const renderItem = ({ item }) => (
        <View style={[styles_store.itemContainer, { backgroundColor: themeData.card }]}>
            <TouchableOpacity style={{flex: 1}} onPress={() => navigation.navigate('EditStore', { store: item })}>
                <Text style={[styles_store.itemName, { color: themeData.text }]}>{item.name}</Text>
                <Text style={[styles_store.itemSubtext, { color: themeData.subtext }]}>QR: {item.qrCodeValue}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)}><Text style={styles_store.deleteButton}>SİL</Text></TouchableOpacity>
        </View>
    );

    if (loading) return <ActivityIndicator style={{flex: 1}} size="large" color={themeData.primary} />;

    return (
        <View style={[styles_store.container, { backgroundColor: themeData.background }]}>
            <FlatList data={stores} renderItem={renderItem} keyExtractor={item => item.id} ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 50, color: themeData.subtext }}>Henüz mağaza eklenmemiş.</Text>} />
            <TouchableOpacity style={styles_store.addButton} onPress={() => navigation.navigate('EditStore', { store: null })}><Text style={styles_store.addButtonText}>Yeni Mağaza Ekle</Text></TouchableOpacity>
        </View>
    );
}
const styles_store = StyleSheet.create({
    container: { flex: 1 },
    itemContainer: { padding: 20, marginVertical: 8, marginHorizontal: 10, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itemName: { fontSize: 18, fontWeight: '600' },
    itemSubtext: { fontSize: 14, marginTop: 4 },
    deleteButton: { color: '#ef4444', fontWeight: 'bold' },
    addButton: { backgroundColor: '#22c55e', padding: 15, margin: 20, borderRadius: 15, alignItems: 'center' },
    addButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
