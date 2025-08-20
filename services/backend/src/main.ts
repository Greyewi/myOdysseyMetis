import express, { Express } from 'express';
import cors from 'cors';
import * as path from 'path';
import { createServer } from 'http';
import goalRoutes from './routes/goals.js'
import userRoutes from "./routes/user.js";
import tasksRoutes from "./routes/tasks.js";
import priceCacheRoutes from "./routes/priceCache.js";
import publicGoalsRoutes from "./routes/publicGoals";
import session from "express-session";
import { errorHandler } from './middlewares/error.js';
import { initializeJobs } from './jobs/index';
import { queueService } from './services/queue.service';
import { socketService } from './services/socket.service';

const app: Express = express();
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:3000', 'https://myodyssey.me', 'https://app.myodyssey.me'],
  credentials: true,
}))
app.use(express.json()); // Parse JSON requests
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'I()ro!!n !!&! Se%&c@ret blabl&%#abla 7916 k@ey',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use("/users", userRoutes);
app.use('/goals', goalRoutes);
app.use('/public-goals', publicGoalsRoutes);
app.use('/tasks', tasksRoutes);
app.use('/api', priceCacheRoutes);

app.get('/', (_, res) => {
  res.send({ message: 'Welcome to backend!' });
});

app.use(errorHandler);

const port = Number(process.env.PORT) || 3333;

// Initialize queue service and jobs before starting the server
async function startServer() {
  try {
    await queueService.initialize();
    console.log('Queue service initialized successfully');
    await initializeJobs();
    console.log('Background jobs initialized successfully');
    const httpServer = createServer(app);
    socketService.initialize(httpServer);
    console.log('Socket.IO server initialized successfully');
    // Start the server
    httpServer.listen(port, () => {
      console.log(`Listening on [::]:${port}`);
    });

    httpServer.on('error', console.error);

    const { MetisBlockIndexerService } = await import('./services/contract');
    const LAZCHAIN_ADDRESS = '0x9001F31c94d4bf96D30f05467aEB09686EF945c1';
    const METIS_RPC = 'https://hyperion-testnet.metisdevops.link';
    const indexer = new MetisBlockIndexerService({
      url: METIS_RPC, 
      contractAddress: LAZCHAIN_ADDRESS,
      pollInterval: 5000,
    });

    // Set up default event handlers for goal status updates
    indexer.setupDefaultEventHandlers();
    
    await indexer.start();


  } catch (error) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

startServer();

export default app;
