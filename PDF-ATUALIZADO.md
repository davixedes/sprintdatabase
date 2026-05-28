# Entregável NeoCare - SP4

**Membros:**
- Davi Praxedes - 560719
- João dos Santos de Jesus - 560400
- Kaue Samartino - 559317

---

## Sumário

1. Descrição do Projeto
2. Justificativa para a escolha do MongoDB
3. Modelo de Dados e Justificativas
   - 3.1 usuarios
   - 3.2 dispositivos
   - 3.3 medicoes
   - 3.4 alertas
4. Documentos JSON/BSON (10 documentos)
5. Interface de Consulta e Operações CRUD
6. Exportação do Dataset
7. Repositório GitHub
8. Vídeo de Demonstração

---

## 1. Descrição do Projeto

A Neocare é uma plataforma de monitoramento contínuo de saúde que recebe leituras
de dispositivos vestíveis (relógios, cintas e sensores cardíacos), processa essas
medições em tempo real e gera alertas quando limites clínicos são ultrapassados.

Na Sprint 3, a persistência foi implementada em PostgreSQL Flexible Server (Azure),
com 9 tabelas relacionais normalizadas. Nesta Sprint 4, o domínio de telemetria
dos pacientes (medições vitais, medições de estresse e alertas) é migrado para o
MongoDB, mantendo o PostgreSQL como base transacional de cadastro e autenticação.

O sistema completo é composto por:
- API REST desenvolvida em Spring Boot 3.5 (Java 17)
- PostgreSQL para dados transacionais (usuários, credenciais)
- MongoDB para telemetria e alertas
- Oracle APEX como camada analítica
- Modelo de IA consumindo dados do APEX para inferências clínicas

---

## 2. Justificativa para a escolha do MongoDB

A escolha do MongoDB como banco NoSQL para a camada de telemetria foi pautada
nos seguintes critérios técnicos:

Cada medição é um evento imutável com timestamp. Inserts são contínuos e leituras
tipicamente filtram por intervalo de tempo + usuário, padrão para o qual o modelo
de documento do MongoDB é otimizado. Além disso, dispositivos heterogêneos
(ESP32, STM32, Polar H10) produzem leituras com atributos diferentes. O modelo
de documento permite armazenar `medicoes_vitais` e `medicoes_estresse` na mesma
coleção, sem migrações de esquema a cada novo tipo de sensor.

Dados que são sempre lidos juntos podem ser embutidos no mesmo documento,
eliminando joins e reduzindo a latência das consultas. O crescimento esperado
da base de telemetria é exponencial (milhões de leituras/dia) e o sharding do
MongoDB permite escalar horizontalmente por `usuario_id`. A API Spring Boot já
trafega JSON; a persistência direta em BSON elimina mapeamentos ORM custosos e
simplifica a integração com Oracle APEX e o futuro Modelo de IA.

---

## 3. Modelo de Dados e Justificativas

A modelagem segue o princípio de agregação por padrão de acesso (access pattern
driven design). Em vez de espelhar a estrutura relacional, aplicou-se *embedding*
para sub-documentos sempre lidos junto com o pai e *referencing* quando há ciclo
de vida independente.

Foram definidas 4 collections:

### 3.1 usuarios

Concentra o cadastro do paciente e suas credenciais. As `roles` são armazenadas
como array embedded, eliminando a tabela de junção `credenciais_role` do modelo
relacional.

```json
{
  "_id": ObjectId,
  "nome": String,
  "sobrenome": String,
  "cpf": String,
  "email": String,
  "telefone": String,
  "data_nascimento": Date,
  "sexo": String,
  "altura": Number,
  "peso": Number,
  "endereco": {
    "logradouro": String, "bairro": String, "cep": String,
    "numero": String, "complemento": String, "cidade": String, "uf": String
  },
  "credenciais": {
    "username": String, "password_hash": String,
    "roles": [String], "created_at": Date, "updated_at": Date
  },
  "ativo": Boolean
}
```

### 3.2 dispositivos

Dispositivos vestíveis vinculados aos usuários. Collection separada porque cada
usuário pode ter múltiplos dispositivos com ciclo de vida independente.

```json
{
  "_id": ObjectId,
  "usuario_id": ObjectId,
  "tipo_dispositivo": String,
  "endereco_disp": String,
  "fabricante": String,
  "modelo": String,
  "firmware": String,
  "data_ativacao": Date,
  "ultima_sincronizacao": Date,
  "ativo": Boolean
}
```

### 3.3 medicoes

Coração do sistema. Cada documento representa uma leitura. Os campos específicos
de cada tipo (vitais ou estresse) são embutidos em sub-documentos opcionais,
aproveitando o schema flexível do MongoDB.

```json
{
  "_id": ObjectId,
  "usuario_id": ObjectId,
  "dispositivo_id": ObjectId,
  "tipo_medicao": String,
  "data_medicao": Date,
  "vitais": {
    "batimentos_por_minuto": Number,
    "oxigenacao_sangue": Number,
    "pressao_sistolica": Number,
    "pressao_diastolica": Number
  },
  "estresse": {
    "variacao_frequencia_cardiaca": Number,
    "condutividade_pele": Number
  },
  "usuario_snapshot": { "nome": String, "idade": Number },
  "metadata": { "origem": String, "qualidade_sinal": Number }
}
```

### 3.4 alertas

Eventos disparados quando uma medição ultrapassa limites clínicos.

```json
{
  "_id": ObjectId,
  "usuario_id": ObjectId,
  "medicao_id": ObjectId,
  "tipo_alerta": String,
  "severidade": String,
  "valor_detectado": String,
  "limite_referencia": String,
  "mensagem": String,
  "data_notificacao": Date,
  "lido": Boolean,
  "acao_tomada": String
}
```

---

## 4. Documentos JSON/BSON (10 documentos)

**Total inserido:** 10 documentos, todos com ≥10 atributos (incluindo atributos
aninhados). Distribuição: 2 usuários + 2 dispositivos + 4 medições + 2 alertas.

### Usuários

**Documento 1 — João Silva**

```json
{
  "_id": ObjectId("6651a1b2c3d4e5f600000001"),
  "nome": "João", "sobrenome": "Silva",
  "cpf": "52857264844", "email": "joaosilva@gmail.com",
  "telefone": "(11) 98765-4321",
  "data_nascimento": ISODate("1985-07-15T00:00:00Z"),
  "sexo": "MASCULINO", "altura": 175, "peso": 80.5,
  "endereco": {
    "logradouro": "Rua das Flores", "bairro": "Jardim Primavera",
    "cep": "01234-567", "numero": "123", "complemento": "Apto 45",
    "cidade": "São Paulo", "uf": "SP"
  },
  "credenciais": {
    "username": "joaosilva",
    "password_hash": "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
    "roles": ["ROLE_USER"],
    "created_at": ISODate("2026-01-15T10:30:00Z"), "updated_at": null
  },
  "ativo": true
}
```

**Documento 2 — Maria Souza**

```json
{
  "_id": ObjectId("6651a1b2c3d4e5f600000002"),
  "nome": "Maria", "sobrenome": "Souza",
  "cpf": "11223344556", "email": "maria.souza@neocare.com",
  "telefone": "(11) 91234-5678",
  "data_nascimento": ISODate("1992-03-22T00:00:00Z"),
  "sexo": "FEMININO", "altura": 165, "peso": 62.0,
  "endereco": {
    "logradouro": "Av. Paulista", "bairro": "Bela Vista",
    "cep": "01310-100", "numero": "1000", "complemento": "Sala 502",
    "cidade": "São Paulo", "uf": "SP"
  },
  "credenciais": {
    "username": "mariasouza",
    "password_hash": "$2a$10$8KZ2nNqOPpyM7vXEZqHWoOTeJzKQYcfk6h7nUz8VgL3w5RcD0xZpa",
    "roles": ["ROLE_ADMIN", "ROLE_USER"],
    "created_at": ISODate("2026-01-20T14:45:00Z"),
    "updated_at": ISODate("2026-03-10T09:15:00Z")
  },
  "ativo": true
}
```

### Dispositivos

**Documento 3 — Polar H10 (João)**

```json
{
  "_id": ObjectId("6651a1b2c3d4e5f600000102"),
  "usuario_id": ObjectId("6651a1b2c3d4e5f600000001"),
  "tipo_dispositivo": "SENSOR_CARDIACO",
  "endereco_disp": "00:1A:7D:DA:71:13",
  "fabricante": "Polar", "modelo": "H10", "firmware": "v3.2.0",
  "data_ativacao": ISODate("2026-02-01T09:30:00Z"),
  "ultima_sincronizacao": ISODate("2026-05-24T07:15:00Z"),
  "ativo": true
}
```

**Documento 4 — ESP32 (Maria)**

```json
{
  "_id": ObjectId("6651a1b2c3d4e5f600000103"),
  "usuario_id": ObjectId("6651a1b2c3d4e5f600000002"),
  "tipo_dispositivo": "ESP32",
  "endereco_disp": "A4:CF:12:45:AE:CC",
  "fabricante": "Espressif", "modelo": "ESP32-WROOM-32", "firmware": "v2.4.1",
  "data_ativacao": ISODate("2026-01-20T15:00:00Z"),
  "ultima_sincronizacao": ISODate("2026-05-24T16:45:00Z"),
  "ativo": true
}
```

### Medições

**Documento 5 — Medição vital normal (João)**

```json
{
  "_id": ObjectId("6651a1b2c3d4e5f600000201"),
  "usuario_id": ObjectId("6651a1b2c3d4e5f600000001"),
  "dispositivo_id": ObjectId("6651a1b2c3d4e5f600000102"),
  "tipo_medicao": "VITAL",
  "data_medicao": ISODate("2026-05-24T07:15:00Z"),
  "vitais": {
    "batimentos_por_minuto": 72, "oxigenacao_sangue": 98.5,
    "pressao_sistolica": 120, "pressao_diastolica": 80
  },
  "usuario_snapshot": { "nome": "João Silva", "idade": 40 },
  "metadata": { "origem": "auto_sync", "qualidade_sinal": 0.95 }
}
```

**Documento 6 — Medição vital crítica (João)**

```json
{
  "_id": ObjectId("6651a1b2c3d4e5f600000202"),
  "usuario_id": ObjectId("6651a1b2c3d4e5f600000001"),
  "dispositivo_id": ObjectId("6651a1b2c3d4e5f600000102"),
  "tipo_medicao": "VITAL",
  "data_medicao": ISODate("2026-05-24T12:30:00Z"),
  "vitais": {
    "batimentos_por_minuto": 145, "oxigenacao_sangue": 96.2,
    "pressao_sistolica": 160, "pressao_diastolica": 100
  },
  "usuario_snapshot": { "nome": "João Silva", "idade": 40 },
  "metadata": { "origem": "auto_sync", "qualidade_sinal": 0.92 }
}
```

**Documento 7 — Medição de estresse normal (Maria)**

```json
{
  "_id": ObjectId("6651a1b2c3d4e5f600000203"),
  "usuario_id": ObjectId("6651a1b2c3d4e5f600000002"),
  "dispositivo_id": ObjectId("6651a1b2c3d4e5f600000103"),
  "tipo_medicao": "ESTRESSE",
  "data_medicao": ISODate("2026-05-24T14:00:00Z"),
  "estresse": { "variacao_frequencia_cardiaca": 35.2, "condutividade_pele": 4.8 },
  "usuario_snapshot": { "nome": "Maria Souza", "idade": 33 },
  "metadata": { "origem": "manual_input", "qualidade_sinal": 0.88 }
}
```

**Documento 8 — Medição de estresse elevado (Maria)**

```json
{
  "_id": ObjectId("6651a1b2c3d4e5f600000204"),
  "usuario_id": ObjectId("6651a1b2c3d4e5f600000002"),
  "dispositivo_id": ObjectId("6651a1b2c3d4e5f600000103"),
  "tipo_medicao": "ESTRESSE",
  "data_medicao": ISODate("2026-05-24T16:45:00Z"),
  "estresse": { "variacao_frequencia_cardiaca": 78.9, "condutividade_pele": 12.3 },
  "usuario_snapshot": { "nome": "Maria Souza", "idade": 33 },
  "metadata": { "origem": "auto_sync", "qualidade_sinal": 0.97 }
}
```

### Alertas

**Documento 9 — Alerta crítico não-lido**

```json
{
  "_id": ObjectId("6651a1b2c3d4e5f600000301"),
  "usuario_id": ObjectId("6651a1b2c3d4e5f600000001"),
  "medicao_id": ObjectId("6651a1b2c3d4e5f600000202"),
  "tipo_alerta": "BATIMENTOS_ELEVADOS", "severidade": "CRITICO",
  "valor_detectado": "145 bpm", "limite_referencia": ">120 bpm em repouso",
  "mensagem": "Frequência cardíaca acima do limite seguro detectada. Recomenda-se avaliação médica imediata.",
  "data_notificacao": ISODate("2026-05-24T12:30:05Z"),
  "lido": false, "acao_tomada": null
}
```

**Documento 10 — Alerta moderado resolvido**

```json
{
  "_id": ObjectId("6651a1b2c3d4e5f600000302"),
  "usuario_id": ObjectId("6651a1b2c3d4e5f600000002"),
  "medicao_id": ObjectId("6651a1b2c3d4e5f600000204"),
  "tipo_alerta": "ESTRESSE_ELEVADO", "severidade": "MODERADO",
  "valor_detectado": "Condutividade 12.3 µS", "limite_referencia": ">10 µS sustentado",
  "mensagem": "Nível de estresse acima do baseline pessoal. Sugere-se pausa de 15 minutos com técnicas de respiração.",
  "data_notificacao": ISODate("2026-05-24T16:45:08Z"),
  "lido": true,
  "acao_tomada": "Notificação enviada via app e contato de emergência alertado."
}
```

---

## 5. Interface de Consulta e Operações CRUD

A interface CRUD foi implementada em três camadas complementares, todas
demonstradas no vídeo:

### 5.1 MongoDB Compass (GUI oficial)

Interface gráfica oficial do MongoDB para administração e consulta visual:
- **Create**: inserção de documentos via formulário JSON
- **Read**: filtros com sintaxe Mongo (`{ "vitais.batimentos_por_minuto": { "$gt": 100 } }`)
- **Update**: edição inline de campos
- **Delete**: remoção individual ou em lote com confirmação

### 5.2 Mongo Express (UI Web)

Interface web disponível em `http://localhost:8081` (sobe automaticamente via
`docker compose up`). Permite todas as operações CRUD pelo navegador, sem
instalação adicional.

### 5.3 Scripts via Mongo Shell (mongosh)

Os scripts numerados no repositório executam todas as operações CRUD
programaticamente:

| Script                  | Operação                                            |
| ----------------------- | --------------------------------------------------- |
| `01-crud-create.js`     | `insertOne` + `insertMany`                          |
| `02-crud-read.js`       | `find`, `findOne`, `$gt`, `$or`, `$in`, sort, limit |
| `03-crud-update.js`     | `updateOne`, `updateMany`, `$set`, `$push`, upsert  |
| `04-crud-delete.js`     | `deleteOne`, `deleteMany`                           |

### Exemplos de operações CRUD

**CREATE — inserir nova medição:**

```javascript
db.medicoes.insertOne({
  usuario_id: ObjectId("6651a1b2c3d4e5f600000001"),
  dispositivo_id: ObjectId("6651a1b2c3d4e5f600000102"),
  tipo_medicao: "VITAL",
  data_medicao: new Date(),
  vitais: { batimentos_por_minuto: 75, oxigenacao_sangue: 98.0,
            pressao_sistolica: 118, pressao_diastolica: 78 },
  usuario_snapshot: { nome: "João Silva", idade: 40 },
  metadata: { origem: "auto_sync", qualidade_sinal: 0.93 }
});
```

**READ — medições críticas do mês:**

```javascript
db.medicoes.find({
  "vitais.batimentos_por_minuto": { $gt: 120 },
  "data_medicao": {
    $gte: ISODate("2026-05-01T00:00:00Z"),
    $lt:  ISODate("2026-06-01T00:00:00Z")
  }
}).sort({ data_medicao: -1 });
```

**UPDATE — marcar alerta como lido:**

```javascript
db.alertas.updateOne(
  { _id: ObjectId("6651a1b2c3d4e5f600000301") },
  { $set: { lido: true,
            acao_tomada: "Paciente contatado, sinais estabilizados." } }
);
```

**DELETE — política de retenção (medições com mais de 1 ano):**

```javascript
db.medicoes.deleteMany({
  "data_medicao": { $lt: ISODate("2025-05-25T00:00:00Z") }
});
```

---

## 6. Exportação do Dataset

O dataset completo foi exportado em formato JSON via `mongoexport` e está
disponível na pasta `/dataset` do repositório. Cada collection gerou um arquivo
separado:

- `neocare_usuarios.json`
- `neocare_dispositivos.json`
- `neocare_medicoes.json`
- `neocare_alertas.json`

### Comandos de exportação executados

```bash
mongoexport --uri="mongodb://localhost:27017/neocare" \
  --collection=usuarios --out=dataset/neocare_usuarios.json --jsonArray --pretty

mongoexport --uri="mongodb://localhost:27017/neocare" \
  --collection=dispositivos --out=dataset/neocare_dispositivos.json --jsonArray --pretty

mongoexport --uri="mongodb://localhost:27017/neocare" \
  --collection=medicoes --out=dataset/neocare_medicoes.json --jsonArray --pretty

mongoexport --uri="mongodb://localhost:27017/neocare" \
  --collection=alertas --out=dataset/neocare_alertas.json --jsonArray --pretty
```

### Reimportação (caso o professor queira reproduzir)

```bash
mongoimport --uri="mongodb://localhost:27017/neocare" \
  --collection=usuarios --file=dataset/neocare_usuarios.json --jsonArray
# (repetir para as outras 3 collections)
```

---

## 7. Repositório GitHub

**Link do repositório:** *[inserir URL do GitHub aqui]*

**Estrutura do repositório:**

```
Neocare-MongoDB/
├── README.md              Instruções de execução
├── docker-compose.yml     Sobe MongoDB 7 + Mongo Express
├── init/
│   └── mongo-init.js      Bootstrap automático
├── scripts/               4 scripts CRUD numerados
│   ├── 01-crud-create.js
│   ├── 02-crud-read.js
│   ├── 03-crud-update.js
│   └── 04-crud-delete.js
└── dataset/               4 arquivos JSON exportados
```

### Como reproduzir (1 comando)

```bash
git clone <url-do-repo>
cd Neocare-MongoDB
docker compose up -d
```

O `mongo-init.js` é executado automaticamente, criando as 4 collections e
inserindo os 10 documentos. Em ~10 segundos o ambiente está pronto, com o
Mongo Express acessível em `http://localhost:8081` (usuário `admin` /
senha `admin`).

---

## 8. Vídeo de Demonstração

**Link do vídeo:** *[inserir link do YouTube ou Azure Blob aqui]*

O vídeo, narrado com áudio, demonstra:

- Subida do ambiente via `docker compose up -d`
- Estrutura das 4 collections no Mongo Express e no Compass
- Validação dos 10 documentos inseridos
- Execução ao vivo dos scripts CRUD (Create, Read, Update, Delete)
- Exportação do dataset via `mongoexport`
