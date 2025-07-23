import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import haversine from 'haversine';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

export default function QRScannerScreen({ navigation }) {
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);
    const processingRef = useRef(false);
    const alertShownRef = useRef(false);

    useEffect(() => {
        const getPermissions = async () => {
            const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
            const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
            
            if (cameraStatus === 'granted' && locationStatus === 'granted') {
                setHasPermission(true);
            } else {
                Alert.alert('İzin Hatası', 'Kamera ve konum izni olmadan bu özellik kullanılamaz.');
                navigation.goBack();
            }
        };

        getPermissions();

        // Component unmount olduğunda ref'leri sıfırla
        return () => {
            processingRef.current = false;
            alertShownRef.current = false;
        };
    }, []);

    const handleBarcodeScanned = async ({ data }) => {
        // Eğer zaten işlem yapılıyorsa veya alert gösterildiyse, yeni taramayı işleme
        if (processingRef.current || alertShownRef.current || scanned) {
            return;
        }
        
        // Hemen tüm kontrolleri aktif et
        processingRef.current = true;
        setScanned(true);

        try {
            const storeIdFromQR = data;
            const storeQuery = query(collection(db, 'stores'), where('qrCodeValue', '==', storeIdFromQR));
            const storeSnapshot = await getDocs(storeQuery);

            if (storeSnapshot.empty) {
                if (!alertShownRef.current) {
                    alertShownRef.current = true;
                    Alert.alert(
                        'Hata', 
                        'Geçersiz QR Kod.', 
                        [{ 
                            text: 'Tamam', 
                            onPress: () => {
                                setScanned(false);
                                processingRef.current = false;
                                alertShownRef.current = false;
                            }
                        }],
                        { cancelable: false }
                    );
                }
                return;
            }

            const storeData = storeSnapshot.docs[0].data();
            const storeLocation = { latitude: storeData.location.latitude, longitude: storeData.location.longitude };
            const currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const userLocation = { latitude: currentLocation.coords.latitude, longitude: currentLocation.coords.longitude };
            const distance = haversine(userLocation, storeLocation, { unit: 'meter' });

            if (distance <= 35) {
                await recordCheckIn(storeSnapshot.docs[0].id);
                
                if (!alertShownRef.current) {
                    alertShownRef.current = true;
                    Alert.alert(
                        'Başarılı!', 
                        `İşleminiz kaydedildi. Mağazaya olan uzaklığınız: ${Math.round(distance)} metre.`,
                        [{ 
                            text: 'Tamam',
                            onPress: () => navigation.goBack()
                        }],
                        { cancelable: false }
                    );
                }
            } else {
                if (!alertShownRef.current) {
                    alertShownRef.current = true;
                    Alert.alert(
                        'Başarısız!', 
                        `Mağazaya yeterince yakın değilsiniz. (Uzaklık: ${Math.round(distance)} metre)`, 
                        [{ 
                            text: 'Tamam', 
                            onPress: () => {
                                setScanned(false);
                                processingRef.current = false;
                                alertShownRef.current = false;
                            }
                        }],
                        { cancelable: false }
                    );
                }
            }
        } catch (error) {
            console.error("QR Tarama Hatası:", error);
            if (!alertShownRef.current) {
                alertShownRef.current = true;
                Alert.alert(
                    'Hata', 
                    'Beklenmedik bir sorun oluştu.', 
                    [{ 
                        text: 'Tamam', 
                        onPress: () => {
                            setScanned(false);
                            processingRef.current = false;
                            alertShownRef.current = false;
                        }
                    }],
                    { cancelable: false }
                );
            }
        }
    };
    
    const recordCheckIn = async (storeId) => {
        const user = auth.currentUser;
        const lastCheckQuery = query(
            collection(db, 'checkIns'), 
            where('userId', '==', user.uid), 
            orderBy('timestamp', 'desc'), 
            limit(1)
        );
        const lastCheckSnapshot = await getDocs(lastCheckQuery);
        
        let newType = 'in';
        if (!lastCheckSnapshot.empty && lastCheckSnapshot.docs[0].data().type === 'in') {
            newType = 'out';
        }

        await addDoc(collection(db, 'checkIns'), {
            userId: user.uid,
            storeId: storeId,
            type: newType,
            timestamp: serverTimestamp()
        });
    };

    if (hasPermission === null) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                <Text style={{ fontSize: 16, color: '#000' }}>Kamera izni isteniyor...</Text>
            </View>
        );
    }
    
    if (hasPermission === false) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                <Text style={{ fontSize: 16, color: '#000' }}>Kamera erişimi yok.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.layerTop} />
            <View style={styles.layerCenter}>
                <View style={styles.layerLeft} />
                <View style={styles.focused} />
                <View style={styles.layerRight} />
            </View>
            <View style={styles.layerBottom}>
                <Text style={styles.instructionText}>
                    QR kodunu çerçeve içine hizalayın
                </Text>
                {scanned && (
                    <Button 
                        title="Tekrar Tara" 
                        onPress={() => {
                            setScanned(false);
                            processingRef.current = false;
                            alertShownRef.current = false;
                        }} 
                        color="#4ade80"
                    />
                )}
            </View>
        </View>
    );
}

const opacity = 'rgba(0, 0, 0, .6)';
const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'column' },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  layerTop: { flex: 2, backgroundColor: opacity },
  layerCenter: { flex: 3, flexDirection: 'row' },
  layerLeft: { flex: 1, backgroundColor: opacity },
  focused: { flex: 8, borderWidth: 2, borderColor: '#4ade80', borderRadius: 10 },
  layerRight: { flex: 1, backgroundColor: opacity },
  layerBottom: { flex: 2, backgroundColor: opacity, justifyContent: 'center', alignItems: 'center' },
});