// =============================================================================
// 02 - CRUD: READ (find, findOne, $gt, $or, $in, sort, limit, projecao)
// Uso:  mongosh "mongodb://localhost:27017/neocare" scripts/02-crud-read.js
// =============================================================================

print(">>> 02-crud-read.js");

// --- findOne por CPF ---------------------------------------------------------
print("\n[findOne] usuario por CPF");
printjson(db.usuarios.findOne({ cpf: "52857264844" }));

// --- find com projecao -------------------------------------------------------
print("\n[find + projecao] nome e email de todos os usuarios ativos");
db.usuarios
    .find({ ativo: true }, { nome: 1, sobrenome: 1, email: 1, _id: 0 })
    .forEach(printjson);

// --- find com $gt e intervalo de tempo --------------------------------------
print("\n[find] medicoes criticas (bpm > 120) em maio/2026");
db.medicoes
    .find({
        "vitais.batimentos_por_minuto": { $gt: 120 },
        data_medicao: {
            $gte: ISODate("2026-05-01T00:00:00Z"),
            $lt: ISODate("2026-06-01T00:00:00Z"),
        },
    })
    .sort({ data_medicao: -1 })
    .forEach(printjson);

// --- find com $or ------------------------------------------------------------
print("\n[find $or] alertas criticos OU nao-lidos");
db.alertas
    .find({ $or: [{ severidade: "CRITICO" }, { lido: false }] })
    .forEach((d) => print(" - " + d.tipo_alerta + " | " + d.severidade + " | lido=" + d.lido));

// --- find com $in ------------------------------------------------------------
print("\n[find $in] dispositivos de fabricantes especificos");
db.dispositivos
    .find({ fabricante: { $in: ["Polar", "Espressif"] } })
    .forEach((d) => print(" - " + d.fabricante + " " + d.modelo + " (firmware " + d.firmware + ")"));

// --- find com sort + limit ---------------------------------------------------
print("\n[find sort+limit] 3 medicoes mais recentes");
db.medicoes
    .find({}, { tipo_medicao: 1, data_medicao: 1, _id: 0 })
    .sort({ data_medicao: -1 })
    .limit(3)
    .forEach(printjson);

// --- count -------------------------------------------------------------------
print("\n[countDocuments] medicoes do tipo VITAL: " +
    db.medicoes.countDocuments({ tipo_medicao: "VITAL" }));
print("[countDocuments] medicoes do tipo ESTRESSE: " +
    db.medicoes.countDocuments({ tipo_medicao: "ESTRESSE" }));

// --- find por subcampo embutido (roles dentro de credenciais) ----------------
print("\n[find] usuarios com role ROLE_ADMIN");
db.usuarios
    .find({ "credenciais.roles": "ROLE_ADMIN" }, { nome: 1, "credenciais.username": 1 })
    .forEach(printjson);

print("\n<<< 02 concluido");
