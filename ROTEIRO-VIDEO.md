# Roteiro - Vídeo de Demonstração NeoCare SP4

**Duração-alvo:** 5 a 7 minutos
**Formato:** screen recording com áudio narrado
**Pré-gravação:**
- `docker compose down -v` (limpa o ambiente para mostrar o init do zero)
- Fechar tudo que não vai aparecer (Slack, e-mail, etc.)
- Deixar abertos em janelas separadas: VS Code (na raiz do projeto),
  Terminal 1 (raiz do projeto), Terminal 2 (raiz do projeto),
  navegador (sem abrir abas ainda), Compass (sem conectar ainda — opcional)
- Conferir microfone / silenciar notificações

---

## 0:00 - 0:30 | Abertura

> "Olá professor, este é o entregável da Sprint 4 do projeto NeoCare.
> Sou o **Davi Praxedes** e estou com o **João dos Santos** e o **Kauê Samartino**.
> Neste vídeo vou demonstrar a camada de telemetria do NeoCare migrada para MongoDB:
> a estrutura das 4 collections, os 10 documentos do seed, as operações CRUD
> e a exportação do dataset."

**Tela:** VS Code aberto na raiz mostrando a estrutura do projeto (árvore lateral).

---

## 0:30 - 1:00 | Estrutura do projeto

> "O projeto está organizado em 3 diretórios:
> `init/` com o bootstrap automático que roda na primeira subida do container,
> `scripts/` com os 4 scripts de CRUD numerados,
> e `dataset/` com os JSONs exportados via mongoexport.
> Tudo sobe com um único comando, graças ao `docker-compose.yml`."

**Tela:** clicar em cada pasta no VS Code mostrando o conteúdo. Abrir
rapidamente o `docker-compose.yml` e mostrar os 2 serviços (mongodb + mongo-express).

---

## 1:00 - 1:30 | Justificativa do MongoDB (30s falados)

> "Optamos por MongoDB nessa camada porque os dados de telemetria são eventos imutáveis
> com timestamp, escrita intensiva, e cada dispositivo (Polar H10, ESP32, STM32)
> produz leituras com atributos diferentes — o schema flexível resolve isso sem migração.
> Vejam por exemplo o documento de medição: o sub-documento `vitais` aparece quando
> é uma medida cardíaca, e o sub-documento `estresse` aparece quando é uma medida
> de estresse. O mesmo schema absorve ambos os tipos."

**Tela:** abrir `init/mongo-init.js` e dar um scroll mostrando os documentos
de `medicoes` (um com `vitais`, outro com `estresse`).

---

## 1:30 - 2:30 | Subida do ambiente

**Terminal 1:**
```bash
docker compose up -d
```

> "Aqui o docker-compose sobe o MongoDB 7 e o Mongo Express. Na primeira subida,
> o script `mongo-init.js` é montado em `/docker-entrypoint-initdb.d` e roda
> automaticamente — criando as 4 collections e inserindo os 10 documentos."

```bash
docker compose ps
docker compose logs mongodb | grep -A4 "seed concluido"
```

> "Nos logs vejo a mensagem de seed concluído, com a contagem por collection:
> 2 usuários, 2 dispositivos, 4 medições e 2 alertas — totalizando os 10 documentos."

---

## 2:30 - 3:30 | Validação no Mongo Express

**Tela:** abrir navegador em `http://localhost:8081` (login: `admin` / `admin`).

> "O Mongo Express é a interface web que sobe junto. Aqui dentro do banco `neocare`
> temos as 4 collections."

**Ações:**
1. Clicar em `usuarios` → mostrar os 2 documentos (João e Maria), expandir
   o `endereco` e o `credenciais` para destacar os sub-documentos aninhados.
2. Clicar em `dispositivos` → mostrar o Polar H10 e o ESP32 com `usuario_id`
   apontando para os 2 usuários.
3. Clicar em `medicoes` → mostrar os 4 documentos, destacar a diferença entre
   `vitais` (sub-doc opcional) e `estresse` (sub-doc opcional).
4. Clicar em `alertas` → mostrar o alerta crítico não-lido e o moderado resolvido.

> "Cada documento tem mais de 10 atributos, contando os sub-documentos aninhados
> como `endereco`, `credenciais`, `vitais` e `metadata`."

---

## 3:30 - 4:30 | Execução dos scripts CRUD

**Terminal 2:** (host com mongosh, ou usar `docker exec -i neocare-mongo mongosh ...`)

### CREATE
```bash
mongosh "mongodb://localhost:27017/neocare" scripts/01-crud-create.js
```

> "O script 01 faz um `insertOne` de uma nova medição vital do João,
> e um `insertMany` com 3 medições de estresse da Maria. O total
> de medições subiu de 4 para 8."

### READ
```bash
mongosh "mongodb://localhost:27017/neocare" scripts/02-crud-read.js
```

> "O script 02 demonstra leitura com vários operadores: `findOne` por CPF,
> projeção, `$gt` para batimentos acima de 120 num intervalo de datas,
> `$or`, `$in`, `sort` com `limit`, e busca por subcampo embutido
> com `credenciais.roles = ROLE_ADMIN`."

### UPDATE
```bash
mongosh "mongodb://localhost:27017/neocare" scripts/03-crud-update.js
```

> "Update demonstra `updateOne` com `$set` marcando o alerta crítico como lido,
> `updateMany` atualizando o firmware dos dispositivos Polar de uma vez,
> `$push` para adicionar uma role no array de credenciais,
> e `upsert` criando um dispositivo novo a partir do MAC."

### DELETE
```bash
mongosh "mongodb://localhost:27017/neocare" scripts/04-crud-delete.js
```

> "Delete remove o dispositivo inserido pelo upsert e aplica uma política de retenção:
> `deleteMany` para medições com mais de 1 ano, e limpa as medições do dia 25/05."

---

## 4:30 - 5:30 | Exportação do dataset

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

> "Os 4 arquivos JSON ficam disponíveis na pasta `dataset/` para que o professor
> consiga reproduzir o ambiente, ou reimportar via `mongoimport` se quiser."

**Tela:** `ls -lh dataset/` mostrando os 4 arquivos. Abrir rapidamente
`dataset/neocare_medicoes.json` no VS Code mostrando o conteúdo bem formatado.

---

## 5:30 - 6:00 | Encerramento

> "Resumindo: 4 collections, 10 documentos com atributos aninhados,
> 4 scripts CRUD cobrindo Create, Read, Update e Delete, dataset exportado em JSON,
> e tudo reproduzível com um único `docker compose up -d`.
> O repositório está disponível no GitHub no link da descrição. Obrigado!"

**Tela:** voltar ao VS Code mostrando a árvore completa do projeto.

---

## Checklist final antes de gravar

- [ ] `docker compose down -v` executado (ambiente limpo)
- [ ] Microfone testado
- [ ] Notificações silenciadas (modo Não Perturbar)
- [ ] Zoom da fonte do VS Code aumentado (Cmd+= 2-3 vezes)
- [ ] Zoom do terminal aumentado
- [ ] Janela do navegador em tela cheia ao mostrar Mongo Express
- [ ] Roteiro impresso ou em segunda tela

## Comandos de "se algo der errado" (live)

```bash
# se Mongo Express não carregar
docker compose restart mongo-express

# se quiser re-rodar o init sem reset total
docker exec -i neocare-mongo mongosh "mongodb://localhost:27017/neocare" < init/mongo-init.js

# se quiser limpar tudo e começar de novo
docker compose down -v && docker compose up -d
```
