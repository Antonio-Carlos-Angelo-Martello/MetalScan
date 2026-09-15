(function () {
  const endpoint = () => window.METALSCAN_AI && window.METALSCAN_AI.endpoint;
  const empty = "Não identificado — informe manualmente.";

  window.MaterialIdentificationService = {
    unavailableMessage: empty,
    async identify(file, capturedBlob) {
      const source = window.ImageService.getSource(file, capturedBlob);
      if (!source) throw new Error("Selecione ou capture uma imagem antes da análise.");
      const api = endpoint();
      if (!api) throw new Error("Análise por IA ainda não configurada no backend.");
      const payload = new FormData();
      payload.append("image", source, file?.name || "material-camera.png");
      payload.append("mode", "material");
      const response = await fetch(api, { method: "POST", body: payload });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `A API respondeu com status ${response.status}.`);
      return {
        description: result.description || empty,
        material_type: result.material_type || null,
        steel_type: result.steel_type || null,
        format: result.format || null,
        diameter_mm: result.diameter_mm ?? null,
        wall_mm: result.wall_mm ?? null,
        color: result.color || null,
        standard: result.standard || null,
        manufacturer: result.manufacturer || null,
        code: result.code || null,
        confidence: Number.isFinite(Number(result.confidence)) ? Number(result.confidence) : 0,
        observations: result.observations || ""
      };
    }
  };
})();
