const form = document.getElementById('uploadDocumentForm');
const fileInput = document.getElementById('documentFile');
const selectedFile = document.getElementById('selectedFile');
const message = document.getElementById('formMessage');
const button = document.getElementById('uploadButton');
const progress = document.getElementById('uploadProgress');
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  selectedFile.textContent = file ? `${file.name} · ${(file.size / (1024 ** 2)).toFixed(2)} MB` : 'No file selected';
  if (file && file.size > 2 * 1024 ** 3) { message.textContent = 'The selected file exceeds 2048 MB.'; message.className = 'form-message error'; fileInput.value = ''; selectedFile.textContent = 'No file selected'; }
});
form.addEventListener('submit', e => {
  e.preventDefault(); message.textContent = ''; message.className = 'form-message';
  if (!fileInput.files.length) { message.textContent = 'Please select a file.'; message.classList.add('error'); return; }
  const data = new FormData(form); button.disabled = true; button.textContent = 'Uploading…'; progress.classList.remove('hidden');
  const xhr = new XMLHttpRequest(); xhr.open('POST', '/api/documents');
  xhr.upload.addEventListener('progress', e => {
    if (!e.lengthComputable) return;
    const percent = Math.round(e.loaded / e.total * 100);
    document.getElementById('progressBar').style.width = `${percent}%`;
    document.getElementById('progressPercent').textContent = `${percent}%`;
    document.getElementById('progressText').textContent = percent === 100 ? 'Processing file…' : 'Uploading file…';
  });
  xhr.onload = () => {
    let result = {}; try { result = JSON.parse(xhr.responseText); } catch {}
    button.disabled = false; button.textContent = 'Upload document ↗'; progress.classList.add('hidden');
    if (xhr.status >= 200 && xhr.status < 300) {
      message.textContent = 'Document uploaded successfully. Opening your library…'; message.classList.add('success'); form.reset(); selectedFile.textContent = 'No file selected';
      setTimeout(() => location.href = '/documents.html', 1100);
    } else { message.textContent = result.error || 'Upload failed. Please try again.'; message.classList.add('error'); }
  };
  xhr.onerror = () => { button.disabled = false; button.textContent = 'Upload document ↗'; progress.classList.add('hidden'); message.textContent = 'Network error. Check your connection and try again.'; message.classList.add('error'); };
  xhr.send(data);
});
const menuToggle = document.getElementById('menuToggle'), mainNav = document.getElementById('mainNav');
if (menuToggle) menuToggle.addEventListener('click', () => mainNav.classList.toggle('open'));
