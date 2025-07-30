import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { collection, onSnapshot, deleteDoc, doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { useTheme } from '../context/ThemeContext';

export default function StoreManagementScreen({ navigation }) {
    const { themeData } = useTheme();
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

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
        Alert.alert(
            "Mağazayı Sil", 
            "Emin misiniz? Bu işlem geri alınamaz.", 
            [
                { text: "İptal", style: "cancel" },
                { 
                    text: "Sil", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, "stores", storeId));
                            const user = auth.currentUser;
                            if (user) {
                                const adminUserRef = doc(db, "users", user.uid);
                                await updateDoc(adminUserRef, {
                                    storeIds: arrayRemove(storeId)
                                });
                            }
                        } catch (error) {
                            console.error("Mağaza silinirken hata oluştu:", error);
                            Alert.alert("Hata", "Mağaza silinirken bir sorun oluştu.");
                        }
                    } 
                }
            ]
        );
    };

    const renderItem = ({ item }) => (
        <View style={[styles.itemContainer, { backgroundColor: themeData.card }]}>
            <TouchableOpacity style={{flex: 1}} onPress={() => navigation.navigate('EditStore', { store: item })}>
                <Text style={[styles.itemName, { color: themeData.text }]}>{item.name}</Text>
                <Text style={[styles.refCode, { color: themeData.primary }]}>Referans Kodu: {item.referenceCode}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)}><Text style={styles.deleteButton}>SİL</Text></TouchableOpacity>
        </View>
    );

    if (loading) return <ActivityIndicator style={{flex: 1}} size="large" color={themeData.primary} />;

    return (
        <View style={[styles.container, { backgroundColor: themeData.background }]}>
            <FlatList data={stores} renderItem={renderItem} keyExtractor={item => item.id} ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 50, color: themeData.subtext }}>Henüz mağaza eklenmemiş.</Text>} />
            <TouchableOpacity 
                style={styles.addButton} 
                onPress={() => navigation.navigate('EditStore', { store: null })}
            >
                <Text style={styles.addButtonText}>Yeni Mağaza Ekle</Text>
            </TouchableOpacity>
        </View>
    );
}
const styles = StyleSheet.create({
    container: { flex: 1 },
    itemContainer: { padding: 20, marginVertical: 8, marginHorizontal: 10, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itemName: { fontSize: 18, fontWeight: '600' },
    refCode: { fontSize: 16, fontWeight: 'bold', marginTop: 5 },
    deleteButton: { color: '#ef4444', fontWeight: 'bold' },
    addButton: { backgroundColor: '#22c55e', padding: 15, margin: 20, borderRadius: 15, alignItems: 'center' },
    addButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});