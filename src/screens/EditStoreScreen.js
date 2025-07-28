import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { doc, setDoc, addDoc, collection, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { GeoPoint } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';

export default function EditStoreScreen({ route, navigation }) {
    const { themeData } = useTheme();
    const { store } = route.params;
    const isEditing = store !== null;
    const [name, setName] = useState(store?.name || '');
    const [qrValue, setQrValue] = useState(store?.qrCodeValue || '');
    const [latitude, setLatitude] = useState(store?.location?.latitude.toString() || '');
    const [longitude, setLongitude] = useState(store?.location?.longitude.toString() || '');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        navigation.setOptions({ title: isEditing ? 'Mağazayı Düzenle' : 'Yeni Mağaza Ekle' });
    }, [navigation, isEditing]);

    const handleSave = async () => {
        if (!name || !qrValue || !latitude || !longitude) {
            Alert.alert("Hata", "Lütfen tüm alanları doldurun."); 
            return;
        }
        setLoading(true);

        // DÜZELTME: Virgülü noktaya çevirerek klavye sorununu çöz
        const lat = parseFloat(latitude.replace(',', '.'));
        const lon = parseFloat(longitude.replace(',', '.'));

        if (isNaN(lat) || isNaN(lon)) {
            Alert.alert("Hata", "Lütfen enlem ve boylam için geçerli sayılar girin."); 
            setLoading(false); 
            return;
        }

        const storeData = { 
            name, 
            qrCodeValue: qrValue, 
            location: new GeoPoint(lat, lon) 
        };

        try {
            if (isEditing) {
                // Mevcut mağazayı güncelle
                await setDoc(doc(db, "stores", store.id), storeData);
            } else {
                // Yeni mağaza oluştur ve adminin profiline ekle
                const newStoreRef = await addDoc(collection(db, "stores"), storeData);
                const user = auth.currentUser;
                if (user) {
                    const adminUserRef = doc(db, "users", user.uid);
                    await updateDoc(adminUserRef, { 
                        storeIds: arrayUnion(newStoreRef.id) 
                    });
                }
            }
            navigation.goBack();
        } catch (error) {
            console.error("Mağaza kaydedilirken hata:", error); 
            Alert.alert("Hata", "Mağaza kaydedilirken bir sorun oluştu. Lütfen güvenlik kurallarınızı kontrol edin.");
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <ScrollView style={[styles_edit.container, { backgroundColor: themeData.background }]}>
            <Text style={[styles_edit.label, { color: themeData.text }]}>Mağaza Adı</Text>
            <TextInput 
                style={[styles_edit.input, { backgroundColor: themeData.card, color: themeData.text }]} 
                value={name} 
                onChangeText={setName} 
                placeholder="Örn: Ataşehir Mağazası" 
            />
            <Text style={[styles_edit.label, { color: themeData.text }]}>QR Kod Değeri</Text>
            <TextInput 
                style={[styles_edit.input, { backgroundColor: themeData.card, color: themeData.text }]} 
                value={qrValue} 
                onChangeText={setQrValue} 
                placeholder="Örn: ATASEHIR_MAVI_2025" 
            />
            <Text style={[styles_edit.label, { color: themeData.text }]}>Enlem (Latitude)</Text>
            <TextInput 
                style={[styles_edit.input, { backgroundColor: themeData.card, color: themeData.text }]} 
                value={latitude} 
                onChangeText={setLatitude} 
                keyboardType="numeric" 
                placeholder="Örn: 40.9895" 
            />
            <Text style={[styles_edit.label, { color: themeData.text }]}>Boylam (Longitude)</Text>
            <TextInput 
                style={[styles_edit.input, { backgroundColor: themeData.card, color: themeData.text }]} 
                value={longitude} 
                onChangeText={setLongitude} 
                keyboardType="numeric" 
                placeholder="Örn: 29.1126" 
            />
            <TouchableOpacity 
                style={styles_edit.saveButton} 
                onPress={handleSave} 
                disabled={loading}
            >
                <Text style={styles_edit.saveButtonText}>{loading ? "Kaydediliyor..." : "Kaydet"}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}
const styles_edit = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
    input: { padding: 15, borderRadius: 10, fontSize: 16, marginBottom: 20 },
    saveButton: { backgroundColor: '#10b981', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});