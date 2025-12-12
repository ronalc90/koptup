// Service for Content Manager API calls

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_PREFIX = '/api';

export type ContentTone = 'formal' | 'técnico' | 'persuasivo';

export type ContentTemplate = 'email' | 'presentation' | 'product' | 'social' | 'proposal';

export interface ContentVersion {
  version: string;
  content: string;
  tone: ContentTone;
  timestamp: string;
}

// Map frontend template names to backend template IDs
const TEMPLATE_MAP: Record<string, ContentTemplate> = {
  'Correo Corporativo': 'email',
  'Presentación Comercial': 'presentation',
  'Descripción de Producto': 'product',
  'Post para Redes Sociales': 'social',
  'Propuesta de Negocio': 'proposal',
};

export function getTemplateId(templateName: string): ContentTemplate {
  return TEMPLATE_MAP[templateName] || 'email';
}

export async function improveContent(content: string, template: ContentTemplate): Promise<string> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/content/improve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, template }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to improve content');
  }

  const data = await response.json();
  return data.data.content;
}

export async function changeTone(
  content: string,
  tone: ContentTone,
  template: ContentTemplate
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/content/change-tone`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, tone, template }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to change tone');
  }

  const data = await response.json();
  return data.data.content;
}

export async function adjustLength(
  content: string,
  targetWords: number,
  template: ContentTemplate
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/content/adjust-length`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, targetWords, template }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to adjust length');
  }

  const data = await response.json();
  return data.data.content;
}

export async function generateVersions(
  content: string,
  template: ContentTemplate,
  numVersions: number = 3
): Promise<ContentVersion[]> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/content/generate-versions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, template, numVersions }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to generate versions');
  }

  const data = await response.json();
  return data.data.versions;
}

export async function generateFromTemplate(
  template: ContentTemplate,
  userInput: string
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/content/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ template, userInput }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to generate content');
  }

  const data = await response.json();
  return data.data.content;
}
