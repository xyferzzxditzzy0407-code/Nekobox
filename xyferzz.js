// ========================================================
// KONFIGURASI SUPABASE (Ganti dengan punya kamu nanti!)
// ========================================================
const SUPABASE_URL = 'https://usfqvarxbxfnhnkpcnss.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yS68uH4IL2cBSFHbO-KwHg_iYVjAqBP';
const BUCKET_NAME = 'media-publik'; // Pastikan nama bucket di Supabase sama persis

// Inisialisasi Client Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Ambil Elemen DOM
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileInfo = document.getElementById('file-info');
const fileNameDisplay = document.getElementById('file-name');
const uploadBtn = document.getElementById('upload-btn');
const loading = document.getElementById('loading');
const resultBox = document.getElementById('result-box');
const previewContainer = document.getElementById('preview-container');
const directUrlInput = document.getElementById('direct-url');
const htmlTagInput = document.getElementById('html-tag');
const resetBtn = document.getElementById('reset-btn');

let selectedFile = null;

// Event Klik & Drag-and-Drop
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer.files.length > 0) {
    handleFileSelection(e.dataTransfer.files[0]);
  }
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFileSelection(e.target.files[0]);
  }
});

function handleFileSelection(file) {
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    alert('Cuma bisa upload file foto atau video ya!');
    return;
  }
  selectedFile = file;
  fileNameDisplay.textContent = file.name;
  fileInfo.classList.remove('hidden');
  resultBox.classList.add('hidden');
}

// Proses Upload ke Supabase
uploadBtn.addEventListener('click', async () => {
  if (!selectedFile) return;

  // Tampilkan loading
  fileInfo.classList.add('hidden');
  dropZone.classList.add('hidden');
  loading.classList.remove('hidden');

  try {
    // Shorter biar link pendek lek
const randomString = Math.random().toString(36).substring(2, 10);
const fileExtension = selectedFile.name.split('.').pop();
const uniqueFileName = `${randomString}.${fileExtension}`;


    // Upload ke Supabase Storage
    const { data, error } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .upload(uniqueFileName, selectedFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Ambil Direct Public URL
    const { data: publicUrlData } = supabaseClient.storage
      .from(BUCKET_NAME)
      .getPublicUrl(uniqueFileName);

    const finalUrl = publicUrlData.publicUrl;
    tampilkanHasil(finalUrl, selectedFile.type);

  } catch (err) {
    console.error(err);
    alert(`Gagal upload: ${err.message}\n\nPastikan SUPABASE_URL, KEY, dan Policy Bucket sudah benar.`);
    resetTampilan();
  } finally {
    loading.classList.add('hidden');
  }
});

// Tampilkan Preview & Link
function tampilkanHasil(url, mimeType) {
const shortUrl = `${window.location.origin}/file/${uniqueFileName}`;
directUrlInput.value = shortUrl;
 previewContainer.innerHTML = '';

  if (mimeType.startsWith('image/')) {
    htmlTagInput.value = `<img src="${url}" alt="media" />`;
    const img = document.createElement('img');
    img.src = url;
    previewContainer.appendChild(img);
  } else if (mimeType.startsWith('video/')) {
    htmlTagInput.value = `<video src="${url}" controls></video>`;
    const video = document.createElement('video');
    video.src = url;
    video.controls = true;
    previewContainer.appendChild(video);
  }

  resultBox.classList.remove('hidden');
}

// Fitur Tombol Copy
document.querySelectorAll('.btn-copy').forEach((button) => {
  button.addEventListener('click', () => {
    const targetId = button.getAttribute('data-target');
    const inputEl = document.getElementById(targetId);

    navigator.clipboard.writeText(inputEl.value).then(() => {
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      button.style.backgroundColor = '#22c55e';
      button.style.color = '#0f172a';

      setTimeout(() => {
        button.textContent = originalText;
        button.style.backgroundColor = '';
        button.style.color = '';
      }, 1500);
    });
  });
});

// Tombol Reset
resetBtn.addEventListener('click', resetTampilan);

function resetTampilan() {
  selectedFile = null;
  fileInput.value = '';
  fileInfo.classList.add('hidden');
  resultBox.classList.add('hidden');
  dropZone.classList.remove('hidden');
}
