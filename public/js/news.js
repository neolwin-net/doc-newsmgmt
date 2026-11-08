const newsForm = document.getElementById('newsSearch'), newsResults = document.getElementById('newsResults');
const newsCount = document.getElementById('newsCount'), toast = document.getElementById('toast');
function esc(s='') { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function dateLabel(s) { return new Date(`${s}T00:00:00`).toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}); }
function notify(s) { toast.textContent=s; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),3000); }
async function loadNews() {
  newsResults.innerHTML='<div class="loading-state">Loading stories…</div>';
  try {
    const params = new URLSearchParams(new FormData(newsForm));
    const response = await fetch(`/api/news?${params}`); if (!response.ok) throw new Error('Could not load news.');
    const items = await response.json(); newsCount.textContent=items.length;
    if (!items.length) { newsResults.innerHTML='<div class="empty-state wide-empty"><span>◫</span><h3>No stories found</h3><p>Try changing your filters or publish the first update.</p><a class="btn btn-primary" href="/upload-news.html">Publish news</a></div>'; return; }
    newsResults.innerHTML=items.map(item=>`<article class="news-card">
      <a class="news-image" href="/news-detail.html?id=${item.id}"><img src="/api/news/${item.id}/photo" alt="" loading="lazy"><span class="image-arrow">↗</span></a>
      <div class="news-card-body"><div class="news-card-meta"><span class="category-tag">${esc(item.category)}</span><time>${dateLabel(item.published_at)}</time></div>
      <h3><a href="/news-detail.html?id=${item.id}">${esc(item.title)}</a></h3><p>${esc(item.preview)}${item.preview.length>=240?'…':''}</p>
      <div class="news-card-footer"><a class="read-more" href="/news-detail.html?id=${item.id}">Read more ↗</a><button class="small-action danger" data-delete="${item.id}" data-title="${esc(item.title)}">Delete ×</button></div></div>
    </article>`).join('');
  } catch(err) { newsResults.innerHTML=`<div class="empty-state"><h3>Something went wrong</h3><p>${esc(err.message)}</p></div>`; }
}
newsForm.addEventListener('submit',e=>{e.preventDefault();loadNews();});
document.getElementById('clearFilters').addEventListener('click',()=>{newsForm.reset();loadNews();});
newsResults.addEventListener('click',async e=>{
  const btn=e.target.closest('[data-delete]'); if(!btn)return;
  if(!confirm(`Are you sure you want to delete this news?\n\n"${btn.dataset.title}" and its associated photo will be permanently deleted.`))return;
  try { const r=await fetch(`/api/news/${btn.dataset.delete}`,{method:'DELETE'}); const d=await r.json(); if(!r.ok)throw new Error(d.error||'Delete failed.'); notify('News article deleted.'); loadNews(); }
  catch(err){notify(err.message);}
});
const menuToggle=document.getElementById('menuToggle'),mainNav=document.getElementById('mainNav');
if(menuToggle)menuToggle.addEventListener('click',()=>mainNav.classList.toggle('open'));
loadNews();
