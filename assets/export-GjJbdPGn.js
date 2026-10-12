import{f as d}from"./index-zsHq8UKf.js";/**
 * @license lucide-react v1.48.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const l={name:"download",size:24,node:[["path",{d:"M12 15V3",key:"m9g1x1"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["path",{d:"m7 10 5 5 5-5",key:"brsn70"}]]};l.node;const u=d(l);function i(t=""){return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function m(t=""){return t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,"-").replace(/^-+|-+$/g,"")||"story"}function p(t){let e=`# ${t.title}

`;return e+=`**Genre:** ${t.genre} | **Tone:** ${t.tone} | **Protagonist:** ${t.protagonist}

`,e+=`---

`,t.chapters.forEach((n,r)=>{e+=`## Chapter ${r+1}: ${n.title}

`,n.atmosphere&&(e+=`*Atmosphere: ${n.atmosphere}*

`),e+=`${n.content}

`,n.chosenAction&&(e+=`> **Reader Choice:** *${n.chosenAction}*

`)}),e}function g(t,{autoPrint:e=!0}={}){const n=/[؀-ۿ]/.test(t.title||"")||t.language==="Arabic"?"rtl":"ltr",r=t.chapters.map(o=>{const a=(o.content||"").split(/\n\s*\n/).filter(c=>c.trim()).map(c=>`<p>${i(c.trim())}</p>`).join("");return`
    <section class="chapter">
      <h2>${i(o.title)}</h2>
      ${o.atmosphere?`<p class="atmosphere">✨ ${i(o.atmosphere)}</p>`:""}
      <div class="content">${a}</div>
      ${o.chosenAction?`<blockquote class="choice">👉 Reader Chose: <em>${i(o.chosenAction)}</em></blockquote>`:""}
    </section>`}).join("");return`<!DOCTYPE html>
<html dir="${n}">
  <head>
    <meta charset="utf-8" />
    <title>${i(t.title)} - Aetheria Storyteller</title>
    <style>
      body { font-family: Georgia, 'Amiri', serif; line-height: 1.8; max-width: 720px; margin: 40px auto; color: #1a1a1a; padding: 20px; }
      h1 { font-size: 2.2rem; margin-bottom: 8px; text-align: center; }
      .meta { text-align: center; color: #666; font-size: 0.95rem; margin-bottom: 32px; }
      .chapter { margin-bottom: 40px; page-break-inside: avoid; }
      h2 { font-size: 1.5rem; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
      .atmosphere { font-style: italic; color: #6b21a8; font-size: 0.9rem; text-indent: 0; }
      .choice { background: #f3f4f6; border-inline-start: 4px solid #7c3aed; padding: 10px 16px; margin: 16px 0; font-size: 0.95rem; }
      p { margin-bottom: 1.2em; text-indent: 1.5em; }
      @media print { body { max-width: 100%; margin: 0; } }
    </style>
  </head>
  <body>
    <h1>${i(t.title)}</h1>
    <div class="meta">${i(t.genre)} • ${i(t.tone)} • Protagonist: ${i(t.protagonist)}</div>
    ${r}
    ${e?"<script>window.onload = function () { window.print(); };<\/script>":""}
  </body>
</html>`}function s(t,e,n){const r=new Blob([e],{type:n}),o=URL.createObjectURL(r),a=document.createElement("a");a.href=o,a.download=t,a.click(),URL.revokeObjectURL(o)}function f(t){s(`${m(t.title)}.md`,p(t),"text/markdown;charset=utf-8")}function $(t){s(`aetheria-backup-${t.exportedAt.slice(0,10)}.json`,JSON.stringify(t),"application/json;charset=utf-8")}function b(t){const e=window.open("","_blank");return e?(e.document.write(g(t)),e.document.close(),!0):!1}export{u as D,$ as a,f as d,b as p};
