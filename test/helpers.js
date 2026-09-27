import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import supertest from 'supertest';
import app from '../src/app.js';

const testDataPath = path.resolve(process.cwd(), './test/fixtures/testData.json');
const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));

const request = supertest(app);

/**
 * Helper para realizar login como administrador.
 * @param {Object} [credentials] - Objeto com email e senha do admin.
 * @returns {Promise<string>} Token JWT retornado pela API.
 */
export const loginAdmin = async (credentials = testData.admin) => {
  const res = await request.post('/api/auth/login').send({
    email: credentials.email,
    senha: credentials.senha,
  });
  return res.body.token;
};

/**
 * Helper para realizar login como usuário / aluno.
 * @param {Object} [credentials] - Objeto com email e senha do usuário.
 * @returns {Promise<string>} Token JWT retornado pela API.
 */
export const loginUsuario = async (credentials = testData.aluno) => {
  const res = await request.post('/api/auth/login').send({
    email: credentials.email,
    senha: credentials.senha,
  });
  return res.body.token;
};

// Alias para permitir o uso de loginAluno ou loginUsuario de forma intercambiável
export const loginAluno = loginUsuario;

export default {
  loginAdmin,
  loginUsuario,
  loginAluno,
};
