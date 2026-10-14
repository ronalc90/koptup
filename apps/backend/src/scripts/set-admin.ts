import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User';
import { connectDB } from '../config/mongodb';
import { recordSystemRoleChange } from '../services/admin-bootstrap.service';

/**
 * Da el rol admin a una cuenta existente, por email.
 *
 * Uso (desde apps/backend): npx ts-node --transpile-only src/scripts/set-admin.ts <email>
 *
 * Lee `apps/backend/.env` (dotenv) para MONGODB_URI; una variable definida en
 * la terminal (o inyectada por `railway run`) tiene prioridad sobre el .env.
 * El cambio queda en la bitácora (AuditLog, `user.role_change`, origen
 * `set-admin`). Sale con código 1 si la cuenta no existe o la base no conecta.
 */
const setAdmin = async () => {
  try {
    const email = (process.argv[2] || process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    if (!email) {
      console.error('Uso: npx ts-node --transpile-only src/scripts/set-admin.ts <email> (o define ADMIN_EMAIL)');
      process.exit(1);
    }
    if (!process.env.MONGODB_URI) {
      console.error('Falta MONGODB_URI: defínela en apps/backend/.env, en la terminal o usa `railway run`.');
      process.exit(1);
    }

    console.log(`Asignando el rol admin a: ${email}`);
    await connectDB();
    if (mongoose.connection.readyState !== 1) {
      console.error('No se pudo conectar a MongoDB con MONGODB_URI.');
      process.exit(1);
    }

    const before = await User.findOne({ email }).select('role').lean();
    if (!before) {
      console.error(`No existe ninguna cuenta con el email ${email}. La persona debe registrarse (o activar su cuenta) primero.`);
      process.exit(1);
    }

    const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
    if (!user) {
      console.error(`No existe ninguna cuenta con el email ${email}.`);
      process.exit(1);
    }

    if (before.role !== 'admin') {
      await recordSystemRoleChange({ userId: String(user._id), email: user.email, antes: before.role, despues: 'admin', origen: 'set-admin' });
      console.log(`Listo: ${email} ahora es admin (antes: ${before.role}). El cambio quedó en la bitácora.`);
    } else {
      console.log(`${email} ya era admin; no se cambió nada.`);
    }
    console.log('La persona debe cerrar sesión y volver a entrar para ver el panel.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error asignando el rol admin:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
};

// Execute if called directly
if (require.main === module) {
  setAdmin();
}

export default setAdmin;
