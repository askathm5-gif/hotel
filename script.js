// ----- DATA KEYS -----
// Use new keys so old menu items are cleared and you can start fresh
const MENU_KEY = "srilankan_spice_menu_v1";
const SALES_KEY = "srilankan_spice_sales_v1";

// ----- DOM LOOKUPS -----
const menuListEl = document.getElementById("menu-list");
const cartBodyEl = document.getElementById("cart-body");
const emptyCartMsgEl = document.getElementById("empty-cart-msg");
const subtotalEl = document.getElementById("subtotal-amount");
const taxEl = document.getElementById("tax-amount");
const totalEl = document.getElementById("total-amount");

const clearCartBtn = document.getElementById("clear-cart-btn");
const printBillBtn = document.getElementById("print-bill-btn");
const payNowBtn = document.getElementById("pay-now-btn");

const paymentModal = document.getElementById("payment-modal");
const closePaymentBtn = document.getElementById("close-payment-btn");
const markPaidBtn = document.getElementById("mark-paid-btn");
const payAmountLabel = document.getElementById("pay-amount-label");

const yearSpan = document.getElementById("year-span");

// Manage menu
const menuForm = document.getElementById("menu-form");
const itemIdInput = document.getElementById("item-id");
const itemNameInput = document.getElementById("item-name");
const itemPriceInput = document.getElementById("item-price");
const itemImageInput = document.getElementById("item-image");
const resetFormBtn = document.getElementById("reset-form-btn");
const manageBodyEl = document.getElementById("manage-body");

// Report
const reportMonthSelect = document.getElementById("report-month");
const reportYearSelect = document.getElementById("report-year");
const loadReportBtn = document.getElementById("load-report-btn");
const reportOrdersEl = document.getElementById("report-orders");
const reportSalesEl = document.getElementById("report-sales");
const reportBodyEl = document.getElementById("report-body");

// Print
const printFrame = document.getElementById("print-frame");

// ----- STATE -----
let menu = [];
let cart = [];

// ----- UTIL -----
const rupee = (n) => `LKR${n.toFixed(2)}`;

const loadFromStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors etc.
  }
};

// ----- INITIAL MENU -----
// Start with an empty menu; you can add your own Sri Lankan items in Manage Menu
const defaultMenu = [];

// ----- RENDER MENU -----
function renderMenu() {
  menuListEl.innerHTML = "";
  manageBodyEl.innerHTML = "";

  menu.forEach((item) => {
    // public menu card
    const card = document.createElement("article");
    card.className = "menu-card";
    card.dataset.id = item.id;

    const img = document.createElement("img");
    img.className = "menu-img";
    if (item.image) {
      img.src = item.image;
      img.alt = item.name;
    } else {
      img.classList.add("placeholder");
      img.alt = "Food image";
    }

    const body = document.createElement("div");
    body.className = "menu-body";

    const left = document.createElement("div");
    const name = document.createElement("div");
    name.className = "menu-name";
    name.textContent = item.name;
    const sub = document.createElement("div");
    sub.className = "menu-sub";
    sub.textContent = item.sub || "Tap to add to bill";
    left.appendChild(name);
    left.appendChild(sub);

    const price = document.createElement("div");
    price.className = "menu-price";
    price.textContent = rupee(item.price);

    body.appendChild(left);
    body.appendChild(price);

    card.appendChild(img);
    card.appendChild(body);
    card.addEventListener("click", () => addToCart(item.id));
    menuListEl.appendChild(card);

    // manage table row
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${rupee(item.price)}</td>
      <td>
        <img class="menu-thumb ${item.image ? "" : "placeholder"}" 
             src="${item.image || ""}" 
             alt="${item.name}" />
      </td>
      <td>
        <div class="table-actions">
          <button class="pill-btn" data-action="edit" data-id="${item.id}">Edit</button>
          <button class="pill-btn danger" data-action="delete" data-id="${item.id}">Delete</button>
        </div>
      </td>
    `;
    manageBodyEl.appendChild(tr);
  });
}

// ----- CART / BILLING -----
function addToCart(itemId) {
  const item = menu.find((m) => m.id === itemId);
  if (!item) return;

  const existing = cart.find((c) => c.id === itemId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: item.id, name: item.name, price: item.price, qty: 1 });
  }
  renderCart();
}

function removeFromCart(itemId) {
  const idx = cart.findIndex((c) => c.id === itemId);
  if (idx === -1) return;
  if (cart[idx].qty > 1) {
    cart[idx].qty -= 1;
  } else {
    cart.splice(idx, 1);
  }
  renderCart();
}

function clearCart() {
  cart = [];
  renderCart();
}

function computeTotals() {
  let subtotal = 0;
  cart.forEach((item) => {
    subtotal += item.price * item.qty;
  });
  const tax = 0; // 0% tax for Sri Lankan setup
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

function renderCart() {
  cartBodyEl.innerHTML = "";

  if (cart.length === 0) {
    emptyCartMsgEl.style.display = "block";
  } else {
    emptyCartMsgEl.style.display = "none";
  }

  cart.forEach((item) => {
    const tr = document.createElement("tr");
    tr.dataset.id = item.id;
    tr.innerHTML = `
      <td>${item.name}</td>
      <td><span class="qty-pill">${item.qty}</span></td>
      <td>${rupee(item.price)}</td>
      <td>${rupee(item.price * item.qty)}</td>
    `;
    tr.addEventListener("click", () => removeFromCart(item.id));
    cartBodyEl.appendChild(tr);
  });

  const { subtotal, tax, total } = computeTotals();
  subtotalEl.textContent = rupee(subtotal);
  taxEl.textContent = rupee(tax);
  totalEl.textContent = rupee(total);
}

// ----- PAYMENT / SALES -----
function openPaymentModal() {
  const { total } = computeTotals();
  if (total <= 0) {
    alert("Add some items to the cart before paying.");
    return;
  }
  payAmountLabel.textContent = `Amount: ${rupee(total)}`;
  paymentModal.classList.remove("hidden");
}

function closePaymentModal() {
  paymentModal.classList.add("hidden");
}

function saveSale() {
  const { subtotal, tax, total } = computeTotals();
  if (total <= 0 || cart.length === 0) {
    alert("No items to save. Add items to the bill first.");
    return;
  }
  const sales = loadFromStorage(SALES_KEY, []);
  const now = new Date();
  const sale = {
    id: `sale_${now.getTime()}`,
    createdAt: now.toISOString(),
    items: cart.map((c) => ({ name: c.name, qty: c.qty, price: c.price })),
    subtotal,
    tax,
    total,
  };
  sales.push(sale);
  saveToStorage(SALES_KEY, sales);
  alert("Payment recorded and sale saved.");
  clearCart();
  closePaymentModal();
}

// ----- PRINT BILL -----
function printBill() {
  const { subtotal, tax, total } = computeTotals();
  if (total <= 0) {
    alert("Nothing to print. Add items to the bill first.");
    return;
  }
  const now = new Date();
  const rowsHtml = cart
    .map(
      (item) => `
      <tr>
        <td>${item.name}</td>
        <td style="text-align:center;">${item.qty}</td>
        <td style="text-align:right;">${rupee(item.price)}</td>
        <td style="text-align:right;">${rupee(item.price * item.qty)}</td>
      </tr>
    `
    )
    .join("");

  const html = `
    <html>
      <head>
        <title>Bill - Sri Lankan Spice Restaurant</title>
        <style>
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            padding: 16px;
            color: #111827;
          }
          h1 {
            margin: 0 0 4px;
            font-size: 1.2rem;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: .08em;
          }
          p {
            margin: 2px 0;
            font-size: .8rem;
            text-align: center;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: .82rem;
          }
          th, td {
            padding: 4px 6px;
            border-bottom: 1px solid #e5e7eb;
          }
          th {
            text-align: left;
            font-weight: 600;
          }
          .summary {
            margin-top: 10px;
            font-size: .84rem;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
          }
          .total {
            font-weight: 700;
          }
          .footer {
            text-align: center;
            margin-top: 12px;
            font-size: .78rem;
          }
        </style>
      </head>
      <body>
        <h1>Sri Lankan Spice Restaurant</h1>
        <p>Taste of Sri Lankan</p>
        <p>${now.toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align:center;">Qty</th>
              <th style="text-align:right;">Price</th>
              <th style="text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div class="summary">
          <div class="summary-row"><span>Sub Total</span><span>${rupee(subtotal)}</span></div>
          <div class="summary-row"><span>Tax (0%)</span><span>${rupee(tax)}</span></div>
          <div class="summary-row total"><span>Grand Total</span><span>${rupee(total)}</span></div>
        </div>
        <div class="footer">
          Thank you for dining with us!
        </div>
      </body>
    </html>
  `;

  const doc = printFrame.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
  printFrame.contentWindow.focus();
  printFrame.contentWindow.print();
}

// ----- MANAGE MENU (CRUD) -----
function resetForm() {
  itemIdInput.value = "";
  itemNameInput.value = "";
  itemPriceInput.value = "";
  itemImageInput.value = "";
}

function handleMenuSubmit(e) {
  e.preventDefault();
  const name = itemNameInput.value.trim();
  const price = Number(itemPriceInput.value);
  const image = itemImageInput.value.trim();

  if (!name || !price || price <= 0) {
    alert("Please enter a valid name and price.");
    return;
  }

  const existingId = itemIdInput.value;
  if (existingId) {
    const idx = menu.findIndex((m) => m.id === existingId);
    if (idx !== -1) {
      menu[idx].name = name;
      menu[idx].price = price;
      menu[idx].image = image || "";
    }
  } else {
    const id = name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now().toString(36);
    menu.push({
      id,
      name,
      price,
      image: image || "",
      sub: "Tap to add to bill",
    });
  }

  saveToStorage(MENU_KEY, menu);
  renderMenu();
  resetForm();
}

function handleManageClick(e) {
  const btn = e.target.closest("button");
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  if (!action || !id) return;

  if (action === "edit") {
    const item = menu.find((m) => m.id === id);
    if (!item) return;
    itemIdInput.value = item.id;
    itemNameInput.value = item.name;
    itemPriceInput.value = item.price;
    itemImageInput.value = item.image || "";
    itemNameInput.focus();
  } else if (action === "delete") {
    if (!confirm("Delete this menu item?")) return;
    menu = menu.filter((m) => m.id !== id);
    saveToStorage(MENU_KEY, menu);
    renderMenu();
  }
}

// ----- REPORTING -----
function populateReportSelectors() {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  reportMonthSelect.innerHTML = "";
  months.forEach((label, idx) => {
    const opt = document.createElement("option");
    opt.value = String(idx);
    opt.textContent = label;
    reportMonthSelect.appendChild(opt);
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  reportYearSelect.innerHTML = "";
  for (let y = currentYear - 3; y <= currentYear + 1; y++) {
    const opt = document.createElement("option");
    opt.value = String(y);
    opt.textContent = String(y);
    reportYearSelect.appendChild(opt);
  }

  reportMonthSelect.value = String(now.getMonth());
  reportYearSelect.value = String(currentYear);
}

function loadReport() {
  const month = Number(reportMonthSelect.value);
  const year = Number(reportYearSelect.value);
  const sales = loadFromStorage(SALES_KEY, []);
  const filtered = sales.filter((sale) => {
    const d = new Date(sale.createdAt);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  reportBodyEl.innerHTML = "";
  let totalSales = 0;
  filtered.forEach((sale) => {
    totalSales += sale.total;
    const d = new Date(sale.createdAt);
    const itemsText = sale.items.map((it) => `${it.name} x${it.qty}`).join(", ");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.toLocaleString()}</td>
      <td>${itemsText}</td>
      <td>${rupee(sale.total)}</td>
    `;
    reportBodyEl.appendChild(tr);
  });

  reportOrdersEl.textContent = String(filtered.length);
  reportSalesEl.textContent = rupee(totalSales);
}

// ----- INIT -----
function init() {
  yearSpan.textContent = new Date().getFullYear();

  const storedMenu = loadFromStorage(MENU_KEY, null);
  menu = Array.isArray(storedMenu) && storedMenu.length ? storedMenu : defaultMenu;
  saveToStorage(MENU_KEY, menu);

  renderMenu();
  renderCart();
  populateReportSelectors();
  loadReport();

  // events
  clearCartBtn.addEventListener("click", clearCart);
  printBillBtn.addEventListener("click", printBill);
  payNowBtn.addEventListener("click", openPaymentModal);
  closePaymentBtn.addEventListener("click", closePaymentModal);
  paymentModal.addEventListener("click", (e) => {
    if (e.target === paymentModal) {
      closePaymentModal();
    }
  });
  markPaidBtn.addEventListener("click", saveSale);

  menuForm.addEventListener("submit", handleMenuSubmit);
  resetFormBtn.addEventListener("click", resetForm);
  manageBodyEl.addEventListener("click", handleManageClick);

  loadReportBtn.addEventListener("click", loadReport);
}

document.addEventListener("DOMContentLoaded", init);

