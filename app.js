// Load saved data
document.getElementById("anchors").value =
  localStorage.getItem("anchors") || "";
document.getElementById("template").value =
  localStorage.getItem("template") || "";

// Save anchors
function saveAnchors() {
  localStorage.setItem("anchors", anchors.value);
  alert("Anchors saved");
}

// Spin & Preview
function previewSpin() {
  const anchors = document.getElementById("anchors").value
    .split("\n")
    .filter(x => x.includes("|"));

  if (!anchors.length) return alert("Anchor kosong");

  const pick = anchors[Math.floor(Math.random() * anchors.length)];
  const [text, url] = pick.split("|").map(x => x.trim());

  const tpl = document.getElementById("template").value;
  const html = tpl.replace(/{ANCHOR}/g,
    `<a href="${url}" target="_blank">${text}</a>`
  );

  document.getElementById("result").innerHTML = html;

  generateInjectJS();
}

// Generate Inject JS
function generateInjectJS() {
  const html = document.getElementById("result").innerHTML;
  const payload = injectPayload(html);

  document.getElementById("inject").value =
    `<script>${payload}</script>`;
}

const PASSWORD = "SeoMafiaWeb88"; // ganti sendiri

function login() {
  if (document.getElementById("pass").value === PASSWORD) {
    localStorage.setItem("auth", "1");
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("panel").style.display = "block";
  } else {
    alert("Password salah");
  }
}

if (localStorage.getItem("auth") === "1") {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("panel").style.display = "block";
}
function exportJSON() {
  const data = {
    anchors: document.getElementById("anchors").value.split("\n"),
    template: document.getElementById("template").value
  };

  const blob = new Blob([JSON.stringify(data)], {type: "application/json"});
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "bunker.json";
  a.click();
}
