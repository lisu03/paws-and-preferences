(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))r(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const l of s.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&r(l)}).observe(document,{childList:!0,subtree:!0});function n(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function r(i){if(i.ep)return;i.ep=!0;const s=n(i);fetch(i.href,s)}})();const _=document.querySelector("#app");if(!_)throw new Error("App container not found");_.innerHTML=`
  <div class="app">
    <header class="app__header">
      <h1 class="app__title">Paws &amp; Preferences</h1>
      <p class="app__subtitle">Swipe through cats to find your favourite kitties.</p>
    </header>

    <main class="app__main">
      <section class="deck" data-view="deck">
        <div class="deck__status" id="status-text" aria-live="polite"></div>
        <div class="deck__cards" id="card-stack"></div>
        <div class="deck__controls">
          <button id="dislike-btn" class="control control--dislike" type="button" aria-label="Dislike this cat">
            Nope
          </button>
          <button id="like-btn" class="control control--like" type="button" aria-label="Like this cat">
            Love
          </button>
        </div>
        <p class="deck__hint">Swipe left or right, or use the buttons.</p>
      </section>

      <section class="summary hidden" data-view="summary">
        <h2 class="summary__title">Your favourite kitties</h2>
        <p class="summary__text">
          You liked <span id="likes-count">0</span> out of <span id="total-count">0</span> cats.
        </p>
        <div class="summary__grid" id="liked-grid"></div>
        <button id="restart-btn" class="summary__restart" type="button">
          Start over
        </button>
      </section>
    </main>
  </div>
`;const h=document.querySelector("#card-stack"),u=document.querySelector("#status-text"),P=document.querySelector("#like-btn"),x=document.querySelector("#dislike-btn"),q=document.querySelector("#restart-btn"),w=document.querySelector('[data-view="deck"]'),L=document.querySelector('[data-view="summary"]'),M=document.querySelector("#likes-count"),T=document.querySelector("#total-count"),p=document.querySelector("#liked-grid");let c=[],d=[],m=0,f=!1;async function $(t=15){u.textContent="Loading cute cats...";try{const e=await fetch(`https://cataas.com/api/cats?limit=${t}`);if(!e.ok)throw new Error("Failed to fetch cats");const n=await e.json();if(!Array.isArray(n)||n.length===0)throw new Error("No cats found");return u.textContent="",n.map(r=>({id:r._id,url:`https://cataas.com/cat/${r._id}?width=600&height=800&fit=cover`}))}catch(e){return console.error(e),u.textContent="We could not load cats from Cataas right now. Please check your connection and try again.",[]}}function H(t,e,n){const r=document.createElement("div");return r.className="cat-card",r.dataset.index=e.toString(),r.style.zIndex=String(n-e),r.innerHTML=`
    <img class="cat-card__image" src="${t.url}" alt="Cute cat ${e+1}" loading="lazy" />
    <div class="cat-card__overlay">
      <span class="badge badge--like">Like</span>
      <span class="badge badge--dislike">Nope</span>
    </div>
  `,r}function X(){h.innerHTML="",c.forEach((e,n)=>{const r=H(e,n,c.length);h.appendChild(r)});const t=k();t&&b(t)}function k(){return h.querySelector(".cat-card:last-child")}function v(t){if(f)return;const e=k();if(!e)return;const n=c[m];n&&(t==="like"&&d.push(n),f=!0,e.classList.add(t==="like"?"cat-card--like":"cat-card--dislike"),e.addEventListener("transitionend",()=>{if(e.remove(),m+=1,f=!1,m>=c.length)N();else{const r=k();r&&b(r)}},{once:!0}))}function b(t){let e=0,n=0,r=!1;const i=a=>{f||a.button!==0||(r=!0,e=a.clientX,n=e,t.setPointerCapture(a.pointerId),t.style.transition="none")},s=a=>{if(!r)return;n=a.clientX;const o=n-e,y=o/15,g=Math.min(Math.abs(o)/120,1);t.style.transform=`translateX(${o}px) rotate(${y}deg)`,t.style.setProperty("--swipe-opacity",g.toString())},l=a=>{if(!r)return;r=!1,t.releasePointerCapture(a.pointerId);const o=n-e,y=90;if(t.style.transition="",Math.abs(o)>y){const g=o>0?"like":"dislike",C=o>0?window.innerWidth*1.5:-window.innerWidth*1.5,E=o>0?25:-25;t.style.transform=`translateX(${C}px) rotate(${E}deg)`,t.style.setProperty("--swipe-opacity","1"),setTimeout(()=>v(g),120)}else t.style.transform="",t.style.setProperty("--swipe-opacity","0")};t.addEventListener("pointerdown",i),t.addEventListener("pointermove",s),t.addEventListener("pointerup",l),t.addEventListener("pointercancel",l)}function N(){if(w.classList.add("hidden"),L.classList.remove("hidden"),M.textContent=d.length.toString(),T.textContent=c.length.toString(),p.innerHTML="",d.length===0){p.innerHTML='<p class="summary__empty">You did not like any cats this time. Try again!</p>';return}d.forEach((t,e)=>{const n=document.createElement("figure");n.className="summary__item",n.innerHTML=`
      <img src="${t.url}" alt="Liked cat ${e+1}" loading="lazy" />
    `,p.appendChild(n)})}function A(){m=0,d=[],c=[],h.innerHTML="",p.innerHTML="",u.textContent="",w.classList.remove("hidden"),L.classList.add("hidden"),S()}P.addEventListener("click",()=>v("like"));x.addEventListener("click",()=>v("dislike"));q.addEventListener("click",A);async function S(){const t=await $(15);t.length!==0&&(c=t,X())}S();
