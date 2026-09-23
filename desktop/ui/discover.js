const $ = (id) => document.getElementById(id);
const api = window.discoveryApi;

function show(el, on) { el.classList.toggle("hidden", !on); }

function setStatus(text, isError) {
  $("status").textContent = text;
  $("status").classList.toggle("error", !!isError);
}

function renderList(servers) {
  const ul = $("list");
  ul.replaceChildren();
  servers.forEach((s) => {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.textContent = s.name;
    const small = document.createElement("small");
    small.textContent = [s.host, s.ip].filter(Boolean).join(" · ");
    b.appendChild(small);
    b.addEventListener("click", () => api.choose(s));
    li.appendChild(b);
    ul.appendChild(li);
  });
  show(ul, servers.length > 0);
}

api.onState((st) => {
  const busy = st.phase === "searching" || st.phase === "connecting";
  show($("spinner"), busy);
  show($("manualBox"), !busy);
  if (busy) show($("list"), false);

  switch (st.phase) {
    case "searching":
      setStatus("Αναζήτηση server στο δίκτυο…");
      break;
    case "connecting":
      setStatus(`Σύνδεση σε ${st.name}…`);
      break;
    case "choose":
      setStatus("Βρέθηκαν servers. Διάλεξε έναν:");
      renderList(st.servers);
      break;
    case "notfound":
      setStatus("Δεν βρέθηκε server MeteoLogger στο δίκτυο.", true);
      renderList([]);
      break;
    case "error":
      setStatus(st.message, true);
      break;
  }
  if (st.manual !== undefined && !$("manual").value) $("manual").value = st.manual;
});

$("manualBtn").addEventListener("click", () => api.manual($("manual").value));
$("manual").addEventListener("keydown", (e) => { if (e.key === "Enter") api.manual($("manual").value); });
$("retry").addEventListener("click", () => api.retry());
