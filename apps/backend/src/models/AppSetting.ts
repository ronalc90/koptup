import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * Configuración editable desde el panel, guardada en MongoDB por clave
 * (p. ej. `commerce`: instrucciones de transferencia y % de anticipo por
 * defecto). La valida y la lee services/commerce-settings.service.ts.
 */
export interface IAppSetting extends Document {
  clave: string;
  valor: Record<string, unknown>;
  actualizadoPor?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const AppSettingSchema = new Schema<IAppSetting>(
  {
    clave: { type: String, required: true, unique: true, trim: true, maxlength: 80 },
    valor: { type: Schema.Types.Mixed, default: {} },
    actualizadoPor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, minimize: false },
);

export default mongoose.model<IAppSetting>('AppSetting', AppSettingSchema);
