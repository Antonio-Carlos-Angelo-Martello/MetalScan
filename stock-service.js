(function () {
  const itemsKey = "metalscan.stock.items";
  const movementsKey = "metalscan.stock.movements";
  const locationsKey = "metalscan.stock.locations";
  const auditKey = "metalscan.stock.audit";
  const companyKey = "metalscan.current-company";
  const now = () => new Date().toISOString();
  const read = (key) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (error) {
      console.error(`Não foi possível carregar ${key}.`, error);
      return [];
    }
  };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const companyId = () => localStorage.getItem(companyKey) || "local-company";
  const number = (value) => Number(String(value ?? "").replace(",", ".")) || 0;
  const user = () => window.currentUser?.email || "Usuário local";
  const material = (id, code) => {
    const materials = window.MaterialsService?.list() || [];
    return materials.find((item) => item.id === id || (code && item.codigo === code));
  };
  const locationName = (idOrName) => {
    if (!idOrName) return "";
    const locations = read(locationsKey);
    return locations.find((item) => item.id === idOrName)?.nome || idOrName;
  };
  function audit(entityId, action, oldValues, newValues, reason) {
    const entries = read(auditKey);
    entries.push({ id: `AUD-${Date.now()}-${entries.length}`, companyId: companyId(), entityType: "stock", entityId, action, oldValues: oldValues || null, newValues: newValues || null, reason: reason || "", user: user(), createdAt: now() });
    write(auditKey, entries);
  }
  function saveItem(item) {
    const items = read(itemsKey);
    const index = items.findIndex((entry) => entry.id === item.id);
    if (index >= 0) items[index] = item; else items.push(item);
    write(itemsKey, items);
    return item;
  }
  function findMatching(items, data) {
    return items.find((item) => item.materialId === data.materialId
      && item.location === (data.location || "")
      && item.lais === (data.lais || "")
      && item.corrida === (data.corrida || "")
      && item.lote === (data.lote || ""));
  }
  const service = {
    list() { return read(itemsKey).filter((item) => item.companyId === companyId()); },
    findByCode(value) {
      const needle = String(value || "").trim().toLowerCase();
      if (!needle) return [];
      return this.list().filter((item) => [item.id, item.lais, item.codigo, item.codigoBarras, item.qrCode].some((field) => String(field || "").toLowerCase() === needle));
    },
    listAll() { return read(itemsKey); },
    movements() { return read(movementsKey).filter((item) => item.companyId === companyId()).slice().reverse(); },
    audit() { return read(auditKey).filter((item) => item.companyId === companyId()).slice().reverse(); },
    locations() { return read(locationsKey).filter((item) => item.companyId === companyId() && item.status !== "inactive"); },
    saveLocation(name, description = "") {
      const normalized = String(name || "").trim();
      if (!normalized) throw new Error("Informe o nome do local.");
      const locations = read(locationsKey);
      if (locations.some((item) => item.companyId === companyId() && item.nome.toLowerCase() === normalized.toLowerCase())) throw new Error("Este local já está cadastrado.");
      const record = { id: `LOC-${Date.now()}`, companyId: companyId(), nome: normalized, descricao: description, status: "active", createdAt: now() };
      write(locationsKey, [...locations, record]);
      audit(record.id, "LOCATION_CREATED", null, record);
      return record;
    },
    createEntry(data) {
      const source = material(data.materialId, data.codigo);
      if (!source) throw new Error("Selecione um material existente no catálogo.");
      const quantity = number(data.quantidade);
      if (quantity <= 0) throw new Error("A quantidade de entrada deve ser maior que zero.");
      const items = read(itemsKey);
      const existing = findMatching(items, { materialId: source.id, location: data.local });
      const before = existing ? { ...existing } : null;
      const unitCost = number(data.custoUnitario);
      const record = existing ? {
        ...existing,
        quantidade: number(existing.quantidade) + quantity,
        comprimento: data.comprimento || existing.comprimento || source.comprimentoPadrao || "",
        peso: number(existing.peso) + number(data.peso || quantity * number(data.pesoUnitario || source.pesoTeoricoMetro) * number(data.comprimento || source.comprimentoPadrao || 0)),
        custoUnitario: unitCost || existing.custoUnitario || 0,
        custoTotal: (number(existing.quantidade) + quantity) * (unitCost || existing.custoUnitario || 0),
        ultimaMovimentacao: now(),
        atualizadoEm: now()
      } : {
        id: `EST-${Date.now()}`, companyId: companyId(), materialId: source.id, lais: data.lais || "", codigo: source.codigo, descricao: source.descricao,
        tipo: source.tipo, material: source.material, bitola: source.bitola || "", diametro: source.diametro || "", espessura: source.espessura || "",
        norma: source.norma || "", corrida: data.corrida || "", lote: data.lote || "", fabricante: data.fabricante || source.fabricante || "",
        fornecedor: data.fornecedor || source.fornecedor || "", quantidade: quantity, unidade: data.unidade || source.unidade || "un.",
        comprimento: data.comprimento || source.comprimentoPadrao || "", peso: number(data.peso || quantity * number(data.pesoUnitario || source.pesoTeoricoMetro) * number(data.comprimento || source.comprimentoPadrao || 0)),
        custoUnitario: unitCost, custoTotal: quantity * unitCost, giro: "Sem movimentação", local: data.local || "", status: "normal",
        dataEntrada: now(), ultimaMovimentacao: now(), atualizadoEm: now()
      };
      saveItem(record);
      const movement = { id: `MOV-${Date.now()}`, companyId: companyId(), tipo: "ENTRADA", itemId: record.id, materialId: source.id, material: record.descricao, quantidade: quantity, peso: record.peso, local: record.local, origem: "", destino: record.local, observacao: data.observacao || "", usuario: user(), createdAt: now() };
      write(movementsKey, [...read(movementsKey), movement]);
      audit(record.id, "ENTRY", before, record, data.observacao);
      return record;
    },
    createExit(data) {
      const quantity = number(data.quantidade);
      if (quantity <= 0) throw new Error("A quantidade de saída deve ser maior que zero.");
      const items = read(itemsKey);
      const item = items.find((entry) => entry.id === data.itemId && entry.companyId === companyId());
      if (!item) throw new Error("Item de estoque não encontrado.");
      if (number(item.quantidade) < quantity) throw new Error("Saldo insuficiente para esta baixa.");
      const before = { ...item };
      item.quantidade = number(item.quantidade) - quantity;
      item.peso = Math.max(0, number(item.peso) - number(data.peso || (number(item.peso) / Math.max(number(before.quantidade), 1)) * quantity));
      item.custoTotal = item.quantidade * number(item.custoUnitario);
      item.ultimaMovimentacao = now();
      item.giro = "Alto giro";
      saveItem(item);
      write(movementsKey, [...read(movementsKey), { id: `MOV-${Date.now()}`, companyId: companyId(), tipo: "SAÍDA", itemId: item.id, materialId: item.materialId, material: item.descricao, quantidade: quantity, peso: data.peso || "", local: item.local, origem: item.local, destino: data.destino || "", motivo: data.motivo || "", observacao: data.observacao || "", usuario: user(), createdAt: now() }]);
      audit(item.id, "EXIT", before, item, data.motivo || data.observacao);
      return item;
    },
    transfer(data) {
      const quantity = number(data.quantidade);
      if (quantity <= 0) throw new Error("A quantidade de transferência deve ser maior que zero.");
      if (!data.destino || data.destino === data.origem) throw new Error("Informe um destino diferente da origem.");
      const source = this.createExit({ itemId: data.itemId, quantidade: quantity, motivo: "TRANSFERÊNCIA", destino: data.destino, observacao: data.observacao });
      const result = this.createEntry({ materialId: source.materialId, quantidade: quantity, local: data.destino, comprimento: source.comprimento, peso: number(data.peso), custoUnitario: source.custoUnitario, observacao: data.observacao, lais: source.lais, corrida: source.corrida, lote: source.lote });
      const movements = read(movementsKey);
      const exit = movements[movements.length - 2];
      const entry = movements[movements.length - 1];
      exit.tipo = "TRANSFERÊNCIA"; entry.tipo = "TRANSFERÊNCIA";
      exit.origem = data.origem; exit.destino = data.destino; entry.origem = data.origem; entry.destino = data.destino;
      write(movementsKey, movements);
      return result;
    },
    importRow(data) {
      const source = material(null, data.codigo);
      if (!source) throw new Error(`Código não encontrado no catálogo: ${data.codigo}`);
      return this.createEntry({ ...data, materialId: source.id, local: data.local || "" });
    },
    indicators() {
      const items = this.list();
      return { totalItens: items.length, quantidadeTotal: items.reduce((sum, item) => sum + number(item.quantidade), 0), valorTotal: items.reduce((sum, item) => sum + number(item.custoTotal), 0), semMovimentacao: items.filter((item) => item.giro === "Sem movimentação").length, maiorGiro: items.filter((item) => item.giro === "Alto giro").length, baixoGiro: items.filter((item) => item.giro === "Baixo giro").length, semLocalizacao: items.filter((item) => !item.local).length, divergencias: items.filter((item) => item.status === "divergence").length };
    },
    locationLabel: locationName
  };
  window.StockService = service;
})();
