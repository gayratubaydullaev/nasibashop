-- Demo catalog for local/dev. Store id matches delivery-service seed (demo-store).
-- Safe to re-run: fixed primary keys + ON CONFLICT DO NOTHING.

INSERT INTO categories (id, parent_id, slug, name_uz, description_uz, sort_order)
VALUES
  ('a1000000-0000-4000-8000-000000000001', NULL, 'demo-elektronika', 'Elektronika', 'Smartfonlar, audio va gadjetlar', 1),
  ('a1000000-0000-4000-8000-000000000002', NULL, 'demo-kiyim', 'Kiyim-kechak', 'Erkaklar va ayollar uchun', 2),
  ('a1000000-0000-4000-8000-000000000003', NULL, 'demo-uy', 'Uy-ro''zg''or', 'Idish-tovoq va kichik maishiy texnika', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO store_locations (id, store_id, name, address, latitude, longitude, phone, opening_hours)
VALUES
  (
    'b1000000-0000-4000-8000-000000000001',
    'demo-store',
    'Demo do''kon',
    'Toshkent, Chilonzor',
    41.2855,
    69.2035,
    '+998901112233',
    'Dush-Juma 09:00-20:00, Shan-Yak 10:00-18:00'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, store_id, category_id, title_uz, description_uz, brand, price_units, currency_code, discount_percent, status)
VALUES
  (
    'a2000000-0000-4000-8000-000000000001',
    'demo-store',
    'a1000000-0000-4000-8000-000000000001',
    'Smartfon Galaxy A55 5G',
    '6.6 dyuymli Super AMOLED ekran, 128 GB xotira, 5000 mAh batareya. Kundalik ishlatish uchun qulay.',
    'Samsung',
    4500000,
    'UZS',
    0,
    'ACTIVE'
  ),
  (
    'a2000000-0000-4000-8000-000000000002',
    'demo-store',
    'a1000000-0000-4000-8000-000000000001',
    'Simsiz quloqchin TWS',
    'Bluetooth 5.3, shovqinni bosish rejimi, zaryadlash qutisi bilan 24 soatgacha ish vaqti.',
    'Nasiba Audio',
    320000,
    'UZS',
    15,
    'ACTIVE'
  ),
  (
    'a2000000-0000-4000-8000-000000000003',
    'demo-store',
    'a1000000-0000-4000-8000-000000000002',
    'Paxta futbolka',
    'Klassik kesim, tabiiy paxta mato. Yozgi kunlar uchun nafis va yumshoq.',
    'Nasiba Wear',
    180000,
    'UZS',
    10,
    'ACTIVE'
  ),
  (
    'a2000000-0000-4000-8000-000000000004',
    'demo-store',
    'a1000000-0000-4000-8000-000000000003',
    'Elektr choynak 1.7 L',
    'Avtomatik o''chish, ko''rinmas qizdirgich, LED indikator. Issiq suv va choy uchun.',
    'Nasiba Home',
    245000,
    'UZS',
    0,
    'ACTIVE'
  ),
  (
    'a2000000-0000-4000-8000-000000000005',
    'demo-store',
    'a1000000-0000-4000-8000-000000000001',
    'Planshet 11 dyuym (qoralama)',
    'Yangi model ustida ishlanmoqda — admin panelda ko''rish uchun qoralama.',
    'Nasiba',
    0,
    'UZS',
    0,
    'DRAFT'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_variants (id, product_id, sku, color, size, price_override_units, active)
VALUES
  ('a3000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001', 'NAS-DEMO-A55-BLK', 'Qora', '', NULL, true),
  ('a3000000-0000-4000-8000-000000000002', 'a2000000-0000-4000-8000-000000000002', 'NAS-DEMO-TWS-WHT', 'Oq', '', NULL, true),
  ('a3000000-0000-4000-8000-000000000003', 'a2000000-0000-4000-8000-000000000003', 'NAS-DEMO-TSH-M', 'Kulrang', 'M', NULL, true),
  ('a3000000-0000-4000-8000-000000000004', 'a2000000-0000-4000-8000-000000000003', 'NAS-DEMO-TSH-L', 'Kulrang', 'L', NULL, true),
  ('a3000000-0000-4000-8000-000000000005', 'a2000000-0000-4000-8000-000000000004', 'NAS-DEMO-KTL-01', 'Kumush', '', NULL, true),
  ('a3000000-0000-4000-8000-000000000006', 'a2000000-0000-4000-8000-000000000005', 'NAS-DEMO-TAB-DRAFT', '', '', NULL, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_images (id, product_id, media_id, url, alt_text, sort_order)
VALUES
  ('a4000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001', NULL, 'https://picsum.photos/seed/nasiba-phone/800/800', 'Smartfon', 0),
  ('a4000000-0000-4000-8000-000000000002', 'a2000000-0000-4000-8000-000000000002', NULL, 'https://picsum.photos/seed/nasiba-tws/800/800', 'TWS quloqchin', 0),
  ('a4000000-0000-4000-8000-000000000003', 'a2000000-0000-4000-8000-000000000003', NULL, 'https://picsum.photos/seed/nasiba-shirt/800/800', 'Futbolka', 0),
  ('a4000000-0000-4000-8000-000000000004', 'a2000000-0000-4000-8000-000000000004', NULL, 'https://picsum.photos/seed/nasiba-kettle/800/800', 'Choynak', 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO stocks (id, product_id, variant_id, store_id, quantity, reserved_quantity)
VALUES
  ('a5000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000001', 'demo-store', 12, 0),
  ('a5000000-0000-4000-8000-000000000002', 'a2000000-0000-4000-8000-000000000002', 'a3000000-0000-4000-8000-000000000002', 'demo-store', 40, 0),
  ('a5000000-0000-4000-8000-000000000003', 'a2000000-0000-4000-8000-000000000003', 'a3000000-0000-4000-8000-000000000003', 'demo-store', 25, 0),
  ('a5000000-0000-4000-8000-000000000004', 'a2000000-0000-4000-8000-000000000003', 'a3000000-0000-4000-8000-000000000004', 'demo-store', 18, 0),
  ('a5000000-0000-4000-8000-000000000005', 'a2000000-0000-4000-8000-000000000004', 'a3000000-0000-4000-8000-000000000005', 'demo-store', 8, 0)
ON CONFLICT (id) DO NOTHING;
