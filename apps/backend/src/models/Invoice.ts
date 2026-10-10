import mongoose, { Schema, Document } from 'mongoose';
import { nextSequentialId } from '../utils/sequence';
import { businessYear } from '../utils/dates';

export interface IInvoice extends Document {
  invoiceNumber: string;
  /** Proyecto del cliente (opcional: una factura puede salir de un pedido sin proyecto). */
  projectId?: mongoose.Types.ObjectId | null;
  orderId?: mongoose.Types.ObjectId;
  /** Cliente dueño de la factura (la ve en su portal). Nunca el miembro del equipo que la emite. */
  userId: mongoose.Types.ObjectId;
  /** Miembro del equipo que la emitió. */
  createdBy?: mongoose.Types.ObjectId | null;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  clientInfo: {
    name: string;
    email: string;
    company?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
  terms?: string;
  history: Array<{
    date: Date;
    action: string;
    description: string;
    amount?: number;
    updatedBy?: mongoose.Types.ObjectId;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema: Schema = new Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'paid', 'overdue', 'cancelled'],
      default: 'pending',
    },
    issueDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paidDate: {
      type: Date,
    },
    clientInfo: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      company: { type: String },
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
      },
    },
    items: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    taxRate: {
      type: Number,
      default: 0.19,
      min: 0,
      max: 1,
    },
    taxAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    paymentMethod: {
      type: String,
    },
    transactionId: {
      type: String,
    },
    notes: {
      type: String,
    },
    terms: {
      type: String,
      default: 'Pago neto a 15 días. Penalización por mora del 2% mensual.',
    },
    history: [
      {
        date: { type: Date, default: Date.now },
        action: { type: String, required: true },
        description: { type: String, required: true },
        amount: { type: Number },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Número de factura (FAC-AAAA-0001): se asigna ANTES de validar (el campo es
// obligatorio) con un contador atómico por año (utils/sequence.ts).
InvoiceSchema.pre('validate', async function () {
  if (!this.invoiceNumber) {
    const year = businessYear((this.issueDate as Date) ?? new Date());
    this.invoiceNumber = await nextSequentialId({ model: 'Invoice', field: 'invoiceNumber', key: `invoice:${year}`, prefix: `FAC-${year}-`, pad: 4 });
  }
});

export default mongoose.model<IInvoice>('Invoice', InvoiceSchema);
