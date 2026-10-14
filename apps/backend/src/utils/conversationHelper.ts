import Conversation from '../models/Conversation';
import Message from '../models/Message';
import User from '../models/User';
import mongoose from 'mongoose';

/**
 * Crea una conversación automática entre cliente y administrador para un pedido
 */
export async function createOrderConversation(
  orderId: string,
  orderName: string,
  userId: mongoose.Types.ObjectId,
  orderAmount: number,
  orderItems: Array<{ name: string; quantity: number; price: number }>
): Promise<mongoose.Types.ObjectId> {
  try {
    // Obtener información del cliente
    const client = await User.findById(userId).select('name email').lean();
    if (!client) {
      throw new Error('Cliente no encontrado');
    }

    // Crear la conversación
    const conversation = new Conversation({
      title: `Pedido ${orderId}: ${orderName}`,
      orderId: new mongoose.Types.ObjectId(orderId),
      participants: [
        {
          userId,
          name: client.name,
          email: client.email,
          role: 'client',
        },
        {
          name: 'Administración KopTup',
          email: 'admin@koptup.com',
          role: 'admin',
        },
      ],
      status: 'active',
      unreadCount: new Map(),
    });

    await conversation.save();

    // Crear mensaje inicial automático
    const itemsList = orderItems
      .map((item) => `- ${item.name} (x${item.quantity}): $${item.price * item.quantity}`)
      .join('\n');

    const initialMessage = new Message({
      conversationId: conversation._id,
      sender: userId,
      senderName: client.name,
      senderRole: 'client',
      content: `¡Hola! He creado un nuevo pedido.\n\n📦 **Detalles del pedido:**\n${itemsList}\n\n💰 **Total:** $${orderAmount}\n\nQuedo atento a su revisión y aprobación.`,
      type: 'text',
      readBy: [{ userId, readAt: new Date() }],
    });

    await initialMessage.save();

    // Actualizar lastMessage en la conversación
    conversation.lastMessage = {
      text: initialMessage.content,
      sender: userId,
      senderName: client.name,
      timestamp: new Date(),
    };
    await conversation.save();

    return conversation._id;
  } catch (error) {
    console.error('Error creating order conversation:', error);
    throw error;
  }
}

/**
 * Envía un mensaje automático cuando un pedido es aprobado o rechazado
 */
export async function sendOrderStatusMessage(
  conversationId: mongoose.Types.ObjectId,
  orderId: string,
  approvalStatus: 'approved' | 'rejected',
  reason?: string
): Promise<void> {
  try {
    let content = '';
    if (approvalStatus === 'approved') {
      content = `✅ **Pedido ${orderId} aprobado**\n\nTu pedido ha sido aprobado y será procesado próximamente. Te mantendremos informado sobre el progreso.`;
    } else {
      content = `❌ **Pedido ${orderId} rechazado**\n\nLamentamos informarte que tu pedido ha sido rechazado.\n\n${reason ? `**Motivo:** ${reason}` : 'Por favor, contáctanos para más información.'}`;
    }

    const message = new Message({
      conversationId,
      senderName: 'Sistema KopTup',
      senderRole: 'admin',
      content,
      type: 'text',
      readBy: [],
    });

    await message.save();

    // Actualizar lastMessage en la conversación
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: {
        text: content,
        sender: null as any,
        senderName: 'Sistema KopTup',
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error sending order status message:', error);
    throw error;
  }
}
