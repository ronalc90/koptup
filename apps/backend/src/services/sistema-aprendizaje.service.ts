/**
 * SISTEMA DE APRENDIZAJE Y CALIBRACIÓN IA
 *
 * Este servicio implementa un sistema de fine-tuning continuo donde:
 * 1. Cada decisión de la IA recibe un score (0-100)
 * 2. Se guardan comentarios en lenguaje natural sobre la decisión
 * 3. El sistema aprende de retroalimentación humana
 * 4. Se calibra automáticamente el modelo experto + IA
 */

import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';

/**
 * Decisión tomada por la IA con metadatos completos
 */
interface DecisionIA {
  id: string;
  timestamp: Date;

  // Contexto de la decisión
  contexto: {
    numeroFactura: string;
    paciente: string;
    diagnostico: string;
    codigoCUPS: string;
    valorFacturado: number;
  };

  // Decisión tomada
  decision: {
    tipo: 'EXTRACCION' | 'VALIDACION' | 'GLOSA' | 'APROBACION';
    valorDecidido: any;
    confianzaIA: number; // 0-100
    razonamiento: string;
  };

  // Feedback humano
  feedback?: {
    scoreHumano: number; // 0-100 (qué tan correcta fue la decisión)
    comentario: string; // Lenguaje natural explicando por qué
    valorCorrecto?: any; // Si la IA se equivocó, cuál era el correcto
    timestamp: Date;
  };

  // Resultado del aprendizaje
  aprendizaje?: {
    errorDetectado: boolean;
    tipoError: string;
    leccionAprendida: string;
    ajusteSugerido: string;
  };
}

/**
 * Dataset para fine-tuning
 */
interface RegistroFineTuning {
  prompt: string;
  completion: string;
  scoreCalidad: number;
  categoria: string;
}

class SistemaAprendizajeService {
  private openai: OpenAI | null = null;
  private decisionesPath: string;
  private fineTuningPath: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }

    // Rutas para almacenar decisiones y datos de training
    this.decisionesPath = path.join(process.cwd(), 'data', 'decisiones-ia');
    this.fineTuningPath = path.join(process.cwd(), 'data', 'fine-tuning');

    // Crear directorios si no existen
    [this.decisionesPath, this.fineTuningPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Registrar una decisión tomada por la IA
   */
  async registrarDecision(decision: DecisionIA): Promise<void> {
    const archivo = path.join(this.decisionesPath, `${decision.id}.json`);
    fs.writeFileSync(archivo, JSON.stringify(decision, null, 2));

    console.log(`📝 Decisión registrada: ${decision.id}`);
  }

  /**
   * Agregar feedback humano a una decisión
   */
  async agregarFeedback(
    decisionId: string,
    scoreHumano: number,
    comentario: string,
    valorCorrecto?: any
  ): Promise<void> {
    const archivo = path.join(this.decisionesPath, `${decisionId}.json`);

    if (!fs.existsSync(archivo)) {
      console.error(`❌ Decisión ${decisionId} no encontrada`);
      return;
    }

    const decision: DecisionIA = JSON.parse(fs.readFileSync(archivo, 'utf-8'));

    // Agregar feedback
    decision.feedback = {
      scoreHumano,
      comentario,
      valorCorrecto,
      timestamp: new Date(),
    };

    // Analizar el error y generar aprendizaje
    if (scoreHumano < 70) {
      decision.aprendizaje = await this.analizarError(decision);
    }

    // Guardar decisión actualizada
    fs.writeFileSync(archivo, JSON.stringify(decision, null, 2));

    // Agregar al dataset de fine-tuning
    await this.agregarAFineTuning(decision);

    console.log(`✅ Feedback agregado a decisión ${decisionId}`);
    console.log(`   Score: ${scoreHumano}/100`);
    console.log(`   Comentario: ${comentario}`);
  }

  /**
   * Analizar un error usando GPT-4o para generar lecciones
   */
  private async analizarError(decision: DecisionIA): Promise<DecisionIA['aprendizaje']> {
    if (!this.openai || !decision.feedback) {
      return {
        errorDetectado: true,
        tipoError: 'Desconocido',
        leccionAprendida: 'Feedback insuficiente',
        ajusteSugerido: 'Revisar manualmente',
      };
    }

    const prompt = `Analiza este error de una IA médica y genera lecciones de aprendizaje:

**CONTEXTO:**
- Factura: ${decision.contexto.numeroFactura}
- Paciente: ${decision.contexto.paciente}
- Diagnóstico: ${decision.contexto.diagnostico}
- Código CUPS: ${decision.contexto.codigoCUPS}

**DECISIÓN DE LA IA:**
- Tipo: ${decision.decision.tipo}
- Valor decidido: ${JSON.stringify(decision.decision.valorDecidido)}
- Confianza: ${decision.decision.confianzaIA}%
- Razonamiento: ${decision.decision.razonamiento}

**FEEDBACK HUMANO:**
- Score: ${decision.feedback.scoreHumano}/100
- Comentario: ${decision.feedback.comentario}
- Valor correcto: ${decision.feedback.valorCorrecto ? JSON.stringify(decision.feedback.valorCorrecto) : 'No especificado'}

**GENERA:**
Responde SOLO con JSON:

{
  "errorDetectado": true,
  "tipoError": "tipo específico de error (ej: extracción_codigo_incorrecto, diagnóstico_mal_identificado, etc)",
  "leccionAprendida": "explicación clara de qué aprendió la IA de este error",
  "ajusteSugerido": "qué debe hacer diferente la próxima vez"
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      });

      const contenido = response.choices[0].message.content || '{}';
      const jsonMatch = contenido.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error al analizar error:', error);
    }

    return {
      errorDetectado: true,
      tipoError: 'Error de análisis',
      leccionAprendida: 'No se pudo analizar automáticamente',
      ajusteSugerido: 'Revisar manualmente',
    };
  }

  /**
   * Agregar decisión al dataset de fine-tuning
   */
  private async agregarAFineTuning(decision: DecisionIA): Promise<void> {
    if (!decision.feedback) return;

    // Crear ejemplo de training en formato OpenAI
    const registro: RegistroFineTuning = {
      prompt: this.construirPromptTraining(decision),
      completion: this.construirCompletionTraining(decision),
      scoreCalidad: decision.feedback.scoreHumano,
      categoria: decision.decision.tipo,
    };

    // Guardar en archivo JSONL para fine-tuning
    const archivoTraining = path.join(
      this.fineTuningPath,
      `training_${decision.decision.tipo.toLowerCase()}.jsonl`
    );

    const lineaJSONL = JSON.stringify({
      messages: [
        { role: 'system', content: 'Eres un auditor médico experto de Nueva EPS.' },
        { role: 'user', content: registro.prompt },
        { role: 'assistant', content: registro.completion },
      ],
      metadata: {
        score: registro.scoreCalidad,
        categoria: registro.categoria,
        timestamp: new Date().toISOString(),
      },
    });

    fs.appendFileSync(archivoTraining, lineaJSONL + '\n');

    console.log(`📚 Agregado a dataset de fine-tuning: ${registro.categoria}`);
  }

  /**
   * Construir prompt para training
   */
  private construirPromptTraining(decision: DecisionIA): string {
    return `Analiza esta factura médica:

Factura: ${decision.contexto.numeroFactura}
Paciente: ${decision.contexto.paciente}
Diagnóstico: ${decision.contexto.diagnostico}
Código CUPS: ${decision.contexto.codigoCUPS}
Valor: $${decision.contexto.valorFacturado}

Tipo de tarea: ${decision.decision.tipo}

${decision.feedback?.comentario ? `\nNota importante: ${decision.feedback.comentario}` : ''}`;
  }

  /**
   * Construir completion (respuesta correcta) para training
   */
  private construirCompletionTraining(decision: DecisionIA): string {
    const valorCorrecto = decision.feedback?.valorCorrecto || decision.decision.valorDecidido;
    const score = decision.feedback?.scoreHumano || 100;

    let completion = '';

    if (decision.feedback?.valorCorrecto) {
      // La IA se equivocó, usar valor correcto
      completion = `Valor correcto: ${JSON.stringify(valorCorrecto)}\n\n`;
      completion += `Razonamiento: ${decision.feedback.comentario}\n\n`;
      completion += `Lección aprendida: ${decision.aprendizaje?.leccionAprendida || 'Mejorar precisión'}`;
    } else {
      // La IA acertó
      completion = `${decision.decision.razonamiento}\n\n`;
      completion += `Valor: ${JSON.stringify(valorCorrecto)}`;
    }

    return completion;
  }

  /**
   * Obtener decisiones de una factura específica
   */
  async obtenerDecisionesFactura(numeroFactura: string): Promise<DecisionIA[]> {
    const archivos = fs.readdirSync(this.decisionesPath);
    const decisiones: DecisionIA[] = archivos
      .filter(f => f.endsWith('.json'))
      .map(f => JSON.parse(fs.readFileSync(path.join(this.decisionesPath, f), 'utf-8')))
      .filter(d => d.contexto.numeroFactura === numeroFactura);

    return decisiones;
  }

  /**
   * Obtener estadísticas de aprendizaje
   */
  async obtenerEstadisticas(): Promise<any> {
    const archivos = fs.readdirSync(this.decisionesPath);
    const decisiones: DecisionIA[] = archivos
      .filter(f => f.endsWith('.json'))
      .map(f => JSON.parse(fs.readFileSync(path.join(this.decisionesPath, f), 'utf-8')));

    const conFeedback = decisiones.filter(d => d.feedback);
    const scorePromedio = conFeedback.length > 0
      ? conFeedback.reduce((sum, d) => sum + (d.feedback?.scoreHumano || 0), 0) / conFeedback.length
      : 0;

    const porTipo = decisiones.reduce((acc, d) => {
      const tipo = d.decision.tipo;
      if (!acc[tipo]) {
        acc[tipo] = { total: 0, conFeedback: 0, scorePromedio: 0 };
      }
      acc[tipo].total++;
      if (d.feedback) {
        acc[tipo].conFeedback++;
        acc[tipo].scorePromedio += d.feedback.scoreHumano;
      }
      return acc;
    }, {} as any);

    // Calcular promedios
    Object.keys(porTipo).forEach(tipo => {
      if (porTipo[tipo].conFeedback > 0) {
        porTipo[tipo].scorePromedio /= porTipo[tipo].conFeedback;
      }
    });

    return {
      totalDecisiones: decisiones.length,
      decisionesConFeedback: conFeedback.length,
      scorePromedioGlobal: Math.round(scorePromedio),
      porcentajeFeedback: Math.round((conFeedback.length / decisiones.length) * 100),
      porTipo,
      erroresComunes: this.identificarErroresComunes(decisiones),
    };
  }

  /**
   * Identificar errores comunes
   */
  private identificarErroresComunes(decisiones: DecisionIA[]): any[] {
    const errores = decisiones
      .filter(d => d.aprendizaje?.errorDetectado)
      .reduce((acc, d) => {
        const tipo = d.aprendizaje!.tipoError;
        if (!acc[tipo]) {
          acc[tipo] = { tipo, count: 0, lecciones: [] };
        }
        acc[tipo].count++;
        if (d.aprendizaje!.leccionAprendida) {
          acc[tipo].lecciones.push(d.aprendizaje!.leccionAprendida);
        }
        return acc;
      }, {} as any);

    return Object.values(errores)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5); // Top 5 errores
  }

  /**
   * Generar reporte de calibración
   */
  async generarReporteCallibracion(): Promise<string> {
    const stats = await this.obtenerEstadisticas();

    const lineas: string[] = [];
    lineas.push('═══════════════════════════════════════════════════════');
    lineas.push('    📊 REPORTE DE CALIBRACIÓN DEL SISTEMA IA');
    lineas.push('═══════════════════════════════════════════════════════');
    lineas.push('');
    lineas.push('📈 ESTADÍSTICAS GENERALES:');
    lineas.push(`   - Total decisiones: ${stats.totalDecisiones}`);
    lineas.push(`   - Decisiones con feedback: ${stats.decisionesConFeedback} (${stats.porcentajeFeedback}%)`);
    lineas.push(`   - Score promedio: ${stats.scorePromedioGlobal}/100`);
    lineas.push('');

    lineas.push('🎯 DESEMPEÑO POR TIPO:');
    Object.entries(stats.porTipo).forEach(([tipo, data]: [string, any]) => {
      lineas.push(`   ${tipo}:`);
      lineas.push(`      Total: ${data.total}`);
      lineas.push(`      Con feedback: ${data.conFeedback}`);
      lineas.push(`      Score: ${Math.round(data.scorePromedio)}/100`);
    });
    lineas.push('');

    if (stats.erroresComunes.length > 0) {
      lineas.push('⚠️  ERRORES MÁS COMUNES:');
      stats.erroresComunes.forEach((error: any, i: number) => {
        lineas.push(`   ${i + 1}. ${error.tipo} (${error.count} veces)`);
        if (error.lecciones.length > 0) {
          lineas.push(`      Lección: ${error.lecciones[0]}`);
        }
      });
      lineas.push('');
    }

    lineas.push('💡 RECOMENDACIONES:');
    if (stats.scorePromedioGlobal < 70) {
      lineas.push('   ⚠️  Score bajo - considerar fine-tuning del modelo');
    } else if (stats.scorePromedioGlobal < 85) {
      lineas.push('   📊 Score moderado - continuar recopilando feedback');
    } else {
      lineas.push('   ✅ Score alto - modelo bien calibrado');
    }

    lineas.push('');
    lineas.push('═══════════════════════════════════════════════════════');

    return lineas.join('\n');
  }
}

export default new SistemaAprendizajeService();
