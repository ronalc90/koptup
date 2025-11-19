import mongoose from 'mongoose';
import { seedCUPS } from './cups.seed';
import { seedCIE10 } from './cie10.seed';
import { seedTarifarios } from './tarifarios.seed';
import { seedReglasAuditoria } from './reglas-auditoria.seed';
import { seedProjects } from './projects.seed';

export async function runAllSeeds() {
  try {
    console.log('🚀 Iniciando proceso de seeds...\n');

    await seedCUPS();
    await seedCIE10();
    await seedTarifarios();
    await seedReglasAuditoria();
    await seedProjects();

    console.log('\n✅ Todos los seeds completados exitosamente!');
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
