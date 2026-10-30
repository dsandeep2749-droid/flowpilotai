import { app } from './app.js';
import { config } from './config/index.js';
import { prisma } from './database/db.js';

const PORT = config.port || 5000;

const server = app.listen(PORT, async () => {
  console.log(`=========================================`);
  console.log(`  FlowPilot AI Backend Service Started   `);
  console.log(`  Listening on: http://localhost:${PORT}  `);
  console.log(`  Environment:  ${config.env}            `);
  console.log(`  AI Provider:  ${config.aiProvider}     `);
  console.log(`  Live AI Key:  ${config.geminiApiKey ? 'Configured' : 'Missing (Demo Mode)'}`);
  console.log(`=========================================`);

  try {
    await prisma.$connect();
    console.log('[Database] Connected successfully.');
  } catch (err) {
    console.error('[Database] Connection failed:', err);
  }
});

process.on('SIGTERM', async () => {
  console.log('[Server] SIGTERM received. Shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

