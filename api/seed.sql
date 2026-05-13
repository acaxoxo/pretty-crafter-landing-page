USE db_penjualan;

INSERT INTO products (id, name, price) VALUES
  ('gantungan-cherry', 'Gantungan Cherry', 5000),
  ('gantungan-daisy', 'Gantungan Bunga Daisy', 5000),
  ('gantungan-pita', 'Gantungan Pita', 4000),
  ('gantungan-lily', 'Gantungan Bunga Lily', 6000)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  price = VALUES(price);
