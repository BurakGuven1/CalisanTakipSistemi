import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function AuthChoiceScreen({ navigation }) {
    const { themeData } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: themeData.background }]}>
            <Text style={[styles.title, { color: themeData.text }]}>Nasıl Kayıt Olmak İstersiniz?</Text>
            <Text style={[styles.subtitle, { color: themeData.subtext }]}>Lütfen rolünüzü seçin.</Text>

            <TouchableOpacity 
                style={[styles.button, { backgroundColor: themeData.primary }]}
                onPress={() => navigation.navigate('AdminSignUp')}
            >
                <Text style={[styles.buttonText, { color: themeData.buttonText }]}>Yönetici Olarak Kaydol</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.button, { backgroundColor: '#10b981' }]}
                onPress={() => navigation.navigate('SignUp')}
            >
                <Text style={[styles.buttonText, { color: themeData.buttonText }]}>Çalışan Olarak Kaydol</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 40,
        textAlign: 'center',
    },
    button: {
        width: '100%',
        padding: 18,
        borderRadius: 15,
        alignItems: 'center',
        marginBottom: 20,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});
