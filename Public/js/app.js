// public/js/app.js
document.addEventListener('DOMContentLoaded', () => {
  // === Floating Memes ===
  const memeFolder = 'memes/';
  const gallery = document.getElementById('floating-memes');
  const memeFiles = [
    'meme1.png','meme2.png','meme3.png','meme4.png',
    'meme5.png','meme6.png','meme7.png','meme8.png',
    'meme9.png','meme10.png','meme11.png','meme12.png',
    'meme13.png','meme14.png','meme15.png','meme16.png',
    'meme17.png','meme18.png','meme19.png','meme20.png'
  ];
  memeFiles.forEach((fileName, i) => {
    const img = document.createElement('img');
    img.src = memeFolder + fileName;
    img.alt = `Meme ${i+1}`;
    img.classList.add('meme-item');
    img.style.animationDelay = `${Math.random() * 5}s`;
    gallery.appendChild(img);
  });

  // === Hamburger Menu ===
  const hamburger = document.getElementById('hamburger');
  const menu = document.getElementById('menu');
  hamburger.addEventListener('click', () => {
    menu.classList.toggle('show');
  });

  // === Wallet Connect Modal Elements ===
  const walletModal       = document.getElementById('wallet-modal');
  const connectWalletBtn  = document.getElementById('connect-wallet');
  const closeModalBtn     = document.getElementById('close-wallet-modal');
  const metamaskBtn       = document.getElementById('connect-metamask-btn');
  const phantomBtn        = document.getElementById('connect-phantom-btn');
  let userAddress         = '';

  // Show the modal when "Connect Wallet" is clicked
  connectWalletBtn.addEventListener('click', () => {
    walletModal.classList.remove('hidden');
  });

  // Hide the modal when "Cancel" is clicked
  closeModalBtn.addEventListener('click', () => {
    walletModal.classList.add('hidden');
  });

  // MetaMask connect flow
  metamaskBtn.addEventListener('click', async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }
    try {
      const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });
      userAddress = account;
      alert(`MetaMask Connected: ${userAddress}`);
      walletModal.classList.add('hidden');
      loadUserRequests();
    } catch (err) {
      console.error('MetaMask connection error:', err);
    }
  });

  // Phantom (Solana) connect flow
  phantomBtn.addEventListener('click', async () => {
    if (!(window.solana && window.solana.isPhantom)) {
      alert('Please install Phantom Wallet!');
      return;
    }
    try {
      const resp = await window.solana.connect();
      userAddress = resp.publicKey.toString();
      alert(`Phantom Connected: ${userAddress}`);
      walletModal.classList.add('hidden');
      loadUserRequests();
    } catch (err) {
      console.error('Phantom connection error:', err);
    }
  });

  // === Submit Meme Form ===
  const form = document.getElementById('meme-form');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!userAddress) {
      alert('Please connect your wallet first!');
      return;
    }

    const description = document.getElementById('meme-description').value;
    const file        = document.getElementById('meme-file').files[0];
    const memeType    = document.getElementById('meme-type').value;
    const memeFormat  = document.getElementById('meme-format').value;

    const formData = new FormData();
    formData.append('description', description);
    formData.append('file', file);
    formData.append('memeType', memeType);
    formData.append('memeFormat', memeFormat);
    formData.append('walletAddress', userAddress);

    try {
      const res = await fetch('/submit-meme', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        form.reset();
        loadUserRequests();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('Failed to submit meme request.');
    }
  });

  // === Load “My Requests” ===
  async function loadUserRequests() {
    if (!userAddress) return;
    try {
      const res = await fetch(`/get-user-requests/${userAddress}`);
      const requests = await res.json();
      const list = document.querySelector('#my-requests .requests-list');
      list.innerHTML = '';

      requests.forEach(r => {
        const isLink = /^https?:\/\//i.test(r.status);
        const statusHtml = isLink
          ? `<a href="${r.status}" target="_blank" rel="noopener">View Meme</a>`
          : `<span>${r.status}</span>`;

        const item = document.createElement('div');
        item.className = 'request-item';
        item.innerHTML = `
          <h3>${r.description}</h3>
          <p>Type: ${r.memeType}, Format: ${r.memeFormat}</p>
          <p>Status: ${statusHtml}</p>
        `;
        list.appendChild(item);
      });
    } catch (err) {
      console.error('Error loading requests:', err);
    }
  }
});
