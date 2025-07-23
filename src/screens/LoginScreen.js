import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = () => {
        if (!email || !password) {
            Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
            return;
        }
        setLoading(true);
        signInWithEmailAndPassword(auth, email, password)
            .catch(error => {
                Alert.alert('Giriş Başarısız', 'E-posta veya şifreniz hatalı.');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{flex: 1}}
        >
            <LinearGradient colors={['#1e3a8a', '#3b82f6']} style={styles.container}>
                <Text style={styles.title}>Çalışan Takip</Text>
                <Text style={styles.subtitle}>Sistemine Hoş Geldiniz</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="E-posta Adresiniz"
                        placeholderTextColor="#a0aec0"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Şifreniz"
                        placeholderTextColor="#a0aec0"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>
                <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Giriş Yap</Text>}
                </TouchableOpacity>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    title: { fontSize: 42, fontWeight: 'bold', color: '#fff', fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto' },
    subtitle: { fontSize: 20, color: '#dbeafe', marginBottom: 50 },
    inputContainer: { width: '100%', marginBottom: 20 },
    input: { width: '100%', height: 55, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 15, paddingHorizontal: 20, color: '#fff', marginBottom: 15, fontSize: 16 },
    button: { width: '100%', height: 55, backgroundColor: '#fb923c', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.30, shadowRadius: 4.65, elevation: 8 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
