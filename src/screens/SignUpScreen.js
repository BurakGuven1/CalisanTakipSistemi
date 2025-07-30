import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { useTheme } from '../context/ThemeContext';

export default function SignUpScreen({ navigation }) {
    const { themeData } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [referenceCode, setReferenceCode] = useState('');
    const [loading, setLoading] = useState(false);

    // Hata mesajları için state'ler
    const [emailError, setEmailError] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // Validasyon fonksiyonları
    const validateEmail = () => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(email)) {
            setEmailError('Lütfen geçerli bir e-posta adresi girin.');
            return false;
        }
        setEmailError('');
        return true;
    };

    const validateUsername = () => {
        if (username.length < 6) {
            setUsernameError('Kullanıcı adı en az 6 karakter olmalıdır.');
            return false;
        }
        setUsernameError('');
        return true;
    };

    const validatePassword = () => {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[.@$!%*?&])[A-Za-z\d.@$!%*?&]{8,}$/;
        if (!regex.test(password)) {
            setPasswordError('Şifre en az 8 karakter olmalı, büyük/küçük harf, sayı ve özel karakter içermelidir.');
            return false;
        }
        setPasswordError('');
        return true;
    };

    const handleSignUp = async () => {
        const isEmailValid = validateEmail();
        const isUsernameValid = validateUsername();
        const isPasswordValid = validatePassword();

        if (!isEmailValid || !isUsernameValid || !isPasswordValid || !referenceCode) {
            Alert.alert('Hata', 'Lütfen tüm alanları doğru bir şekilde doldurun.');
            return;
        }
        setLoading(true);

        try {
            const storesRef = collection(db, 'stores');
            const q = query(storesRef, where("referenceCode", "==", referenceCode.toUpperCase()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                Alert.alert('Hata', 'Geçersiz mağaza referans kodu.');
                setLoading(false);
                return;
            }

            const storeDoc = querySnapshot.docs[0];
            const storeId = storeDoc.id;
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                username: username,
                email: user.email,
                role: 'employee',
                storeId: storeId,
            });
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                Alert.alert('Hata', 'Bu e-posta adresi zaten kullanılıyor.');
            } else {
                Alert.alert('Kayıt Başarısız', 'Bir hata oluştu, lütfen tekrar deneyin.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: themeData.background }]}>
            <Text style={[styles.label, { color: themeData.text }]}>Kullanıcı Adı</Text>
            <TextInput style={[styles.input, { backgroundColor: themeData.card, color: themeData.text }]} value={username} onChangeText={setUsername} onBlur={validateUsername} placeholder="En az 6 karakter" placeholderTextColor={themeData.subtext} />
            {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}
            
            <Text style={[styles.label, { color: themeData.text }]}>E-posta</Text>
            <TextInput style={[styles.input, { backgroundColor: themeData.card, color: themeData.text }]} value={email} onChangeText={setEmail} onBlur={validateEmail} keyboardType="email-address" autoCapitalize="none" placeholder="ornek@mail.com" placeholderTextColor={themeData.subtext} />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            
            <Text style={[styles.label, { color: themeData.text }]}>Şifre</Text>
            <TextInput style={[styles.input, { backgroundColor: themeData.card, color: themeData.text }]} value={password} onChangeText={setPassword} onBlur={validatePassword} secureTextEntry placeholder="Büyük/küçük harf, sayı, özel karakter" placeholderTextColor={themeData.subtext} />
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            <Text style={[styles.label, { color: themeData.text }]}>Mağaza Referans Kodu</Text>
            <TextInput style={[styles.input, { backgroundColor: themeData.card, color: themeData.text }]} value={referenceCode} onChangeText={setReferenceCode} autoCapitalize="characters" placeholder="Yöneticinizden aldığınız 6 haneli kod" placeholderTextColor={themeData.subtext} />
            
            <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Kayıt Ol</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
    input: { padding: 15, borderRadius: 10, fontSize: 16, marginBottom: 5 },
    button: { backgroundColor: '#10b981', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 20 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    errorText: { color: '#ef4444', marginBottom: 15, marginLeft: 5 },
});