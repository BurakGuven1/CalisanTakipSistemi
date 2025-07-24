import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as XLSX from 'xlsx';

// Excel'e Aktarma Fonksiyonu
export const exportToExcel = async (data, fileName) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rapor");
    const wbout = XLSX.write(wb, { type: 'base64', bookType: "xlsx" });
    const uri = FileSystem.cacheDirectory + `${fileName}.xlsx`;
    await FileSystem.writeAsStringAsync(uri, wbout, {
        encoding: FileSystem.EncodingType.Base64
    });
    await Sharing.shareAsync(uri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Raporu Paylaş',
    });
};

// PDF'e Aktarma Fonksiyonu
export const exportToPdf = async (data, storeName, period) => {
    // Veriyi HTML tablosuna dönüştür
    const tableRows = data.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.totalHours} saat</td>
        </tr>
    `).join('');

    const htmlContent = `
        <html>
            <head>
                <style>
                    body { font-family: sans-serif; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #dddddd; text-align: left; padding: 8px; }
                    th { background-color: #f2f2f2; }
                    h1 { text-align: center; }
                </style>
            </head>
            <body>
                <h1>${storeName} - ${period} Raporu</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Çalışan Adı</th>
                            <th>Toplam Çalışma Saati</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </body>
        </html>
    `;

    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'PDF Raporunu Paylaş' });
};