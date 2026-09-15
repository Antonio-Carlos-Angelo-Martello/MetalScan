(function () {
  const endpoint = window.METALSCAN_INTELLIGENCE_ENDPOINT || "/api/material-intelligence/search";
  const normalize = (value) => String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

  window.MaterialIntelligenceService = {
    normalizeDescription(value) {
      return String(value || "").replace(/(\d+),(\d+)/g, "$1.$2").replace(/\s+x\s+/gi, "x").replace(/\s+/g, " ").trim();
    },
    buildQuery(fields) {
      return Object.entries(fields).filter(([, value]) => String(value || "").trim()).map(([key, value]) => `${key}: ${value}`).join(" | ");
    },
    async search(fields) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: this.buildQuery(fields), fields })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Não foi possível pesquisar na internet.");
      return Array.isArray(payload.results) ? payload.results : [];
    },
    toMaterial(result) {
      return {
        codigo: result.codigo || "",
        descricao: this.normalizeDescription(result.descricao || ""),
        tipo: result.tipo || "Outro",
        material: result.material || "",
        norma: result.norma || "",
        bitola: result.bitola || "",
        diametro: result.diametro || "",
        espessura: result.espessura || "",
        largura: result.largura || "",
        altura: result.altura || "",
        comprimentoPadrao: result.comprimento || "",
        pesoTeoricoMetro: result.pesoTeorico || "",
        unidade: result.unidade || "un.",
        fabricante: result.fabricante || "",
        fornecedor: result.fornecedor || "",
        fonteNome: result.fonteNome || "",
        fonteUrl: result.fonteUrl || "",
        fonteData: result.fonteData || new Date().toISOString()
      };
    },
    normalizeKey(value) {
      return normalize(value);
    }
  };
})();
