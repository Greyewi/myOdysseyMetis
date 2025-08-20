import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

class SocketService {
  private io: Server | null = null;

  initialize(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: ['http://localhost:4200', 'http://localhost:3000', 'https://myodyssey.me'],
        credentials: true
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`[${new Date().toISOString()}] Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`[${new Date().toISOString()}] Client disconnected: ${socket.id}`);
      });
    });

    console.log('Socket.IO server initialized');
  }

  notifyBalanceChange(walletId: number, balance: string) {
    if (!this.io) {
      console.error('Socket.IO server not initialized');
      return;
    }

    this.io.emit('balance-change', {
      walletId,
      balance,
      timestamp: new Date().toISOString()
    });
  }

  notifyRefundCompleted(userId: number, goalId: number, summary: any) {
    if (!this.io) {
      console.error('Socket.IO server not initialized');
      return;
    }

    this.io.emit('refund-completed', {
      userId,
      goalId,
      summary,
      timestamp: new Date().toISOString()
    });
  }
}

// Create a singleton instance
export const socketService = new SocketService(); 