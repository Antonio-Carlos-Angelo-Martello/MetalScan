(function () {
  const key = "metalscan.catalog-partners";
  const read = () => JSON.parse(localStorage.getItem(key) || "[]");
  const write = (items) => localStorage.setItem(key, JSON.stringify(items));
  window.PartnersService = {
    list(type) { return read().filter((item) => !type || item.tipo === type); },
    save(partner) {
      const items = read();
      const record = { ...partner, id: partner.id || `PAR-${Date.now()}`, status: partner.status || "active", atualizadoEm: new Date().toISOString() };
      const duplicate = items.some((item) => item.tipo === record.tipo && item.nome.toLowerCase() === record.nome.toLowerCase() && item.id !== record.id);
      if (duplicate) throw new Error(`Já existe este ${record.tipo === "fabricante" ? "fabricante" : "fornecedor"} cadastrado.`);
      const index = items.findIndex((item) => item.id === record.id);
      if (index >= 0) items[index] = record; else items.push(record);
      write(items);
      return record;
    },
    setStatus(id, status) { write(read().map((item) => item.id === id ? { ...item, status, atualizadoEm: new Date().toISOString() } : item)); }
  };
})();
