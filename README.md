# NeoCare - MongoDB (Sprint 4)

Camada de telemetria do NeoCare em MongoDB 7, com 4 collections
(`usuarios`, `dispositivos`, `medicoes`, `alertas`) e seed de 10 documentos.

## Pré-requisitos

- Docker Desktop (ou Docker Engine + Compose v2)
- Opcional: [MongoDB Compass](https://www.mongodb.com/products/compass) para inspeção visual
- Opcional: `mongosh` para rodar os scripts do host

## Como subir (1 comando)

```bash
docker compose up -d
```

O `init/mongo-init.js` roda automaticamente na primeira subida (volume vazio),
criando as 4 collections e inserindo os 10 documentos.

Após ~10 segundos:
- MongoDB em `mongodb://localhost:27017/neocare`
- Mongo Express em `http://localhost:8081` (usuário `admin` / senha `admin`)

## Estrutura

```
.
├── README.md
├── ROTEIRO-VIDEO.md         Roteiro narrado para a gravação
├── docker-compose.yml       MongoDB 7 + Mongo Express
├── init/
│   └── mongo-init.js        Bootstrap: collections + 10 documentos
├── scripts/
│   ├── 01-crud-create.js    insertOne + insertMany
│   ├── 02-crud-read.js      find, findOne, $gt, $or, $in, sort, limit
│   ├── 03-crud-update.js    updateOne, updateMany, $set, $push, upsert
│   └── 04-crud-delete.js    deleteOne, deleteMany
└── dataset/                 4 JSONs exportados (mongoexport)
```

## Executando os scripts CRUD

Do host (com `mongosh` instalado):

```bash
mongosh "mongodb://localhost:27017/neocare" scripts/01-crud-create.js
mongosh "mongodb://localhost:27017/neocare" scripts/02-crud-read.js
mongosh "mongodb://localhost:27017/neocare" scripts/03-crud-update.js
mongosh "mongodb://localhost:27017/neocare" scripts/04-crud-delete.js
```

Ou de dentro do container:

```bash
docker exec -i neocare-mongo mongosh "mongodb://localhost:27017/neocare" < scripts/01-crud-create.js
# ... idem para 02, 03 e 04
```

## Exportação do dataset

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

## Reimportação

```bash
mongoimport --uri="mongodb://localhost:27017/neocare" \
  --collection=usuarios --file=dataset/neocare_usuarios.json --jsonArray
# repetir para dispositivos, medicoes, alertas
```

## Reset completo

```bash
docker compose down -v   # remove o volume mongo_data
docker compose up -d     # init roda do zero
```
