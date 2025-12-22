// app.js — optimized with warm-up for Google Apps Script
(function () {
  const GOOGLE_SCRIPT_WEBAPP_URL =
    "https://script.google.com/macros/s/AKfycbzQUaIXYGK3xA_5sWWf4OkU4--UAT26drV66dRiR1qSjkUqi7wywvNrNle2TDDeB5PRAA/exec";

  // 🔥 Warm-up: gọi GET nhẹ để tránh cold start khi submit
  fetch(GOOGLE_SCRIPT_WEBAPP_URL, { method: "GET" }).catch(() => {});

  const form = document.getElementById("regForm");
  const result = document.getElementById("result");
  const copyBtn = document.getElementById("copyBtn");

  function setError(id, msg) {
    const el = document.querySelector(`[data-err-for="${id}"]`);
    if (el) el.textContent = msg || "";
  }

  function normalizePhone(phone) {
    return (phone || "").trim().replace(/\s+/g, "").replace(/-/g, "");
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

  function showResult(html, isError) {
    result.innerHTML = html;
    result.style.display = "block";
    result.style.background = isError
      ? "rgba(255, 120, 120, .10)"
      : "rgba(232,217,168,.08)";
  }

  async function postToSheet(payload) {
    const res = await fetch(GOOGLE_SCRIPT_WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch (_) {}

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (json && json.ok === false) throw new Error(json.error || "Submit failed");

    return true;
  }

  if (!form) {
    console.error("Không tìm thấy form #regForm");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      fullName: form.fullName.value,
      msisdn: form.msisdn.value,
      department: form.department.value,
      type: form.type.value,
      level: form.level.value,
      note: form.note.value,
    };

    if (!validate(data)) return;

    const regCode = makeRegCode();
    const payload = {
      ...data,
      msisdn: normalizePhone(data.msisdn),
      regCode,
      submittedAt: new Date().toISOString(),
    };

    showResult(
      `<div><strong>Đang gửi đăng ký...</strong></div>
       <div class="muted" style="margin-top:6px;font-size:12px;">
         Vui lòng chờ 1–3 giây
       </div>`
    );

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      await postToSheet(payload);

      showResult(
        `<div><strong>Đăng ký thành công!</strong></div>
         <div>Mã đăng ký: <strong class="mono">${regCode}</strong></div>
         <div class="muted" style="margin-top:6px;font-size:12px;">
           Dữ liệu đã được lưu vào Google Sheet
         </div>`
      );

      if (copyBtn) {
        copyBtn.disabled = false;
        copyBtn.dataset.payload = JSON.stringify(payload, null, 2);
      }

      form.reset();
      if (form.type) form.type.value = "double";
      if (form.level) form.level.value = "newbie";

    } catch (err) {
      showResult(
        `<div><strong>Gửi đăng ký thất bại.</strong></div>
         <div class="muted" style="margin-top:6px;font-size:12px;">
           ${err.message || err}
         </div>
         <div class="muted" style="margin-top:6px;font-size:12px;">
           Bạn có thể copy nội dung để gửi thủ công cho BTC
         </div>`,
        true
      );

      if (copyBtn) {
        copyBtn.disabled = false;
        copyBtn.dataset.payload = JSON.stringify(payload, null, 2);
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      try {
        const txt = copyBtn.dataset.payload || "";
        if (!txt) return;
        await navigator.clipboard.writeText(txt);
        showResult(`<div><strong>Đã copy!</strong></div>`);
      } catch (_) {
        showResult(`<div><strong>Không copy được, hãy Ctrl+C thủ công.</strong></div>`, true);
      }
    });
  }
})();
