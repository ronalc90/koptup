import mongoose, { Document, Schema, Types } from 'mongoose';
import { DEMO_ACCESS_MODES, DEFAULT_GRANT_DAYS, MAX_GRANT_DAYS, MIN_GRANT_DAYS } from '../config/demos';
import type { DemoAccessMode } from '../middleware/access';

/**
 * Una entrada por cada ruta /demo/<slug> de la web (28 en la semilla).
 * `accessMode` y `activo` se cambian desde Admin › Catálogo de demos sin
 * desplegar; la semilla (services/demo-catalog.service.ts) solo inserta las
 * que faltan y nunca pisa esos cambios.
 */
export interface IDemoCatalogItem extends Document {
  slug: string;
  nombre: string;
  nombreEn?: string;
  accessMode: DemoAccessMode;
  activo: boolean;
  duracionDiasPorDefecto: number;
  orden: number;
  actualizadoPor?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DemoCatalogItemSchema = new Schema<IDemoCatalogItem>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9-]{2,60}$/ },
    nombre: { type: String, required: true, trim: true, maxlength: 120 },
    nombreEn: { type: String, trim: true, maxlength: 120 },
    accessMode: { type: String, enum: [...DEMO_ACCESS_MODES], required: true },
    activo: { type: Boolean, default: true },
    duracionDiasPorDefecto: { type: Number, default: DEFAULT_GRANT_DAYS, min: MIN_GRANT_DAYS, max: MAX_GRANT_DAYS },
    orden: { type: Number, default: 0 },
    actualizadoPor: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

DemoCatalogItemSchema.index({ orden: 1 });

export default mongoose.model<IDemoCatalogItem>('DemoCatalogItem', DemoCatalogItemSchema);
