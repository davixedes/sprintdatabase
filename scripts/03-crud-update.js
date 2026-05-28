// =============================================================================
// 03 - CRUD: UPDATE (updateOne, updateMany, $set, $push, $inc, upsert)
// Uso:  mongosh "mongodb://localhost:27017/neocare" scripts/03-crud-update.js
// =============================================================================

print(">>> 03-crud-update.js");

const alertaCritico = ObjectId("6651a1b2c3d4e5f600000301");
const usuarioJoao = ObjectId("6651a1b2c3d4e5f600000001");

// --- updateOne com $set: marcar alerta como lido -----------------------------
print("\n[updateOne $set] marcar alerta critico como lido");
const r1 = db.alertas.updateOne(
    { _id: alertaCritico },
    {
        $set: {
            lido: true,
            acao_tomada: "Paciente contatado, sinais estabilizados.",
        },
    }
);
print("matched=" + r1.matchedCount + " modified=" + r1.modifiedCount);
printjson(db.alertas.findOne({ _id: alertaCritico }));

// --- updateMany com $set: atualizar firmware em lote -------------------------
print("\n[updateMany $set] atualizar firmware dos dispositivos Polar");
const r2 = db.dispositivos.updateMany(
    { fabricante: "Polar" },
    { $set: { firmware: "v3.3.0", ultima_sincronizacao: new Date() } }
);
print("matched=" + r2.matchedCount + " modified=" + r2.modifiedCount);

// --- updateOne com $push: adicionar role a um usuario ------------------------
print("\n[updateOne $push] adicionar role ROLE_MEDICO ao Joao");
const r3 = db.usuarios.updateOne(
    { _id: usuarioJoao },
    {
        $push: { "credenciais.roles": "ROLE_MEDICO" },
        $set: { "credenciais.updated_at": new Date() },
    }
);
print("matched=" + r3.matchedCount + " modified=" + r3.modifiedCount);
print("roles atuais: " +
    db.usuarios.findOne({ _id: usuarioJoao }, { "credenciais.roles": 1 })
        .credenciais.roles.join(", "));

// --- updateOne com upsert: cria se nao existir -------------------------------
print("\n[updateOne upsert] inserir/atualizar dispositivo por endereco MAC");
const r4 = db.dispositivos.updateOne(
    { endereco_disp: "B8:27:EB:11:22:33" },
    {
        $set: {
            usuario_id: usuarioJoao,
            tipo_dispositivo: "PULSEIRA_FITNESS",
            fabricante: "Xiaomi",
            modelo: "Mi Band 8",
            firmware: "v1.0.0",
            data_ativacao: new Date(),
            ultima_sincronizacao: new Date(),
            ativo: true,
        },
    },
    { upsert: true }
);
print("upsertedId=" + r4.upsertedId + " modified=" + r4.modifiedCount);

// --- updateMany condicional --------------------------------------------------
print("\n[updateMany] inativar dispositivos sem sincronizacao desde 01/01/2026");
const r5 = db.dispositivos.updateMany(
    { ultima_sincronizacao: { $lt: ISODate("2026-01-01T00:00:00Z") } },
    { $set: { ativo: false } }
);
print("matched=" + r5.matchedCount + " modified=" + r5.modifiedCount);

print("\n<<< 03 concluido");
