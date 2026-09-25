-- Site artık yalnızca Türkçe yayınlanıyor (Google Website Translator widget'ı
-- diğer diller için tarayıcı tarafında çeviri yapıyor). Şema yapısı bilinçli
-- olarak korunuyor (gelecekte gerçek çok dilliliğe dönmek isterse), ama
-- artık okunmayan en/ar/ru satırları temizleniyor.
DELETE FROM "ContentLocale" WHERE locale <> 'tr';
DELETE FROM "FaqLocale" WHERE locale <> 'tr';
DELETE FROM "GalleryAlt" WHERE locale <> 'tr';
DELETE FROM "HomeContent" WHERE locale <> 'tr';
DELETE FROM "ListingContent" WHERE locale <> 'tr';
