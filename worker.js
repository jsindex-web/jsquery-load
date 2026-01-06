export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname.toLowerCase();

    /* ========== ✅ OPTIONS (WAJIB) ========== */
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "*"
        }
      });
    }

    const USERNAME = "admin";
    const PASSWORD = "SEOMAFIAWEB88";

    const cookie = req.headers.get("Cookie") || "";
    const isLogin = cookie.includes("auth=1");

    /* ========== 🔓 PUBLIC JS INJECT ========== */
    if (path === "/inject.js") {
      return new Response(await env.CONTENT_DB.get("inject_js") || "", {
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=300"
        }
      });
    }

    /* ========== 🔓 PUBLIC READ (SEO FETCH) ========== */
    if (path === "/public") {
      const key = url.searchParams.get("key");

      if (!["anchors", "article"].includes(key)) {
        return new Response("Forbidden", { status: 403 });
      }

      return new Response(await env.CONTENT_DB.get(key) || "", {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=300"
        }
      });
    }

    /* ========== LOGIN ========== */
    if (path === "/login" && req.method === "POST") {
      const f = await req.formData();
      if (f.get("username") === USERNAME && f.get("password") === PASSWORD) {
        return new Response("OK", {
          headers: { "Set-Cookie": "auth=1; Path=/; HttpOnly" }
        });
      }
      return new Response("FAIL");
    }

    if (path === "/logout") {
      return new Response("OUT", {
        headers: { "Set-Cookie": "auth=0; Path=/; Max-Age=0" }
      });
    }

    /* ========== PANEL PROTECTED ========== */
    if (!isLogin) {
      return new Response(loginHTML(), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    /* ========== SAVE CONTENT ========== */
    if (path === "/save") {
      const b = await req.json();
      await env.CONTENT_DB.put(b.key, b.value || "");
      return new Response("SAVED");
    }

    /* ========== GET (UNTUK PANEL) ========== */
    if (path === "/get") {
      const key = url.searchParams.get("key");
      return new Response(await env.CONTENT_DB.get(key) || "");
    }

    return new Response(panelHTML(), {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
};

const html = () => ({ "Content-Type": "text/html; charset=utf-8" });


/* ================= LOGIN ================= */
function loginHTML() {
  return `
<!DOCTYPE html>
<html>
<body>
<h2>Admin Login</h2>
<input id="u" placeholder="Username"><br>
<input id="p" type="password" placeholder="Password"><br><br>
<button onclick="login()">Login</button>

<script>
if(localStorage.getItem("dark")==="true")document.body.classList.add("dark");

async function login(){
  const f=new FormData();
  f.append("username",u.value);
  f.append("password",p.value);
  const r=await fetch("/login",{method:"POST",body:f});
  if(await r.text()=="OK")location.reload();
  else alert("Login gagal");
}
</script>

<style>${darkCSS()}</style>
</body>
</html>`;
}

/* ================= PANEL ================= */
function panelHTML() {
  return `
<!DOCTYPE html>
<html>
<head>
<title>Mini Admin Panel</title>
<style>${darkCSS()}</style>
</head>
<body>

<button onclick="toggleDark()">Dark Mode</button>
<button onclick="logout()">Logout</button>

<h3>Bunker Anchors</h3>
<textarea id="anchors"></textarea>
<button onclick="save('anchors')">Save</button>

<h3>Template Artikel (Spin)</h3>
<textarea id="article"></textarea>
<button onclick="save('article')">Save</button>
<button onclick="spin()">Preview Spin</button>

<h3>Hasil Spin</h3>
<textarea id="result"></textarea>

<h3>Inject JS</h3>
<textarea id="inject"></textarea>
<button onclick="save('inject_js')">Save</button>

<script>
const qs = id => document.getElementById(id);

/* ===== DARK MODE ===== */
if(localStorage.getItem("dark")==="true")document.body.classList.add("dark");
function toggleDark(){
  document.body.classList.toggle("dark");
  localStorage.setItem("dark",document.body.classList.contains("dark"));
}

/* ===== SAVE ===== */
async function save(key){
  const el = key === "inject_js" ? qs("inject") : qs(key);
  await fetch("/save",{
    method:"POST",
    body:JSON.stringify({
      key: key,
      value: el.value
    })
  });
  alert("Saved");
}

/* ===== LOAD (ANTI HTML ERROR) ===== */
async function load(key){
  const r = await fetch("/get?key="+key);
  const t = await r.text();

  if(!t || t.startsWith("<!DOCTYPE") || t.includes("Worker threw exception")) return;

  const el = key === "inject_js" ? qs("inject") : qs(key);
  el.value = t;
}

function logout(){
  fetch("/logout").then(()=>location.reload());
}

/* ===== SPINNER ===== */
function spin(){
  let t = qs("article").value;

  t = t.replace(/{([^}|]+(\|[^}]+)+)}/g, m => {
    const a = m.slice(1,-1).split("|");
    return a[Math.floor(Math.random()*a.length)];
  });

  const anchors = qs("anchors").value
    .split("\\n")
    .filter(x=>x.trim())
    .map(l=>{
      const p=l.split("|");
      return '<a href="'+p[1].trim()+'">'+p[0].trim()+'</a>';
    })
    .sort(()=>Math.random()-0.5);

  let i=0;
  t = t.replace(/{ANCHOR}/g,()=>anchors[i++%anchors.length]);

  const p = t.split("\\n").filter(x=>x.trim());
  for(let i=p.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [p[i],p[j]]=[p[j],p[i]];
  }

  qs("result").value = p.join("\\n");
}

/* ===== LOAD ON START ===== */
document.addEventListener("DOMContentLoaded",()=>{
  load("anchors");
  load("article");
  load("inject_js");
});
</script>

</body>
</html>`;
}

/* ================= CSS ================= */
function darkCSS() {
  return `
body{font-family:sans-serif;background:#f4f4f4;color:#000;padding:20px}
textarea{width:100%;height:120px;margin-bottom:10px}
button{margin:5px;padding:6px 10px}
body.dark{background:#121212;color:#eee}
body.dark textarea{background:#1e1e1e;color:#eee;border:1px solid #333}
body.dark button{background:#333;color:#eee;border:1px solid #555}
`;
}
