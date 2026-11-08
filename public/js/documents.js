const docForm = document.getElementById('documentSearch');
const docResults = document.getElementById('documentResults');
const docCount = document.getElementById('docCount');
const toast = document.getElementById('toast');
const fmtSize = bytes => {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB','MB','GB','TB']; let value = bytes / 1024, i = 0;
  while (value >= 1024 && i < units.length - 1) { value /= 1024; i++; }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[i]}`;
};
const fmtDate = value => new Date(value.replace(' ', 'T') + (value.includes('Z') ? '' : 'Z')).toLocaleDateString(undefined, {year:'numeric',month:'short',day:'numeric'});
function notify(message) { toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3200); }
async function loadDocuments() {
  docResults.innerHTML = '<div class="loading-state">Searching documents…</div>';
  const params = new URLSearchParams(new FormData(docForm));
  try {
    const response = await fetch(`/api/documents?${params}`);
    if (!response.ok) throw new Error('Could not load documents.');
    const items = await response.json(); docCount.textContent = items.length;
    if (!items.length) { docResults.innerHTML = '<div class="empty-state"><span>⌕</span><h3>No documents found</h3><p>Try another search or upload a new document.</p><a class="btn btn-primary" href="/upload-document.html">Upload document</a></div>'; return; }
    docResults.innerHTML = items.map(item => `<article class="document-row">
      <div class="doc-type-icon">${(item.original_name.split('.').pop() || 'FILE').slice(0,4).toUpperCase()}</div>
      <div class="doc-main"><div class="doc-title-line"><h3>${escapeHtml(item.title)}</h3><span class="category-tag">${escapeHtml(item.category)}</span></div>
        <p class="doc-filename">${escapeHtml(item.original_name)}</p><p class="doc-description">${escapeHtml(item.description || 'No description provided.')}</p>
        <div class="doc-meta"><span>${fmtSize(item.size_bytes)}</span><span>Uploaded ${fmtDate(item.uploaded_at)}</span></div></div>
      <div class="doc-actions"><a class="small-action" href="/api/documents/${item.id}/file" target="_blank" rel="noopener">View ↗</a><a class="small-action" href="/api/documents/${item.id}/download">Download ↓</a><button class="small-action danger" data-delete="${item.id}" data-title="${escapeAttr(item.title)}">Delete ×</button></div>
    </article>`).join('');
  } catch (err) { docResults.innerHTML = `<div class="empty-state"><h3>Something went wrong</h3><p>${escapeHtml(err.message)}</p></div>`; }
}
function escapeHtml(s='') { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function escapeAttr(s='') { return escapeHtml(s); }
docForm.addEventListener('submit', e => { e.preventDefault(); loadDocuments(); });
document.getElementById('clearFilters').addEventListener('click', () => { docForm.reset(); loadDocuments(); });
docResults.addEventListener('click', async e => {
  const btn = e.target.closest('[data-delete]'); if (!btn) return;
  if (!confirm(`Are you sure you want to delete "${btn.dataset.title}"?\n\nThe stored file will also be permanently deleted.`)) return;
  try {
    const response = await fetch(`/api/documents/${btn.dataset.delete}`, {method:'DELETE'});
    const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Delete failed.');
    notify('Document deleted successfully.'); loadDocuments();
  } catch (err) { notify(err.message); }
});
const menuToggle = document.getElementById('menuToggle'), mainNav = document.getElementById('mainNav');
if (menuToggle) menuToggle.addEventListener('click', () => mainNav.classList.toggle('open'));
loadDocuments();
