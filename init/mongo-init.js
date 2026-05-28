// =============================================================================
// NeoCare - Bootstrap automatico do MongoDB
// Executado UMA UNICA VEZ na primeira subida do container (volume vazio).
// Cria 4 collections e insere os 10 documentos do seed.
// =============================================================================

const dbName = "neocare";
db = db.getSiblingDB(dbName);

print("=== NeoCare init: criando collections e seed ===");

// -----------------------------------------------------------------------------
// 1) Limpa estado anterior (idempotente)
// -----------------------------------------------------------------------------
["usuarios", "dispositivos", "medicoes", "alertas"].forEach((c) => {
    if (db.getCollectionNames().includes(c)) {
        db[c].drop();
        print("dropped collection: " + c);
    }
});

// -----------------------------------------------------------------------------
// 2) Cria collections
// -----------------------------------------------------------------------------
db.createCollection("usuarios");
db.createCollection("dispositivos");
db.createCollection("medicoes");
db.createCollection("alertas");

// -----------------------------------------------------------------------------
// 3) Seed - IDs fixos para garantir referencias consistentes entre collections
// -----------------------------------------------------------------------------
const ID = {
    joao: ObjectId("6651a1b2c3d4e5f600000001"),
    maria: ObjectId("6651a1b2c3d4e5f600000002"),
    dispJoao: ObjectId("6651a1b2c3d4e5f600000102"),
    dispMaria: ObjectId("6651a1b2c3d4e5f600000103"),
    medJoaoNormal: ObjectId("6651a1b2c3d4e5f600000201"),
    medJoaoCritica: ObjectId("6651a1b2c3d4e5f600000202"),
    medMariaNormal: ObjectId("6651a1b2c3d4e5f600000203"),
    medMariaElevada: ObjectId("6651a1b2c3d4e5f600000204"),
    alertaCritico: ObjectId("6651a1b2c3d4e5f600000301"),
    alertaModerado: ObjectId("6651a1b2c3d4e5f600000302"),
};

// --- usuarios ----------------------------------------------------------------
db.usuarios.insertMany([
    {
        _id: ID.joao,
        nome: "João",
        sobrenome: "Silva",
        cpf: "52857264844",
        email: "joaosilva@gmail.com",
        telefone: "(11) 98765-4321",
        data_nascimento: ISODate("1985-07-15T00:00:00Z"),
        sexo: "MASCULINO",
        altura: 175,
        peso: 80.5,
        endereco: {
            logradouro: "Rua das Flores",
            bairro: "Jardim Primavera",
            cep: "01234-567",
            numero: "123",
            complemento: "Apto 45",
            cidade: "São Paulo",
            uf: "SP",
        },
        credenciais: {
            username: "joaosilva",
            password_hash:
                "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
            roles: ["ROLE_USER"],
            created_at: ISODate("2026-01-15T10:30:00Z"),
            updated_at: null,
        },
        ativo: true,
    },
    {
        _id: ID.maria,
        nome: "Maria",
        sobrenome: "Souza",
        cpf: "11223344556",
        email: "maria.souza@neocare.com",
        telefone: "(11) 91234-5678",
        data_nascimento: ISODate("1992-03-22T00:00:00Z"),
        sexo: "FEMININO",
        altura: 165,
        peso: 62.0,
        endereco: {
            logradouro: "Av. Paulista",
            bairro: "Bela Vista",
            cep: "01310-100",
            numero: "1000",
            complemento: "Sala 502",
            cidade: "São Paulo",
            uf: "SP",
        },
        credenciais: {
            username: "mariasouza",
            password_hash:
                "$2a$10$8KZ2nNqOPpyM7vXEZqHWoOTeJzKQYcfk6h7nUz8VgL3w5RcD0xZpa",
            roles: ["ROLE_ADMIN", "ROLE_USER"],
            created_at: ISODate("2026-01-20T14:45:00Z"),
            updated_at: ISODate("2026-03-10T09:15:00Z"),
        },
        ativo: true,
    },
]);

// --- dispositivos ------------------------------------------------------------
db.dispositivos.insertMany([
    {
        _id: ID.dispJoao,
        usuario_id: ID.joao,
        tipo_dispositivo: "SENSOR_CARDIACO",
        endereco_disp: "00:1A:7D:DA:71:13",
        fabricante: "Polar",
        modelo: "H10",
        firmware: "v3.2.0",
        data_ativacao: ISODate("2026-02-01T09:30:00Z"),
        ultima_sincronizacao: ISODate("2026-05-24T07:15:00Z"),
        ativo: true,
    },
    {
        _id: ID.dispMaria,
        usuario_id: ID.maria,
        tipo_dispositivo: "ESP32",
        endereco_disp: "A4:CF:12:45:AE:CC",
        fabricante: "Espressif",
        modelo: "ESP32-WROOM-32",
        firmware: "v2.4.1",
        data_ativacao: ISODate("2026-01-20T15:00:00Z"),
        ultima_sincronizacao: ISODate("2026-05-24T16:45:00Z"),
        ativo: true,
    },
]);

// --- medicoes ----------------------------------------------------------------
db.medicoes.insertMany([
    {
        _id: ID.medJoaoNormal,
        usuario_id: ID.joao,
        dispositivo_id: ID.dispJoao,
        tipo_medicao: "VITAL",
        data_medicao: ISODate("2026-05-24T07:15:00Z"),
        vitais: {
            batimentos_por_minuto: 72,
            oxigenacao_sangue: 98.5,
            pressao_sistolica: 120,
            pressao_diastolica: 80,
        },
        usuario_snapshot: { nome: "João Silva", idade: 40 },
        metadata: { origem: "auto_sync", qualidade_sinal: 0.95 },
    },
    {
        _id: ID.medJoaoCritica,
        usuario_id: ID.joao,
        dispositivo_id: ID.dispJoao,
        tipo_medicao: "VITAL",
        data_medicao: ISODate("2026-05-24T12:30:00Z"),
        vitais: {
            batimentos_por_minuto: 145,
            oxigenacao_sangue: 96.2,
            pressao_sistolica: 160,
            pressao_diastolica: 100,
        },
        usuario_snapshot: { nome: "João Silva", idade: 40 },
        metadata: { origem: "auto_sync", qualidade_sinal: 0.92 },
    },
    {
        _id: ID.medMariaNormal,
        usuario_id: ID.maria,
        dispositivo_id: ID.dispMaria,
        tipo_medicao: "ESTRESSE",
        data_medicao: ISODate("2026-05-24T14:00:00Z"),
        estresse: { variacao_frequencia_cardiaca: 35.2, condutividade_pele: 4.8 },
        usuario_snapshot: { nome: "Maria Souza", idade: 33 },
        metadata: { origem: "manual_input", qualidade_sinal: 0.88 },
    },
    {
        _id: ID.medMariaElevada,
        usuario_id: ID.maria,
        dispositivo_id: ID.dispMaria,
        tipo_medicao: "ESTRESSE",
        data_medicao: ISODate("2026-05-24T16:45:00Z"),
        estresse: { variacao_frequencia_cardiaca: 78.9, condutividade_pele: 12.3 },
        usuario_snapshot: { nome: "Maria Souza", idade: 33 },
        metadata: { origem: "auto_sync", qualidade_sinal: 0.97 },
    },
]);

// --- alertas -----------------------------------------------------------------
db.alertas.insertMany([
    {
        _id: ID.alertaCritico,
        usuario_id: ID.joao,
        medicao_id: ID.medJoaoCritica,
        tipo_alerta: "BATIMENTOS_ELEVADOS",
        severidade: "CRITICO",
        valor_detectado: "145 bpm",
        limite_referencia: ">120 bpm em repouso",
        mensagem:
            "Frequência cardíaca acima do limite seguro detectada. Recomenda-se avaliação médica imediata.",
        data_notificacao: ISODate("2026-05-24T12:30:05Z"),
        lido: false,
        acao_tomada: null,
    },
    {
        _id: ID.alertaModerado,
        usuario_id: ID.maria,
        medicao_id: ID.medMariaElevada,
        tipo_alerta: "ESTRESSE_ELEVADO",
        severidade: "MODERADO",
        valor_detectado: "Condutividade 12.3 µS",
        limite_referencia: ">10 µS sustentado",
        mensagem:
            "Nível de estresse acima do baseline pessoal. Sugere-se pausa de 15 minutos com técnicas de respiração.",
        data_notificacao: ISODate("2026-05-24T16:45:08Z"),
        lido: true,
        acao_tomada: "Notificação enviada via app e contato de emergência alertado.",
    },
]);

// -----------------------------------------------------------------------------
// 5) Resumo
// -----------------------------------------------------------------------------
print("=== seed concluido ===");
print("usuarios     : " + db.usuarios.countDocuments());
print("dispositivos : " + db.dispositivos.countDocuments());
print("medicoes     : " + db.medicoes.countDocuments());
print("alertas      : " + db.alertas.countDocuments());
print("=== ambiente pronto ===");
