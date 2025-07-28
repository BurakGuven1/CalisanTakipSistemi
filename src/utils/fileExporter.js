import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as XLSX from 'xlsx';

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

export const exportToPdf = async (data, title) => {
    // DÜZELTME: item.name yerine item["Çalışan Adı"] gibi doğru anahtarlar kullanıldı.
    const tableRows = data.map(item => `
        <tr>
            <td>${item["Çalışan Adı"]}</td>
            <td>${item["Tarih"]}</td>
            <td>${item["Giriş Saati"]}</td>
            <td>${item["Çıkış Saati"]}</td>
            <td>${item["Toplam Süre (saat)"]}</td>
        </tr>
    `).join('');
    
    const htmlContent = `
        <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: sans-serif; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #dddddd; text-align: left; padding: 8px; }
                    th { background-color: #f2f2f2; }
                    h1 { text-align: center; }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Çalışan Adı</th>
                            <th>Tarih</th>
                            <th>Giriş Saati</th>
                            <th>Çıkış Saati</th>
                            <th>Toplam Süre (saat)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </body>
        </html>`;
        
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'PDF Raporunu Paylaş' });
};