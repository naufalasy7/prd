// ====== KONFIGURASI ======
const API_URL = "https://script.google.com/macros/s/AKfycby5JO1VspysQ81xcenRLIEudTdl9JxYA5gwfDRJoaZfv44BgqNtp8CPWka7pGzJaUw/exec";
const TOKEN   = "123";          // harus sama dengan di Code.gs & ESP8266
const CHANNELS = [{ id: 1, name: "Relay 1" }, { id: 2, name: "Relay 2" }];
const POLL_MS = 3000;
const ONLINE_WINDOW_S = 15;                     // dianggap online bila ESP terlihat < 15 detik lalu
// =========================

const $channels = document.getElementById("channels");
const $status = document.getElementById("status");
const $statusText = document.getElementById("statusText");
const $msg = document.getElementById("msg");
const busy = {};   // channel yang sedang dikirim, supaya polling tidak menimpa tampilan

function render() {
  $channels.innerHTML = CHANNELS.map(c => `
    <div class="ch" id="ch${c.id}">
      <div><div class="name">${c.name}</div><div class="state" id="st${c.id}">…</div></div>
      <button class="switch" id="sw${c.id}" role="switch" aria-checked="false" aria-label="${c.name}"></button>
    </div>`).join("");
  CHANNELS.forEach(c => document.getElementById("sw" + c.id).addEventListener("click", () => toggle(c.id)));
}

function paint(id, on) {
  document.getElementById("ch" + id).classList.toggle("on", !!on);
  document.getElementById("sw" + id).setAttribute("aria-checked", !!on);
  document.getElementById("st" + id).textContent = on ? "Menyala" : "Mati";
}

async function api(params) {
  const url = API_URL + "?" + new URLSearchParams({ token: TOKEN, ...params });
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

async function refresh() {
  try {
    const d = await api({ action: "state" });
    CHANNELS.forEach(c => { if (!busy[c.id]) paint(c.id, d["relay" + c.id] == 1); });
    const age = d.now - d.lastSeen;
    const online = d.lastSeen > 0 && age <= ONLINE_WINDOW_S;
    $status.className = "status " + (online ? "online" : "offline");
    $statusText.textContent = online ? "ESP8266 online" : "ESP8266 offline";
    $msg.textContent = "";
  } catch (e) {
    $msg.textContent = "Gagal terhubung ke server: " + e.message;
  }
}

async function toggle(id) {
  const btn = document.getElementById("sw" + id);
  const next = btn.getAttribute("aria-checked") !== "true";
  busy[id] = true; btn.disabled = true; paint(id, next);
  try {
    await api({ action: "set", ch: id, state: next ? 1 : 0 });
    $msg.textContent = "";
  } catch (e) {
    paint(id, !next);
    $msg.textContent = "Perintah gagal dikirim: " + e.message;
  } finally {
    busy[id] = false; btn.disabled = false;
  }
}

render();
refresh();
setInterval(refresh, POLL_MS);
