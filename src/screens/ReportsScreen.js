import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, FlatList, ScrollView } from 'react-native';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useTheme } from '../context/ThemeContext';
import { exportToExcel, exportToPdf } from '../utils/fileExporter'; // DÜZELTME: Eksik import eklendi

export default function ReportsScreen({ route }) {
    const { themeData } = useTheme();
    const { stores } = route.params;
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStoreId, setSelectedStoreId] = useState(stores.length > 0 ? stores[0].id : null);
    const [period, setPeriod] = useState('monthly');

    useEffect(() => {
        if (!selectedStoreId) { 
            setLoading(false); 
            setReportData([]);
            return; 
        }

        const generateReport = async () => {
            setLoading(true);
            try {
                const now = new Date();
                let startDate;
                if (period === 'monthly') {
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                } else {
                    startDate = new Date();
                    startDate.setDate(startDate.getDate() - (startDate.getDay() === 0 ? 6 : startDate.getDay() - 1));
                }
                startDate.setHours(0,0,0,0);

                const employeesSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'employee'), where('storeId', '==', selectedStoreId)));
                const employees = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                if (employees.length === 0) {
                    setReportData([]);
                    setLoading(false);
                    return;
                }

                const employeeIds = employees.map(e => e.id);
                const checkInsSnapshot = await getDocs(query(collection(db, 'checkIns'), where('userId', 'in', employeeIds), where('timestamp', '>=', startDate)));
                
                const checkIns = checkInsSnapshot.docs
                    .map(doc => ({ ...doc.data(), timestamp: doc.data().timestamp ? doc.data().timestamp.toDate() : null }))
                    .filter(item => item.timestamp !== null);
                
                const reports = employees.map(employee => {
                    const employeeCheckIns = checkIns.filter(c => c.userId === employee.id).sort((a, b) => a.timestamp - b.timestamp);
                    let dailyWork = {};
                    for (let i = 0; i < employeeCheckIns.length - 1; i++) {
                        if (employeeCheckIns[i].type === 'in' && employeeCheckIns[i + 1].type === 'out') {
                            const checkInTime = employeeCheckIns[i].timestamp;
                            const checkOutTime = employeeCheckIns[i + 1].timestamp;
                            const date = checkInTime.toLocaleDateString('tr-TR');
                            if (!dailyWork[date]) {
                                dailyWork[date] = { checkIn: checkInTime, checkOut: checkOutTime, totalMillis: 0 };
                            } else {
                                dailyWork[date].checkOut = checkOutTime;
                            }
                            dailyWork[date].totalMillis += checkOutTime - checkInTime;
                            i++;
                        }
                    }
                    return Object.keys(dailyWork).map(date => ({
                        id: `${employee.id}-${date}`,
                        "Çalışan Adı": employee.fullName,
                        "Tarih": date,
                        "Giriş Saati": dailyWork[date].checkIn.toLocaleTimeString('tr-TR'),
                        "Çıkış Saati": dailyWork[date].checkOut.toLocaleTimeString('tr-TR'),
                        "Toplam Süre (saat)": (dailyWork[date].totalMillis / 3600000).toFixed(2)
                    }));
                }).flat();
                setReportData(reports);
            } catch (error) {
                console.error("Rapor oluşturulurken hata:", error);
                Alert.alert("Hata", "Rapor verileri yüklenemedi. Lütfen terminaldeki linki kullanarak Firestore indeksini oluşturun.");
                setReportData([]);
            } finally {
                setLoading(false);
            }
        };
        generateReport();
    }, [selectedStoreId, period]);

    const handleExport = (format) => {
        if (reportData.length === 0) { Alert.alert("Hata", "Dışa aktarılacak veri bulunmuyor."); return; }
        const selectedStore = stores.find(s => s.id === selectedStoreId);
        const title = `${selectedStore.name} - ${period === 'monthly' ? 'Aylık' : 'Haftalık'} Rapor`;
        if (format === 'excel') exportToExcel(reportData, title);
        else exportToPdf(reportData, title);
    };
    
    const renderItem = ({ item }) => (
        <View style={[styles_reports.itemContainer, {backgroundColor: themeData.card}]}>
            <View style={{flex: 1}}>
                <Text style={{color: themeData.text, fontWeight: 'bold'}}>{item["Çalışan Adı"]}</Text>
                <Text style={{color: themeData.subtext}}>{item["Tarih"]}</Text>
            </View>
            <View style={{alignItems: 'flex-end'}}>
                <Text style={{color: themeData.text}}>{item["Giriş Saati"]} - {item["Çıkış Saati"]}</Text>
                <Text style={{color: themeData.primary, fontWeight: 'bold'}}>{item["Toplam Süre (saat)"]} sa</Text>
            </View>
        </View>
    );

    return (
        <View style={[styles_reports.container, { backgroundColor: themeData.background }]}>
            <View style={{padding: 10}}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {stores.map(store => (
                        <TouchableOpacity key={store.id} style={[styles_reports.tab, {backgroundColor: themeData.tabInactive}, selectedStoreId === store.id && {backgroundColor: themeData.tabActive}]} onPress={() => setSelectedStoreId(store.id)}>
                            <Text style={{color: themeData.text}}>{store.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
            <View style={styles_reports.exportButtons}>
                <TouchableOpacity style={styles_reports.exportButton} onPress={() => handleExport('excel')}><Text style={styles_reports.exportButtonText}>Excel'e Aktar</Text></TouchableOpacity>
                <TouchableOpacity style={styles_reports.exportButton} onPress={() => handleExport('pdf')}><Text style={styles_reports.exportButtonText}>PDF'e Aktar</Text></TouchableOpacity>
            </View>
            {loading ? <ActivityIndicator size="large" color={themeData.primary} /> :
                <FlatList
                    data={reportData}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    ListEmptyComponent={<Text style={{color: themeData.subtext, textAlign: 'center', marginTop: 20}}>Bu periyot için rapor oluşturulacak veri bulunmuyor.</Text>}
                />
            }
        </View>
    );
}
const styles_reports = StyleSheet.create({
    container: { flex: 1 },
    tab: { padding: 10, borderRadius: 8, marginHorizontal: 5 },
    exportButtons: { flexDirection: 'row', justifyContent: 'space-around', padding: 15, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    exportButton: { padding: 15, backgroundColor: '#4f46e5', borderRadius: 8 },
    exportButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    itemContainer: { padding: 15, marginVertical: 5, marginHorizontal: 10, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between'}
});