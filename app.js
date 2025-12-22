// app.js
(function () {
  const GOOGLE_SCRIPT_WEBAPP_URL =
    "https://script.google.com/macros/s/AKfycbzQUaIXYGK3xA_5sWWf4OkU4--UAT26drV66dRiR1qSjkUqi7wywvNrNle2TDDeB5PRAA/exec";

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

    if (!res.ok) throw new Error(`HTTP ${res.status} - ${text || "Request failed"}`);
    if (json && json.ok === false) throw new Error(json.error || "Submit failed");

    return true;
  }

  if (!form) {
    console.error("Không tìm thấy form #regForm. Kiểm tra lại index.html.");
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
      userAgent: navigator.userAgent,
      source: "phucleo.github.io/billiards-tournament",
    };

    showResult(
      `<div><strong>Đang gửi đăng ký...</strong></div>
       <div class="muted" style="margin-top:6px;font-size:12px;">Vui lòng chờ trong giây lát.</div>`
    );

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      await postToSheet(payload);

      showResult(
        `<div><strong>Đăng ký thành công!</strong></div>
         <div>Mã đăng ký của bạn: <strong class="mono">${regCode}</strong></div>
         <div class="muted" style="margin-top:6px;font-size:12px;">
           Dữ liệu đã được lưu vào Google Sheet của BTC.
         </div>`
      );

      if (copyBtn) {
        copyBtn.disabled = false;
        copyBtn.dataset.payload = JSON.stringify(payload, null, 2);
      }

      form.reset();

      // ✅ Mặc định lại: Đôi
      if (form.type) form.type.value = "double";
      if (form.level) form.level.value = "newbie";
    } catch (err) {
      showResult(
        `<div><strong>Gửi đăng ký thất bại.</strong></div>
         <div class="muted" style="margin-top:6px;font-size:12px;">
           Lỗi: ${String(err.message || err)}
         </div>
         <div class="muted" style="margin-top:6px;font-size:12px;">
           Bạn có thể bấm "Copy nội dung đăng ký" để gửi thủ công cho BTC.
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
        if (!txt) {
          showResult(`<div><strong>Chưa có dữ liệu để copy.</strong></div>`, true);
          return;
        }
        await navigator.clipboard.writeText(txt);
        showResult(`<div><strong>Đã copy!</strong> Bạn có thể paste gửi cho BTC.</div>`);
      } catch (err) {
        showResult(
          `<div><strong>Không copy được tự động.</strong></div>
           <div class="muted" style="margin-top:6px;font-size:12px;">Bạn thử Ctrl+C thủ công.</div>`,
          true
        );
      }
    });
  }
})();
