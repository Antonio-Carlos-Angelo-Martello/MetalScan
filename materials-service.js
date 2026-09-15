window.MaterialsService = (() => {
  const key = "metalscan.materials";
  const read = () => JSON.parse(localStorage.getItem(key) || "[]");
  const write = (items) => localStorage.setItem(key, JSON.stringify(items));
  return {
    list: read,
    save(material) {
      const items = read();
      const duplicate = items.some((item) => item.codigo.toLowerCase() === material.codigo.toLowerCase() && item.id !== material.id);
      if (duplicate) throw new Error("Já existe um material cadastrado com este código.");
      const now = new Date().toISOString();
      const record = {
        ...material,
        id: material.id || `MAT-${Date.now()}`,
        largura: material.largura || "",
        altura: material.altura || "",
        fonteNome: material.fonteNome || "",
        fonteUrl: material.fonteUrl || "",
        fonteData: material.fonteData || "",
        status: material.status || "active",
        criadoEm: material.criadoEm || now,
        atualizadoEm: now
      };
      write(material.id ? items.map((item) => item.id === material.id ? record : item) : [...items, record]);
      return record;
    },
    setStatus(id, status) { write(read().map((item) => item.id === id ? { ...item, status, atualizadoEm: new Date().toISOString() } : item)); },
    remove(id) { write(read().filter((item) => item.id !== id)); }
  };
})();
