import mongoose from 'mongoose';
import Tarifario from '../models/Tarifario';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

async function seedTarifario() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe un tarifario
    const existing = await Tarifario.findOne({ tipo: 'ISS' });
    if (existing) {
      console.log('⚠️ Ya existe un tarifario ISS, eliminando...');
      await Tarifario.deleteMany({ tipo: 'ISS' });
    }

    // Crear tarifario ISS 2001 con códigos CUPS comunes
    const tarifario = new Tarifario({
      nombre: 'ISS 2001 - Tarifario Base',
      tipo: 'ISS',
      vigenciaInicio: new Date('2001-01-01'),
      eps: '800000000-1', // EPS Demo
      activo: true,
      items: [
        // Consultas
        { codigoCUPS: '890201', valor: 25000, observaciones: 'Consulta de primera vez por medicina general' },
        { codigoCUPS: '890202', valor: 20000, observaciones: 'Consulta de control por medicina general' },
        { codigoCUPS: '890203', valor: 35000, observaciones: 'Consulta de primera vez por especialista' },
        { codigoCUPS: '890204', valor: 30000, observaciones: 'Consulta de control por especialista' },

        // Procedimientos comunes
        { codigoCUPS: '890301', valor: 15000, observaciones: 'Aplicación de medicamento intramuscular' },
        { codigoCUPS: '890302', valor: 20000, observaciones: 'Aplicación de medicamento endovenoso' },
        { codigoCUPS: '890801', valor: 80000, observaciones: 'Electrocardiograma' },
        { codigoCUPS: '890802', valor: 120000, observaciones: 'Radiografía de tórax' },

        // Laboratorio
        { codigoCUPS: '902210', valor: 12000, observaciones: 'Hemograma completo' },
        { codigoCUPS: '902211', valor: 8000, observaciones: 'Glicemia' },
        { codigoCUPS: '902212', valor: 15000, observaciones: 'Perfil lipídico' },
        { codigoCUPS: '902213', valor: 10000, observaciones: 'Creatinina' },

        // Urgencias
        { codigoCUPS: '890601', valor: 50000, observaciones: 'Atención de urgencias - Triage I' },
        { codigoCUPS: '890602', valor: 40000, observaciones: 'Atención de urgencias - Triage II' },
        { codigoCUPS: '890603', valor: 35000, observaciones: 'Atención de urgencias - Triage III' },

        // Hospitalización
        { codigoCUPS: '891201', valor: 150000, observaciones: 'Día cama hospitalización general' },
        { codigoCUPS: '891202', valor: 300000, observaciones: 'Día cama UCI' },

        // Imágenes diagnósticas
        { codigoCUPS: '871101', valor: 200000, observaciones: 'Ecografía abdominal' },
        { codigoCUPS: '871102', valor: 150000, observaciones: 'Ecografía pélvica' },
        { codigoCUPS: '871103', valor: 500000, observaciones: 'TAC simple' },
        { codigoCUPS: '871104', valor: 800000, observaciones: 'Resonancia magnética' },

        // Procedimientos quirúrgicos menores
        { codigoCUPS: '851101', valor: 100000, observaciones: 'Sutura simple' },
        { codigoCUPS: '851102', valor: 150000, observaciones: 'Curación de herida' },
        { codigoCUPS: '851103', valor: 200000, observaciones: 'Drenaje de absceso' },
      ],
    });

    await tarifario.save();
    console.log('✅ Tarifario ISS 2001 creado exitosamente');
    console.log(`   - ${tarifario.items.length} códigos CUPS incluidos`);

    // Crear también un tarifario genérico para todas las EPS
    const tarifarioGenerico = new Tarifario({
      nombre: 'Tarifario General - Todas las EPS',
      tipo: 'Personalizado',
      vigenciaInicio: new Date('2020-01-01'),
      activo: true,
      items: tarifario.items, // Usar los mismos códigos
    });

    await tarifarioGenerico.save();
    console.log('✅ Tarifario genérico creado exitosamente');

    console.log('\n✅ Proceso completado exitosamente');
  } catch (error) {
    console.error('❌ Error al crear tarifario:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
  }
}

seedTarifario();
