import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { doc, setDoc, addDoc, collection, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { GeoPoint } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';

const generateReferenceCode = () => {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export default function EditStoreScreen({ route, navigation }) {
    const { themeData } = useTheme();
    const { store } = route.params;
    const isEditing = store !== null;
    const [name, setName] = useState(store?.name || '');
    const [qrValue, setQrValue] = useState(store?.qrCodeValue || '');
    const [latitude, setLatitude] = useState(store?.location?.latitude.toString() || '');
    const [longitude, setLongitude] = useState(store?.location?.longitude.toString() || '');
    const [referenceCode, setReferenceCode] = useState(store?.referenceCode || '');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        navigation.setOptions({ title: isEditing ? store.name : 'Yeni Mağaza Ekle' });
        // DÜZELTME: Sadece yeni mağaza oluşturulurken ve kod boşken kod üret.
        if (!isEditing && referenceCode === '') {
            setReferenceCode(generateReferenceCode());
        }
    }, [navigation, isEditing, referenceCode]);

    const handleSave = async () => {
        if (!name || !qrValue || !latitude || !longitude) {
            Alert.alert("Hata", "Lütfen tüm alanları doldurun."); return;
        }
        setLoading(true);
        const lat = parseFloat(latitude.replace(',', '.'));
        const lon = parseFloat(longitude.replace(',', '.'));
        if (isNaN(lat) || isNaN(lon)) {
            Alert.alert("Hata", "Lütfen enlem ve boylam için geçerli sayılar girin."); setLoading(false); return;
        }
        const storeData = { name, qrCodeValue: qrValue, location: new GeoPoint(lat, lon), referenceCode: referenceCode, };
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Kullanıcı bulunamadı");
            const adminUserRef = doc(db, "users", user.uid);

            if (isEditing) {
                await setDoc(doc(db, "stores", store.id), storeData);
            } else {
                // YENİ: Krediyi düşürmek için transaction kullan
                await runTransaction(db, async (transaction) => {
                    const adminDoc = await transaction.get(adminUserRef);
                    if (!adminDoc.exists() || !adminDoc.data().storeCreationCredits || adminDoc.data().storeCreationCredits < 1) {
                        throw new Error("Mağaza oluşturma krediniz bulunmuyor.");
                    }

                    // Krediyi düşür
                    const newCredits = adminDoc.data().storeCreationCredits - 1;
                    transaction.update(adminUserRef, { storeCreationCredits: newCredits });

                    // Mağazayı oluştur ve adminin listesine ekle
                    const newStoreRef = doc(collection(db, "stores"));
                    transaction.set(newStoreRef, storeData);
                    transaction.update(adminUserRef, { storeIds: arrayUnion(newStoreRef.id) });
                });
            }
            navigation.goBack();
        } catch (error) {
            console.error("Mağaza kaydedilirken hata:", error); 
            Alert.alert("Hata", error.message || "Mağaza kaydedilirken bir sorun oluştu.");
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: themeData.background }]}>
            <Text style={[styles.label, { color: themeData.text }]}>Mağaza Adı</Text>
            <TextInput style={[styles.input, { backgroundColor: themeData.card, color: themeData.text }]} value={name} onChangeText={setName} placeholder="Örn: Ataşehir Mağazası" placeholderTextColor={themeData.subtext} />
            <Text style={[styles.label, { color: themeData.text }]}>QR Kod Değeri</Text>
            <TextInput style={[styles.input, { backgroundColor: themeData.card, color: themeData.text }]} value={qrValue} onChangeText={setQrValue} placeholder="Örn: ATASEHIR_MAVI_2025" placeholderTextColor={themeData.subtext} />
            <Text style={[styles.label, { color: themeData.text }]}>Enlem (Latitude)</Text>
            <TextInput style={[styles.input, { backgroundColor: themeData.card, color: themeData.text }]} value={latitude} onChangeText={setLatitude} keyboardType="numeric" placeholder="Örn: 40.9895" placeholderTextColor={themeData.subtext} />
            <Text style={[styles.label, { color: themeData.text }]}>Boylam (Longitude)</Text>
            <TextInput style={[styles.input, { backgroundColor: themeData.card, color: themeData.text }]} value={longitude} onChangeText={setLongitude} keyboardType="numeric" placeholder="Örn: 29.1126" placeholderTextColor={themeData.subtext} />
            <Text style={[styles.label, { color: themeData.text }]}>Referans Kodu (Çalışan Kaydı İçin)</Text>
            <TextInput style={[styles.input, { backgroundColor: themeData.card, color: themeData.text, fontWeight: 'bold' }]} value={referenceCode} editable={false} />
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}><Text style={styles.saveButtonText}>{loading ? "Kaydediliyor..." : "Kaydet"}</Text></TouchableOpacity>
        </ScrollView>
    );
}
const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
    input: { padding: 15, borderRadius: 10, fontSize: 16, marginBottom: 20 },
    saveButton: { backgroundColor: '#10b981', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});