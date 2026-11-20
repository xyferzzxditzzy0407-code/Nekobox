
// ========================================================
// XYFERZZ CDN — SUPABASE MEDIA UPLOADER
// ========================================================

const SUPABASE_URL = 'https://usfqvarxbxfnhnkpcnss.supabase.co';

const SUPABASE_ANON_KEY =
  'sb_publishable_yS68uH4IL2cBSFHbO-KwHg_iYVjAqBP';

const BUCKET_NAME = 'media-publik';

// ========================================================
// INITIALIZE SUPABASE
// ========================================================

if (!window.supabase || !window.supabase.createClient) {
  alert('Supabase CDN gagal dimuat!');
  throw new Error('Supabase library tidak ditemukan.');
}

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ========================================================
// DOM ELEMENTS
// ========================================================

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

// ========================================================
// CHECK HTML ELEMENTS
// ========================================================

const requiredElements = [
  dropZone,
  fileInput,
  fileInfo,
  fileNameDisplay,
  uploadBtn,
  loading,
  resultBox,
  previewContainer,
  directUrlInput,
  htmlTagInput,
  resetBtn
];

if (requiredElements.some(el => !el)) {
  throw new Error('Ada ID HTML yang tidak ditemukan!');
}

let selectedFile = null;

// ========================================================
// FILE SELECTION
// ========================================================

dropZone.addEventListener('click', () => {
  fileInput.click();
});

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

// ========================================================
// HANDLE FILE
// ========================================================

function handleFileSelection(file) {
  if (
    !file.type.startsWith('image/') &&
    !file.type.startsWith('video/')
  ) {
    alert('Cuma bisa upload foto atau video mpruyy!');
    fileInput.value = '';
    return;
  }

  selectedFile = file;
  fileNameDisplay.textContent = file.name;

  fileInfo.classList.remove('hidden');
  resultBox.classList.add('hidden');

  // AUTO UPLOAD
  uploadBtn.click();
}

// ========================================================
// GENERATE UNIQUE FILE NAME
// ========================================================

function generateUniqueFileName(file) {

  const extension = file.name.includes('.')
    ? file.name.split('.').pop().toLowerCase()
    : '';

  const randomString =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Date.now() + '-' + Math.random().toString(36).substring(2, 12);

  return extension
    ? `${randomString}.${extension}`
    : randomString;
}

// ========================================================
// UPLOAD TO SUPABASE
// ========================================================

uploadBtn.addEventListener('click', async () => {

  if (!selectedFile) {
    alert('Pilih file terlebih dahulu!');
    return;
  }

  const fileToUpload = selectedFile;

  fileInfo.classList.add('hidden');
  dropZone.classList.add('hidden');
  loading.classList.remove('hidden');

  uploadBtn.disabled = true;

  try {

    // 1. Generate unique filename
    const uniqueFileName = generateUniqueFileName(fileToUpload);

    // 2. Upload to Supabase
    const { data, error } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .upload(uniqueFileName, fileToUpload, {
        cacheControl: '3600',
        contentType: fileToUpload.type,
        upsert: false
      });

    if (error) {
      throw error;
    }

    // 3. Get uploaded path
    const uploadedPath = data.path;

    // 4. Encode file path
    const encodedPath = uploadedPath
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/');

    // 5. Generate short URL
    const shortUrl =
      `${window.location.origin}/file/${encodedPath}`;

    // 6. Display result
    tampilkanHasil(shortUrl, fileToUpload.type);

    console.log('UPLOAD SUCCESS');
    console.log('File:', uploadedPath);
    console.log('URL:', shortUrl);

  } catch (err) {

    console.error('UPLOAD ERROR:', err);

    alert(
      `Gagal upload: ${err.message}\n\n` +
      'Eror lek, file gagal di upload silahkan coba lagi.'
    );

    fileInfo.classList.remove('hidden');
    dropZone.classList.remove('hidden');

  } finally {

    loading.classList.add('hidden');
    uploadBtn.disabled = false;

  }

});

// ========================================================
// DISPLAY RESULT
// ========================================================

function tampilkanHasil(url, mimeType) {
  directUrlInput.value = url;
  previewContainer.innerHTML = '';

  if (mimeType.startsWith('image/')) {
    htmlTagInput.value =
      `<img src="${url}" alt="media" />`;

    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Uploaded image';
    img.loading = 'lazy';

    previewContainer.appendChild(img);

  } else if (mimeType.startsWith('video/')) {
    htmlTagInput.value =
      `<video src="${url}" controls playsinline></video>`;

    const video = document.createElement('video');
    video.src = url;
    video.controls = true;
    video.playsInline = true;

    previewContainer.appendChild(video);
  }

  // Sembunyikan tampilan awal
  document.querySelector('.info-cards')
    ?.classList.add('hidden');

  dropZone.classList.add('hidden');
  fileInfo.classList.add('hidden');

  // Tampilkan hasil upload
  resultBox.classList.remove('hidden');

  // Geser halaman ke hasil upload
  resultBox.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}
// ========================================================
// COPY BUTTON
// ========================================================

document.querySelectorAll('.btn-copy').forEach((button) => {

  button.addEventListener('click', async () => {

    const targetId = button.getAttribute('data-target');
    const input = document.getElementById(targetId);

    if (!input) {
      alert('Input tidak ditemukan!');
      return;
    }

    try {

      if (navigator.clipboard && window.isSecureContext) {

        await navigator.clipboard.writeText(input.value);

      } else {

        input.focus();
        input.select();

        const copied = document.execCommand('copy');

        if (!copied) {
          throw new Error('Gagal menyalin teks.');
        }

      }

      const originalText = button.textContent;

      button.textContent = 'Copied!';
      button.style.backgroundColor = '#22c55e';
      button.style.color = '#0f172a';

      setTimeout(() => {

        button.textContent = originalText;
        button.style.backgroundColor = '';
        button.style.color = '';

      }, 1500);

    } catch (err) {

      console.error('COPY ERROR:', err);
      alert('Gagal menyalin link!');

    }

  });

});

// ========================================================
// RESET
// ========================================================

resetBtn.addEventListener('click', resetTampilan);

function resetTampilan() {
  if (uploadInProgress) return;

  selectedFile = null;
  fileInput.value = '';

  directUrlInput.value = '';
  htmlTagInput.value = '';

  previewContainer.innerHTML = '';

  fileInfo.classList.add('hidden');
  resultBox.classList.add('hidden');
  loading.classList.add('hidden');

  // Tampilkan kembali kotak informasi awal
  document.querySelector('.info-cards')
    ?.classList.remove('hidden');

  // Tampilkan kembali kotak upload
  dropZone.classList.remove('hidden');

  // Aktifkan kembali tombol jika tersedia
  if (uploadBtn) {
    uploadBtn.disabled = false;
  }

  // Kembali ke bagian atas
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}
