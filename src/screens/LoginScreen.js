import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';


export default function LoginScreen({ navigation }) {
    const { theme, setTheme, themeData } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

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
    
    const dynamicStyles = StyleSheet.create({
        title: { fontSize: 42, fontWeight: 'bold', color: themeData.text, fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto' },
        subtitle: { fontSize: 20, color: themeData.subtext, marginBottom: 50 },
        input: { width: '100%', height: 55, backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)', borderRadius: 15, paddingHorizontal: 20, color: themeData.text, marginBottom: 15, fontSize: 16 },
        buttonText: { color: themeData.buttonText, fontSize: 18, fontWeight: 'bold' },
        themeToggleText: { color: themeData.text, marginHorizontal: 8, fontSize: 16, }
    });

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
            <LinearGradient colors={theme === 'light' ? ['#e0f2fe', '#7dd3fc'] : ['#0f172a', '#1e293b']} style={styles.container}>
                <View style={styles.themeToggleContainer}>
                    <Text style={dynamicStyles.themeToggleText}>Light</Text>
                    <Switch
                        trackColor={{ false: "#767577", true: "#81b0ff" }}
                        thumbColor={theme === 'dark' ? "#f5dd4b" : "#f4f3f4"}
                        onValueChange={toggleTheme}
                        value={theme === 'dark'}
                    />
                    <Text style={dynamicStyles.themeToggleText}>Dark</Text>
                </View>

                <Text style={dynamicStyles.title}>Çalışan Takip</Text>
                <Text style={dynamicStyles.subtitle}>Sistemine Hoş Geldiniz</Text>
                <View style={styles.inputContainer}>
                    <TextInput style={dynamicStyles.input} placeholder="E-posta Adresiniz" placeholderTextColor={themeData.subtext} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/>
                    <TextInput style={dynamicStyles.input} placeholder="Şifreniz" placeholderTextColor={themeData.subtext} value={password} onChangeText={setPassword} secureTextEntry/>
                </View>
                <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={dynamicStyles.buttonText}>Giriş Yap</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.signUpButton} onPress={() => navigation.navigate('AuthChoice')}>
                    <Text style={[dynamicStyles.themeToggleText, { fontWeight: 'bold' }]}>Hesabın yok mu? Kayıt Ol</Text>
                </TouchableOpacity>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    themeToggleContainer: { position: 'absolute', top: 60, right: 20, flexDirection: 'row', alignItems: 'center' },
    inputContainer: { width: '100%', marginBottom: 20 },
    button: { width: '100%', height: 55, backgroundColor: '#fb923c', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.30, shadowRadius: 4.65, elevation: 8 },
    signUpButton: { marginTop: 25 },
});