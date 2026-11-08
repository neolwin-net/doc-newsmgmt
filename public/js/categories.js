(() => {
  const builtInCategories = {
    documents: ['General', 'Networking', 'Academic', 'Reports', 'Presentations', 'Images'],
    news: ['General', 'Announcement', 'Technology', 'Education', 'Networking', 'Events']
  };
  const escapeText = value => String(value).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  async function loadCategoryType(type, preferredValue) {
    const response = await fetch(`/api/categories?type=${encodeURIComponent(type)}`);
    if (!response.ok) throw new Error('Could not load categories.');
    const categories = await response.json();

    document.querySelectorAll(`select[data-category-type="${type}"]`).forEach(select => {
      const current = preferredValue ?? select.value;
      const isFilter = select.dataset.filterCategory === 'true';
      select.innerHTML = isFilter ? '<option value="">All categories</option>' : '';
      categories.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
      });
      if (current && categories.includes(current)) select.value = current;
      else if (!isFilter && categories.length) select.selectedIndex = 0;
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const types = [...new Set([...document.querySelectorAll('select[data-category-type]')]
      .map(select => select.dataset.categoryType))];
    for (const type of types) {
      try { await loadCategoryType(type); }
      catch (error) { console.error(error); }
    }

    function updateDeleteButtons() {
      document.querySelectorAll('[data-delete-category-type]').forEach(button => {
        const type = button.dataset.deleteCategoryType;
        const select = document.querySelector(`select[data-category-type="${type}"]`);
        const name = select?.value;
        button.disabled = !name || builtInCategories[type]?.some(item => item.toLowerCase() === name.toLowerCase());
      });
    }
    document.querySelectorAll('select[data-category-type]').forEach(select => {
      select.addEventListener('change', updateDeleteButtons);
    });
    updateDeleteButtons();

    document.querySelectorAll('[data-add-category-type]').forEach(button => {
      button.addEventListener('click', async () => {
        const type = button.dataset.addCategoryType;
        const label = type === 'documents' ? 'document' : 'news';
        const entered = window.prompt(`Enter a new ${label} category (1–40 characters):`);
        if (entered === null) return;
        const name = entered.trim().replace(/\s+/g, ' ');
        if (!name) { window.alert('Category name cannot be empty.'); return; }
        button.disabled = true;
        try {
          const response = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, name })
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'Could not add category.');
          await loadCategoryType(type, result.name);
          updateDeleteButtons();
          window.alert(`Category "${result.name}" added successfully.`);
        } catch (error) {
          window.alert(error.message);
        } finally {
          button.disabled = false;
        }
      });
    });

    document.querySelectorAll('[data-delete-category-type]').forEach(button => {
      button.addEventListener('click', async () => {
        const type = button.dataset.deleteCategoryType;
        const select = document.querySelector(`select[data-category-type="${type}"]`);
        const name = select?.value;
        if (!name) return;
        if (!window.confirm(`Delete the custom category "${name}"?`)) return;
        button.disabled = true;
        try {
          const response = await fetch('/api/categories', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, name })
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'Could not delete category.');
          await loadCategoryType(type);
          updateDeleteButtons();
        } catch (error) {
          window.alert(error.message);
        } finally {
          button.disabled = false;
        }
      });
    });
  });
})();
