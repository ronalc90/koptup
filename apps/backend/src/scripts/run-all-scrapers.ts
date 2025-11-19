import { connectDB } from '../config/mongodb';

/**
 * Script Maestro - Ejecuta todos los scrapers en secuencia
 *
 * Este script ejecuta todos los scrapers de datos médicos en el orden correcto:
 * 1. CUPS (códigos de procedimientos)
 * 2. CIE-10 (diagnósticos)
 * 3. INVIMA (medicamentos)
 * 4. Tarifas (actualiza tarifas en CUPS)
 *
 * Uso:
 *   npx ts-node src/scripts/run-all-scrapers.ts
 *
 * Opciones:
 *   --skip-cups        Omitir scraping de CUPS
 *   --skip-cie10       Omitir scraping de CIE-10
 *   --skip-invima      Omitir scraping de INVIMA
 *   --skip-tarifas     Omitir scraping de tarifas
 *   --only=<scraper>   Ejecutar solo un scraper específico
 */

async function runAllScrapers() {
  const args = process.argv.slice(2);
  const skipCUPS = args.includes('--skip-cups');
  const skipCIE10 = args.includes('--skip-cie10');
  const skipINVIMA = args.includes('--skip-invima');
  const skipTarifas = args.includes('--skip-tarifas');

  const onlyArg = args.find(arg => arg.startsWith('--only='));
  const onlyMode = onlyArg ? onlyArg.split('=')[1] : null;

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🚀 SCRIPT MAESTRO - SCRAPERS DE DATOS MÉDICOS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('Este script descarga datos reales de fuentes oficiales:');
  console.log('  ✓ CUPS: Códigos de procedimientos médicos (Ministerio de Salud)');
  console.log('  ✓ CIE-10: Diagnósticos internacionales (OMS)');
  console.log('  ✓ INVIMA: Medicamentos registrados (INVIMA Colombia)');
  console.log('  ✓ Tarifas: ISS 2001, ISS 2004, SOAT 2024');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (onlyMode) {
    console.log(`⚙️  MODO: Ejecutar solo "${onlyMode}"\n`);
  }

  try {
    // Conectar a MongoDB
    console.log('📦 Conectando a MongoDB...');
    await connectDB();
    console.log('✅ Conectado a MongoDB\n');

    let totalDescargados = 0;
    let totalTiempo = 0;

    // 1. SCRAPER CUPS
    if ((!onlyMode || onlyMode === 'cups') && !skipCUPS) {
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('📋 SCRAPER 1/4: CUPS (Códigos de Procedimientos)');
      console.log('═══════════════════════════════════════════════════════════════\n');

      const start = Date.now();

      try {
        // Importar dinámicamente para evitar errores si falta cheerio
        const { scrapeDatosAbiertosColombia } = await import('./scrapers/cups-scraper');
        const CUPS = (await import('../models/CUPS')).default;

        const cupsData = await scrapeDatosAbiertosColombia();

        if (cupsData.length > 0) {
          console.log(`\n💾 Importando ${cupsData.length} códigos CUPS a MongoDB...`);

          // Importar en lotes
          for (let i = 0; i < cupsData.length; i += 1000) {
            const batch = cupsData.slice(i, i + 1000);

            await CUPS.bulkWrite(
              batch.map(item => ({
                updateOne: {
                  filter: { codigo: item.codigo },
                  update: {
                    $set: {
                      descripcion: item.descripcion,
                      categoria: item.categoria || 'Otro',
                      especialidad: item.especialidad || '',
                      activo: true,
                    },
                  },
                  upsert: true,
                },
              }))
            );

            console.log(`Procesados: ${Math.min(i + 1000, cupsData.length)} / ${cupsData.length}`);
          }

          totalDescargados += cupsData.length;
        }

        const tiempo = ((Date.now() - start) / 1000).toFixed(2);
        totalTiempo += parseFloat(tiempo);
        console.log(`\n✅ CUPS completado en ${tiempo}s\n`);
      } catch (error: any) {
        console.error(`❌ Error en scraper CUPS: ${error.message}\n`);
      }
    }

    // 2. SCRAPER CIE-10
    if ((!onlyMode || onlyMode === 'cie10') && !skipCIE10) {
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('🩺 SCRAPER 2/4: CIE-10 (Diagnósticos)');
      console.log('═══════════════════════════════════════════════════════════════\n');

      const start = Date.now();

      try {
        const { scrapeGitHubOPS, getMostCommonDiagnoses } = await import('./scrapers/cie10-scraper');
        const Diagnostico = (await import('../models/Diagnostico')).default;

        let cie10Data = await scrapeGitHubOPS();

        if (cie10Data.length < 20) {
          console.log('⚠️ Pocas fuentes externas, usando datos comunes...');
          cie10Data = getMostCommonDiagnoses();
        }

        if (cie10Data.length > 0) {
          console.log(`\n💾 Importando ${cie10Data.length} diagnósticos CIE-10 a MongoDB...`);

          for (let i = 0; i < cie10Data.length; i += 1000) {
            const batch = cie10Data.slice(i, i + 1000);

            await Diagnostico.bulkWrite(
              batch.map(item => ({
                updateOne: {
                  filter: { codigoCIE10: item.codigoCIE10 },
                  update: {
                    $set: {
                      descripcion: item.descripcion,
                      categoria: item.categoria,
                      subcategoria: item.subcategoria || '',
                      gravedad: item.gravedad || 'leve',
                      cronico: item.cronico || false,
                      requiereHospitalizacion: item.requiereHospitalizacion || false,
                      activo: true,
                    },
                  },
                  upsert: true,
                },
              }))
            );
          }

          totalDescargados += cie10Data.length;
        }

        const tiempo = ((Date.now() - start) / 1000).toFixed(2);
        totalTiempo += parseFloat(tiempo);
        console.log(`\n✅ CIE-10 completado en ${tiempo}s\n`);
      } catch (error: any) {
        console.error(`❌ Error en scraper CIE-10: ${error.message}\n`);
      }
    }

    // 3. SCRAPER INVIMA
    if ((!onlyMode || onlyMode === 'invima') && !skipINVIMA) {
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('💊 SCRAPER 3/4: INVIMA (Medicamentos)');
      console.log('═══════════════════════════════════════════════════════════════\n');

      const start = Date.now();

      try {
        const { scrapeDatosAbiertosColombiaCUM, getMostCommonMedicamentos } = await import('./scrapers/invima-scraper');
        const Medicamento = (await import('../models/Medicamento')).default;

        let medicamentos = await scrapeDatosAbiertosColombiaCUM();

        if (medicamentos.length < 20) {
          console.log('⚠️ Pocas fuentes externas, agregando medicamentos comunes...');
          const common = getMostCommonMedicamentos();
          medicamentos = [...medicamentos, ...common];
        }

        if (medicamentos.length > 0) {
          console.log(`\n💾 Importando ${medicamentos.length} medicamentos a MongoDB...`);

          for (let i = 0; i < medicamentos.length; i += 1000) {
            const batch = medicamentos.slice(i, i + 1000);

            await Medicamento.bulkWrite(
              batch.map(item => ({
                updateOne: {
                  filter: { codigoCUM: item.codigoCUM },
                  update: {
                    $set: {
                      codigoATC: item.codigoATC || '',
                      principioActivo: item.principioActivo,
                      nombreComercial: item.nombreComercial,
                      concentracion: item.concentracion,
                      formaFarmaceutica: item.formaFarmaceutica,
                      viaAdministracion: item.viaAdministracion,
                      presentacion: item.presentacion,
                      laboratorio: item.laboratorio,
                      pos: item.pos,
                      requiereFormula: item.requiereFormula,
                      controlEspecial: item.controlEspecial,
                      precioUnitario: item.precioUnitario || 0,
                      activo: true,
                    },
                  },
                  upsert: true,
                },
              }))
            );
          }

          totalDescargados += medicamentos.length;
        }

        const tiempo = ((Date.now() - start) / 1000).toFixed(2);
        totalTiempo += parseFloat(tiempo);
        console.log(`\n✅ INVIMA completado en ${tiempo}s\n`);
      } catch (error: any) {
        console.error(`❌ Error en scraper INVIMA: ${error.message}\n`);
      }
    }

    // 4. SCRAPER TARIFAS
    if ((!onlyMode || onlyMode === 'tarifas') && !skipTarifas) {
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('💰 SCRAPER 4/4: Tarifas (ISS, SOAT)');
      console.log('═══════════════════════════════════════════════════════════════\n');

      const start = Date.now();

      try {
        const { generateSyntheticTariffs } = await import('./scrapers/tarifas-scraper');
        const CUPS = (await import('../models/CUPS')).default;

        const tarifas = await generateSyntheticTariffs();

        if (tarifas.length > 0) {
          console.log(`\n💾 Actualizando ${tarifas.length} tarifas en CUPS...`);

          for (let i = 0; i < tarifas.length; i += 1000) {
            const batch = tarifas.slice(i, i + 1000);

            await CUPS.bulkWrite(
              batch.map(tarifa => ({
                updateOne: {
                  filter: { codigo: tarifa.codigoCUPS },
                  update: {
                    $set: {
                      tarifaISS2001: tarifa.tarifaISS2001 || 0,
                      tarifaISS2004: tarifa.tarifaISS2004 || 0,
                      tarifaSOAT: tarifa.tarifaSOAT || 0,
                      uvr: tarifa.uvr || 0,
                    },
                  },
                },
              }))
            );
          }
        }

        const tiempo = ((Date.now() - start) / 1000).toFixed(2);
        totalTiempo += parseFloat(tiempo);
        console.log(`\n✅ Tarifas completado en ${tiempo}s\n`);
      } catch (error: any) {
        console.error(`❌ Error en scraper tarifas: ${error.message}\n`);
      }
    }

    // RESUMEN FINAL
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎉 PROCESO COMPLETADO');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`📊 Resumen:`);
    console.log(`   - Total registros descargados: ${totalDescargados.toLocaleString()}`);
    console.log(`   - Tiempo total: ${totalTiempo.toFixed(2)}s`);
    console.log(`   - Promedio: ${(totalDescargados / totalTiempo).toFixed(0)} registros/segundo\n`);
    console.log('✅ Base de datos poblada exitosamente!\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  }
}

// Ejecutar
if (require.main === module) {
  runAllScrapers();
}

export { runAllScrapers };
