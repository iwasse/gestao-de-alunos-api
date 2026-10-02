import 'dotenv/config';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer;

// Em testes locais, inicializa o banco em memória para não depender de MongoDB externo rodando.
// No CI (GitHub Actions), utiliza o serviço do MongoDB configurado se MONGODB_URI e CI existirem.
const shouldStartMemoryServer = !process.env.USE_REAL_DB && (!process.env.CI || !process.env.MONGODB_URI);

if (shouldStartMemoryServer) {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  console.log(`[test-setup] MongoMemoryServer iniciado em: ${process.env.MONGODB_URI}`);
} else {
  console.log(`[test-setup] Utilizando MONGODB_URI do ambiente: ${process.env.MONGODB_URI}`);
}

export const mochaHooks = {
  async afterAll() {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
      console.log('[test-setup] MongoMemoryServer finalizado com sucesso.');
    }
  },
};
