let allProducts = [];

// --- Column name mapping (Hebrew & English) ---
const COLUMN_MAP = {
    name:         ['שם', 'שם מוצר', 'שם המוצר', 'name', 'product name', 'product'],
    category:     ['קטגוריה', 'קטגורייה', 'category', 'cat'],
    manufacturer: ['יצרן', 'ספק', 'manufacturer', 'brand', 'vendor'],
    ref:          ['מק"ט', 'מקט', 'קטלוג', 'מספר קטלוג', 'ref', 'catalog', 'cat#', 'part number', 'pn'],
    description:  ['תיאור', 'תיאור מוצר', 'description', 'desc'],
    sizes:        ['מידות', 'גדלים', 'מידה', 'sizes', 'size', 'specifications', 'specs'],
    image:        ['תמונה', 'תמונה', 'image', 'img', 'photo', 'picture'],
    notes:        ['הערות', 'הערה', 'notes', 'note', 'remarks'],
    id:           ['מזהה', 'id', 'מספר', 'number']
};

function normalizeHeader(h) {
    return (h || '').toString().trim().toLowerCase().replace(/['"]/g, '');
}

function mapColumns(headers) {
    const map = {};
    headers.forEach((h, i) => {
        const norm = normalizeHeader(h);
        for (const [field, aliases] of Object.entries(COLUMN_MAP)) {
            if (aliases.some(a => a.toLowerCase().replace(/['"]/g, '') === norm)) {
                map[field] = i;
            }
        }
    });
    return map;
}

function rowToProduct(row, colMap, index) {
    const get = field => colMap[field] !== undefined ? (row[colMap[field]] ?? '') : '';

    const sizesRaw = get('sizes').toString().trim();
    const sizes = sizesRaw ? sizesRaw.split(/[,،;|\n]+/).map(s => s.trim()).filter(Boolean) : [];

    let id = get('id').toString().trim();
    if (!id) id = 'P-' + String(index + 1).padStart(3, '0');

    return {
        id,
        name:         get('name').toString().trim(),
        category:     get('category').toString().trim(),
        manufacturer: get('manufacturer').toString().trim(),
        ref:          get('ref').toString().trim(),
        description:  get('description').toString().trim(),
        sizes,
        image:        get('image').toString().trim(),
        notes:        get('notes').toString().trim()
    };
}

// --- Excel import ---
document.getElementById('excelFileInput').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
        try {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

            if (rows.length < 2) {
                showToast('הקובץ ריק או אין שורות נתונים.', 'error');
                return;
            }

            const headers = rows[0];
            const colMap = mapColumns(headers);

            if (colMap.name === undefined) {
                showToast('לא נמצאה עמודת "שם מוצר". ודאי שיש כותרת בשורה הראשונה.', 'error');
                return;
            }

            const products = rows.slice(1)
                .filter(r => r.some(c => c !== ''))
                .map((r, i) => rowToProduct(r, colMap, i));

            allProducts = products;
            localStorage.setItem('cathlabProducts', JSON.stringify(products));
            localStorage.setItem('cathlabFileName', file.name);

            resetFilters();
            populateFilters();
            renderProducts(allProducts);
            showToast(`✅ נטענו ${products.length} מוצרים מ-${file.name}`);
        } catch (err) {
            showToast('שגיאה בקריאת הקובץ: ' + err.message, 'error');
            console.error(err);
        }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
});

// --- Reset to default JSON ---
document.getElementById('clearDataBtn').addEventListener('click', () => {
    if (!confirm('למחוק את נתוני ה-Excel ולחזור לנתוני ברירת מחדל?')) return;
    localStorage.removeItem('cathlabProducts');
    localStorage.removeItem('cathlabFileName');
    loadDefaultProducts();
});

// --- Load products ---
async function loadDefaultProducts() {
    try {
        const res = await fetch('data/products.json');
        const data = await res.json();
        allProducts = data.products;
        resetFilters();
        populateFilters();
        renderProducts(allProducts);
    } catch (err) {
        document.getElementById('productsGrid').innerHTML =
            '<p style="color:#c0392b;padding:2rem">שגיאה בטעינת הנתונים.</p>';
        console.error(err);
    }
}

function loadProducts() {
    const saved = localStorage.getItem('cathlabProducts');
    if (saved) {
        try {
            allProducts = JSON.parse(saved);
            resetFilters();
            populateFilters();
            renderProducts(allProducts);
            const fname = localStorage.getItem('cathlabFileName');
            if (fname) showToast(`נטען מ-${fname}`, 'info', 2500);
            return;
        } catch (_) {}
    }
    loadDefaultProducts();
}

// --- Filters ---
function resetFilters() {
    const catSel = document.getElementById('categoryFilter');
    const mfrSel = document.getElementById('manufacturerFilter');
    catSel.innerHTML = '<option value="">כל הקטגוריות</option>';
    mfrSel.innerHTML = '<option value="">כל היצרנים</option>';
}

function populateFilters() {
    const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))].sort();
    const manufacturers = [...new Set(allProducts.map(p => p.manufacturer).filter(Boolean))].sort();

    const catSel = document.getElementById('categoryFilter');
    categories.forEach(c => {
        const o = document.createElement('option');
        o.value = c; o.textContent = c;
        catSel.appendChild(o);
    });

    const mfrSel = document.getElementById('manufacturerFilter');
    manufacturers.forEach(m => {
        const o = document.createElement('option');
        o.value = m; o.textContent = m;
        mfrSel.appendChild(o);
    });
}

// --- Render ---
function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    const noResults = document.getElementById('noResults');
    const count = document.getElementById('resultsCount');

    count.textContent = products.length + ' מוצרים';

    if (products.length === 0) {
        grid.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';
    grid.innerHTML = products.map(p => `
        <div class="product-card" onclick="openModal('${p.id}')">
            <div class="product-image">
                ${p.image
                    ? `<img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=no-image>אין תמונה</div>'">`
                    : '<div class="no-image">אין תמונה</div>'}
            </div>
            <div class="product-info">
                <h3>${p.name || '—'}</h3>
                ${p.category ? `<span class="category-badge">${p.category}</span>` : ''}
                ${p.manufacturer ? `<p class="manufacturer">${p.manufacturer}</p>` : ''}
                ${p.ref ? `<p class="ref">מק"ט: ${p.ref}</p>` : ''}
                ${p.description ? `<p class="description">${p.description}</p>` : ''}
            </div>
        </div>
    `).join('');
}

// --- Filter logic ---
function filterProducts() {
    const search = document.getElementById('searchInput').value.toLowerCase().trim();
    const category = document.getElementById('categoryFilter').value;
    const manufacturer = document.getElementById('manufacturerFilter').value;

    const filtered = allProducts.filter(p => {
        const matchSearch = !search ||
            (p.name || '').toLowerCase().includes(search) ||
            (p.description || '').toLowerCase().includes(search) ||
            (p.ref || '').toLowerCase().includes(search) ||
            (p.manufacturer || '').toLowerCase().includes(search);
        const matchCat = !category || p.category === category;
        const matchMfr = !manufacturer || p.manufacturer === manufacturer;
        return matchSearch && matchCat && matchMfr;
    });

    renderProducts(filtered);
}

// --- Modal ---
function openModal(id) {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;

    const sizesRow = p.sizes && p.sizes.length
        ? `<tr><td>מידות</td><td>${p.sizes.join(', ')}</td></tr>` : '';
    const notesRow = p.notes
        ? `<tr><td>הערות</td><td>${p.notes}</td></tr>` : '';

    document.getElementById('modalBody').innerHTML = `
        <div class="modal-product">
            ${p.image ? `<img src="${p.image}" alt="${p.name}" class="modal-image" onerror="this.style.display='none'">` : ''}
            <h2>${p.name}</h2>
            <table class="details-table">
                ${p.category ? `<tr><td>קטגוריה</td><td>${p.category}</td></tr>` : ''}
                ${p.manufacturer ? `<tr><td>יצרן</td><td>${p.manufacturer}</td></tr>` : ''}
                ${p.ref ? `<tr><td>מק"ט</td><td>${p.ref}</td></tr>` : ''}
                ${sizesRow}
                ${notesRow}
            </table>
            ${p.description ? `<p class="modal-description">${p.description}</p>` : ''}
        </div>
    `;

    document.getElementById('modal').style.display = 'flex';
}

// --- Toast ---
function showToast(msg, type = 'success', duration = 3500) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast toast-' + type;
    t.style.display = 'block';
    setTimeout(() => { t.style.display = 'none'; }, duration);
}

// --- Event listeners ---
document.getElementById('searchInput').addEventListener('input', filterProducts);
document.getElementById('categoryFilter').addEventListener('change', filterProducts);
document.getElementById('manufacturerFilter').addEventListener('change', filterProducts);

document.getElementById('clearFilters').addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('manufacturerFilter').value = '';
    renderProducts(allProducts);
});

document.getElementById('modalClose').addEventListener('click', () => {
    document.getElementById('modal').style.display = 'none';
});

document.getElementById('modal').addEventListener('click', e => {
    if (e.target === document.getElementById('modal')) {
        document.getElementById('modal').style.display = 'none';
    }
});

// --- Start ---
loadProducts();