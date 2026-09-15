const backdrop = document.querySelector("#modal-backdrop");
const countModal = document.querySelector("#count-modal");
const identifyModal = document.querySelector("#identify-modal");
const catalogModal = document.querySelector("#catalog-modal");
const catalogsManagerModal = document.querySelector("#catalogs-manager-modal");
const importsManagerModal = document.querySelector("#imports-manager-modal");
const materialIntelligenceModal = document.querySelector("#material-intelligence-modal");
const materialIntelligenceReviewModal = document.querySelector("#material-intelligence-review-modal");
const rfidModal = document.querySelector("#rfid-modal");
const materialIdentifyModal = document.querySelector("#material-identify-modal");
const materialsModal = document.querySelector("#materials-modal");
const stockModal = document.querySelector("#stock-modal");
const authModal = document.querySelector("#auth-modal");
const adminModal = document.querySelector("#admin-modal");
const authButton = document.querySelector("#auth-button");
const logoutButton = document.querySelector("#logout-button");
const countResult = document.querySelector("#count-result");
const countFile = document.querySelector("#count-file");
const dropzone = document.querySelector("#count-drop");
const countPreview = document.querySelector("#count-preview");
const aiStatus = document.querySelector("#ai-status");
const identifyFile = document.querySelector("#identify-file");
const identifyDrop = document.querySelector("#identify-drop");
const identifyPreview = document.querySelector("#identify-preview");
const materialImageFile = document.querySelector("#material-image-file");
const materialImagePreview = document.querySelector("#material-image-preview");
const materialCamera = document.querySelector("#material-camera");
const materialCameraCanvas = document.querySelector("#material-camera-canvas");
const materialCaptureArea = document.querySelector("#material-capture-area");
const materialIdentifyStatus = document.querySelector("#material-identify-status");
let materialCameraStream = null;
let materialCapturedBlob = null;
const countStorageKey = "metalscan.counts";
let savedCounts = JSON.parse(localStorage.getItem(countStorageKey) || "[]");
const companySelect = document.querySelector("#company-select");
const companyColor = document.querySelector("#company-color");
const companyName = document.querySelector("#company-name");
const catalogCompany = document.querySelector("#catalog-company");
const catalogStatus = document.querySelector("#catalog-status");
const catalogFile = document.querySelector("#catalog-file");
const catalogSearch = document.querySelector("#catalog-search");
const tipList = document.querySelector("#tip-list");
const tipTotal = document.querySelector("#tip-total");
const sidebar = document.querySelector(".sidebar");
const sidebarTrigger = document.querySelector(".sidebar-trigger");
const appShell = document.querySelector(".app-shell");
let sidebarCloseTimer;
let sidebarPinned = false;
const tipsStorageKey = "metalscan.tips";
const remoteClient = window.METALSCAN_SUPABASE && window.supabase
  ? window.supabase.createClient(window.METALSCAN_SUPABASE.url, window.METALSCAN_SUPABASE.anonKey)
  : null;
let savedTips = JSON.parse(localStorage.getItem(tipsStorageKey) || "[]").map((tip) => ({ ...tip, status: tip.status || "active" }));
let tipSequence = savedTips.reduce((highest, tip) => Math.max(highest, Number(tip.id.replace("PT-", "")) || 0), 0) + 1;
let editingTipId = null;

document.querySelector(".mobile-menu").addEventListener("click", () => {
  if (sidebar.classList.contains("sidebar-open")) {
    collapseSidebar();
  } else {
    expandSidebar();
  }
});

function identificationValue(id, fallback = "") {
  return document.querySelector(id).value.trim() || fallback;
}

function showMaterialIdentification(result) {
  const empty = MaterialIdentificationService.unavailableMessage;
  const value = (item) => item === null || item === undefined || item === "" ? empty : item;
  document.querySelector("#material-identify-result").hidden = true;
  document.querySelector("#material-identify-details").hidden = false;
  document.querySelector("#material-result-description").textContent = value(result.description);
  document.querySelector("#material-result-confidence").textContent = result.confidence ? `${Math.round(result.confidence * 100)}%` : empty;
  document.querySelector("#material-result-code").textContent = value(result.code);
  document.querySelector("#material-result-type").textContent = value(result.material_type);
  document.querySelector("#material-result-steel").textContent = value(result.steel_type);
  document.querySelector("#material-result-format").textContent = value(result.format);
  document.querySelector("#material-result-diameter").textContent = result.diameter_mm ? `${result.diameter_mm} mm` : empty;
  document.querySelector("#material-result-wall").textContent = result.wall_mm ? `${result.wall_mm} mm` : empty;
  document.querySelector("#material-result-standard").textContent = value(result.standard);
  document.querySelector("#material-result-color").textContent = value(result.color);
  document.querySelector("#material-result-manufacturer").textContent = value(result.manufacturer);
  document.querySelector("#identified-material-field").value = result.steel_type || "";
  document.querySelector("#identified-type-field").value = result.material_type || "";
  document.querySelector("#identified-diameter-field").value = result.diameter_mm || "";
  document.querySelector("#identified-wall-field").value = result.wall_mm || "";
  document.querySelector("#identified-color-field").value = result.color || "";
  document.querySelector("#identified-standard-field").value = result.standard || "";
  document.querySelector("#identified-manufacturer-field").value = result.manufacturer || "";
  document.querySelector("#identified-code-field").value = result.code || "";
}
document.querySelector("#export-materials").addEventListener("click", () => {
  const rows = MaterialsService.list().map((item) => [item.codigo, item.descricao, item.tipo, item.material, item.bitola, item.diametro, item.espessura, item.norma, item.comprimentoPadrao, item.pesoTeoricoPeca || item.pesoTeoricoMetro, item.unidade, item.status]);
  csvDownload("metalscan-materiais.csv", ["Código", "Descrição", "Tipo", "Material", "Bitola", "Diâmetro", "Espessura", "Norma", "Comprimento", "Peso teórico", "Unidade", "Status"], rows);
});

function expandSidebar() {
  window.clearTimeout(sidebarCloseTimer);
  sidebar.classList.add("sidebar-open");
  appShell.classList.add("menu-expanded");
  sidebarTrigger.setAttribute("aria-expanded", "true");
}

function collapseSidebar() {
  if (sidebarPinned) return;
  sidebarCloseTimer = window.setTimeout(() => {
    sidebar.classList.remove("sidebar-open");
    appShell.classList.remove("menu-expanded");
    sidebarTrigger.setAttribute("aria-expanded", "false");
  }, 180);
}

sidebar.addEventListener("mouseenter", expandSidebar);
sidebar.addEventListener("mouseleave", collapseSidebar);
sidebarTrigger.addEventListener("mouseenter", expandSidebar);
sidebarTrigger.addEventListener("mouseleave", collapseSidebar);
sidebarTrigger.addEventListener("focus", expandSidebar);
sidebarTrigger.addEventListener("blur", collapseSidebar);
sidebarTrigger.addEventListener("click", () => {
  window.clearTimeout(sidebarCloseTimer);
  sidebarPinned = !sidebarPinned;
  sidebar.classList.toggle("sidebar-open", sidebarPinned);
  appShell.classList.toggle("menu-expanded", sidebarPinned);
  sidebarTrigger.setAttribute("aria-expanded", String(sidebarPinned));
});

function setupSidebarGroups() {
  const nav = document.querySelector(".nav");
  if (!nav || nav.dataset.groupsReady === "true") return;
  nav.dataset.groupsReady = "true";
  let currentGroup = null;

  Array.from(nav.children).forEach((element) => {
    if (element.classList.contains("nav-group-label")) {
      const group = document.createElement("section");
      group.className = "nav-group";
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "nav-group-toggle";
      toggle.setAttribute("aria-expanded", "false");
      toggle.innerHTML = `<span class="nav-group-icon">◇</span><span>${element.textContent}</span><b>⌄</b>`;
      group.appendChild(toggle);
      element.replaceWith(group);
      currentGroup = group;
      toggle.addEventListener("click", () => {
        const isOpen = group.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(isOpen));
      });
      return;
    }
    if (currentGroup && element.classList.contains("nav-item")) {
      currentGroup.appendChild(element);
    }
  });
}

setupSidebarGroups();

const shortcutsToggle = document.querySelector("#toggle-shortcuts");
const shortcutContent = document.querySelector("#shortcut-content");
const shortcutsStorageKey = "metalscan.shortcuts.expanded";
function setShortcutsExpanded(expanded) {
  shortcutsToggle.setAttribute("aria-expanded", String(expanded));
  shortcutsToggle.setAttribute("aria-controls", "shortcut-content");
  shortcutContent.setAttribute("aria-hidden", String(!expanded));
  shortcutContent.inert = !expanded;
  document.querySelector("#shortcuts-section").classList.toggle("is-collapsed", !expanded);
  shortcutsToggle.innerHTML = `${expanded ? "Recolher" : "Expandir"} <span aria-hidden="true">${expanded ? "⌃" : "⌄"}</span>`;
  localStorage.setItem(shortcutsStorageKey, String(expanded));
}
setShortcutsExpanded(localStorage.getItem(shortcutsStorageKey) !== "false");
shortcutsToggle.addEventListener("click", () => setShortcutsExpanded(shortcutsToggle.getAttribute("aria-expanded") !== "true"));

sidebar.addEventListener("click", (event) => {
  const link = event.target.closest("a.nav-item");
  if (link && window.innerWidth <= 900) {
    sidebar.classList.remove("sidebar-open");
    appShell.classList.remove("menu-expanded");
  }
});

function renderTips() {
  tipList.innerHTML = "";
  if (savedTips.length === 0) {
    tipList.innerHTML = '<p class="empty-list">Nenhuma ponta cadastrada nesta sessão.</p>';
  } else {
    savedTips.slice().reverse().forEach((tip) => {
      const statusLabel = tip.status === "inactive" ? "Inativo" : "Ativo";
      tipList.insertAdjacentHTML("beforeend", `<div class="tip-row"><div><strong>${tip.id}</strong><small>${tip.code} · ${tip.description}</small></div><span>${tip.unit}</span><span>Ø ${tip.diameter} mm</span><span>${tip.length} m</span><span>${tip.quantity} un.</span><b>${tip.weight} kg</b><span class="tip-status ${tip.status}">${statusLabel}</span><button class="tip-action edit-tip" data-id="${tip.id}">Editar</button><button class="tip-action delete-tip" data-id="${tip.id}">Excluir</button></div>`);
    });

  }
  tipTotal.textContent = `${savedTips.length} ${savedTips.length === 1 ? "registro" : "registros"}`;
  document.querySelector("#next-tip-id").textContent = `ID automático · PT-${String(tipSequence).padStart(4, "0")}`;
}

renderTips();

function renderCounts() {
  const body = document.querySelector("#count-table tbody");
  body.innerHTML = savedCounts.length ? savedCounts.slice().reverse().map((item) => `<tr><td>${item.date}</td><td>${item.company}</td><td>${item.material}</td><td>${item.quantity}</td><td>${item.weight}</td></tr>`).join("") : '<tr><td colspan="5">Nenhuma contagem registrada.</td></tr>';
}
renderCounts();

function csvDownload(filename, headers, rows) {
  const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(";")).join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

document.querySelector("#export-counts").addEventListener("click", () => csvDownload("metalscan-contagens.csv", ["Data", "Empresa", "Material", "Quantidade", "Peso teórico"], savedCounts.map((item) => [item.date, item.company, item.material, item.quantity, item.weight])));
document.querySelector("#export-tips").addEventListener("click", () => csvDownload("metalscan-pontas.csv", ["ID", "Código", "Descrição", "Unidade", "Diâmetro", "Comprimento", "Quantidade", "Peso kg", "Status"], savedTips.map((tip) => [tip.id, tip.code, tip.description, tip.unit, tip.diameter, tip.length, tip.quantity, tip.weight, tip.status])));

function updateIdentifyPhoto(file) {
  if (!file || !file.type.startsWith("image/")) return;
  identifyPreview.src = URL.createObjectURL(file);
  identifyPreview.hidden = false;
  identifyDrop.querySelector("strong").textContent = file.name;
  identifyDrop.querySelector("span").textContent = "Foto pronta para análise";
}
identifyDrop.addEventListener("click", (event) => { if (event.target !== identifyFile) identifyFile.click(); });
identifyFile.addEventListener("change", () => updateIdentifyPhoto(identifyFile.files[0]));
document.querySelector("#analyze-identify").addEventListener("click", async () => {
  const status = document.querySelector("#identify-status");
  if (!identifyFile.files[0]) { status.textContent = "Selecione uma foto da ponta antes de analisar."; return; }
  const endpoint = window.METALSCAN_AI && window.METALSCAN_AI.endpoint;
  if (!endpoint) { status.textContent = "Configure a API de IA para análise automática."; return; }
  status.textContent = "Analisando ponta...";
  try {
    const payload = new FormData();
    payload.append("image", identifyFile.files[0]);
    payload.append("mode", "tip");
    const response = await fetch(endpoint, { method: "POST", body: payload });
    if (!response.ok) throw new Error(`A API respondeu com status ${response.status}.`);
    const result = await response.json();
    document.querySelector("#identified-description").textContent = result.description || result.standard || "Especificação identificada";
    document.querySelector("#identify-confidence").textContent = `${Math.round((Number(result.confidence || 0) * 100))}%`;
    document.querySelector("#tip-description").value = result.description || document.querySelector("#tip-description").value;
    document.querySelector("#tip-diameter").value = result.diameter_mm || "";
    document.querySelector("#tip-length").value = result.length_m || document.querySelector("#tip-length").value;
    status.textContent = "Análise concluída. Confirme os dados antes de cadastrar.";
  } catch (error) { status.textContent = error.message; }
});

async function loadRemoteTips() {
  if (!remoteClient) return;
  const { data: sessionData } = await remoteClient.auth.getSession();
  if (!sessionData.session) return;
  const { data: memberships, error: membershipError } = await remoteClient
    .from("company_members")
    .select("company_id")
    .eq("user_id", sessionData.session.user.id)
    .limit(1);
  if (membershipError) throw membershipError;
  const companyId = memberships && memberships[0] ? memberships[0].company_id : null;
  if (!companyId) return;
  const { data, error } = await remoteClient.from("tips").select("*").eq("company_id", companyId).order("sequential_id");
  if (error) throw error;
  savedTips = (data || []).map((tip) => ({
    id: `PT-${String(tip.sequential_id).padStart(4, "0")}`,
    code: tip.code,
    description: tip.description,
    unit: tip.unit,
    diameter: tip.diameter ?? "—",
    length: tip.length ?? "—",
    quantity: tip.quantity,
    weight: tip.weight_kg,
    status: tip.status || "active"
  }));
  tipSequence = savedTips.reduce((highest, tip) => Math.max(highest, Number(tip.id.replace("PT-", "")) || 0), 0) + 1;
  renderTips();
}

loadRemoteTips().catch((error) => console.error("Não foi possível carregar as pontas do Supabase.", error));

function openModal(modal) {
  backdrop.hidden = false;
  [authModal, adminModal, countModal, identifyModal, catalogModal, catalogsManagerModal, importsManagerModal, materialIntelligenceModal, materialIntelligenceReviewModal, rfidModal, materialIdentifyModal, materialsModal, stockModal].forEach((item) => {
    item.hidden = item !== modal;
  });
  document.body.style.overflow = "hidden";
}

function closeModal() {
  backdrop.hidden = true;
  countResult.hidden = true;
  if (materialCameraStream) {
    materialCameraStream.getTracks().forEach((track) => track.stop());
    materialCameraStream = null;
  }
  materialCamera.hidden = true;
  document.body.style.overflow = "";
}

let importFile = null;
let importRows = [];
let importHeaders = [];
let importValidation = [];
let importMapping = {};

const importFields = {
  materials: [
    ["codigo", "Código", true], ["descricao", "Descrição", true], ["material", "Material", true], ["tipo", "Tipo", true],
    ["bitola", "Bitola", false], ["diametro", "Diâmetro", false], ["espessura", "Espessura", false], ["norma", "Norma", false],
    ["comprimentoPadrao", "Comprimento padrão", false], ["pesoTeoricoMetro", "Peso teórico por metro", false], ["unidade", "Unidade", false]
  ],
  catalogs: [["empresa", "Empresa", true], ["nome", "Nome do catálogo", true], ["tipo", "Tipo", false], ["versao", "Versão", false]],
  stock: [["codigo", "Código", true], ["descricao", "Descrição", false], ["quantidade", "Quantidade", true], ["unidade", "Unidade", false], ["local", "Local", false], ["comprimento", "Comprimento", false], ["peso", "Peso", false], ["lais", "LAIS", false], ["corrida", "Corrida", false], ["lote", "Lote", false], ["fornecedor", "Fornecedor", false], ["custoUnitario", "Custo unitário", false]]
};

function importTypeChanged() {
  const type = document.querySelector("#import-type").value;
  const help = { materials: "Importe dados para o cadastro mestre de materiais.", catalogs: "Relacione empresas e catálogos já existentes ou crie registros após a confirmação.", stock: "A estrutura está preparada para estoque; códigos inexistentes serão rejeitados." };
  document.querySelector("#import-type-help").textContent = help[type];
  renderImportTemplate(type);
  if (importFile) renderImportMapping();
}

function renderImportTemplate(type = document.querySelector("#import-type").value) {
  const fields = importFields[type];
  document.querySelector("#import-template-columns").innerHTML = fields.map(([, label, required]) => `<span class="${required ? "required" : ""}">${label}${required ? " *" : ""}</span>`).join("");
}

function downloadImportTemplate() {
  const type = document.querySelector("#import-type").value;
  const headers = importFields[type].map(([, label]) => label);
  const sample = type === "materials"
    ? ["MAT-001", "Tubo aço carbono", "Aço carbono", "Tubo", "50,8", "50,8", "2", "ABNT NBR 5580", "6", "3,56", "un."]
    : type === "catalogs"
      ? ["Fornecedor ABC", "Tubos e Barras 2026", "Fornecedor", "1.0"]
      : ["MAT-001", "Tubo aço carbono", "10", "un.", "NAVE 01", "6", "21,36", "LAIS-001", "C123", "L001", "Fornecedor", "12.50"];
  csvDownload(`modelo-importacao-${type}.csv`, headers, [sample]);
}

function parseImportText(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  const rows = lines.map((line) => line.split(/[;,]/).map((value) => value.trim().replace(/^"|"$/g, "")));
  importHeaders = rows.shift() || [];
  importRows = rows;
  renderImportMapping();
}

function guessImportMapping(fieldList) {
  const normalize = (value) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
  return Object.fromEntries(fieldList.map(([field, label]) => {
    const target = normalize(label);
    const index = importHeaders.findIndex((header) => {
      const source = normalize(header);
      return source === target || source.includes(normalize(field)) || (field === "pesoTeoricoMetro" && (source.includes("kgm") || source.includes("peso")));
    });
    return [field, index >= 0 ? String(index) : ""];
  }));
}

function renderImportMapping() {
  const type = document.querySelector("#import-type").value;
  const fields = importFields[type];
  importMapping = guessImportMapping(fields);
  document.querySelector("#import-mapping").innerHTML = fields.map(([field, label, required]) => `<label>${label}${required ? " *" : ""}<select data-import-map="${field}"><option value="">Ignorar coluna</option>${importHeaders.map((header, index) => `<option value="${index}" ${importMapping[field] === String(index) ? "selected" : ""}>${header || `Coluna ${index + 1}`}</option>`).join("")}</select></label>`).join("");
  document.querySelectorAll("[data-import-map]").forEach((select) => select.addEventListener("change", () => { importMapping[select.dataset.importMap] = select.value; validateImportRows(); }));
  document.querySelector("#import-workflow").hidden = false;
  document.querySelector("#import-preview-meta").textContent = `${importRows.length} registros · ${importHeaders.length} colunas identificadas`;
  validateImportRows();
}

function mappedRow(row, type) {
  return Object.fromEntries(Object.keys(importMapping).map((field) => [field, importMapping[field] === "" ? "" : (row[Number(importMapping[field])] || "").trim()]));
}

function validateImportRows() {
  const type = document.querySelector("#import-type").value;
  const fields = importFields[type];
  const required = fields.filter((field) => field[2]).map((field) => field[0]);
  const existingCodes = type === "materials" ? new Set(MaterialsService.list().map((item) => item.codigo.toLowerCase())) : type === "stock" ? new Set(MaterialsService.list().map((item) => item.codigo.toLowerCase())) : new Set();
  const duplicatePolicy = document.querySelector("#import-duplicate-policy").value;
  const codesInFile = new Set();
  importValidation = importRows.map((row, index) => {
    const data = mappedRow(row, type);
    const reasons = [];
    required.forEach((field) => { if (!data[field]) reasons.push(`${fields.find((entry) => entry[0] === field)[1]} ausente`); });
    ["diametro", "espessura", "comprimentoPadrao", "comprimento", "pesoTeoricoMetro", "pesoTeorico", "peso", "quantidade", "custoUnitario"].forEach((field) => {
      if (data[field] && !Number.isFinite(Number(data[field].replace(",", ".")))) reasons.push(`${field} inválido`);
    });
    let operation = "NOVO";
    if ((type === "materials" || type === "stock") && data.codigo) {
      const normalized = data.codigo.toLowerCase();
      if (codesInFile.has(normalized)) reasons.push("Código duplicado no arquivo");
      codesInFile.add(normalized);
      if (!existingCodes.has(normalized) && type === "stock") reasons.push("Código inexistente no catálogo");
      if (existingCodes.has(normalized) && type === "materials") operation = duplicatePolicy === "update" ? "ATUALIZAR" : "IGNORAR";
    }
    return { line: index + 2, data, operation: reasons.length ? "ERRO" : operation, reasons, original: row };
  });
  const valid = importValidation.filter((item) => item.operation !== "ERRO");
  const errors = importValidation.length - valid.length;
  document.querySelector("#import-analyzed").textContent = importValidation.length;
  document.querySelector("#import-valid").textContent = valid.length;
  document.querySelector("#import-invalid").textContent = errors;
  document.querySelector("#import-attention").textContent = valid.filter((item) => item.operation === "ATUALIZAR" || item.operation === "IGNORAR").length;
  document.querySelector("#import-new").textContent = valid.filter((item) => item.operation === "NOVO").length;
  document.querySelector("#import-updates").textContent = valid.filter((item) => item.operation === "ATUALIZAR").length;
  const head = document.querySelector("#import-preview-table thead");
  const body = document.querySelector("#import-preview-table tbody");
  head.innerHTML = `<tr><th>Linha</th>${importHeaders.map((header) => `<th>${header}</th>`).join("")}<th>Operação</th><th>Situação</th><th>Motivo</th></tr>`;
  body.innerHTML = importValidation.slice(0, 100).map((item) => `<tr><td>${item.line}</td>${importHeaders.map((_, index) => `<td>${item.original[index] || "—"}</td>`).join("")}<td>${item.operation}</td><td class="import-state ${item.operation.toLowerCase()}">${item.operation === "ERRO" ? "Erro" : item.operation === "ATUALIZAR" || item.operation === "IGNORAR" ? "Atenção" : "Válido"}</td><td>${item.reasons.join("; ") || (item.operation === "IGNORAR" ? "Código já cadastrado; registro será ignorado." : "Pronto para importar")}</td></tr>`).join("");
  document.querySelector("#confirm-import").disabled = !importValidation.length || errors > 0;
}

function renderImportHistory() {
  const history = ImportsService.list().slice().reverse();
  document.querySelector("#import-history-list").innerHTML = history.length ? history.map((item) => `<div class="catalog-history-row"><div><strong>${item.nomeArquivo}</strong><small>${item.dataHora} · ${item.tipo}</small></div><span>${item.totalRegistros} registros</span><b>${item.status}</b></div>`).join("") : '<p class="empty-list">Nenhuma importação registrada.</p>';
  document.querySelector("#imports-total").textContent = history.length;
  document.querySelector("#imports-completed").textContent = history.filter((item) => item.status === "Concluída").length;
  document.querySelector("#imports-errors").textContent = history.filter((item) => item.registrosComErro > 0 || item.status === "Com erro").length;
  document.querySelector("#imports-records").textContent = history.reduce((sum, item) => sum + (item.registrosNovos || 0) + (item.registrosAtualizados || 0), 0);
  document.querySelector("#imports-last").textContent = history[0]?.dataHora || "—";
}

function openImports() {
  renderImportHistory();
  document.querySelector("#import-workflow").hidden = true;
  document.querySelector("#import-file").value = "";
  document.querySelector("#import-status").textContent = "";
  openModal(importsManagerModal);
}

function openCardDestination(action) {
  if (action === "materials") {
    renderMaterials();
    openModal(materialsModal);
  } else if (action === "count") {
    openModal(countModal);
  } else if (action === "rfid") {
    openModal(rfidModal);
  } else if (action === "inventory") {
    openModal(rfidModal);
    document.querySelector('[data-rfid-tab="inventory"]')?.click();
  } else if (action === "movements") {
    openModal(rfidModal);
    document.querySelector('[data-rfid-tab="history"]')?.click();
  } else if (action === "stock") {
    openStock();
  }
}

let stockFormMode = "entry";
let stockSelectedItemId = null;
function stockMoney(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function stockRefreshSelects() {
  const materials = MaterialsService.list().filter((item) => item.status === "active");
  const locations = StockService.locations();
  document.querySelector("#stock-material-field").innerHTML = `<option value="">Selecione um material</option>${materials.map((item) => `<option value="${item.id}">${item.codigo} · ${item.descricao}</option>`).join("")}`;
  const locationOptions = `<option value="">Sem localização</option>${locations.map((item) => `<option value="${item.nome}">${item.nome}</option>`).join("")}`;
  document.querySelector("#stock-location-field").innerHTML = locationOptions;
  document.querySelector("#stock-filter-location").innerHTML = `<option value="">Todos os locais</option>${locations.map((item) => `<option value="${item.nome}">${item.nome}</option>`).join("")}`;
}
function renderStock() {
  const items = StockService.list();
  const query = document.querySelector("#stock-search").value.trim().toLowerCase();
  const filters = {
    location: document.querySelector("#stock-filter-location").value.toLowerCase(),
    material: document.querySelector("#stock-filter-material").value.trim().toLowerCase(),
    standard: document.querySelector("#stock-filter-standard").value.trim().toLowerCase(),
    status: document.querySelector("#stock-filter-status").value
  };
  const filtered = items.filter((item) => {
    const text = [item.codigo, item.descricao, item.lais, item.corrida, item.lote, item.fornecedor, item.fabricante, item.local, item.norma, item.material].join(" ").toLowerCase();
    return (!query || text.includes(query)) && (!filters.location || String(item.local).toLowerCase() === filters.location) && (!filters.material || String(item.material).toLowerCase().includes(filters.material)) && (!filters.standard || String(item.norma).toLowerCase().includes(filters.standard)) && (!filters.status || item.status === filters.status);
  });
  document.querySelector("#stock-table tbody").innerHTML = filtered.length ? filtered.map((item) => `<tr><td>${item.id}</td><td>${item.lais || "—"}</td><td><strong>${item.codigo}</strong></td><td>${item.descricao}</td><td>${item.tipo || "—"}</td><td>${item.material || "—"}</td><td>${item.diametro || item.bitola || "—"}</td><td>${item.espessura || "—"}</td><td>${item.norma || "—"}</td><td>${item.corrida || "—"}</td><td>${item.lote || "—"}</td><td>${item.fabricante || "—"}</td><td>${item.fornecedor || "—"}</td><td>${item.quantidade}</td><td>${item.unidade || "—"}</td><td>${item.comprimento || "—"}</td><td>${Number(item.peso || 0).toLocaleString("pt-BR", { maximumFractionDigits: 3 })}</td><td>${stockMoney(item.custoUnitario)}</td><td>${stockMoney(item.custoTotal)}</td><td>${item.giro || "—"}</td><td>${item.local || "Não informado"}</td><td><span class="tip-status ${item.status}">${item.status}</span></td><td>${item.dataEntrada ? new Date(item.dataEntrada).toLocaleDateString("pt-BR") : "—"}</td><td>${item.ultimaMovimentacao ? new Date(item.ultimaMovimentacao).toLocaleString("pt-BR") : "—"}</td><td><button class="tip-action" data-stock-exit="${item.id}">Baixa</button><button class="tip-action" data-stock-transfer="${item.id}">Transferir</button></td></tr>`).join("") : `<tr><td colspan="25" class="materials-empty">Nenhum item encontrado no estoque.</td></tr>`;
  const indicators = StockService.indicators();
  document.querySelector("#stock-total-items").textContent = indicators.totalItens;
  document.querySelector("#stock-total-quantity").textContent = indicators.quantidadeTotal.toLocaleString("pt-BR");
  document.querySelector("#stock-total-value").textContent = stockMoney(indicators.valorTotal);
  document.querySelector("#stock-no-movement").textContent = indicators.semMovimentacao;
  document.querySelector("#stock-no-location").textContent = indicators.semLocalizacao;
  document.querySelector("#stock-divergences").textContent = indicators.divergencias;
  document.querySelector("#stock-history-table tbody").innerHTML = StockService.movements().slice(0, 100).map((item) => `<tr><td>${new Date(item.createdAt).toLocaleString("pt-BR")}</td><td>${item.usuario}</td><td>${item.material || "—"}</td><td>${item.tipo}</td><td>${item.quantidade || "—"}</td><td>${item.local || item.destino || "—"}</td><td>${item.observacao || item.motivo || "—"}</td></tr>`).join("") || '<tr><td colspan="7" class="materials-empty">Nenhuma movimentação registrada.</td></tr>';
}
function renderStockLocations() {
  document.querySelector("#stock-locations-list").innerHTML = StockService.locations().map((item) => `<div class="stock-location-row"><strong>${item.nome}</strong><span>${item.descricao || "Sem descrição"}</span></div>`).join("") || '<p class="empty-list">Nenhum local cadastrado.</p>';
}
function resetStockForm(mode = "entry", itemId = null) {
  stockFormMode = mode;
  stockSelectedItemId = itemId;
  const item = itemId ? StockService.list().find((entry) => entry.id === itemId) : null;
  document.querySelector("#stock-form-panel").hidden = false;
  document.querySelector("#stock-form-kicker").textContent = mode === "entry" ? "ENTRADA DE MATERIAL" : mode === "exit" ? "BAIXA DE MATERIAL" : "TRANSFERÊNCIA";
  document.querySelector("#stock-form-title").textContent = mode === "entry" ? "Nova entrada" : mode === "exit" ? "Registrar saída" : "Transferir material";
  document.querySelector("#stock-submit-form").textContent = mode === "entry" ? "Registrar entrada" : mode === "exit" ? "Registrar baixa" : "Registrar transferência";
  stockRefreshSelects();
  if (item) {
    document.querySelector("#stock-material-field").value = item.materialId;
    document.querySelector("#stock-location-field").value = item.local || "";
    document.querySelector("#stock-lais-field").value = item.lais || "";
    document.querySelector("#stock-heat-field").value = item.corrida || "";
    document.querySelector("#stock-lot-field").value = item.lote || "";
    document.querySelector("#stock-supplier-field").value = item.fornecedor || "";
    document.querySelector("#stock-unit-field").value = item.unidade || "";
  }
  document.querySelector("#stock-form-status").textContent = "";
}
function openStock(action = "") {
  stockRefreshSelects();
  renderStock();
  renderStockLocations();
  document.querySelector("#stock-form-panel").hidden = true;
  document.querySelector("#stock-locations-panel").hidden = true;
  openModal(stockModal);
  if (action === "entry") resetStockForm("entry");
  if (action === "exit") resetStockForm("exit");
  if (action === "locations") { document.querySelector("#stock-locations-panel").hidden = false; }
}
document.querySelectorAll("[data-open-stock]").forEach((item) => item.addEventListener("click", () => openStock(item.dataset.stockAction || "")));
document.querySelector("#stock-new-entry").addEventListener("click", () => resetStockForm("entry"));
document.querySelector("#stock-locations-button").addEventListener("click", () => { const panel = document.querySelector("#stock-locations-panel"); panel.hidden = !panel.hidden; renderStockLocations(); });
document.querySelector("#stock-save-location").addEventListener("click", () => {
  try {
    StockService.saveLocation(document.querySelector("#stock-location-name").value, document.querySelector("#stock-location-description").value);
    document.querySelector("#stock-location-name").value = "";
    document.querySelector("#stock-location-description").value = "";
    stockRefreshSelects(); renderStockLocations(); renderStock();
  } catch (error) { document.querySelector("#stock-status").textContent = error.message; }
});
document.querySelector("#stock-cancel-form").addEventListener("click", () => { document.querySelector("#stock-form-panel").hidden = true; });
document.querySelector("#stock-submit-form").addEventListener("click", () => {
  const status = document.querySelector("#stock-form-status");
  try {
    const data = { materialId: document.querySelector("#stock-material-field").value, quantidade: document.querySelector("#stock-quantity-field").value, unidade: document.querySelector("#stock-unit-field").value, comprimento: document.querySelector("#stock-length-field").value, custoUnitario: document.querySelector("#stock-unit-cost-field").value, peso: document.querySelector("#stock-weight-field").value, local: document.querySelector("#stock-location-field").value, lais: document.querySelector("#stock-lais-field").value, corrida: document.querySelector("#stock-heat-field").value, lote: document.querySelector("#stock-lot-field").value, fornecedor: document.querySelector("#stock-supplier-field").value, observacao: document.querySelector("#stock-note-field").value, motivo: document.querySelector("#stock-reason-field").value };
    if (stockFormMode === "entry") StockService.createEntry(data);
    else if (stockFormMode === "exit") StockService.createExit({ ...data, itemId: stockSelectedItemId, destino: data.motivo });
    else StockService.transfer({ ...data, itemId: stockSelectedItemId, origem: data.local, destino: data.motivo });
    document.querySelector("#stock-form-panel").hidden = true;
    renderStock();
    document.querySelector("#stock-status").textContent = "Movimentação registrada com sucesso.";
  } catch (error) { status.textContent = error.message; }
});
document.querySelector("#stock-table tbody").addEventListener("click", (event) => {
  const button = event.target.closest("[data-stock-exit],[data-stock-transfer]");
  if (!button) return;
  resetStockForm(button.dataset.stockExit ? "exit" : "transfer", button.dataset.stockExit || button.dataset.stockTransfer);
});
document.querySelectorAll("#stock-search,#stock-filter-location,#stock-filter-material,#stock-filter-standard,#stock-filter-status").forEach((element) => element.addEventListener("input", renderStock));
document.querySelector("#stock-clear-filters").addEventListener("click", () => { ["#stock-search", "#stock-filter-material", "#stock-filter-standard"].forEach((id) => { document.querySelector(id).value = ""; }); document.querySelector("#stock-filter-location").value = ""; document.querySelector("#stock-filter-status").value = ""; renderStock(); });
document.querySelector("#stock-import").addEventListener("click", () => { document.querySelector("#import-type").value = "stock"; importTypeChanged(); openModal(importsManagerModal); });
document.querySelector("#stock-code-search").addEventListener("click", () => {
  const value = document.querySelector("#stock-code-lookup").value;
  const matches = StockService.findByCode(value);
  document.querySelector("#stock-status").textContent = matches.length ? `${matches.length} item(ns) localizado(s) para ${value}.` : "Nenhum item localizado para este código, QR ou LAIS.";
  document.querySelector("#stock-search").value = value;
  renderStock();
});

document.querySelectorAll("[data-card-action]").forEach((card) => {
  const activate = () => openCardDestination(card.dataset.cardAction);
  card.addEventListener("click", activate);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate();
    }
  });
});

document.querySelector("#import-type").addEventListener("change", importTypeChanged);
document.querySelector("#download-import-template").addEventListener("click", downloadImportTemplate);
document.querySelector("#import-duplicate-policy").addEventListener("change", validateImportRows);
document.querySelector("#import-file").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const extension = file.name.split(".").pop().toLowerCase();
  if (!["csv", "xls", "xlsx"].includes(extension)) { document.querySelector("#import-status").textContent = "Arquivo inválido. Use CSV, XLSX ou XLS."; return; }
  importFile = file;
  document.querySelector("#import-file-info").textContent = `${file.name} · ${Math.ceil(file.size / 1024)} KB · arquivo recebido`;
  if (extension !== "csv") { document.querySelector("#import-status").textContent = "Arquivo recebido. A leitura de XLS/XLSX depende de um processador de planilhas ainda não configurado."; document.querySelector("#import-workflow").hidden = true; return; }
  const reader = new FileReader();
  reader.addEventListener("load", () => parseImportText(String(reader.result || "")));
  reader.addEventListener("error", () => { document.querySelector("#import-status").textContent = "Não foi possível ler o arquivo."; });
  reader.readAsText(file);
});
document.querySelector("#clear-import").addEventListener("click", () => { importFile = null; importRows = []; importHeaders = []; document.querySelector("#import-file").value = ""; document.querySelector("#import-workflow").hidden = true; document.querySelector("#import-file-info").textContent = "Formatos aceitos: CSV, XLSX e XLS."; });
document.querySelector("#confirm-import").addEventListener("click", () => {
  if (!importFile || !importValidation.length) return;
  const type = document.querySelector("#import-type").value;
  if (type === "stock") {
    document.querySelector("#import-status").textContent = "A importação de estoque está preparada, mas permanece bloqueada até a validação do cadastro de locais e vínculos de materiais.";
    return;
  }
  const validRows = importValidation.filter((item) => item.operation !== "ERRO");
  const record = { tipo: type, nomeArquivo: importFile.name, formato: importFile.name.split(".").pop().toLowerCase(), dataHora: new Date().toLocaleString("pt-BR"), usuario: "Antonio Angelo", totalRegistros: importValidation.length, registrosNovos: validRows.filter((item) => item.operation === "NOVO").length, registrosAtualizados: validRows.filter((item) => item.operation === "ATUALIZAR").length, registrosIgnorados: 0, registrosComErro: importValidation.length - validRows.length, status: "Processando", mapeamento: importMapping, erros: importValidation.filter((item) => item.operation === "ERRO") };
  const saved = ImportsService.save(record);
  document.querySelector("#import-progress").hidden = false;
  document.querySelector("#confirm-import").disabled = true;
  let step = 0;
  const timer = window.setInterval(() => {
    step += 1;
    document.querySelector("#import-progress-bar").value = Math.min(step * 20, 100);
    document.querySelector("#import-progress-label").textContent = `${Math.min(step * 20, 100)}%`;
    if (step >= 5) {
      window.clearInterval(timer);
      if (type === "materials") validRows.filter((item) => item.operation !== "IGNORAR").forEach((item) => MaterialsService.save(item.data));
      if (type === "stock") validRows.filter((item) => item.operation !== "IGNORAR").forEach((item) => StockService.importRow(item.data));
      if (type === "catalogs") validRows.filter((item) => item.operation !== "IGNORAR").forEach((item) => CatalogsService.save({ empresa: item.data.empresa, nome: item.data.nome, tipo: item.data.tipo || "Fornecedor", versao: item.data.versao, quantidadeMateriais: 0 }));
      saved.status = record.registrosComErro ? "Concluída com alertas" : "Concluída";
      ImportsService.save(saved);
      document.querySelector("#import-status").textContent = `Importação concluída: ${record.registrosNovos} novos, ${record.registrosAtualizados} atualizados e ${record.registrosComErro} com erro.`;
      renderImportHistory();
    }
  }, 80);
});

renderImportTemplate();

let editingCatalogId = null;
let catalogUpload = null;
let catalogPreviewRows = [];

function resetCatalogForm() {
  editingCatalogId = null;
  catalogUpload = null;
  catalogPreviewRows = [];
  document.querySelector("#catalog-form-title").textContent = "Novo catálogo";
  document.querySelectorAll("#catalog-form-panel input").forEach((field) => { field.value = ""; });
  document.querySelector("#catalog-type-field").value = "Fornecedor";
  document.querySelector("#catalog-status-field").value = "active";
  document.querySelector("#catalog-preview").hidden = true;
  document.querySelector("#catalog-file-info").textContent = "Formatos aceitos: CSV, XLSX, XLS e PDF.";
}

function renderCatalogHistory() {
  const history = CatalogsService.listImports().slice().reverse();
  document.querySelector("#catalog-history-list").innerHTML = history.length
    ? history.map((item) => `<div class="catalog-history-row"><div><strong>${item.arquivo || "Arquivo sem nome"}</strong><small>${item.data || "—"} · ${item.status || "Processando"}</small></div><span>${item.totalRegistros || 0} registros</span><b>${item.importados || 0} importados</b></div>`).join("")
    : '<p class="empty-list">Nenhuma importação registrada.</p>';
}

function renderCatalogFilters(catalogs) {
  const select = document.querySelector("#catalogs-filter-company");
  const current = select.value;
  const companies = [...new Set(catalogs.map((item) => item.empresa).filter(Boolean))].sort();
  select.innerHTML = '<option value="">Todas as empresas</option>' + companies.map((company) => `<option>${company}</option>`).join("");
  select.value = companies.includes(current) ? current : "";
}

function renderCatalogs() {
  const catalogs = CatalogsService.list();
  renderCatalogFilters(catalogs);
  const query = document.querySelector("#catalogs-search").value.trim().toLowerCase();
  const company = document.querySelector("#catalogs-filter-company").value.toLowerCase();
  const type = document.querySelector("#catalogs-filter-type").value.toLowerCase();
  const status = document.querySelector("#catalogs-filter-status").value;
  const filtered = catalogs.filter((item) => {
    const text = [item.empresa, item.nome, item.fabricante, item.codigo, item.tipo].join(" ").toLowerCase();
    return (!query || text.includes(query)) && (!company || item.empresa.toLowerCase() === company) && (!type || item.tipo.toLowerCase() === type) && (!status || item.status === status);
  });
  document.querySelector("#catalogs-table tbody").innerHTML = filtered.length
    ? filtered.map((item) => `<tr><td><strong>${item.empresa || "—"}</strong></td><td>${item.nome}</td><td>${item.tipo}</td><td>${item.versao || "—"}</td><td>${item.quantidadeMateriais}</td><td>${item.dataAtualizacao || "—"}</td><td><span class="tip-status ${item.status}">${item.status === "active" ? "Ativo" : "Inativo"}</span></td><td class="material-actions"><button class="tip-action" data-catalog-view="${item.id}">Visualizar</button><button class="tip-action" data-catalog-edit="${item.id}">Editar</button><button class="tip-action" data-catalog-status="${item.id}">${item.status === "active" ? "Inativar" : "Ativar"}</button><button class="tip-action" data-catalog-delete="${item.id}">Excluir</button></td></tr>`).join("")
    : `<tr><td colspan="8" class="materials-empty">${catalogs.length ? "Nenhum catálogo encontrado." : "Nenhum catálogo cadastrado."}</td></tr>`;
  const active = catalogs.filter((item) => item.status === "active");
  document.querySelector("#catalogs-total").textContent = catalogs.length;
  document.querySelector("#catalogs-active").textContent = active.length;
  document.querySelector("#catalogs-companies").textContent = new Set(catalogs.map((item) => item.empresa).filter(Boolean)).size;
  document.querySelector("#catalogs-materials").textContent = catalogs.reduce((total, item) => total + item.quantidadeMateriais, 0);
  const last = CatalogsService.listImports().slice(-1)[0];
  document.querySelector("#catalogs-last-import").textContent = last?.data || "—";
  renderCatalogHistory();
}

function fillCatalogForm(item) {
  editingCatalogId = item.id;
  document.querySelector("#catalog-form-title").textContent = "Editar catálogo";
  const fields = { empresa: "#catalog-company-field", cnpj: "#catalog-cnpj-field", fabricante: "#catalog-maker-field", contato: "#catalog-contact-field", nome: "#catalog-name-field", codigo: "#catalog-code-field", tipo: "#catalog-type-field", versao: "#catalog-version-field", dataCatalogo: "#catalog-date-field", dataAtualizacao: "#catalog-update-field", status: "#catalog-status-field" };
  Object.entries(fields).forEach(([key, selector]) => { document.querySelector(selector).value = item[key] || ""; });
  document.querySelector("#catalog-form-panel").hidden = false;
}

function parseCatalogCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const rows = lines.map((line) => line.split(/[;,]/).map((value) => value.trim().replace(/^"|"$/g, "")));
  catalogPreviewRows = rows;
  const headers = rows[0] || [];
  const body = rows.slice(1, 4);
  document.querySelector("#catalog-preview-meta").textContent = `${Math.max(rows.length - 1, 0)} registros · ${headers.length} colunas identificadas`;
  document.querySelector("#catalog-preview-table").innerHTML = rows.length ? `<div class="catalog-preview-scroll"><table><thead><tr>${headers.map((header) => `<th>${header || "Coluna"}</th>`).join("")}</tr></thead><tbody>${body.map((row) => `<tr>${headers.map((_, index) => `<td>${row[index] || "—"}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : "<p>Arquivo sem linhas de dados.</p>";
  document.querySelector("#catalog-preview").hidden = false;
}

document.querySelectorAll("[data-open-catalogs]").forEach((item) => item.addEventListener("click", () => { renderCatalogs(); openModal(catalogsManagerModal); }));
document.querySelector("#new-catalog").addEventListener("click", () => { resetCatalogForm(); document.querySelector("#catalog-form-panel").hidden = false; });
document.querySelector("#cancel-catalog-form").addEventListener("click", () => { document.querySelector("#catalog-form-panel").hidden = true; resetCatalogForm(); });
document.querySelectorAll("#catalogs-search,#catalogs-filter-company,#catalogs-filter-type,#catalogs-filter-status").forEach((field) => field.addEventListener("input", renderCatalogs));
document.querySelector("#clear-catalog-filters").addEventListener("click", () => { document.querySelector("#catalogs-search").value = ""; document.querySelector("#catalogs-filter-company").value = ""; document.querySelector("#catalogs-filter-type").value = ""; document.querySelector("#catalogs-filter-status").value = ""; renderCatalogs(); });
document.querySelector("#catalog-upload-file").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  catalogUpload = file;
  document.querySelector("#catalog-file-info").textContent = `Arquivo recebido: ${file.name} (${Math.ceil(file.size / 1024)} KB).`;
  const extension = file.name.split(".").pop().toLowerCase();
  if (extension !== "csv") {
    document.querySelector("#catalogs-status").textContent = "Arquivo recebido. A pré-visualização de XLS/XLSX/PDF será habilitada com o processador correspondente.";
    document.querySelector("#catalog-preview").hidden = true;
    return;
  }
  const reader = new FileReader();
  reader.addEventListener("load", () => parseCatalogCsv(String(reader.result || "")));
  reader.addEventListener("error", () => { document.querySelector("#catalogs-status").textContent = "Não foi possível processar o arquivo."; });
  reader.readAsText(file);
});
document.querySelector("#save-catalog").addEventListener("click", () => {
  const empresa = document.querySelector("#catalog-company-field").value.trim();
  const nome = document.querySelector("#catalog-name-field").value.trim();
  if (!empresa || !nome) { document.querySelector("#catalogs-status").textContent = "Preencha Empresa e Nome do catálogo."; return; }
  try {
    const record = { id: editingCatalogId, empresa, cnpj: document.querySelector("#catalog-cnpj-field").value.trim(), fabricante: document.querySelector("#catalog-maker-field").value.trim(), contato: document.querySelector("#catalog-contact-field").value.trim(), nome, codigo: document.querySelector("#catalog-code-field").value.trim(), tipo: document.querySelector("#catalog-type-field").value, versao: document.querySelector("#catalog-version-field").value.trim(), dataCatalogo: document.querySelector("#catalog-date-field").value, dataAtualizacao: document.querySelector("#catalog-update-field").value, status: document.querySelector("#catalog-status-field").value, arquivo: catalogUpload ? { nome: catalogUpload.name, tamanho: catalogUpload.size } : null, formato: catalogUpload ? catalogUpload.name.split(".").pop().toLowerCase() : "", quantidadeMateriais: catalogPreviewRows.length ? catalogPreviewRows.length - 1 : 0 };
    const saved = CatalogsService.save(record);
    if (catalogUpload) CatalogsService.addImport({ catalogoId: saved.id, arquivo: catalogUpload.name, data: new Date().toLocaleString("pt-BR"), totalRegistros: record.quantidadeMateriais, importados: 0, atualizados: 0, ignorados: 0, erros: 0, status: "Processando" });
    document.querySelector("#catalogs-status").textContent = "Catálogo salvo com sucesso.";
    document.querySelector("#catalog-form-panel").hidden = true;
    renderCatalogs();
    resetCatalogForm();
  } catch (error) { document.querySelector("#catalogs-status").textContent = error.message; }
});
document.querySelector("#catalogs-table").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const catalogs = CatalogsService.list();
  const item = catalogs.find((catalog) => catalog.id === (button.dataset.catalogView || button.dataset.catalogEdit || button.dataset.catalogStatus || button.dataset.catalogDelete));
  if (!item) return;
  try {
    if (button.dataset.catalogView) alert(`Empresa: ${item.empresa}\nCatálogo: ${item.nome}\nTipo: ${item.tipo}\nVersão: ${item.versao || "—"}\nMateriais: ${item.quantidadeMateriais}\nArquivo: ${item.arquivo?.nome || "—"}`);
    if (button.dataset.catalogEdit) fillCatalogForm(item);
    if (button.dataset.catalogStatus) { CatalogsService.setStatus(item.id, item.status === "active" ? "inactive" : "active"); renderCatalogs(); }
    if (button.dataset.catalogDelete) { if (window.confirm("Tem certeza que deseja excluir este catálogo?")) { CatalogsService.remove(item.id); renderCatalogs(); } }
  } catch (error) { document.querySelector("#catalogs-status").textContent = error.message; }
});

let materialIntelligenceResults = [];
let selectedIntelligenceResults = new Set();
let intelligenceReviewResult = null;

function openMaterialIntelligence() {
  document.querySelector("#material-intelligence-status").textContent = "Nenhuma pesquisa executada.";
  document.querySelector("#material-intelligence-results").innerHTML = '<p class="empty-list">Informe os dados e pesquise em uma fonte configurada.</p>';
  selectedIntelligenceResults.clear();
  renderIntelligenceSelection();
  openModal(materialIntelligenceModal);
}

function renderIntelligenceSelection() {
  document.querySelector("#material-intelligence-selection").textContent = `${selectedIntelligenceResults.size} selecionados`;
  const compare = document.querySelector("#material-intelligence-compare");
  compare.hidden = selectedIntelligenceResults.size < 2;
  if (!compare.hidden) {
    const selected = [...selectedIntelligenceResults].map((index) => materialIntelligenceResults[index]);
    document.querySelector("#material-intelligence-compare-table").innerHTML = `<div class="intelligence-compare-grid">${["material", "dimensoes", "norma", "pesoTeorico", "fabricante", "fornecedor"].map((field) => `<div><strong>${field}</strong>${selected.map((item) => `<span>${item[field] || "—"}</span>`).join("")}</div>`).join("")}</div>`;
  }
}

function renderIntelligenceResults() {
  const results = document.querySelector("#material-intelligence-results");
  results.innerHTML = materialIntelligenceResults.length ? materialIntelligenceResults.map((item, index) => `<article class="intelligence-result-card"><div class="intelligence-result-heading"><div><strong>${item.descricao || "Material sem descrição"}</strong><small>${item.fabricante || "Fabricante não informado"} · ${item.fornecedor || "Fornecedor não informado"}</small></div><label><input type="checkbox" data-intelligence-select="${index}" ${selectedIntelligenceResults.has(index) ? "checked" : ""} /> Comparar</label></div><div class="intelligence-result-grid"><span>Tipo<strong>${item.tipo || "—"}</strong></span><span>Código<strong>${item.codigo || "—"}</strong></span><span>Material<strong>${item.material || "—"}</strong></span><span>Norma<strong>${item.norma || "—"}</strong></span><span>Dimensões<strong>${item.dimensoes || item.bitola || "—"}</strong></span><span>Espessura<strong>${item.espessura || "—"}</strong></span><span>Comprimento<strong>${item.comprimento || "—"}</strong></span><span>Peso teórico<strong>${item.pesoTeorico || "—"} ${item.unidadePeso || "kg/m"}</strong></span></div><div class="intelligence-source"><span>Fonte: ${item.fonteNome || "Não informada"} · ${item.fonteData || "Data não informada"}</span><div><a class="outline-button" href="${item.fonteUrl || "#"}" target="_blank" rel="noopener noreferrer">Ver fonte</a><button class="primary-button" data-intelligence-review="${index}">Selecionar</button></div></div></article>`).join("") : '<p class="empty-list">Nenhum resultado retornado pela fonte configurada.</p>';
  results.querySelectorAll("[data-intelligence-select]").forEach((input) => input.addEventListener("change", () => {
    const index = Number(input.dataset.intelligenceSelect);
    if (input.checked) selectedIntelligenceResults.add(index); else selectedIntelligenceResults.delete(index);
    renderIntelligenceSelection();
  }));
  results.querySelectorAll("[data-intelligence-review]").forEach((button) => button.addEventListener("click", () => openIntelligenceReview(Number(button.dataset.intelligenceReview))));
}

function openIntelligenceReview(index) {
  intelligenceReviewResult = materialIntelligenceResults[index];
  const fields = { codigo: "Código", descricao: "Descrição", tipo: "Tipo", material: "Material", norma: "Norma", bitola: "Bitola", diametro: "Diâmetro", espessura: "Espessura", largura: "Largura", altura: "Altura", comprimento: "Comprimento", pesoTeorico: "Peso teórico por metro", unidade: "Unidade", fabricante: "Fabricante", fornecedor: "Fornecedor" };
  document.querySelector("#material-intelligence-review-form").innerHTML = Object.entries(fields).map(([key, label]) => `<label>${label}<input name="${key}" value="${String(intelligenceReviewResult[key] || "").replace(/"/g, "&quot;")}" /></label>`).join("");
  document.querySelector("#material-intelligence-source").innerHTML = `<strong>Fonte preservada</strong><span>${intelligenceReviewResult.fonteNome || "Não informada"} · ${intelligenceReviewResult.fonteData || "Data não informada"}</span>${intelligenceReviewResult.fonteUrl ? `<a href="${intelligenceReviewResult.fonteUrl}" target="_blank" rel="noopener noreferrer">${intelligenceReviewResult.fonteUrl}</a>` : ""}`;
  openModal(materialIntelligenceReviewModal);
}

document.querySelector("#open-material-intelligence").addEventListener("click", openMaterialIntelligence);
function renderPartners(type) {
  const list = PartnersService.list(type);
  document.querySelector("#catalog-partners-list").innerHTML = list.length
    ? list.map((item) => `<div class="catalog-partner-row"><div><strong>${item.nome}</strong><small>${item.cnpj || "CNPJ não informado"} · ${item.pais || "País não informado"}${item.cidade ? ` · ${item.cidade}/${item.estado || ""}` : ""}</small></div><span class="tip-status ${item.status}">${item.status === "active" ? "Ativo" : "Inativo"}</span><button class="tip-action" data-partner-status="${item.id}">${item.status === "active" ? "Inativar" : "Ativar"}</button></div>`).join("")
    : '<p class="empty-list">Nenhum cadastro encontrado.</p>';
}
function openPartners(type) {
  document.querySelector("#partner-type").value = type;
  document.querySelector("#catalog-partners-content").hidden = false;
  renderPartners(type);
}
document.querySelector("#toggle-manufacturers").addEventListener("click", () => openPartners("fabricante"));
document.querySelector("#toggle-suppliers").addEventListener("click", () => openPartners("fornecedor"));
document.querySelector("#save-partner").addEventListener("click", () => {
  const type = document.querySelector("#partner-type").value;
  const name = document.querySelector("#partner-name").value.trim();
  if (!name) return;
  try {
    PartnersService.save({ tipo: type, nome: name, cnpj: document.querySelector("#partner-cnpj").value.trim(), pais: document.querySelector("#partner-country").value.trim(), cidade: document.querySelector("#partner-city").value.trim(), estado: document.querySelector("#partner-state").value.trim(), site: document.querySelector("#partner-site").value.trim(), contato: document.querySelector("#partner-contact").value.trim() });
    document.querySelector("#partner-name").value = "";
    renderPartners(type);
  } catch (error) { document.querySelector("#catalogs-status").textContent = error.message; }
});
document.querySelector("#catalog-partners-list").addEventListener("click", (event) => {
  const button = event.target.closest("[data-partner-status]");
  if (!button) return;
  const item = PartnersService.list().find((partner) => partner.id === button.dataset.partnerStatus);
  if (item) { PartnersService.setStatus(item.id, item.status === "active" ? "inactive" : "active"); renderPartners(item.tipo); }
});
document.querySelector("#open-catalog-import").addEventListener("click", () => {
  closeModal();
  openImports();
});
document.querySelector("#material-intelligence-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const fields = Object.fromEntries(new FormData(event.currentTarget).entries());
  const status = document.querySelector("#material-intelligence-status");
  status.textContent = "Consultando a fonte configurada...";
  try {
    materialIntelligenceResults = await MaterialIntelligenceService.search(fields);
    selectedIntelligenceResults.clear();
    renderIntelligenceResults();
    renderIntelligenceSelection();
    status.textContent = materialIntelligenceResults.length ? `${materialIntelligenceResults.length} resultado(s) recebido(s).` : "Nenhum resultado retornado pela fonte configurada.";
  } catch (error) {
    materialIntelligenceResults = [];
    renderIntelligenceResults();
    status.textContent = error.message;
  }
});
document.querySelector("#save-intelligent-material").addEventListener("click", () => {
  if (!intelligenceReviewResult) return;
  const data = Object.fromEntries(new FormData(document.querySelector("#material-intelligence-review-form")).entries());
  try {
    MaterialsService.save({ ...MaterialIntelligenceService.toMaterial({ ...intelligenceReviewResult, ...data }), status: "active" });
    closeModal();
    document.querySelector("#catalogs-status").textContent = "Material salvo no cadastro mestre com a fonte preservada.";
  } catch (error) {
    document.querySelector("#material-intelligence-source").insertAdjacentHTML("beforeend", `<p class="ai-status">${error.message}</p>`);
  }
});

  let editingMaterialId = null;
  const materialFields = {
    codigo: "#material-code", descricao: "#material-description", tipo: "#material-type-field", material: "#material-steel-field",
    norma: "#material-standard-field", bitola: "#material-bitola-field", diametro: "#material-diameter-field", espessura: "#material-wall-field", largura: "#material-width-field", altura: "#material-height-field",
    comprimentoPadrao: "#material-length-field", cor: "#material-color-field", pesoTeoricoMetro: "#material-weight-meter-field",
    pesoTeoricoPeca: "#material-weight-piece-field", unidade: "#material-unit-field", fabricante: "#material-maker-field",
    fornecedor: "#material-supplier-field", fonteNome: "#material-source-field", status: "#material-status-field", observacoes: "#material-notes-field",
    codigoBarras: "#material-barcode-field", qrCode: "#material-qr-field"
  };
  const materialValue = (key) => document.querySelector(materialFields[key]).value.trim();
  function resetMaterialForm() {
    editingMaterialId = null;
    document.querySelector("#material-form-title").textContent = "Novo material";
    Object.values(materialFields).forEach((selector) => { const element = document.querySelector(selector); element.value = element.tagName === "SELECT" ? "active" : ""; });
    document.querySelector("#material-unit-field").value = "un.";
    document.querySelector("#material-status-field").value = "active";
  }
  function renderMaterials() {
    const materials = MaterialsService.list();
    const query = document.querySelector("#materials-search").value.trim().toLowerCase();
    const sort = document.querySelector("#materials-sort").value;
    const filters = {
      tipo: document.querySelector("#filter-material-type").value.toLowerCase(),
      material: document.querySelector("#filter-material-steel").value.toLowerCase(),
      norma: document.querySelector("#filter-material-standard").value.trim().toLowerCase(),
      bitola: document.querySelector("#filter-material-bitola").value.trim().toLowerCase(),
      status: document.querySelector("#filter-material-status").value,
      unidade: document.querySelector("#filter-material-unit").value
    };
    const filtered = materials.filter((item) => {
      const text = [item.codigo, item.descricao, item.material, item.tipo, item.bitola, item.diametro, item.norma].join(" ").toLowerCase();
      return (!query || text.includes(query)) && (!filters.tipo || item.tipo.toLowerCase() === filters.tipo) && (!filters.material || item.material.toLowerCase() === filters.material) && (!filters.norma || item.norma.toLowerCase().includes(filters.norma)) && (!filters.bitola || item.bitola.toLowerCase().includes(filters.bitola)) && (!filters.status || item.status === filters.status) && (!filters.unidade || item.unidade === filters.unidade);
    });
    filtered.sort((a, b) => {
      if (sort === "updated") return new Date(b.atualizadoEm || 0) - new Date(a.atualizadoEm || 0);
      return String(a[sort === "code" ? "codigo" : sort === "description" ? "descricao" : sort] || "").localeCompare(String(b[sort === "code" ? "codigo" : sort === "description" ? "descricao" : sort] || ""), "pt-BR");
    });
    const body = document.querySelector("#materials-table tbody");
    body.innerHTML = filtered.length ? filtered.map((item) => `<tr><td>${item.id}</td><td><strong>${item.codigo}</strong></td><td>${item.descricao}</td><td>${item.tipo}</td><td>${item.material}</td><td>${item.diametro || item.bitola || "—"}</td><td>${item.espessura || "—"}</td><td>${item.largura || "—"}</td><td>${item.altura || "—"}</td><td>${item.comprimentoPadrao || "—"}</td><td>${item.norma || "—"}</td><td>${item.pesoTeoricoPeca || item.pesoTeoricoMetro || "—"}</td><td>${item.unidade}</td><td>${item.fabricante || "—"}</td><td>${item.fornecedor || "—"}</td><td><span class="tip-status ${item.status}">${item.status === "active" ? "Ativo" : "Inativo"}</span></td><td>${item.fonteNome || "—"}</td><td>${item.atualizadoEm ? new Date(item.atualizadoEm).toLocaleDateString("pt-BR") : "—"}</td><td class="material-actions"><button class="tip-action" data-material-view="${item.id}">Visualizar</button><button class="tip-action" data-material-edit="${item.id}">Editar</button><button class="tip-action" data-material-status="${item.id}">${item.status === "active" ? "Desativar" : "Ativar"}</button><button class="tip-action" data-material-delete="${item.id}">Excluir</button></td></tr>`).join("") : `<tr><td colspan="19" class="materials-empty">${materials.length ? "Nenhum material encontrado para os filtros selecionados." : "Nenhum material cadastrado."}</td></tr>`;
    const active = materials.filter((item) => item.status === "active");
    document.querySelector("#materials-total").textContent = materials.length;
    document.querySelector("#materials-active").textContent = active.length;
    document.querySelector("#materials-inactive").textContent = materials.length - active.length;
    document.querySelector("#materials-types").textContent = new Set(materials.map((item) => item.tipo)).size;
    document.querySelector("#materials-recent").textContent = materials.filter((item) => Date.now() - new Date(item.criadoEm).getTime() < 30 * 86400000).length;
  }
  function fillMaterialForm(item) {
    editingMaterialId = item.id;
    document.querySelector("#material-form-title").textContent = "Editar material";
    Object.keys(materialFields).forEach((key) => { document.querySelector(materialFields[key]).value = item[key] ?? ""; });
    setMaterialFormExpanded(true);
  }
  function setMaterialTableExpanded(expanded) {
    const panel = document.querySelector("#materials-table-panel");
    const button = document.querySelector("#toggle-materials-table");
    materialsModal.classList.toggle("materials-table-open", expanded);
    panel.hidden = !expanded;
    button.setAttribute("aria-expanded", String(expanded));
    button.setAttribute("aria-controls", "materials-table-panel");
    button.innerHTML = `${expanded ? "Ocultar tabela" : "Mostrar tabela"} <span aria-hidden="true">${expanded ? "⌃" : "⌄"}</span>`;
  }
  function setMaterialFormExpanded(expanded) {
    const panel = document.querySelector("#material-form-panel");
    const button = document.querySelector("#toggle-material-form");
    materialsModal.classList.toggle("materials-form-open", expanded);
    panel.hidden = !expanded;
    button.setAttribute("aria-expanded", String(expanded));
    button.setAttribute("aria-controls", "material-form-panel");
    button.innerHTML = `${expanded ? "Ocultar cadastro" : "Cadastrar manualmente"} <span aria-hidden="true">${expanded ? "⌃" : "＋"}</span>`;
  }
  document.querySelectorAll("[data-open-materials]").forEach((item) => item.addEventListener("click", () => {
    renderMaterials();
    setMaterialTableExpanded(false);
    setMaterialFormExpanded(false);
    openModal(materialsModal);
  }));
  document.querySelector("#toggle-materials-table").addEventListener("click", () => setMaterialTableExpanded(document.querySelector("#materials-table-panel").hidden));
  document.querySelector("#toggle-material-form").addEventListener("click", () => {
    const expanded = document.querySelector("#material-form-panel").hidden;
    if (expanded) resetMaterialForm();
    setMaterialFormExpanded(expanded);
  });
  document.querySelector("#new-material").addEventListener("click", () => { resetMaterialForm(); setMaterialFormExpanded(true); });
  document.querySelector("#import-materials").addEventListener("click", () => {
    document.querySelector("#import-type").value = "materials";
    importTypeChanged();
    openModal(importsManagerModal);
  });
  document.querySelector("#download-materials-template").addEventListener("click", () => {
    document.querySelector("#import-type").value = "materials";
    downloadImportTemplate();
  });
  document.querySelector("#cancel-material-form").addEventListener("click", () => { setMaterialFormExpanded(false); resetMaterialForm(); });
  document.querySelector("#clear-material-filters").addEventListener("click", () => { document.querySelectorAll(".materials-filters select,.materials-filters input,#materials-search").forEach((element) => { element.value = ""; }); renderMaterials(); });
  document.querySelectorAll("#materials-search,.materials-filters input,.materials-filters select,#materials-sort").forEach((element) => element.addEventListener("input", renderMaterials));
  document.querySelector("#save-material").addEventListener("click", () => {
    const required = ["codigo", "descricao", "tipo", "material"];
    if (required.some((key) => !materialValue(key))) { document.querySelector("#materials-status").textContent = "Preencha Código, Descrição, Tipo e Material."; return; }
    const numeric = ["diametro", "espessura", "comprimentoPadrao", "pesoTeoricoMetro", "pesoTeoricoPeca"];
    if (numeric.some((key) => materialValue(key) && (!Number.isFinite(Number(materialValue(key))) || Number(materialValue(key)) < 0))) { document.querySelector("#materials-status").textContent = "Verifique os campos numéricos informados."; return; }
    try {
      const record = Object.fromEntries(Object.keys(materialFields).map((key) => [key, materialValue(key)]));
      record.id = editingMaterialId;
      MaterialsService.save(record);
      document.querySelector("#materials-status").textContent = "Material cadastrado com sucesso.";
      setMaterialFormExpanded(false);
      resetMaterialForm();
      renderMaterials();
    } catch (error) { document.querySelector("#materials-status").textContent = error.message; }
  });
  document.querySelector("#materials-table").addEventListener("click", (event) => {
    const button = event.target.closest(".tip-action");
    if (!button) return;
    const item = MaterialsService.list().find((material) => material.id === (button.dataset.materialView || button.dataset.materialEdit || button.dataset.materialStatus || button.dataset.materialDelete));
    if (!item) return;
    if (button.dataset.materialEdit) fillMaterialForm(item);
    if (button.dataset.materialView) alert(`Código: ${item.codigo}\nDescrição: ${item.descricao}\nTipo: ${item.tipo}\nMaterial: ${item.material}\nNorma: ${item.norma || "—"}\nStatus: ${item.status === "active" ? "Ativo" : "Inativo"}`);
    if (button.dataset.materialStatus) { MaterialsService.setStatus(item.id, item.status === "active" ? "inactive" : "active"); renderMaterials(); }
    if (button.dataset.materialDelete) { if (window.confirm("Tem certeza que deseja excluir este material?")) { MaterialsService.remove(item.id); renderMaterials(); } }
  });
function resetMaterialIdentification() {
  materialImageFile.value = "";
  materialCapturedBlob = null;
  materialImagePreview.hidden = true;
  materialCamera.hidden = true;
  document.querySelector("#capture-material-photo").hidden = true;
  document.querySelector("#retake-material-photo").hidden = true;
  document.querySelector("#remove-material-image").hidden = true;
  document.querySelector("#confirm-material-image").hidden = true;
  document.querySelector("#material-identify-details").hidden = true;
  document.querySelector("#material-confirmed-result").hidden = true;
  document.querySelector("#material-identify-result").hidden = false;
  materialIdentifyStatus.textContent = "Análise por IA ainda não configurada.";
}

function setMaterialImage(file) {
  if (!ImageService.isSupported(file)) {
    materialIdentifyStatus.textContent = "Selecione uma imagem JPG, PNG ou WEBP.";
    return;
  }
  materialImagePreview.src = URL.createObjectURL(file);
  materialImagePreview.hidden = false;
  materialCamera.hidden = true;
  document.querySelector("#remove-material-image").hidden = false;
  document.querySelector("#confirm-material-image").hidden = false;
  materialIdentifyStatus.textContent = "Imagem pronta. Confirme para preparar a análise.";
}

materialImageFile.addEventListener("change", () => setMaterialImage(materialImageFile.files[0]));
document.querySelector("#choose-material-image").addEventListener("click", () => materialImageFile.click());
materialCaptureArea.addEventListener("dragover", (event) => event.preventDefault());
materialCaptureArea.addEventListener("drop", (event) => {
  event.preventDefault();
  setMaterialImage(event.dataTransfer.files[0]);
});
document.querySelector("#remove-material-image").addEventListener("click", resetMaterialIdentification);
document.querySelector("#retake-material-photo").addEventListener("click", () => document.querySelector("#open-material-camera").click());
document.querySelector("#confirm-material-image").addEventListener("click", async () => {
  materialIdentifyStatus.textContent = "Analisando material...";
  const file = materialImageFile.files[0] || materialCapturedBlob;
  if (!file) {
    materialIdentifyStatus.textContent = "Selecione ou capture uma imagem antes da análise.";
    return;
  }
  try {
    const result = await MaterialIdentificationService.identify(materialImageFile.files[0], materialCapturedBlob);
    showMaterialIdentification(result);
    materialIdentifyStatus.textContent = "Análise concluída. Confirme os dados identificados.";
  } catch (error) {
    materialIdentifyStatus.textContent = error.message;
  }
});
document.querySelector("#open-material-camera").addEventListener("click", async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    materialIdentifyStatus.textContent = "Não foi possível acessar a câmera. Utilize o upload de imagem.";
    return;
  }
  try {
    materialCameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    materialCamera.srcObject = materialCameraStream;
    materialCamera.hidden = false;
    materialImagePreview.hidden = true;
    document.querySelector("#capture-material-photo").hidden = false;
    document.querySelector("#retake-material-photo").hidden = true;
    materialIdentifyStatus.textContent = "Câmera ativa. Enquadre o material e capture a imagem.";
  } catch (error) {
    console.error("Não foi possível acessar a câmera.", error);
    materialIdentifyStatus.textContent = "Não foi possível acessar a câmera. Utilize o upload de imagem.";
  }
});
document.querySelector("#capture-material-photo").addEventListener("click", () => {
  if (!materialCamera.videoWidth) return;
  materialCameraCanvas.width = materialCamera.videoWidth;
  materialCameraCanvas.height = materialCamera.videoHeight;
  materialCameraCanvas.getContext("2d").drawImage(materialCamera, 0, 0);
  materialImagePreview.src = materialCameraCanvas.toDataURL("image/png");
  materialCameraCanvas.toBlob((blob) => { materialCapturedBlob = blob; }, "image/png");
  materialImagePreview.hidden = false;
  materialCamera.hidden = true;
  document.querySelector("#capture-material-photo").hidden = true;
  document.querySelector("#retake-material-photo").hidden = false;
  document.querySelector("#remove-material-image").hidden = false;
  materialIdentifyStatus.textContent = "Foto capturada. Confirme para preparar a análise.";
});
document.querySelector("#read-material-code").addEventListener("click", async () => {
  if (!("BarcodeDetector" in window)) {
    materialIdentifyStatus.textContent = "Leitura de código ainda não disponível neste navegador.";
    return;
  }
  materialIdentifyStatus.textContent = "Leitor preparado. Envie uma imagem com código para leitura.";
});
document.querySelector("#manual-material-search").addEventListener("click", () => document.querySelector("#material-search-input").focus());
document.querySelector("#material-search-submit").addEventListener("click", () => {
  const query = document.querySelector("#material-search-input").value.trim();
  if (!query) {
    materialIdentifyStatus.textContent = "Informe um código, descrição, diâmetro, bitola ou norma.";
    return;
  }
  const matches = MaterialCatalogService.search(query);
  if (matches.length) {
    const item = matches[0];
    document.querySelector("#material-identify-result").hidden = true;
    document.querySelector("#material-identify-details").hidden = false;
    document.querySelector("#material-result-code").textContent = item.codigo;
    document.querySelector("#material-result-description").textContent = item.descricao;
    document.querySelector("#material-result-type").textContent = item.tipo;
    document.querySelector("#material-result-steel").textContent = item.material;
    document.querySelector("#material-result-bitola").textContent = item.bitola || "—";
    document.querySelector("#material-result-diameter").textContent = item.diametro ? `${item.diametro} mm` : "—";
    document.querySelector("#material-result-wall").textContent = item.espessura ? `${item.espessura} mm` : "—";
    document.querySelector("#material-result-standard").textContent = item.norma || "—";
    document.querySelector("#material-result-color").textContent = item.cor || "—";
    document.querySelector("#material-result-length").textContent = item.comprimentoPadrao ? `${item.comprimentoPadrao} m` : "—";
    document.querySelector("#material-result-weight").textContent = item.pesoTeoricoPeca || item.pesoTeoricoMetro || "—";
    document.querySelector("#material-result-unit").textContent = item.unidade || "—";
    document.querySelector("#material-result-confidence").textContent = "Catálogo";
    showMaterialIdentification({
      description: item.descricao,
      code: item.codigo,
      material_type: item.tipo,
      steel_type: item.material,
      diameter_mm: item.diametro,
      wall_mm: item.espessura,
      standard: item.norma,
      color: item.cor,
      manufacturer: item.fabricante,
      confidence: 1
    });
    materialIdentifyStatus.textContent = "Correspondência encontrada no cadastro mestre.";
    return;
  }
  document.querySelector("#material-identify-result").innerHTML = `<span>⌕</span><strong>Material não encontrado no catálogo.</strong><p>Nenhuma correspondência disponível para “${query.replace(/[<>&"]/g, "")}”.</p><div class="material-result-actions"><button class="outline-button" id="retry-material-search">Pesquisar novamente</button><button class="outline-button" id="manual-material-data">Informar dados manualmente</button><button class="outline-button" id="forward-material-registration">Cadastrar novo material</button></div>`;
  document.querySelector("#material-identify-result").hidden = false;
  document.querySelector("#material-identify-details").hidden = true;
});
document.querySelector("#material-identify-result").addEventListener("click", (event) => {
  if (event.target.id === "retry-material-search") {
    document.querySelector("#material-search-input").focus();
  } else if (event.target.id === "manual-material-data") {
    materialIdentifyStatus.textContent = "Informe os dados manualmente quando o módulo de materiais estiver disponível.";
  } else if (event.target.id === "forward-material-registration") {
    materialIdentifyStatus.textContent = "O cadastro será encaminhado ao módulo de materiais em uma próxima etapa.";
  }
});
document.querySelector("#confirm-material-result").addEventListener("click", () => {
  const calculation = WeightCalculationService.calculate({
    diameter: identificationValue("#identified-diameter-field"),
    wall: identificationValue("#identified-wall-field"),
    profile: identificationValue("#identified-type-field").toLowerCase().includes("barra") ? "round_bar" : "round_tube",
    steelType: identificationValue("#identified-material-field").toLowerCase().includes("inox") ? "stainless" : "carbon",
    length: identificationValue("#identified-length-field"),
    quantity: identificationValue("#identified-quantity-field", "1")
  });
  if (!calculation) {
    materialIdentifyStatus.textContent = "Informe comprimento, quantidade, diâmetro e espessura válidos para calcular o peso estimado.";
    return;
  }
  document.querySelector("#material-result-weight").textContent = `${calculation.perMeter.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} kg/m`;
  document.querySelector("#identified-weight-meter").textContent = `${calculation.perMeter.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} kg/m`;
  document.querySelector("#identified-length-result").textContent = `${identificationValue("#identified-length-field")} m`;
  document.querySelector("#identified-quantity-result").textContent = identificationValue("#identified-quantity-field", "1");
  document.querySelector("#identified-weight-piece").textContent = `${calculation.perPiece.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`;
  document.querySelector("#identified-weight-total").textContent = `${calculation.total.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`;
  document.querySelector("#identified-total-length").textContent = `${calculation.totalLength.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} m`;
  document.querySelector("#material-confirmed-result").hidden = false;
  materialIdentifyStatus.textContent = "Material confirmado. O peso abaixo é uma estimativa teórica.";
});
document.querySelector("#consult-material-catalog").addEventListener("click", () => {
  const query = [identificationValue("#identified-code-field"), identificationValue("#identified-material-field"), identificationValue("#identified-type-field"), identificationValue("#identified-diameter-field")].filter(Boolean).join(" ");
  closeModal();
  renderCatalogs();
  openModal(catalogsManagerModal);
  const search = document.querySelector("#catalogs-search");
  if (search) { search.value = query; search.dispatchEvent(new Event("input")); }
});
document.querySelector("#add-material-stock").addEventListener("click", () => {
  const identifiedCode = identificationValue("#identified-code-field");
  const catalogMaterial = MaterialsService.list().find((item) => item.codigo === identifiedCode);
  closeModal();
  openStock();
  resetStockForm("entry");
  if (catalogMaterial) document.querySelector("#stock-material-field").value = catalogMaterial.id;
  document.querySelector("#stock-quantity-field").value = identificationValue("#identified-quantity-field", "1");
  document.querySelector("#stock-length-field").value = identificationValue("#identified-length-field");
  document.querySelector("#stock-weight-field").value = document.querySelector("#identified-weight-total").textContent.replace(/[^\d,.-]/g, "").replace(",", ".");
  document.querySelector("#stock-status").textContent = catalogMaterial ? "Dados da identificação preparados para uma nova entrada." : "Confirme o material no catálogo antes de registrar a entrada.";
});
document.querySelector("#register-material-scrap").addEventListener("click", () => {
  materialIdentifyStatus.textContent = "A integração com o fluxo de Sobras será conectada quando o módulo de sobras estiver disponível.";
});
document.querySelector("#edit-material-result").addEventListener("click", () => {
  materialIdentifyStatus.textContent = "Edite os campos de pesquisa ou selecione outra correspondência.";
  document.querySelector("#material-search-input").focus();
});

document.querySelectorAll("[data-open-count]").forEach((item) => {
  item.addEventListener("click", () => openModal(countModal));
});
document.querySelectorAll("[data-open-identify]").forEach((item) => {
  item.addEventListener("click", () => openModal(identifyModal));
});
document.querySelectorAll("[data-open-material-identify]").forEach((item) => {
  item.addEventListener("click", () => {
    resetMaterialIdentification();
    openModal(materialIdentifyModal);
  });
});
document.querySelectorAll("[data-open-catalog]").forEach((item) => {
  item.addEventListener("click", () => openModal(catalogModal));
});
document.querySelectorAll("[data-close-modal]").forEach((item) => {
  item.addEventListener("click", closeModal);
});
backdrop.addEventListener("click", (event) => {
  if (event.target === backdrop) closeModal();
});

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", (event) => {
    const target = item.getAttribute("href");
    document.querySelectorAll(".nav-item").forEach((nav) => nav.classList.remove("active"));
    item.classList.add("active");
    if (target === "#contagem") {
      event.preventDefault();
      openModal(countModal);
    } else if (target === "#catalogo") {
      event.preventDefault();
      renderCatalogs();
      openModal(catalogsManagerModal);
    } else if (target === "#importacao") {
      event.preventDefault();
      openImports();
    } else if (target === "#materiais") {
      event.preventDefault();
      renderMaterials();
      openModal(materialsModal);
    } else if (target === "#identificacao") {
      event.preventDefault();
      openModal(identifyModal);
    } else if (target === "#material-identificacao") {
      event.preventDefault();
      openModal(materialIdentifyModal);
    } else if (target === "#admin") {
      event.preventDefault();
      openModal(adminModal);
    } else if (target === "#rfid") {
      event.preventDefault();
      openModal(rfidModal);
    }
  });
});

function updateCountPhoto(file) {
  if (!file || !file.type.startsWith("image/")) return;
  if (file.size > 20 * 1024 * 1024) {
    dropzone.querySelector("span").textContent = "A imagem ultrapassa o limite de 20 MB.";
    return;
  }
  countPreview.src = URL.createObjectURL(file);
  countPreview.hidden = false;
  dropzone.querySelector("strong").textContent = file.name;
  dropzone.querySelector("span").textContent = "Foto pronta para análise";
}

dropzone.addEventListener("click", (event) => {
  if (event.target !== countFile) countFile.click();
});
dropzone.addEventListener("dragover", (event) => event.preventDefault());
dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  updateCountPhoto(event.dataTransfer.files[0]);
});
countFile.addEventListener("change", () => {
  if (countFile.files[0]) {
    updateCountPhoto(countFile.files[0]);
  }
});

function calculateWeight(quantity, length, diameter, wall, profile, steelType) {
  const density = steelType === "stainless" ? 8000 : 7850;
  let area;
  if (profile === "round_bar") area = Math.PI * diameter ** 2 / 4;
  else if (profile === "square_tube") area = diameter ** 2 - Math.max(diameter - (2 * wall), 0) ** 2;
  else area = Math.PI * (diameter ** 2 - Math.max(diameter - (2 * wall), 0) ** 2) / 4;
  return area * density / 1000000 * length * quantity;
}

function showCountResult(result, sourceLabel) {
  const length = Number(document.querySelector("#standard-length").value) || 6;
  const quantity = Number(result.quantity) || 1;
  const diameter = Number(result.diameter_mm ?? document.querySelector("#material-diameter").value) || 0;
  const wall = Number(result.wall_mm ?? document.querySelector("#material-wall").value) || 0;
  const profile = result.material_type || document.querySelector("#material-type").value;
  const steelType = result.steel_type || document.querySelector("#steel-type").value;
  const totalWeight = Number(result.total_weight_kg) || calculateWeight(quantity, length, diameter, wall, profile, steelType);
  const materialOption = [...document.querySelector("#material-type").options].find((option) => option.value === profile);
  const steelOption = [...document.querySelector("#steel-type").options].find((option) => option.value === steelType);
  const standard = result.standard || document.querySelector("#material-standard").value.trim() || "Não informada";
  document.querySelector("#material-quantity").value = quantity;
  document.querySelector("#material-diameter").value = diameter || "";
  document.querySelector("#material-wall").value = wall || "";
  document.querySelector("#material-standard").value = standard === "Não informada" ? "" : standard;
  document.querySelector("#material-type").value = profile;
  document.querySelector("#steel-type").value = steelType;
  document.querySelector("#count-number").innerHTML = `${quantity.toLocaleString("pt-BR")} <em>un.</em>`;
  document.querySelector("#result-length").textContent = `${length} m`;
  document.querySelector("#count-weight").textContent = `Peso teórico: ${totalWeight.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`;
  document.querySelector("#result-profile").textContent = `${materialOption ? materialOption.textContent : profile} · ${steelOption ? steelOption.textContent : steelType}`;
  document.querySelector("#result-standard").textContent = standard;
  aiStatus.textContent = sourceLabel;
  aiStatus.className = "ai-status";
  countResult.hidden = false;
}

document.querySelector("#analyze-count").addEventListener("click", async () => {
  if (!countFile.files[0] && countPreview.hidden) {
    dropzone.querySelector("span").textContent = "Selecione uma foto antes de analisar.";
    return;
  }
  const length = Number(document.querySelector("#standard-length").value) || 6;
  const endpoint = window.METALSCAN_AI && window.METALSCAN_AI.endpoint;
  if (!endpoint) {
    showCountResult({ quantity: Number(document.querySelector("#material-quantity").value) || 1 }, "Resultado calculado com os dados informados. Configure a API para ativar a IA.");
    return;
  }
  const button = document.querySelector("#analyze-count");
  button.disabled = true;
  aiStatus.textContent = "Analisando imagem e consultando o catálogo...";
  aiStatus.className = "ai-status loading";
  try {
    const payload = new FormData();
    payload.append("image", countFile.files[0]);
    payload.append("company_id", companySelect.value);
    payload.append("length_m", String(length));
    const response = await fetch(endpoint, { method: "POST", body: payload });
    if (!response.ok) throw new Error(`A API de IA respondeu com status ${response.status}.`);
    const result = await response.json();
    showCountResult(result, `IA concluída. Confiança da análise: ${Math.round((Number(result.confidence || 0) * 100))}%.`);
  } catch (error) {
    aiStatus.textContent = `${error.message} Resultado manual mantido.`;
    aiStatus.className = "ai-status error";
    showCountResult({ quantity: Number(document.querySelector("#material-quantity").value) || 1 }, aiStatus.textContent);
  } finally {
    button.disabled = false;
  }
});

companySelect.addEventListener("change", () => {
  const option = companySelect.options[companySelect.selectedIndex];
  companyColor.style.backgroundColor = option.dataset.color;
  companyName.textContent = option.textContent;
});

catalogCompany.addEventListener("change", () => {
  const option = catalogCompany.options[catalogCompany.selectedIndex];
  catalogStatus.textContent = `Tabela ativa: ${option.textContent.replace(" · ", " — ")}.`;
});

catalogFile.addEventListener("change", () => {
  if (catalogFile.files[0]) {
    catalogStatus.textContent = `Arquivo "${catalogFile.files[0].name}" selecionado para a empresa ativa.`;
  }
});

catalogSearch.addEventListener("input", () => {
  const query = catalogSearch.value.trim().toLowerCase();
  document.querySelectorAll(".catalog-table > div:not(.table-head)").forEach((row) => {
    row.hidden = query !== "" && !row.textContent.toLowerCase().includes(query);
  });
});

document.querySelector("#save-count").addEventListener("click", () => {
  const quantity = Number(document.querySelector("#material-quantity").value) || 1;
  const weight = document.querySelector("#count-weight").textContent;
  savedCounts.push({
    date: new Date().toLocaleString("pt-BR"),
    company: companySelect.selectedOptions[0].textContent,
    material: document.querySelector("#result-profile").textContent,
    quantity,
    weight: weight.replace("Peso teórico: ", "")
  });
  localStorage.setItem(countStorageKey, JSON.stringify(savedCounts));
  renderCounts();
  closeModal();
  document.querySelector(".activity-list").insertAdjacentHTML(
    "afterbegin",
    `<div class="activity"><span class="activity-icon blue">▥</span><div><strong>Nova contagem salva</strong><p>Resultado confirmado no histórico</p><small>Agora</small></div><b>${quantity.toLocaleString("pt-BR")} un. · ${weight.replace("Peso teórico: ", "")}</b></div>`
  );
});

document.querySelector("#add-identified").addEventListener("click", () => {
  const id = editingTipId || `PT-${String(tipSequence).padStart(4, "0")}`;
  const code = document.querySelector("#tip-code").value.trim() || id;
  const description = document.querySelector("#tip-description").value.trim() || "Ponta sem descrição";
  const unit = document.querySelector("#tip-unit").value;
  const diameter = document.querySelector("#tip-diameter").value || "—";
  const length = document.querySelector("#tip-length").value || "—";
  const quantity = document.querySelector("#tip-quantity").value || "0";
  const weight = document.querySelector("#tip-weight").value || "0,00";
  const status = document.querySelector("#tip-status").value;
  const tip = { id, code, description, unit, diameter, length, quantity, weight, status };
  savedTips = editingTipId ? savedTips.map((item) => item.id === editingTipId ? tip : item) : [...savedTips, tip];
  localStorage.setItem(tipsStorageKey, JSON.stringify(savedTips));
  if (remoteClient) {
    remoteClient.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (!session) return;
      return remoteClient.from("company_members").select("company_id").eq("user_id", session.user.id).limit(1)
        .then(({ data: memberships, error }) => {
          if (error) throw error;
          const companyId = memberships && memberships[0] ? memberships[0].company_id : null;
          if (!companyId) return;
          return remoteClient.from("tips").insert({
            company_id: companyId,
            sequential_id: Number(id.replace("PT-", "")),
            code, description, unit, diameter: diameter === "—" ? null : Number(diameter),
            length: length === "—" ? null : Number(length), quantity: Number(quantity), weight_kg: Number(weight) || 0, status,
            created_by: session.user.id
          });
        })
        .catch((error) => console.error("Não foi possível salvar a ponta no Supabase.", error));
    });
  }
  if (!editingTipId) tipSequence += 1;
  editingTipId = null;
  renderTips();
  document.querySelector("#tip-code").value = "";
  document.querySelector("#tip-diameter").value = "";
  document.querySelector("#tip-weight").value = "";
  document.querySelector("#tip-status").value = "active";
});

tipList.addEventListener("click", (event) => {
  const action = event.target.closest(".tip-action");
  if (!action) return;
  const tip = savedTips.find((item) => item.id === action.dataset.id);
  if (!tip) return;
  if (action.classList.contains("delete-tip")) {
    if (!window.confirm(`Excluir o cadastro ${tip.id}? Esta ação não pode ser desfeita.`)) return;
    savedTips = savedTips.filter((item) => item.id !== tip.id);
  } else {
    editingTipId = tip.id;
    document.querySelector("#tip-code").value = tip.code;
    document.querySelector("#tip-description").value = tip.description;
    document.querySelector("#tip-unit").value = tip.unit;
    document.querySelector("#tip-diameter").value = tip.diameter === "—" ? "" : tip.diameter;
    document.querySelector("#tip-length").value = tip.length === "—" ? "" : tip.length;
    document.querySelector("#tip-quantity").value = tip.quantity;
    document.querySelector("#tip-weight").value = tip.weight;
    document.querySelector("#tip-status").value = tip.status;
  }
  localStorage.setItem(tipsStorageKey, JSON.stringify(savedTips));
  tipSequence = savedTips.reduce((highest, item) => Math.max(highest, Number(item.id.replace("PT-", "")) || 0), 0) + 1;
  renderTips();
});

document.querySelector("#print-tip-label").addEventListener("click", () => {
  const id = editingTipId || `PT-${String(tipSequence).padStart(4, "0")}`;
  const label = window.open("", "_blank", "width=420,height=300");
  if (!label) return;
  label.document.write(`<html><head><title>Etiqueta ${id}</title><style>body{font-family:Arial;padding:28px;text-align:center;border:1px solid #222}h1{font-size:30px;margin:0 0 16px}p{font-size:16px;margin:8px}</style></head><body><h1>METALSCAN</h1><p><strong>ID DA PONTA</strong></p><h1>${id}</h1><p>${document.querySelector("#tip-code").value || "Código não informado"}</p><p>${document.querySelector("#tip-description").value || "Descrição não informada"}</p><script>window.print();</script></body></html>`);
  label.document.close();
});

let currentInventory = null;
function renderRfidTags() {
  const body = document.querySelector("#rfid-table tbody");
  const tags = RFIDService.listTags();
  body.innerHTML = tags.length ? tags.slice().reverse().map((tag) => `<tr><td>${tag.epc}</td><td>${tag.label}</td><td>${tag.description}</td><td>${tag.location}</td><td>${tag.status === "active" ? "ATIVA" : "INATIVA"}</td><td>${tag.status === "active" ? `<button class="tip-action" data-inactivate-tag="${tag.id}">Inativar</button>` : "—"}</td></tr>`).join("") : '<tr><td colspan="6">Nenhuma TAG cadastrada.</td></tr>';
}
function renderRfidHistory() {
  const body = document.querySelector("#rfid-history-table tbody");
  body.innerHTML = RFIDService.listInventories().slice().reverse().map((item) => `<tr><td>${item.id}</td><td>${item.location}</td><td>${new Date(item.startedAt).toLocaleString("pt-BR")}</td><td>${item.status}</td><td>${item.expected.length}</td><td>${item.read.filter((entry) => entry.state === "read").length}</td></tr>`).join("") || '<tr><td colspan="6">Nenhum inventário realizado.</td></tr>';
}
renderRfidTags();
renderRfidHistory();
document.querySelector("#register-rfid").addEventListener("click", () => {
  const status = document.querySelector("#rfid-status");
  try {
    RFIDService.registerTag({ epc: document.querySelector("#rfid-epc").value.trim(), label: document.querySelector("#rfid-label").value.trim(), code: document.querySelector("#rfid-code").value.trim(), description: document.querySelector("#rfid-description").value.trim(), batch: document.querySelector("#rfid-batch").value.trim(), location: document.querySelector("#rfid-location").value.trim(), quantity: Number(document.querySelector("#rfid-quantity").value) || 0, weight: Number(document.querySelector("#rfid-weight").value) || 0 });
    status.textContent = "TAG cadastrada como ATIVA.";
    renderRfidTags();
  } catch (error) { status.textContent = error.message; }
});
document.querySelector("#rfid-table").addEventListener("click", (event) => {
  const button = event.target.closest("[data-inactivate-tag]");
  if (!button || !window.confirm("Inativar esta TAG? Ela permanecerá no histórico.")) return;
  RFIDService.inactivateTag(button.dataset.inactivateTag);
  renderRfidTags();
});
document.querySelectorAll("[data-rfid-tab]").forEach((tab) => tab.addEventListener("click", () => {
  document.querySelectorAll("[data-rfid-tab]").forEach((item) => item.classList.toggle("active", item === tab));
  ["tags", "inventory", "history"].forEach((name) => { document.querySelector(`#rfid-${name}-panel`).hidden = name !== tab.dataset.rfidTab; });
}));
document.querySelector("#start-inventory").addEventListener("click", () => {
  const location = document.querySelector("#inventory-location").value.trim();
  if (!location) { document.querySelector("#inventory-status").textContent = "Informe o local antes de iniciar."; return; }
  currentInventory = RFIDService.startInventory(location);
  document.querySelector("#inventory-expected").textContent = currentInventory.expected.length;
  document.querySelector("#inventory-read").textContent = "0";
  document.querySelector("#inventory-missing").textContent = currentInventory.expected.length;
  document.querySelector("#inventory-divergences").textContent = "0";
  document.querySelector("#inventory-status").textContent = `Inventário ${currentInventory.id} iniciado.`;
  renderRfidHistory();
});
document.querySelector("#register-inventory-read").addEventListener("click", () => {
  if (!currentInventory) { document.querySelector("#inventory-status").textContent = "Inicie um inventário primeiro."; return; }
  const epc = document.querySelector("#inventory-epc").value.trim();
  if (!epc) return;
  currentInventory = RFIDService.registerRead(currentInventory.id, epc);
  const read = currentInventory.read.filter((item) => item.state === "read").length;
  document.querySelector("#inventory-read").textContent = read;
  document.querySelector("#inventory-missing").textContent = Math.max(currentInventory.expected.length - read, 0);
  document.querySelector("#inventory-divergences").textContent = currentInventory.read.filter((item) => item.state !== "read").length;
  document.querySelector("#inventory-epc").value = "";
  document.querySelector("#inventory-status").textContent = "Leitura registrada sem duplicidade.";
});

document.querySelector("#auth-button").addEventListener("click", () => openModal(authModal));
document.querySelector("#auth-submit").addEventListener("click", async () => {
  const status = document.querySelector("#auth-status");
  if (!remoteClient) {
    status.textContent = "Configure o arquivo supabase-config.js para ativar o login.";
    return;
  }
  const email = document.querySelector("#auth-email").value.trim();
  const password = document.querySelector("#auth-password").value;
  if (!email || !password) {
    status.textContent = "Informe e-mail e senha.";
    return;
  }
  const { data: authData, error } = await remoteClient.auth.signInWithPassword({ email, password });
  if (error) {
    status.textContent = error.message;
    return;
  }
  const { data: memberships, error: membershipError } = await remoteClient
    .from("company_members")
    .select("role")
    .eq("user_id", authData.user.id);
  if (membershipError) {
    status.textContent = "Não foi possível validar as permissões administrativas.";
    await remoteClient.auth.signOut();
    return;
  }
  const isAdmin = (memberships || []).some((membership) => membership.role === "admin" || membership.role === "owner");
  if (!isAdmin) {
    status.textContent = "Acesso negado. Esta conta não possui permissão administrativa.";
    await remoteClient.auth.signOut();
    return;
  }
  status.textContent = "Login realizado.";
  authButton.textContent = "Conta ativa";
  authButton.hidden = false;
  logoutButton.hidden = false;
  closeModal();
  await loadRemoteTips();
});

logoutButton.addEventListener("click", async () => {
  if (remoteClient) {
    const { error } = await remoteClient.auth.signOut();
    if (error) {
      console.error("Não foi possível sair do Supabase.", error);
      return;
    }
  }
  authButton.textContent = "Entrar";
  logoutButton.hidden = true;
  savedTips = JSON.parse(localStorage.getItem(tipsStorageKey) || "[]").map((tip) => ({ ...tip, status: tip.status || "active" }));
  tipSequence = savedTips.reduce((highest, tip) => Math.max(highest, Number(tip.id.replace("PT-", "")) || 0), 0) + 1;
  renderTips();
});

document.querySelector("#admin-submit").addEventListener("click", async () => {
  const status = document.querySelector("#admin-status");
  if (!remoteClient) {
    status.textContent = "Configure o Supabase para validar o acesso administrativo.";
    return;
  }
  const email = document.querySelector("#admin-email").value.trim();
  const password = document.querySelector("#admin-password").value;
  if (!email || !password) {
    status.textContent = "Informe e-mail e senha.";
    return;
  }
  const { error } = await remoteClient.auth.signInWithPassword({ email, password });
  if (error) {
    status.textContent = error.message;
    return;
  }
  status.textContent = "Acesso administrativo autorizado.";
  authButton.textContent = "Conta ativa";
  logoutButton.hidden = false;
  setTimeout(() => closeModal(), 500);
});
