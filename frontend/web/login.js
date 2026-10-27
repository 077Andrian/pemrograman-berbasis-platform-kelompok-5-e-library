(() => {
  "use strict";

  const form = document.getElementById("login-form");
  const nameField = document.getElementById("name-field");
  const nameInput = document.getElementById("name");
  const nameError = document.getElementById("name-error");
  const emailInput = document.getElementById("email");
  const authModeToggle = document.getElementById("auth-mode-toggle");
  let authMode = "login";
  const passwordInput = document.getElementById("password");
  const emailError = document.getElementById("email-error");
  const passwordError = document.getElementById("password-error");
  const message = document.getElementById("form-message");
  const button = document.getElementById("submit-button");
  const buttonLabel = document.getElementById("button-label");
  const togglePassword = document.getElementById("toggle-password");
  const supportNote = document.getElementById("support-note");
  const pageTitle = document.getElementById("page-title");
  const pageIntro = document.getElementById("page-intro");
  const libraryPanel = document.getElementById("library-panel");
  const currentUserNode = document.getElementById("current-user");
  const currentRoleNode = document.getElementById("current-role");
  const bookGrid = document.getElementById("book-grid");
  const catalogCount = document.getElementById("catalog-count");
  const catalogMessage = document.getElementById("catalog-message");
  const loanList = document.getElementById("loan-list");
  const loanHeading = document.getElementById("loan-heading");
  const loanSubtitle = document.getElementById("loan-subtitle");
  const adminPanel = document.getElementById("admin-panel");
  const adminBookForm = document.getElementById("admin-book-form");
  const adminLoanList = document.getElementById("admin-loan-list");
  const leadershipPanel = document.getElementById("leadership-panel");
  const leadershipStats = document.getElementById("leadership-stats");
  const categoryFilter = document.getElementById("category-filter");
  const newCategory = document.getElementById("new-category");
  let accessTokenInMemory = null;
  let currentUser = null;

  const config = window.ELIBRARY_CONFIG || {};
  const apiBaseUrl = String(config.apiBaseUrl || "http://localhost:3000/api").replace(/\/+$/, "");

  function setMessage(text, success) {
    message.textContent = text;
    message.hidden = false;
    message.classList.toggle("success", Boolean(success));
  }
  function clearLoginErrors() {
    nameError.textContent = "";
    emailError.textContent = "";
    passwordError.textContent = "";
    nameInput.removeAttribute("aria-invalid");
    emailInput.removeAttribute("aria-invalid");
    passwordInput.removeAttribute("aria-invalid");
    message.hidden = true;
    message.classList.remove("success");
  }
  function setFieldError(input, node, text) {
    input.setAttribute("aria-invalid", "true");
    node.textContent = text;
  }
  function validForm() {
    let valid = true;
    const email = emailInput.value.trim();
    if (authMode === "register") {
      if (nameInput.value.trim().length < 2) {
        setFieldError(nameInput, nameError, "Nama minimal 2 karakter.");
        valid = false;
      }
      if (passwordInput.value.length < 8) {
        setFieldError(passwordInput, passwordError, "Kata sandi minimal 8 karakter.");
        valid = false;
      }
    }
    if (!email) {
      setFieldError(emailInput, emailError, "Email wajib diisi.");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError(emailInput, emailError, "Masukkan format email yang benar.");
      valid = false;
    }
    if (!passwordInput.value) {
      setFieldError(passwordInput, passwordError, "Kata sandi wajib diisi.");
      valid = false;
    }
    return valid;
  }

  function setAuthMode(mode) {
    authMode = mode;
    const registering = mode === "register";
    nameField.hidden = !registering;
    pageTitle.textContent = registering ? "Buat akun E-Library" : "Selamat datang kembali";
    pageIntro.textContent = registering
      ? "Buat akun untuk mulai meminjam buku di perpustakaan digital."
      : "Masuk untuk melanjutkan aktivitas perpustakaan digitalmu.";
    buttonLabel.textContent = registering ? "Daftar" : "Masuk";
    authModeToggle.textContent = registering
      ? "Sudah punya akun? Masuk"
      : "Belum punya akun? Daftar";
    passwordInput.autocomplete = registering ? "new-password" : "current-password";
    clearLoginErrors();
  }

  async function api(path, options) {
    const settings = options || {};
    const headers = Object.assign({ "Accept": "application/json" }, settings.headers || {});
    const init = { method: settings.method || "GET", headers };
    if (settings.body !== undefined) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(settings.body);
    }
    if (accessTokenInMemory && settings.auth !== false) {
      headers.Authorization = "Bearer " + accessTokenInMemory;
    }
    const response = await fetch(apiBaseUrl + path, init);
    if (response.status === 204) return {};
    let data;
    try { data = await response.json(); }
    catch (_) { throw new Error("Respons API bukan JSON yang valid."); }
    if (!response.ok) {
      const detail = data && data.error && data.error.message;
      throw new Error(detail || (data && data.message) || "Permintaan API gagal.");
    }
    return data;
  }
  function makeText(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = text == null ? "" : String(text);
    return node;
  }
  function showCatalogMessage(text, success) {
    catalogMessage.textContent = text;
    catalogMessage.hidden = !text;
    catalogMessage.classList.toggle("success", Boolean(success));
  }
  function emptyState(text) {
    return makeText("p", "empty-state", text);
  }
  async function loadCategories() {
    const result = await api("/categories");
    const selected = categoryFilter.value;
    categoryFilter.replaceChildren(new Option("Semua kategori", ""));
    newCategory.replaceChildren(new Option("Tanpa kategori", ""));
    for (const category of result.data || []) {
      categoryFilter.add(new Option(category.name, String(category.id)));
      newCategory.add(new Option(category.name, String(category.id)));
    }
    categoryFilter.value = selected;
  }
  function makeBookCard(book) {
    const card = makeText("article", "book-card", "");
    card.appendChild(makeText("h4", "", book.title));
    card.appendChild(makeText("p", "book-author", "Penulis: " + book.author));
    card.appendChild(makeText("p", "book-description", book.description || "Belum ada deskripsi buku."));
    card.appendChild(makeText("div", "book-meta",
      (book.categoryName || "Tanpa kategori") + " · Stok tersedia: " + book.stock));
    const actions = makeText("div", "book-actions", "");
    if (currentUser.role === "member") {
      const borrow = makeText("button", "", book.stock > 0 ? "Pinjam buku" : "Stok habis");
      borrow.type = "button";
      borrow.disabled = book.stock < 1;
      borrow.addEventListener("click", async () => {
        borrow.disabled = true;
        try {
          await api("/loans", { method: "POST", body: { bookId: book.id } });
          showCatalogMessage("Buku berhasil dipinjam.", true);
          await loadBooks();
          await loadLoans();
        } catch (error) {
          showCatalogMessage(error.message);
          borrow.disabled = book.stock < 1;
        }
      });
      actions.appendChild(borrow);
    } else if (currentUser.role === "librarian") {
      const edit = makeText("button", "secondary", "Ubah judul");
      edit.type = "button";
      edit.addEventListener("click", async () => {
        const title = window.prompt("Judul buku baru:", book.title);
        if (title === null || !title.trim()) return;
        try {
          await api("/admin/books/" + book.id, { method: "PATCH", body: { title: title.trim() } });
          showCatalogMessage("Judul buku diperbarui.", true);
          await loadBooks();
        } catch (error) { showCatalogMessage(error.message); }
      });
      const remove = makeText("button", "secondary", "Hapus");
      remove.type = "button";
      remove.addEventListener("click", async () => {
        if (!window.confirm("Hapus buku \"" + book.title + "\"?")) return;
        try {
          await api("/admin/books/" + book.id, { method: "DELETE" });
          showCatalogMessage("Buku dihapus.", true);
          await loadBooks();
        } catch (error) { showCatalogMessage(error.message); }
      });
      actions.append(edit, remove);
    }
    card.appendChild(actions);
    return card;
  }
  async function loadBooks() {
    catalogCount.textContent = "Memuat katalog...";
    bookGrid.replaceChildren();
    const params = new URLSearchParams();
    const query = document.getElementById("book-search").value.trim();
    if (query) params.set("q", query);
    if (categoryFilter.value) params.set("categoryId", categoryFilter.value);
    try {
      const result = await api("/books" + (params.toString() ? "?" + params.toString() : ""));
      catalogCount.textContent = String(result.pagination.total) + " buku ditemukan";
      if (!result.data || result.data.length === 0) {
        bookGrid.appendChild(emptyState("Buku tidak ditemukan. Coba kata kunci lain."));
        return;
      }
      for (const book of result.data) bookGrid.appendChild(makeBookCard(book));
    } catch (error) {
      catalogCount.textContent = "Katalog belum dapat dimuat";
      bookGrid.appendChild(emptyState(error.message));
    }
  }
  function loanNode(loan, adminMode) {
    const item = makeText("article", "loan-item", "");
    const body = makeText("div", "", "");
    body.appendChild(makeText("strong", "", loan.bookTitle || "Buku"));
    body.appendChild(makeText("p", "", adminMode
      ? (loan.userName || loan.userEmail || "Pengguna") + " · " + (loan.userEmail || "")
      : "Status: " + loan.status));
    body.appendChild(makeText("p", "", "Jatuh tempo: " + loan.dueDate));
    item.appendChild(body);
    if (loan.status === "borrowed") {
      const button = makeText("button", "", "Tandai dikembalikan");
      button.type = "button";
      button.addEventListener("click", async () => {
        button.disabled = true;
        try {
          if (adminMode) {
            await api("/admin/loans/" + loan.id + "/status", { method: "PATCH", body: { status: "returned" } });
          } else {
            await api("/loans/" + loan.id + "/return", { method: "POST" });
          }
          showCatalogMessage("Status peminjaman diperbarui.", true);
          await loadBooks();
          await loadLoans();
        } catch (error) {
          showCatalogMessage(error.message);
          button.disabled = false;
        }
      });
      item.appendChild(button);
    } else {
      item.appendChild(makeText("span", "role-line", "Dikembalikan"));
    }
    return item;
  }
  async function loadLeadershipDashboard() {
    const result = await api("/leadership/stats");
    const data = result.data || {};
    const summary = data.summary || {};
    leadershipStats.replaceChildren();

    const grid = makeText("div", "stats-grid", "");
    const cards = [
      ["Judul buku", summary.totalTitles || 0],
      ["Eksemplar tersedia", summary.availableCopies || 0],
      ["Peminjaman aktif", summary.activeLoans || 0],
      ["Total transaksi", summary.totalLoans || 0],
      ["Anggota terdaftar", summary.totalMembers || 0]
    ];
    for (const [label, value] of cards) {
      const card = makeText("div", "stats-card", "");
      card.appendChild(makeText("span", "stats-label", label));
      card.appendChild(makeText("strong", "stats-value", value));
      grid.appendChild(card);
    }
    leadershipStats.appendChild(grid);

    const sections = [
      {
        title: "Buku paling sering dipinjam",
        rows: data.mostBorrowed || [],
        label: (row) => (row.title || "Buku") + " — " + (row.loanCount || 0) + " kali"
      },
      {
        title: "Anggota paling aktif",
        rows: data.mostActiveMembers || [],
        label: (row) => (row.name || row.email || "Anggota") + " — " + (row.loanCount || 0) + " pinjaman"
      },
      {
        title: "Buku dengan stok menipis",
        rows: data.lowStockBooks || [],
        label: (row) => (row.title || "Buku") + " — stok " + (row.stock || 0)
      }
    ];
    for (const section of sections) {
      const block = makeText("section", "stats-section", "");
      block.appendChild(makeText("h4", "", section.title));
      if (!section.rows.length) {
        block.appendChild(emptyState("Belum ada data."));
      } else {
        const list = makeText("ul", "stats-list", "");
        for (const row of section.rows) list.appendChild(makeText("li", "", section.label(row)));
        block.appendChild(list);
      }
      leadershipStats.appendChild(block);
    }
    leadershipPanel.hidden = false;
  }

  async function loadLoans() {
    const librarianMode = currentUser.role === "librarian";
    const leadershipMode = currentUser.role === "leadership";
    document.querySelector(".loan-section").hidden = librarianMode || leadershipMode;
    leadershipPanel.hidden = !leadershipMode;

    if (leadershipMode) {
      adminPanel.hidden = true;
      await loadLeadershipDashboard();
      return;
    }

    loanHeading.textContent = librarianMode ? "Semua peminjaman" : "Peminjaman saya";
    loanSubtitle.textContent = librarianMode ? "Kelola status pinjaman anggota" : "Riwayat dan status peminjaman";
    const result = await api(librarianMode ? "/admin/loans" : "/loans/my");
    loanList.replaceChildren();
    for (const loan of result.data || []) loanList.appendChild(loanNode(loan, librarianMode));
    if (!result.data || result.data.length === 0) loanList.appendChild(emptyState("Belum ada peminjaman."));
    adminLoanList.replaceChildren();
    if (librarianMode) {
      for (const loan of result.data || []) adminLoanList.appendChild(loanNode(loan, true));
      adminPanel.hidden = false;
    } else {
      adminPanel.hidden = true;
    }
  }
  async function enterLibrary(token) {
    accessTokenInMemory = token;
    const profile = await api("/auth/me");
    currentUser = profile.data;
    currentUserNode.textContent = currentUser.name;
    const roleLabels = { member: "Anggota", librarian: "Pustakawan", leadership: "Pimpinan" };
    currentRoleNode.textContent = "Role: " + (roleLabels[currentUser.role] || currentUser.role);
    pageTitle.textContent = "Perpustakaan E-Library";
    pageIntro.textContent = "Jelajahi katalog dan kelola peminjaman dari satu tempat.";
    form.hidden = true;
    supportNote.hidden = true;
    libraryPanel.hidden = false;
    await loadCategories();
    await loadBooks();
    await loadLoans();
  }
  function logout() {
    accessTokenInMemory = null;
    currentUser = null;
    form.reset();
    passwordInput.value = "";
    setAuthMode("login");
    clearLoginErrors();
    form.hidden = false;
    supportNote.hidden = false;
    libraryPanel.hidden = true;
    adminPanel.hidden = true;
    leadershipPanel.hidden = true;
    pageTitle.textContent = "Selamat datang kembali";
    pageIntro.textContent = "Masuk untuk melanjutkan aktivitas perpustakaan digitalmu.";
    showCatalogMessage("");
  }

  togglePassword.addEventListener("click", () => {
    const show = passwordInput.type === "password";
    passwordInput.type = show ? "text" : "password";
    togglePassword.textContent = show ? "Sembunyi" : "Lihat";
    togglePassword.setAttribute("aria-pressed", String(show));
    togglePassword.setAttribute("aria-label", show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi");
  });
  emailInput.addEventListener("input", () => {
    emailInput.removeAttribute("aria-invalid");
    emailError.textContent = "";
  });
  passwordInput.addEventListener("input", () => {
    passwordInput.removeAttribute("aria-invalid");
    passwordError.textContent = "";
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearLoginErrors();
    if (!validForm()) return;
    button.disabled = true;
    buttonLabel.textContent = "Memeriksa...";
    try {
      if (authMode === "register") {
        const registered = await api("/auth/register", {
          method: "POST",
          auth: false,
          body: {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            password: passwordInput.value
          }
        });
        emailInput.value = registered.data.email;
        passwordInput.value = "";
        setAuthMode("login");
        setMessage("Pendaftaran berhasil. Silakan masuk menggunakan akun yang baru dibuat.", true);
        return;
      }
      const response = await api("/auth/login", {
        method: "POST", auth: false,
        body: { email: emailInput.value.trim(), password: passwordInput.value }
      });
      if (!response.accessToken) throw new Error("Respons login tidak memuat accessToken.");
      passwordInput.value = "";
      await enterLibrary(response.accessToken);
      message.hidden = true;
    } catch (error) {
      accessTokenInMemory = null;
      currentUser = null;
      form.hidden = false;
      supportNote.hidden = false;
      libraryPanel.hidden = true;
      setAuthMode(authMode);
      if (error instanceof TypeError) {
        setMessage("Tidak dapat terhubung ke API. Pastikan backend aktif, URL API benar, dan CORS dikonfigurasi.");
      } else {
        setMessage(error.message || "Terjadi kesalahan saat login.");
      }
    } finally {
      button.disabled = false;
      buttonLabel.textContent = authMode === "register" ? "Daftar" : "Masuk";
    }
  });
  authModeToggle.addEventListener("click", () => setAuthMode(authMode === "login" ? "register" : "login"));
  nameInput.addEventListener("input", () => {
    nameInput.removeAttribute("aria-invalid");
    nameError.textContent = "";
  });
  document.getElementById("logout-button").addEventListener("click", logout);
  document.getElementById("refresh-button").addEventListener("click", async () => {
    try { await loadBooks(); await loadLoans(); showCatalogMessage("Data berhasil dimuat ulang.", true); }
    catch (error) { showCatalogMessage(error.message); }
  });
  document.getElementById("search-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    await loadBooks();
  });
  categoryFilter.addEventListener("change", loadBooks);
  adminBookForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const title = document.getElementById("new-title").value.trim();
    const author = document.getElementById("new-author").value.trim();
    const isbn = document.getElementById("new-isbn").value.trim();
    const stock = Number(document.getElementById("new-stock").value);
    const categoryId = newCategory.value ? Number(newCategory.value) : null;
    try {
      await api("/admin/books", {
        method: "POST",
        body: { title, author, isbn: isbn || null, stock, categoryId }
      });
      adminBookForm.reset();
      document.getElementById("new-stock").value = "1";
      showCatalogMessage("Buku baru berhasil ditambahkan.", true);
      await loadBooks();
      await loadCategories();
    } catch (error) { showCatalogMessage(error.message); }
  });
})();