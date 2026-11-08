const form=document.getElementById('uploadNewsForm'), photo=document.getElementById('newsPhoto');
const selected=document.getElementById('selectedPhoto'), preview=document.getElementById('photoPreview'), message=document.getElementById('formMessage'), button=document.getElementById('publishButton');
document.getElementById('newsDate').value=new Date().toISOString().slice(0,10);
photo.addEventListener('change',()=>{
  const file=photo.files[0]; selected.textContent=file?`${file.name} · ${(file.size/1024/1024).toFixed(2)} MB`:'No photo selected';
  if(!file){preview.classList.add('hidden');return;}
  if(!['image/png','image/jpeg'].includes(file.type)||file.size>15*1024*1024){message.textContent='Choose a PNG, JPG or JPEG image up to 15 MB.';message.className='form-message error';photo.value='';selected.textContent='No photo selected';preview.classList.add('hidden');return;}
  preview.src=URL.createObjectURL(file);preview.classList.remove('hidden');
});
form.addEventListener('submit',async e=>{
  e.preventDefault();message.textContent='';message.className='form-message';
  button.disabled=true;button.textContent='Publishing…';
  try{
    const response=await fetch('/api/news',{method:'POST',body:new FormData(form)});
    const result=await response.json();if(!response.ok)throw new Error(result.error||'Could not publish news.');
    message.textContent='News published successfully. Opening the news page…';message.classList.add('success');form.reset();document.getElementById('newsDate').value=new Date().toISOString().slice(0,10);selected.textContent='No photo selected';preview.classList.add('hidden');
    setTimeout(()=>location.href='/news.html',1000);
  }catch(err){message.textContent=err.message;message.classList.add('error');}
  finally{button.disabled=false;button.textContent='Publish news ↗';}
});
const menuToggle=document.getElementById('menuToggle'),mainNav=document.getElementById('mainNav');
if(menuToggle)menuToggle.addEventListener('click',()=>mainNav.classList.toggle('open'));
