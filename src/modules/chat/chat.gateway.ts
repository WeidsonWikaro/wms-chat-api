import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import { getCorsOrigins } from '../../app.config';
import { ChatService } from './chat.service';

/**
 * Assistente WMS — Socket.IO namespace `/chat`.
 *
 * Handshake auth (Socket.IO v4+): `auth: { token: "<JWT>" }`.
 * Policy: invalid/expired JWT → disconnect immediately (no `chat:error`; no chat stream).
 *
 * Protocol: `chat_protocol_version` = 1 (see `chat.constants.ts`).
 *
 * Servidor → cliente (além dos já documentados): `chat:message_received`
 * `{ clientMessageId, conversationId, sentAt }` — hora oficial do servidor quando
 * a mensagem do utilizador é aceite (antes dos `chat:chunk` do assistente).
 */
@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: getCorsOrigins(),
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection {
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
  ) {}

  handleConnection(client: Socket): void {
    const raw = client.handshake.auth;
    const token =
      raw && typeof raw === 'object' && 'token' in raw
        ? (raw as { token?: unknown }).token
        : undefined;
    if (typeof token !== 'string' || !token.trim()) {
      this.logger.debug('Socket /chat: missing auth.token — disconnect');
      client.disconnect(true);
      return;
    }
    try {
      const payload = this.jwtService.verify<{ sub?: string }>(token);
      const sub = payload.sub;
      if (typeof sub !== 'string' || !sub.trim()) {
        this.logger.debug('Socket /chat: JWT without sub — disconnect');
        client.disconnect(true);
        return;
      }
      (client.data as { userId: string }).userId = sub;
      /**
       * Adiar a saudação para o próximo tick: se o cliente registar listeners
       * dentro de `socket.on('connect', ...)`, ainda não estavam ativos quando
       * `handleConnection` corria — os eventos eram perdidos.
       */
      setImmediate(() => {
        try {
          if (!client.connected) {
            return;
          }
          this.chatService.sendWelcomeAfterConnect(client, sub);
        } catch (err) {
          this.logger.error(err);
        }
      });
    } catch {
      this.logger.debug('Socket /chat: JWT invalid — disconnect');
      client.disconnect(true);
    }
  }

  @SubscribeMessage('chat:send')
  handleChatSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): void {
    try {
      this.chatService.handleChatSend(client, body);
    } catch (err) {
      this.logger.error(err);
      client.emit('chat:error', {
        code: 'INTERNAL_ERROR',
        message: 'Unexpected server error.',
        sentAt: new Date().toISOString(),
      });
    }
  }
}
