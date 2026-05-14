import { Decision, ModerationItem } from './moderation.types';

const t = (h: number) => new Date(Date.now() - h * 3600000).toISOString();

export const items: ModerationItem[] = [
  { id: 'mod_001', contentType: 'text', contentExcerpt: 'Comentario potencialmente ofensivo...', sourceUser: 'user_a123', aiScore: 0.87, flags: ['hate-speech', 'profanity'], status: 'pending', severity: 'high', createdAt: t(2), updatedAt: t(2) },
  { id: 'mod_002', contentType: 'image', contentUrl: '/uploads/img_b456.jpg', sourceUser: 'user_b456', aiScore: 0.42, flags: ['nudity-suspect'], status: 'pending', severity: 'medium', createdAt: t(4), updatedAt: t(4) },
  { id: 'mod_003', contentType: 'video', contentUrl: '/uploads/vid_c789.mp4', sourceUser: 'user_c789', aiScore: 0.95, flags: ['violence', 'gore'], status: 'rejected', severity: 'critical', createdAt: t(48), updatedAt: t(40) },
  { id: 'mod_004', contentType: 'text', contentExcerpt: '¿Algún problema con mi cuenta?', sourceUser: 'user_d012', aiScore: 0.05, flags: [], status: 'approved', severity: 'low', createdAt: t(72), updatedAt: t(70) },
  { id: 'mod_005', contentType: 'image', contentUrl: '/uploads/img_e345.png', sourceUser: 'user_e345', aiScore: 0.65, flags: ['spam'], status: 'pending', severity: 'medium', createdAt: t(1), updatedAt: t(1) },
  { id: 'mod_006', contentType: 'text', contentExcerpt: 'Compra mi producto a precio especial', sourceUser: 'user_f678', aiScore: 0.78, flags: ['spam', 'scam-suspect'], status: 'escalated', severity: 'high', createdAt: t(12), updatedAt: t(10) },
  { id: 'mod_007', contentType: 'audio', contentUrl: '/uploads/aud_g901.mp3', sourceUser: 'user_g901', aiScore: 0.35, flags: ['low-quality'], status: 'approved', severity: 'low', createdAt: t(96), updatedAt: t(94) },
  { id: 'mod_008', contentType: 'text', contentExcerpt: 'Threats of harm against...', sourceUser: 'user_h234', aiScore: 0.99, flags: ['threats', 'hate-speech'], status: 'rejected', severity: 'critical', createdAt: t(120), updatedAt: t(118) },
  { id: 'mod_009', contentType: 'image', contentUrl: '/uploads/img_i567.jpg', sourceUser: 'user_i567', aiScore: 0.15, flags: [], status: 'approved', severity: 'low', createdAt: t(140), updatedAt: t(138) },
  { id: 'mod_010', contentType: 'text', contentExcerpt: 'Información personal compartida...', sourceUser: 'user_j890', aiScore: 0.72, flags: ['pii'], status: 'pending', severity: 'high', createdAt: t(0.5), updatedAt: t(0.5) },
];

export const decisions: Decision[] = [
  { id: 'dec_001', itemId: 'mod_003', moderatorId: 'mod_user_01', verdict: 'reject', reason: 'Violencia explícita', createdAt: t(40), updatedAt: t(40) },
  { id: 'dec_002', itemId: 'mod_004', moderatorId: 'mod_user_01', verdict: 'approve', reason: 'Contenido benigno', createdAt: t(70), updatedAt: t(70) },
  { id: 'dec_003', itemId: 'mod_006', moderatorId: 'mod_user_02', verdict: 'escalate', reason: 'Posible scam, requiere supervisor', createdAt: t(10), updatedAt: t(10) },
  { id: 'dec_004', itemId: 'mod_008', moderatorId: 'mod_user_01', verdict: 'reject', reason: 'Amenazas explícitas', createdAt: t(118), updatedAt: t(118) },
];
