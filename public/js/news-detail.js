const article=document.getElementById('articleContent');
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function dateLabel(s){return new Date(`${s}T00:00:00`).toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'});}
async function loadArticle(){
  const id=new URLSearchParams(location.search).get('id');
  if(!id||!/^\d+$/.test(id)){article.innerHTML='<div class="empty-state"><h3>Article not found</h3><p>The requested news item could not be identified.</p><a class="btn btn-primary" href="/news.html">Return to news</a></div>';return;}
  try{
    const response=await fetch(`/api/news/${id}`);if(!response.ok)throw new Error('This article may have been deleted or is unavailable.');
    const item=await response.json();document.title=`${item.title} | Document & News`;
    article.innerHTML=`<div class="article-header"><span class="category-tag">${esc(item.category)}</span><time>${dateLabel(item.published_at)}</time><h1>${esc(item.title)}</h1></div>
      <img class="article-cover" src="/api/news/${item.id}/photo" alt="${esc(item.title)}">
      <div class="article-body">${esc(item.content).split(/\\r?\\n/).map(p=>p.trim()?`<p>${p}</p>`:'').join('')}</div>
      <div class="article-end"><a class="btn btn-primary" href="/news.html">← Back to news</a></div>`;
  }catch(err){article.innerHTML=`<div class="empty-state"><h3>Unable to open article</h3><p>${esc(err.message)}</p><a class="btn btn-primary" href="/news.html">Return to news</a></div>`;}
}
const menuToggle=document.getElementById('menuToggle'),mainNav=document.getElementById('mainNav');
if(menuToggle)menuToggle.addEventListener('click',()=>mainNav.classList.toggle('open'));
loadArticle();
