import{f as l}from"./index-gh370Ysa.js";/**
 * @license lucide-react v1.48.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const s={name:"download",size:24,node:[["path",{d:"M12 15V3",key:"m9g1x1"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["path",{d:"m7 10 5 5 5-5",key:"brsn70"}]]};s.node;const d=l(s);function n(e=""){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function p(e=""){return e.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,"-").replace(/^-+|-+$/g,"")||"story"}function g(e){let t=`# ${e.title}

`;return t+=`**Genre:** ${e.genre} | **Tone:** ${e.tone} | **Protagonist:** ${e.protagonist}

`,t+=`---

`,e.chapters.forEach((o,r)=>{t+=`## Chapter ${r+1}: ${o.title}

`,o.atmosphere&&(t+=`*Atmosphere: ${o.atmosphere}*

`),t+=`${o.content}

`,o.chosenAction&&(t+=`> **Reader Choice:** *${o.chosenAction}*

`)}),t}function h(e,{autoPrint:t=!0}={}){const o=/[؀-ۿ]/.test(e.title||"")||e.language==="Arabic"?"rtl":"ltr",r=e.chapters.map(i=>{const c=(i.content||"").split(/\n\s*\n/).filter(a=>a.trim()).map(a=>`<p>${n(a.trim())}</p>`).join("");return`
    <section class="chapter">
      <h2>${n(i.title)}</h2>
      ${i.atmosphere?`<p class="atmosphere">✨ ${n(i.atmosphere)}</p>`:""}
      <div class="content">${c}</div>
      ${i.chosenAction?`<blockquote class="choice">👉 Reader Chose: <em>${n(i.chosenAction)}</em></blockquote>`:""}
    </section>`}).join("");return`<!DOCTYPE html>
<html dir="${o}">
  <head>
    <meta charset="utf-8" />
    <title>${n(e.title)} - Aetheria Storyteller</title>
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
    <h1>${n(e.title)}</h1>
    <div class="meta">${n(e.genre)} • ${n(e.tone)} • Protagonist: ${n(e.protagonist)}</div>
    ${r}
    ${t?"<script>window.onload = function () { window.print(); };<\/script>":""}
  </body>
</html>`}export{d as D,p as a,h as b,g as s};
