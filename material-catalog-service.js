(function () {
  window.MaterialCatalogService = {
    search(query) {
      const normalized = String(query || "").trim().toLowerCase();
      if (!normalized) return [];
      return MaterialsService.list().filter((item) => [
        item.codigo, item.descricao, item.material, item.tipo, item.bitola,
        item.diametro, item.espessura, item.norma, item.fabricante, item.fornecedor
      ].join(" ").toLowerCase().includes(normalized));
    }
  };
})();
