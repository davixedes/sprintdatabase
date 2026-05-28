// =============================================================================
// 04 - CRUD: DELETE (deleteOne, deleteMany)
// Uso:  mongosh "mongodb://localhost:27017/neocare" scripts/04-crud-delete.js
//
// OBS: este script remove dados inseridos pelo 01-crud-create.js e pelo
//      upsert do 03-crud-update.js. Para restaurar o estado original,
//      basta rodar `docker compose down -v && docker compose up -d`.
// =============================================================================

print(">>> 04-crud-delete.js");

// --- deleteOne: remove o dispositivo criado via upsert no script 03 ----------
print("\n[deleteOne] remover o Mi Band 8 (criado via upsert no script 03)");
const r1 = db.dispositivos.deleteOne({ endereco_disp: "B8:27:EB:11:22:33" });
print("deletedCount=" + r1.deletedCount);

// --- deleteMany: politica de retencao (medicoes com >1 ano) ------------------
print("\n[deleteMany] politica de retencao - medicoes com mais de 1 ano");
const limite = ISODate("2025-05-25T00:00:00Z");
const r2 = db.medicoes.deleteMany({ data_medicao: { $lt: limite } });
print("deletedCount=" + r2.deletedCount + " (esperado 0 com o seed atual)");

// --- deleteMany: remove medicoes do dia 25/05/2026 (criadas pelo script 01) --
print("\n[deleteMany] limpar medicoes inseridas pelo 01-crud-create.js");
const r3 = db.medicoes.deleteMany({
    data_medicao: {
        $gte: ISODate("2026-05-25T00:00:00Z"),
        $lt: ISODate("2026-05-26T00:00:00Z"),
    },
});
print("deletedCount=" + r3.deletedCount);

// --- estado final ------------------------------------------------------------
print("\nusuarios     : " + db.usuarios.countDocuments());
print("dispositivos : " + db.dispositivos.countDocuments());
print("medicoes     : " + db.medicoes.countDocuments());
print("alertas      : " + db.alertas.countDocuments());

print("\n<<< 04 concluido");
