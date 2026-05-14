import { Metadata } from 'next';
import {
  generateMetadata,
  getBreadcrumbSchema,
  getSoftwareApplicationSchema,
} from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('demo-voice-ai');

const softwareSchema = getSoftwareApplicationSchema({
  name: 'KopTup Voice AI / Call Center',
  description:
    'Voice AI con IVR conversacional sub-300ms, STT/TTS realistas, function calling, llamadas inbound y outbound, y compliance PCI / DNC.',
  url: 'https://koptup.com/demo/voice-ai',
  applicationCategory: 'CommunicationApplication',
  lowPrice: 0.12,
  highPrice: 25000,
  reviewCount: 31,
  ratingValue: 4.8,
  featureList: [
    'STT streaming (Whisper, Deepgram, AssemblyAI) <300ms',
    'TTS realista (ElevenLabs, Cartesia, Play.ht) con barge-in',
    'Function calling: transferir, agendar, consultar en vivo',
    'Compliance: DNC, recording disclosure, PCI redaction auto',
  ],
});

export default function VoiceAiLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Demos', url: '/demo' },
    { name: 'Voice AI / Call Center', url: '/demo/voice-ai' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      {children}
    </>
  );
}
