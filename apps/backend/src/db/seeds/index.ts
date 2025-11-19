import mongoose from 'mongoose';
import { seedCUPS } from './cups.seed';
import { seedCIE10 } from './cie10.seed';
import { seedTarifarios } from './tarifarios.seed';
import { seedReglasAuditoria } from './reglas-auditoria.seed';
import { seedConvenios } from './convenios.seed';
import { seedCuotasModeradoras } from './cuotas-moderadoras.seed';
import { seedEPS } from './eps.seed';
import { seedIPS } from './ips.seed';
import { seedAutorizaciones } from './autorizaciones.seed';

export async function runAllSeeds() {
  try {
    console.log('🚀 Iniciando proceso de seeds...\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  SEEDS DEL SISTEMA DE AUDITORÍA MÉDICA');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Datos médicos básicos
    console.log('📋 FASE 1: Datos Médicos Básicos');
    console.log('─────────────────────────────────────');
    await seedCUPS();
    await seedCIE10();

    // Tarifarios y reglas
    console.log('\n💰 FASE 2: Tarifarios y Reglas');
    console.log('─────────────────────────────────────');
    await seedTarifarios();
    await seedReglasAuditoria();

    // Entidades (EPS e IPS)
    console.log('\n🏥 FASE 3: Entidades (EPS e IPS)');
    console.log('─────────────────────────────────────');
    await seedEPS();
    await seedIPS();

    // Convenios y cuotas
    console.log('\n📝 FASE 4: Convenios y Cuotas');
    console.log('─────────────────────────────────────');
    await seedConvenios();
    await seedCuotasModeradoras();

    // Autorizaciones de ejemplo
    console.log('\n✅ FASE 5: Autorizaciones de Ejemplo');
    console.log('─────────────────────────────────────');
    await seedAutorizaciones();

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ TODOS LOS SEEDS COMPLETADOS EXITOSAMENTE!');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📊 Resumen:');
    console.log('   - CUPS: 16 códigos de ejemplo');
    console.log('   - CIE-10: 24 diagnósticos');
    console.log('   - Tarifarios: 5 tarifarios');
    console.log('   - Reglas de Auditoría: 9 reglas');
    console.log('   - EPS: 6 entidades');
    console.log('   - IPS: 3 instituciones');
    console.log('   - Convenios: 6 convenios');
    console.log('   - Cuotas Moderadoras: ~18 cuotas');
    console.log('   - Autorizaciones: 5 ejemplos\n');
  } catch (error) {
    console.error('\n❌ Error ejecutando seeds:', error);
    throw error;
  }
}

// Script ejecutable
if (require.main === module) {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/koptup';

  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      console.log('📦 Conectado a MongoDB');
      return runAllSeeds();
    })
    .then(() => {
      console.log('🎉 Seeds ejecutados correctamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error:', error);
      process.exit(1);
    });
}
