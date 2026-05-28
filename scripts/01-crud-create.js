// =============================================================================
// 01 - CRUD: CREATE (insertOne + insertMany)
// Uso:  mongosh "mongodb://localhost:27017/neocare" scripts/01-crud-create.js
// =============================================================================

print(">>> 01-crud-create.js");

const usuarioJoao = ObjectId("6651a1b2c3d4e5f600000001");
const dispJoao = ObjectId("6651a1b2c3d4e5f600000102");
const usuarioMaria = ObjectId("6651a1b2c3d4e5f600000002");
const dispMaria = ObjectId("6651a1b2c3d4e5f600000103");

// --- insertOne: nova medicao vital do Joao -----------------------------------
print("\n[insertOne] nova medicao vital do Joao");
const r1 = db.medicoes.insertOne({
    usuario_id: usuarioJoao,
    dispositivo_id: dispJoao,
    tipo_medicao: "VITAL",
    data_medicao: new Date(),
    vitais: {
        batimentos_por_minuto: 75,
        oxigenacao_sangue: 98.0,
        pressao_sistolica: 118,
        pressao_diastolica: 78,
    },
    usuario_snapshot: { nome: "João Silva", idade: 40 },
    metadata: { origem: "auto_sync", qualidade_sinal: 0.93 },
});
print("inserido _id = " + r1.insertedId);

// --- insertMany: lote de 3 medicoes de estresse da Maria ---------------------
print("\n[insertMany] 3 medicoes de estresse da Maria");
const r2 = db.medicoes.insertMany([
    {
        usuario_id: usuarioMaria,
        dispositivo_id: dispMaria,
        tipo_medicao: "ESTRESSE",
        data_medicao: ISODate("2026-05-25T08:00:00Z"),
        estresse: { variacao_frequencia_cardiaca: 28.5, condutividade_pele: 3.2 },
        usuario_snapshot: { nome: "Maria Souza", idade: 33 },
        metadata: { origem: "auto_sync", qualidade_sinal: 0.94 },
    },
    {
        usuario_id: usuarioMaria,
        dispositivo_id: dispMaria,
        tipo_medicao: "ESTRESSE",
        data_medicao: ISODate("2026-05-25T12:00:00Z"),
        estresse: { variacao_frequencia_cardiaca: 41.7, condutividade_pele: 6.5 },
        usuario_snapshot: { nome: "Maria Souza", idade: 33 },
        metadata: { origem: "auto_sync", qualidade_sinal: 0.91 },
    },
    {
        usuario_id: usuarioMaria,
        dispositivo_id: dispMaria,
        tipo_medicao: "ESTRESSE",
        data_medicao: ISODate("2026-05-25T18:30:00Z"),
        estresse: { variacao_frequencia_cardiaca: 55.0, condutividade_pele: 8.1 },
        usuario_snapshot: { nome: "Maria Souza", idade: 33 },
        metadata: { origem: "auto_sync", qualidade_sinal: 0.89 },
    },
]);
print("inseridos = " + r2.insertedIds.length + " documentos");

// --- total apos os inserts ---------------------------------------------------
print("\ntotal de medicoes apos insert: " + db.medicoes.countDocuments());

print("\n<<< 01 concluido");
