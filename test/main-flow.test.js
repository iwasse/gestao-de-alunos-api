import './setup.js';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import supertest from 'supertest';
import { expect } from 'chai';
import app from '../src/app.js';
import Aluno from '../src/models/aluno.model.js';
import Disciplina from '../src/models/disciplina.model.js';
import Matricula from '../src/models/matricula.model.js';
import Trabalho from '../src/models/trabalho.model.js';
import { loginAdmin, loginUsuario } from './helpers.js';

const testDataPath = path.resolve(process.cwd(), './test/fixtures/testData.json');
const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));

const request = supertest(app);

describe('Fluxo Principal da API', () => {
  const cenarios = testData.cenarios;

  cenarios.forEach((cenario) => {
    describe(`${cenario.descricao}`, () => {
      let adminToken;
      let alunoToken;
      let alunoId;
      let disciplinaId;
      let trabalhoId;

      before(async () => {
        // Limpeza prévia para garantir idempotência do teste
        await Aluno.deleteMany({
          $or: [{ email: cenario.aluno.email }, { matricula: cenario.aluno.matricula }],
        });
        await Disciplina.deleteMany({ codigo: cenario.disciplina.codigo });
      });

      after(async () => {
        // Limpeza dos registros gerados durante a execução do cenário
        if (trabalhoId) await Trabalho.findByIdAndDelete(trabalhoId);
        if (alunoId && disciplinaId) await Matricula.deleteMany({ alunoId, disciplinaId });
        if (disciplinaId) await Disciplina.findByIdAndDelete(disciplinaId);
        if (alunoId) await Aluno.findByIdAndDelete(alunoId);
      });

      it('1. Deve realizar login como administrador', async () => {
        adminToken = await loginAdmin(testData.admin);
        expect(adminToken).to.be.a('string');
        expect(adminToken.length).to.be.greaterThan(0);
      });

      it('2. Deve cadastrar uma disciplina como administrador', async () => {
        const res = await request
          .post('/api/admin/disciplinas')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(cenario.disciplina);

        expect(res.status).to.equal(201);
        expect(res.body).to.have.property('id');
        expect(res.body.codigo).to.equal(cenario.disciplina.codigo);
        disciplinaId = res.body.id;
      });

      it('3. Deve cadastrar um aluno com sucesso como administrador', async () => {
        const res = await request
          .post('/api/admin/alunos')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(cenario.aluno);

        expect(res.status).to.equal(201);
        expect(res.body).to.have.property('id');
        expect(res.body.email).to.equal(cenario.aluno.email);
        expect(res.body.matricula).to.equal(cenario.aluno.matricula);
        alunoId = res.body.id;
      });

      it('4. Deve matricular o aluno na disciplina', async () => {
        const res = await request
          .post(`/api/admin/disciplinas/${disciplinaId}/matriculas`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ alunoId });

        expect(res.status).to.equal(201);
        expect(res.body).to.have.property('id');
        expect(res.body.alunoId).to.equal(alunoId);
        expect(res.body.disciplinaId).to.equal(disciplinaId);
      });

      it('5. Deve realizar login como aluno', async () => {
        alunoToken = await loginUsuario({
          email: cenario.aluno.email,
          senha: cenario.aluno.senha,
        });

        expect(alunoToken).to.be.a('string');
        expect(alunoToken.length).to.be.greaterThan(0);
      });

      it('6. Deve registrar a entrega de um trabalho como aluno', async () => {
        const res = await request
          .post(`/api/alunos/${alunoId}/trabalhos`)
          .set('Authorization', `Bearer ${alunoToken}`)
          .send({
            disciplinaId,
            titulo: cenario.trabalho.titulo,
            descricao: cenario.trabalho.descricao,
          });

        expect(res.status).to.equal(201);
        expect(res.body).to.have.property('id');
        expect(res.body.alunoId).to.equal(alunoId);
        expect(res.body.disciplinaId).to.equal(disciplinaId);
        expect(res.body.titulo).to.equal(cenario.trabalho.titulo);
        expect(res.body.status).to.equal('entregue');
        trabalhoId = res.body.id;
      });
    });
  });
});
