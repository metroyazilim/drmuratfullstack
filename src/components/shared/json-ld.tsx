import type { WithContext, Thing } from 'schema-dts';

type JsonLdProps = {
  data: WithContext<Thing> | WithContext<Thing>[];
};

/**
 * JSON-LD'nin tek render noktası. Sayfa dosyalarında elle
 * <script type="application/ld+json"> yazılmaz.
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify çıktısı; `<` kaçışlanarak script kırılması engellenir.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
