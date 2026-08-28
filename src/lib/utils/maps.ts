import type { Clinic } from '@/lib/content/types';

/**
 * Google Haritalar "konuma git" bağlantısı.
 *
 * Koordinat varsa onu kullanır: adres araması Halkalı'da aynı isimli
 * birden fazla rezidans bloğu döndürebiliyor, koordinat tek noktayı
 * işaret eder. Koordinat yoksa yazılı adrese düşer.
 */
export function mapsUrl(address: Clinic['address']): string {
  const query = address.geo
    ? `${address.geo.latitude},${address.geo.longitude}`
    : address.formatted;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
