# Pretty Crafter API

## Setup cepat (local)
1. Buat database dan tabel:
   - Jalankan file `schema.sql`
   - Jalankan file `seed.sql`
2. Copy `.env.example` ke `.env` lalu isi kredensial MySQL.
3. Install dependency:
   - `npm install`
4. Jalankan API:
   - `npm run start`

## Vercel
- Endpoint serverless ada di `api/orders.js` (route: `/api/orders`).
- Untuk local dev server, gunakan `api/server.local.js` (via `npm run start`).

## Endpoint
### POST /api/orders
Contoh payload:
```json
{
  "customer": {
    "name": "Nadia",
    "phone": "08123456789",
    "email": "nadia@mail.com",
    "address": "Bandung"
  },
  "items": [
    {"product_id": "gantungan-cherry", "qty": 2},
    {"product_id": "gantungan-pita", "qty": 1}
  ],
  "payment_method": "transfer",
  "delivery_method": "kurir",
  "notes": "Mohon warna soft pink"
}
```
