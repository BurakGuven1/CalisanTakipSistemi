import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc, addDoc, updateDoc, GeoPoint } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { useTheme } from '../context/ThemeContext';

const generateReferenceCode = () => {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export default function AdminSignUpScreen({ navigation }) {
    const { themeData } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [storeName, setStoreName] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        if (!email || !password || !username || !storeName || !latitude || !longitude) {
            Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
            return;
        }
        setLoading(true);

        try {
            const lat = parseFloat(latitude.replace(',', '.'));
            const lon = parseFloat(longitude.replace(',', '.'));
            if (isNaN(lat) || isNaN(lon)) {
                Alert.alert("Hata", "Lütfen enlem ve boylam için geçerli sayılar girin.");
                setLoading(false);
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const adminUserRef = doc(db, "users", user.uid);
            await setDoc(adminUserRef, {
                username: username,
                email: user.email,
                role: 'admin',
                storeIds: [],
            });

            const newStoreRef = await addDoc(collection(db, 'stores'), {
                name: storeName,
                referenceCode: generateReferenceCode(),
                qrCodeValue: `${storeName.replace(/\s+/g, '_').toUpperCase()}_QR`,
                location: new GeoPoint(lat, lon),
            });

            await updateDoc(adminUserRef, {
                storeIds: [newStoreRef.id],
            });

        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                Alert.alert('Hata', 'Bu e-posta adresi zaten kullanılıyor.');
            } else {
                Alert.alert('Kayıt Başarısız', 'Bir hata oluştu, lütfen tekrar deneyin.');
                console.error("Admin kayıt hatası:", error);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: themeData.background }]}>
            <Text style={[styles.label, { color: themeData.text }]}>Yönetici Adı</Text>
            <TextInput style={[styles.input, { backgroundColor: themeData.card, color: themeData.text }]} value={username} onChangeText={setUsername} placeholder="Adınız Soyadınız" placeholderTextColor={themeData.subtext} />
            
            <Text style={[styles.label, { color: themeData.text }]}>E-posta</Text>
            <TextInput style={[styles.input, { backgroundColor: themeData.card, color: themeData.text }]} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="ornek@sirket.com" placeholderTextColor={themeData.subtext} />
            
            <Text style={[styles.label, { color: themeData.text }]}>Şifre</Text>
            <TextInput style={[styles.input, { backgroundColor: themeData.card, color: themeData.text }]} value={password} onChangeText={setPassword} secureTextEntry placeholder="Güçlü bir şifre belirleyin" placeholderTextColor={themeData.subtext} />

            <Text style={[styles.label, { color: themeData.text }]}>İlk Mağazanızın Adı</Text>
            <TextInput style={[styles.input, { backgroundColor: themeData.card, color: themeData.text }]} value={storeName} onChangeText={setStoreName} placeholder="Örn: Merkez Şube" placeholderTextColor={themeData.subtext} />
            
            <Text style={[styles.label, { color: themeData.text }]}>Mağaza Enlem (Latitude)</Text>
            <TextInput style={[styles.input, { backgroundColor: themeData.card, color: themeData.text }]} value={latitude} onChangeText={setLatitude} keyboardType="numeric" placeholder="Örn: 39.1137" placeholderTextColor={themeData.subtext} />
            
            <Text style={[styles.label, { color: themeData.text }]}>Mağaza Boylam (Longitude)</Text>
            <TextInput style={[styles.input, { backgroundColor: themeData.card, color: themeData.text }]} value={longitude} onChangeText={setLongitude} keyboardType="numeric" placeholder="Örn: 27.1770" placeholderTextColor={themeData.subtext} />

            <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Yönetici Hesabı Oluştur</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
    input: { padding: 15, borderRadius: 10, fontSize: 16, marginBottom: 20 },
    button: { backgroundColor: '#4f46e5', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});