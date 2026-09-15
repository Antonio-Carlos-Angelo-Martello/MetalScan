(function () {
  const densities = { carbon: 7850, stainless: 8000, aluminum: 2700 };
  window.WeightCalculationService = {
    theoreticalWeightPerMeter({ diameter, wall, profile, steelType }) {
      const d = Number(diameter);
      const t = Number(wall);
      if (!Number.isFinite(d) || !Number.isFinite(t) || d <= 0 || t <= 0 || t * 2 >= d) return null;
      const area = profile === "round_bar"
        ? Math.PI * (d / 1000) ** 2 / 4
        : Math.PI * (((d / 1000) ** 2 - ((d - 2 * t) / 1000) ** 2) / 4);
      return area * (densities[steelType] || densities.carbon);
    },
    calculate({ diameter, wall, profile, steelType, length, quantity }) {
      const perMeter = this.theoreticalWeightPerMeter({ diameter, wall, profile, steelType });
      const meters = Number(length);
      const pieces = Number(quantity);
      if (perMeter === null || !Number.isFinite(meters) || !Number.isFinite(pieces) || meters <= 0 || pieces <= 0) return null;
      return { perMeter, perPiece: perMeter * meters, total: perMeter * meters * pieces, totalLength: meters * pieces };
    }
  };
})();
