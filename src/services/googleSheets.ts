import { getAccessToken } from './firebaseAuth';
import { Order, Product } from '../types';

/**
 * Creates a new Google Spreadsheet for Jajan Makanan & Minuman transactions
 */
export async function createTransactionSpreadsheet(
  title: string = `Laporan Transaksi Jajan - ${new Date().toLocaleDateString('id-ID')}`
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Silakan login dengan Google terlebih dahulu untuk menghubungkan ke Google Sheets.');
  }

  // Handle demo mode simulation
  if (token.startsWith('demo_')) {
    const demoId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
    return {
      spreadsheetId: `demo-sheet-${Date.now().toString().slice(-6)}`,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${demoId}/edit#gid=0`,
    };
  }

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'Riwayat Transaksi',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: [
                    { userEnteredValue: { stringValue: 'Waktu Transaksi' } },
                    { userEnteredValue: { stringValue: 'No. Pesanan' } },
                    { userEnteredValue: { stringValue: 'Nama Pelanggan' } },
                    { userEnteredValue: { stringValue: 'Daftar Menu Jajan' } },
                    { userEnteredValue: { stringValue: 'Metode Pengambilan' } },
                    { userEnteredValue: { stringValue: 'Metode Pembayaran' } },
                    { userEnteredValue: { stringValue: 'Status Pembayaran' } },
                    { userEnteredValue: { stringValue: 'Subtotal (Rp)' } },
                    { userEnteredValue: { stringValue: 'Diskon (Rp)' } },
                    { userEnteredValue: { stringValue: 'Total Bayar (Rp)' } },
                    { userEnteredValue: { stringValue: 'Status Pesanan' } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gagal membuat spreadsheet (${response.status})`);
  }

  const data = await response.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
  };
}

/**
 * Appends transactions to a Google Spreadsheet
 */
export async function syncOrdersToSheet(
  spreadsheetId: string,
  orders: Order[]
): Promise<{ updatedRows: number }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Akses Google Sheets memerlukan token autentikasi. Silakan login ulang.');
  }

  // Handle demo mode simulation
  if (token.startsWith('demo_')) {
    return { updatedRows: orders.length };
  }

  const rows = orders.map((order) => {
    const itemsStr = order.items
      .map((item) => `${item.product.name} (x${item.quantity})`)
      .join(', ');

    return [
      order.createdAt,
      order.orderNumber,
      order.customerName,
      itemsStr,
      order.fulfillmentType === 'pickup' ? 'Ambil di Tempat (Pick-up)' : 'Kurir Antar (Delivery)',
      order.paymentMethod.toUpperCase(),
      order.paymentStatus === 'paid' ? 'LUNAS' : 'PENDING',
      order.subtotal,
      order.discount,
      order.total,
      order.status,
    ];
  });

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Riwayat Transaksi!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: rows,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gagal menyimpan ke Google Sheets (${response.status})`);
  }

  const result = await response.json();
  return { updatedRows: result.updates?.updatedRows || rows.length };
}

/**
 * Syncs or Exports products inventory to a Google Sheet
 */
export async function exportInventoryToSheet(
  spreadsheetId: string,
  products: Product[]
): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) throw new Error('Token Google Sheets tidak tersedia');

  if (token.startsWith('demo_')) {
    return true;
  }

  const rows = [
    ['ID Produk', 'Nama Menu', 'Kategori', 'Harga (Rp)', 'Stok', 'Status', 'Estimasi Waktu'],
    ...products.map((p) => [
      p.id,
      p.name,
      p.category,
      p.price,
      p.stock,
      p.isAvailable ? 'Tersedia' : 'Habis / Nonaktif',
      `${p.preparationTimeMinutes} Menit`,
    ]),
  ];

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Inventaris!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: rows,
      }),
    }
  );

  return response.ok;
}
