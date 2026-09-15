(function () {
  const key = "metalscan.catalogs";
  const historyKey = "metalscan.catalog-imports";

  function read(storageKey) {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (error) {
      console.error("Não foi possível carregar os catálogos locais.", error);
      return [];
    }
  }

  function write(storageKey, value) {
    localStorage.setItem(storageKey, JSON.stringify(value));
  }

  function normalize(record) {
    const now = new Date().toISOString();
    return {
      id: record.id || `CAT-${Date.now()}`,
      empresaId: record.empresaId || "",
      empresa: record.empresa || "",
      cnpj: record.cnpj || "",
      fabricante: record.fabricante || "",
      contato: record.contato || "",
      observacoes: record.observacoes || "",
      nome: record.nome || "",
      codigo: record.codigo || "",
      tipo: record.tipo || "Fornecedor",
      versao: record.versao || "",
      dataCatalogo: record.dataCatalogo || "",
      dataAtualizacao: record.dataAtualizacao || now.slice(0, 10),
      arquivo: record.arquivo || null,
      formato: record.formato || "",
      quantidadeMateriais: Number(record.quantidadeMateriais) || 0,
      status: record.status || "active",
      criadoEm: record.criadoEm || now,
      atualizadoEm: now
    };
  }

  window.CatalogsService = {
    list() {
      return read(key).map(normalize);
    },
    listImports() {
      return read(historyKey);
    },
    save(record) {
      const catalogs = this.list();
      const normalized = normalize(record);
      const duplicate = catalogs.find((item) => item.id !== normalized.id && item.empresa.toLowerCase() === normalized.empresa.toLowerCase() && item.nome.toLowerCase() === normalized.nome.toLowerCase());
      if (duplicate) throw new Error("Já existe um catálogo com esta empresa e nome.");
      const index = catalogs.findIndex((item) => item.id === normalized.id);
      if (index >= 0) catalogs[index] = normalized;
      else catalogs.push(normalized);
      write(key, catalogs);
      return normalized;
    },
    setStatus(id, status) {
      const item = this.list().find((catalog) => catalog.id === id);
      if (!item) throw new Error("Catálogo não encontrado.");
      item.status = status;
      this.save(item);
      return item;
    },
    remove(id) {
      const catalogs = this.list();
      const item = catalogs.find((catalog) => catalog.id === id);
      if (!item) throw new Error("Catálogo não encontrado.");
      if (item.quantidadeMateriais > 0 || this.listImports().some((entry) => entry.catalogoId === id)) {
        throw new Error("Este catálogo possui registros vinculados e não pode ser excluído. Utilize a opção Inativar.");
      }
      write(key, catalogs.filter((catalog) => catalog.id !== id));
    },
    addImport(entry) {
      const imports = this.listImports();
      imports.push({ id: `IMP-${Date.now()}`, ...entry });
      write(historyKey, imports);
    }
  };
})();
