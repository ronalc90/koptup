import type { Metadata } from 'next';
import HomeContent from '@/components/home/HomeContent';
import StructuredData, { FAQStructuredData } from '@/components/seo/StructuredData';
import { HOME_TITLE } from '@/lib/site';

/**
 * Home. El `<title>` es absoluto ("KopTup | …", sin la plantilla
 * "%s | KopTup"). La description, el canonical y og/twitter de la home son los
 * del layout raíz (src/app/layout.tsx), y la imagen og/twitter sale de
 * src/app/opengraph-image.tsx.
 */
export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
};

export default function HomePage() {
  return (
    <>
      {/* SEO Structured Data (se renderiza en el servidor, fuera del bundle cliente) */}
      <StructuredData type="organization" />
      <StructuredData type="website" />
      <StructuredData type="softwareApplication" />
      <StructuredData type="localBusiness" />
      <FAQStructuredData />

      <HomeContent />
    </>
  );
}
