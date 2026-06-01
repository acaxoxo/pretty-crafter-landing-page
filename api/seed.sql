USE db_penjualan;

INSERT INTO products (id, name, price, description, image_url, is_active) VALUES
  (
    'gantungan-cherry',
    'Gantungan Cherry',
    5000,
    'Desain bunga cherry yang manis dengan sentuhan warna lembut, menghadirkan kesan ceria dan penuh kehangatan dalam setiap detail kecil.',
    'assets/cherry.jpeg',
    1
  ),
  (
    'gantungan-daisy',
    'Gantungan Bunga Daisy',
    5000,
    'Bunga daisy dengan tampilan sederhana namun elegan, memberikan nuansa ringan, fresh, dan romantis yang tak berlebihan.',
    'assets/bunga_daisy.jpeg',
    1
  ),
  (
    'gantungan-pita',
    'Gantungan Pita',
    4000,
    'Kombinasi desain dalam satu paket dengan tampilan yang beragam, menghadirkan pilihan aksen yang playful dan tetap harmonis.',
    'assets/pita.jpeg',
    1
  ),
  (
    'gantungan-lily',
    'Gantungan Bunga Lily',
    6000,
    'Bunga lily dengan kelopak berlapis yang anggun, menciptakan kesan elegan dan berkelas dalam sentuhan yang lembut.',
    'assets/daisy_ungu.jpeg',
    1
  )
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  price = VALUES(price),
  description = VALUES(description),
  image_url = VALUES(image_url),
  is_active = VALUES(is_active);

INSERT INTO site_meta (page_title, meta_description, keywords, og_image_url)
VALUES (
  'Pretty Crafter - Gantungan Bunga Hiasan Cantik',
  'Gantungan bunga handmade cantik, harga terjangkau.',
  'gantungan bunga, handmade, souvenir',
  '/assets/og-image.jpg'
)
ON DUPLICATE KEY UPDATE
  page_title = VALUES(page_title),
  meta_description = VALUES(meta_description),
  keywords = VALUES(keywords),
  og_image_url = VALUES(og_image_url);

INSERT INTO site_content (content_key, content_value) VALUES
  (
    'promo_banner',
    '{"headline":"Promo Manis Minggu Ini","subtext":"Diskon 10% untuk pembelian 10 pcs atau lebih.","cta_label":"Tanya Promo","cta_url":"https://wa.me/6281237705049","is_active":true}'
  ),
  (
    'testimonials',
    '[{"name":"Flourensia Bullu","location":"Kupang","quote":"Awalnya coba-coba aja, ternyata hasilnya beneran rapi dan detailnya halus banget. Kecil tapi lucu, jadi suka diliat terus.","photo_url":""},{"name":"Claudya Ndolu","location":"Kupang","quote":"Warnanya lembut dan sesuai foto, nggak nyangka bakal sebagus ini. Kelihatan simpel tapi tetap ada kesan elegannya.","photo_url":""},{"name":"Esmeralda De Lemos","location":"Kupang","quote":"Packaging-nya juga cantik, jadi makin berasa spesial. Produknya sendiri ringan dan detailnya keliatan banget dibuat dengan teliti.","photo_url":""}]'
  )
ON DUPLICATE KEY UPDATE
  content_value = VALUES(content_value);
