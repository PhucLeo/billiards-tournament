(function () {
  const form = document.getElementById("regForm");
  const result = document.getElementById("result");
  const copyBtn = document.getElementById("copyBtn");

  function setError(id, msg) {
    const el = document.querySelector(`[data-err-for="${id}"]`);
    if (el) el.textContent = msg || "";
  }

  function normalizePhone(phone) {
    return (phone || "").replace(/\s+/g, "").replace(/-/g, "");
  }

  function validate(data) {
    let ok = true;

    setError("fullName", "");
    setError("msisdn", "");
    setError("department", "");

    if (!data.fullName || data.fullName.trim().length < 2) {
      setError("fullName", "Vui lòng nhập họ tên hợp lệ.");
      ok = false;
    }

    const msisdn = normalizePhone(data.msisdn);
    if (!msisdn || msisdn.length < 8) {
      setError("msisdn", "Vui lòng nhập số điện thoại hợp lệ.");
      ok = false;
    }

    if (!data.department || data.department.trim().length < 2) {
      setError("department", "Vui lòng nhập phòng ban/đơn vị.");
      ok = false;
    }

    return ok;
  }

  function makeRegCode() {
    const d = new Date();
    const y = String(d.getFullYear()).slice(-2);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `Q4BIA-${y}${m}${day}-${rand}`;
  }

  function showResult(html) {
    result.innerHTML = html;
    result.style.display = "block";
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = {
      fullName: form.fullName.value,
      msisdn: form.msisdn.value,
      department: form.department.value,
      type: form.type.value,
      level: form.level.value,
      note: form.note.value
    };

    if (!validate(data)) return;

    const regCode = makeRegCode();
    const payload = { ...data, regCode, submittedAt: new Date().toISOString() };

    // Lưu local để demo (GitHub Pages là trang tĩnh)
    localStorage.setItem("q4_billiards_registration_last", JSON.stringify(payload));

    showResult(`
      <div><strong>Đăng ký thành công!</strong></div>
      <div>Mã đăng ký của bạn: <strong class="mono">${regCode}</strong></div>
      <div class="muted" style="margin-top:6px;font-size:12px;">
        Vui lòng chụp màn hình hoặc copy nội dung đăng ký để gửi cho BTC (nếu cần).
      </div>
    `);

    copyBtn.disabled = false;
    copyBtn.dataset.payload = JSON.stringify(payload, null, 2);

    form.reset();
    form.type.value = "single";
    form.level.value = "newbie";
  });

  copyBtn.addEventListener("click", async () => {
    try {
      const txt = copyBtn.dataset.payload || "";
      await navigator.clipboard.writeText(txt);
      showResult(`<div><strong>Đã copy!</strong> Bạn có thể paste gửi cho BTC.</div>`);
    } catch (err) {
      showResult(`<div><strong>Không copy được tự động.</strong> Trình duyệt chặn clipboard. Bạn thử dùng Ctrl+C thủ công.</div>`);
    }
  });
})();
