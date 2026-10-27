import EmbedChat from './EmbedChat';

interface EmbedChatbotPageProps {
  params: { botId: string };
  searchParams: Record<string, string | string[] | undefined>;
}

const BOT_ID = /^[a-zA-Z0-9_-]{3,64}$/;
const HEX = /^#[0-9a-f]{6}$/i;

/**
 * /embed/chatbot/[botId] — chat público de un bot creado en "Configura el
 * tuyo" (/demo/chatbot?mode=builder). Lo usan el iframe del código para
 * insertar y el botón flotante de /widget.js (`?widget=1`, con botón de
 * cerrar). `?color=#RRGGBB` aplica el color del código insertado.
 */
export default function EmbedChatbotPage({ params, searchParams }: EmbedChatbotPageProps) {
  const color = typeof searchParams.color === 'string' && HEX.test(searchParams.color) ? searchParams.color : null;
  const widget = searchParams.widget === '1';
  const botId = BOT_ID.test(params.botId) ? params.botId : null;
  return <EmbedChat botId={botId} colorOverride={color} widget={widget} />;
}
