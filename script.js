// ====== ISI INI SAJA ======
const API_URL = "https://script.google.com/macros/s/AKfycbyLe15wFFBUGgC9iibOtHgSUF0iUk_-OcxihI7Fik84N1VENBaKiqsonJyYL9zV9gZR/exec";
// ==========================
const CHANNELS = [{ id: 1, name: "Relay 1" }, { id: 2, name: "Relay 2" }];
const $channels = document.getElementById("channels");
const $status = document.getElementById("status");
const $statusText = document.getElementById("statusText");
const $msg = document.getElementById("msg");
const busy = {};

function render() {
  $channels.innerHTML = CHANNELS.map(c => `
    <div class="ch" id="ch${c.id}">
      <div><div class="name">${c.name}</div><div class="state" id="st${c.id}">…</div></div>
      <button class="switch" id="sw${c.id}" role="switch" aria-checked="false" aria-label="${c.name}"></button>
    </div>`).join("");
  CHANNELS.forEach(c => document.getElementById("sw" + c.id).onclick = () => toggle(c.id));
}

function paint(id, on) {
  document.getElementById("ch" + id).classList.toggle("on", !!on);
  document.getElementById("sw" + id).setAttribute("aria-checked", !!on);
  document.getElementById("st" + id).textContent = on ? "Menyala" : "Mati";
}

async function call(query) {
  const res = await fetch(API_URL + (query ? "?" + query : ""));
  return res.json();
}

async function refresh() {
  try {
    const d = await call("");
    CHANNELS.forEach(c => { if (!busy[c.id]) paint(c.id, d["r" + c.id] == 1); });
    const online = d.seen > 0 && d.now - d.seen <= 15;
    $status.className = "status " + (online ? "online" : "offline");
    $statusText.textContent = online ? "ESP8266 online" : "ESP8266 offline";
    $msg.textContent = "";
  } catch (e) {
    $msg.textContent = "Gagal terhubung ke Apps Script. Cek API_URL dan akses deployment (Anyone).";
  }
}

async function toggle(id) {
  const btn = document.getElementById("sw" + id);
  const next = btn.getAttribute("aria-checked") !== "true";
  busy[id] = true; paint(id, next);
  try {
    await call("r" + id + "=" + (next ? 1 : 0));
    $msg.textContent = "";
  } catch (e) {
    paint(id, !next);
    $msg.textContent = "Perintah gagal dikirim.";
  }
  setTimeout(() => { busy[id] = false; }, 4000);   // beri waktu agar polling tidak menimpa tampilan
}

render();
refresh();
setInterval(refresh, 3000);
