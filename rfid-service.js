window.RFIDService = (() => {
  const tagsKey = "metalscan.rfid.tags";
  const inventoriesKey = "metalscan.rfid.inventories";
  const read = (key) => JSON.parse(localStorage.getItem(key) || "[]");
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  return {
    listTags: () => read(tagsKey),
    registerTag(tag) {
      const tags = read(tagsKey);
      if (tags.some((item) => item.epc === tag.epc)) throw new Error("Este EPC já está cadastrado.");
      const record = { ...tag, id: `RF-${String(tags.length + 1).padStart(5, "0")}`, status: "active", createdAt: new Date().toISOString() };
      write(tagsKey, [...tags, record]);
      return record;
    },
    inactivateTag(id) {
      const tags = read(tagsKey).map((tag) => tag.id === id ? { ...tag, status: "inactive", updatedAt: new Date().toISOString() } : tag);
      write(tagsKey, tags);
    },
    startInventory(location) {
      const expected = read(tagsKey).filter((tag) => tag.status === "active" && tag.location === location);
      const inventory = { id: `INV-${Date.now()}`, location, expected, read: [], startedAt: new Date().toISOString(), status: "in_progress" };
      write(inventoriesKey, [...read(inventoriesKey), inventory]);
      return inventory;
    },
    registerRead(inventoryId, epc) {
      const inventories = read(inventoriesKey);
      const inventory = inventories.find((item) => item.id === inventoryId);
      if (!inventory || inventory.status !== "in_progress" || inventory.read.some((item) => item.epc === epc)) return inventory;
      const tag = read(tagsKey).find((item) => item.epc === epc);
      inventory.read.push({ epc, state: !tag ? "unregistered" : tag.location === inventory.location ? "read" : "wrong_location", tag });
      write(inventoriesKey, inventories);
      return inventory;
    },
    finishInventory(inventoryId) {
      const inventories = read(inventoriesKey);
      const inventory = inventories.find((item) => item.id === inventoryId);
      if (!inventory) throw new Error("Inventário não encontrado.");
      inventory.status = "completed";
      inventory.finishedAt = new Date().toISOString();
      return inventory;
    },
    listInventories: () => read(inventoriesKey)
  };
})();
