(function () {
  const key = "metalscan.imports";
  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (error) {
      console.error("Não foi possível carregar o histórico de importações.", error);
      return [];
    }
  }
  function write(items) {
    localStorage.setItem(key, JSON.stringify(items));
  }
  window.ImportsService = {
    list() { return read(); },
    save(item) {
      const items = read();
      const record = { id: item.id || `IMP-${Date.now()}`, criadoEm: item.criadoEm || new Date().toISOString(), atualizadoEm: new Date().toISOString(), ...item };
      const index = items.findIndex((entry) => entry.id === record.id);
      if (index >= 0) items[index] = record; else items.push(record);
      write(items);
      return record;
    }
  };
})();
