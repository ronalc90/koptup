// Service for AI-powered content management
import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { getOpenAI } from './openai.service';

export type ContentTone = 'formal' | 'técnico' | 'persuasivo';
export type ContentTemplate = 'email' | 'presentation' | 'product' | 'social' | 'proposal';

export interface ImproveContentRequest {
  content: string;
  template: ContentTemplate;
}

export interface ChangeToneRequest {
  content: string;
  tone: ContentTone;
  template: ContentTemplate;
}

export interface AdjustLengthRequest {
  content: string;
  targetWords: number;
  template: ContentTemplate;
}

export interface GenerateVersionsRequest {
  content: string;
  template: ContentTemplate;
  numVersions?: number;
}

export interface ContentVersion {
  version: string;
  content: string;
  tone: ContentTone;
  timestamp: string;
}

// Template-specific prompts
const TEMPLATE_CONTEXTS = {
  email: 'correo corporativo profesional',
  presentation: 'presentación comercial de ventas',
  product: 'descripción de producto para marketing',
  social: 'publicación para redes sociales',
  proposal: 'propuesta de negocio formal',
};

/**
 * Improve content using AI
 */
export async function improveContent(request: ImproveContentRequest): Promise<string> {
  try {
    const client = getOpenAI();
    const context = TEMPLATE_CONTEXTS[request.template];

    const systemPrompt = `Eres un experto en redacción corporativa. Tu tarea es mejorar el texto manteniendo su propósito y mensaje principal, pero optimizando:
- Gramática y ortografía
- Claridad y concisión
- Estructura profesional
- Tono apropiado para el contexto

Contexto del documento: ${context}

Instrucciones:
1. Corrige errores gramaticales y ortográficos
2. Mejora la claridad y fluidez
3. Mantén el mensaje y la intención original
4. Asegura un tono profesional y apropiado
5. Devuelve SOLO el texto mejorado, sin explicaciones adicionales`;

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: request.content },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const improvedContent = response.choices[0]?.message?.content;
    if (!improvedContent) {
      throw new Error('Empty response from OpenAI');
    }

    logger.info('Content improved successfully');
    return improvedContent.trim();
  } catch (error: any) {
    logger.error('Error improving content:', error);
    throw new Error(`Failed to improve content: ${error.message}`);
  }
}

/**
 * Change content tone
 */
export async function changeTone(request: ChangeToneRequest): Promise<string> {
  try {
    const client = getOpenAI();
    const context = TEMPLATE_CONTEXTS[request.template];

    const toneDescriptions = {
      formal: 'formal y profesional, con lenguaje corporativo estándar',
      técnico: 'técnico y especializado, con terminología específica del sector',
      persuasivo: 'persuasivo y convincente, enfocado en destacar beneficios y crear impacto',
    };

    const systemPrompt = `Eres un experto en redacción adaptativa. Tu tarea es reescribir el texto en un tono ${toneDescriptions[request.tone]}.

Contexto del documento: ${context}

Instrucciones:
1. Mantén el mensaje y los puntos principales
2. Adapta el lenguaje al tono ${request.tone}
3. Asegura coherencia en todo el texto
4. Mantén la longitud similar al original
5. Devuelve SOLO el texto adaptado, sin explicaciones adicionales`;

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: request.content },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const adaptedContent = response.choices[0]?.message?.content;
    if (!adaptedContent) {
      throw new Error('Empty response from OpenAI');
    }

    logger.info(`Content tone changed to ${request.tone}`);
    return adaptedContent.trim();
  } catch (error: any) {
    logger.error('Error changing tone:', error);
    throw new Error(`Failed to change tone: ${error.message}`);
  }
}

/**
 * Adjust content length
 */
export async function adjustLength(request: AdjustLengthRequest): Promise<string> {
  try {
    const client = getOpenAI();
    const context = TEMPLATE_CONTEXTS[request.template];

    const systemPrompt = `Eres un experto en edición de contenido. Tu tarea es ajustar el texto a aproximadamente ${request.targetWords} palabras.

Contexto del documento: ${context}

Instrucciones:
1. Mantén los puntos clave y el mensaje principal
2. Ajusta a aproximadamente ${request.targetWords} palabras (±10%)
3. Mantén un tono profesional
4. Si necesitas reducir, prioriza la información más importante
5. Si necesitas expandir, añade detalles relevantes sin perder coherencia
6. Devuelve SOLO el texto ajustado, sin explicaciones adicionales`;

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: request.content },
      ],
      temperature: 0.7,
      max_tokens: 2500,
    });

    const adjustedContent = response.choices[0]?.message?.content;
    if (!adjustedContent) {
      throw new Error('Empty response from OpenAI');
    }

    logger.info(`Content adjusted to ${request.targetWords} words`);
    return adjustedContent.trim();
  } catch (error: any) {
    logger.error('Error adjusting length:', error);
    throw new Error(`Failed to adjust length: ${error.message}`);
  }
}

/**
 * Generate multiple versions
 */
export async function generateVersions(
  request: GenerateVersionsRequest
): Promise<ContentVersion[]> {
  try {
    const numVersions = request.numVersions || 3;
    const tones: ContentTone[] = ['formal', 'técnico', 'persuasivo'];
    const versions: ContentVersion[] = [];

    // Generate versions with different tones in parallel
    const promises = tones.slice(0, numVersions).map(async (tone, index) => {
      const adaptedContent = await changeTone({
        content: request.content,
        tone,
        template: request.template,
      });

      return {
        version: `v1.${numVersions - index}`,
        content: adaptedContent,
        tone,
        timestamp: new Date().toISOString(),
      };
    });

    const results = await Promise.all(promises);
    versions.push(...results);

    logger.info(`Generated ${versions.length} content versions`);
    return versions.reverse(); // Newest first
  } catch (error: any) {
    logger.error('Error generating versions:', error);
    throw new Error(`Failed to generate versions: ${error.message}`);
  }
}

/**
 * Generate content from template
 */
export async function generateFromTemplate(
  template: ContentTemplate,
  userInput: string
): Promise<string> {
  try {
    const client = getOpenAI();
    const context = TEMPLATE_CONTEXTS[template];

    const systemPrompt = `Eres un experto en creación de contenido corporativo. Tu tarea es crear un ${context} basándote en la información proporcionada por el usuario.

Instrucciones:
1. Crea un contenido completo y profesional
2. Estructura el contenido de manera lógica
3. Usa un tono apropiado para ${context}
4. Asegura que sea claro, conciso y efectivo
5. Incluye todos los elementos necesarios para este tipo de documento
6. Devuelve SOLO el contenido generado, sin explicaciones adicionales`;

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ],
      temperature: 0.8,
      max_tokens: 2000,
    });

    const generatedContent = response.choices[0]?.message?.content;
    if (!generatedContent) {
      throw new Error('Empty response from OpenAI');
    }

    logger.info(`Content generated from template: ${template}`);
    return generatedContent.trim();
  } catch (error: any) {
    logger.error('Error generating from template:', error);
    throw new Error(`Failed to generate content: ${error.message}`);
  }
}
