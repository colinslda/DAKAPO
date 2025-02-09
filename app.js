document.addEventListener('DOMContentLoaded', () => {
  // Navigation par onglets
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      button.classList.add('active');
      document.getElementById(button.dataset.tab).classList.add('active');
    });
  });

   /* --- Répertoire de Répétition --- */
  const openRepertoireFormBtn = document.getElementById('open-repertoire-form');
  const repertoireFormContainer = document.getElementById('repertoire-form-container');
  const repertoireForm = document.getElementById('repertoire-form');
  const closeRepertoireFormBtn = document.getElementById('close-repertoire-form');
  const repertoireList = document.getElementById('repertoire-list');
  let repertoireItems = [];

  openRepertoireFormBtn.addEventListener('click', () => {
    repertoireFormContainer.style.display = 'block';
  });

  closeRepertoireFormBtn.addEventListener('click', () => {
    repertoireFormContainer.style.display = 'none';
  });

  repertoireForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const compositeur = document.getElementById('compositeur').value.trim();
    const titre = document.getElementById('titre').value.trim();
    const categorie = document.getElementById('categorie').value;
    if(compositeur && titre) {
      const item = { id: Date.now(), compositeur, titre, categorie };
      repertoireItems.push(item);
      renderRepertoire();
      repertoireForm.reset();
      repertoireFormContainer.style.display = 'none';
      updatePieceSelectOptions();
    }
  });

  function renderRepertoire() {
    // Regrouper les pièces par catégorie
    const categories = {};
    repertoireItems.forEach(item => {
      if (!categories[item.categorie]) {
        categories[item.categorie] = [];
      }
      categories[item.categorie].push(item);
    });

    repertoireList.innerHTML = '';
    for (const cat in categories) {
      const catDiv = document.createElement('div');
      catDiv.className = 'category-group';
      const catTitle = document.createElement('h3');
      catTitle.textContent = cat;
      catDiv.appendChild(catTitle);

      categories[cat].forEach(item => {
        const div = document.createElement('div');
        div.className = 'repertoire-item';
        div.innerHTML = `
          <div class="repertoire-item-info">
            <p class="repertoire-compositeur"><strong>Compositeur :</strong> ${item.compositeur}</p>
            <p class="repertoire-titre"><strong>Titre :</strong> ${item.titre}</p>
            <p class="repertoire-categorie"><strong>Catégorie :</strong> ${item.categorie}</p>
          </div>
          <div class="repertoire-item-actions">
            <button data-id="${item.id}" class="edit-btn">Modifier</button>
            <button data-id="${item.id}" class="delete-btn">Supprimer</button>
          </div>
        `;
        catDiv.appendChild(div);
      });
      repertoireList.appendChild(catDiv);
    }
  }

  repertoireList.addEventListener('click', (e) => {
    if(e.target.classList.contains('delete-btn')) {
      const id = Number(e.target.dataset.id);
      repertoireItems = repertoireItems.filter(item => item.id !== id);
      renderRepertoire();
      updatePieceSelectOptions();
    }
    if(e.target.classList.contains('edit-btn')) {
      const id = Number(e.target.dataset.id);
      const item = repertoireItems.find(item => item.id === id);
      if(item) {
        const newCompositeur = prompt("Modifier le compositeur :", item.compositeur);
        const newTitre = prompt("Modifier le titre :", item.titre);
        if(newCompositeur && newTitre) {
          item.compositeur = newCompositeur.trim();
          item.titre = newTitre.trim();
          renderRepertoire();
          updatePieceSelectOptions();
        }
      }
    }
  });

  /* --- Journal de Bord de Répétition --- */
  const journalForm = document.getElementById('journal-form');
  const pieceSelect = document.getElementById('piece-select');
  const journalList = document.getElementById('journal-list');
  const sortSelect = document.getElementById('sort-select');
  const sortButton = document.getElementById('sort-button');
  let journalEntries = [];

  function updatePieceSelectOptions() {
    pieceSelect.innerHTML = `<option value="">-- Choisissez une pièce --</option>`;
    repertoireItems.forEach(item => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = `${item.compositeur} - ${item.titre} [${item.categorie}]`;
      pieceSelect.appendChild(option);
    });
  }

  journalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const selectedPieceId = pieceSelect.value;
    const noteContent = document.getElementById('note-content').value.trim();
    if(selectedPieceId && noteContent) {
      const entry = {
        id: Date.now(),
        pieceId: Number(selectedPieceId),
        noteContent,
        timestamp: new Date()
      };
      journalEntries.push(entry);
      renderJournal();
      journalForm.reset();
    }
  });

  function renderJournal() {
    journalList.innerHTML = '';
    journalEntries.forEach(entry => {
      const piece = repertoireItems.find(item => item.id === entry.pieceId);
      const pieceInfo = piece ? `${piece.compositeur} - ${piece.titre} [${piece.categorie}]` : 'Pièce inconnue';
      const timeString = new Date(entry.timestamp).toLocaleString();
      const div = document.createElement('div');
      div.className = 'journal-entry';
      div.innerHTML = `
        <div class="journal-entry-header">
          <p class="journal-piece">${pieceInfo}</p>
          <time class="journal-timestamp">${timeString}</time>
        </div>
        <div class="journal-entry-content">
          <p>${entry.noteContent}</p>
        </div>
      `;
      journalList.appendChild(div);
    });
  }

  sortButton.addEventListener('click', () => {
    const criterion = sortSelect.value;
    if(criterion === 'date') {
      journalEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else if(criterion === 'piece') {
      journalEntries.sort((a, b) => {
        const pieceA = repertoireItems.find(item => item.id === a.pieceId);
        const pieceB = repertoireItems.find(item => item.id === b.pieceId);
        const nameA = pieceA ? pieceA.titre.toLowerCase() : '';
        const nameB = pieceB ? pieceB.titre.toLowerCase() : '';
        return nameA.localeCompare(nameB);
      });
    }
    renderJournal();
  });

  /* --- Métronome --- */
  let metronomeInterval = null;
  const metronomeVisual = document.getElementById('metronome-visual');
  const startStopBtn = document.getElementById('start-stop');
  const tempoSlider = document.getElementById('tempo-slider');
  const tempoDisplay = document.getElementById('tempo-display');
  const decreaseTempoBtn = document.getElementById('decrease-tempo');
  const increaseTempoBtn = document.getElementById('increase-tempo');

  function updateTempoDisplay() {
    tempoDisplay.textContent = `${tempoSlider.value} BPM`;
  }

  updateTempoDisplay();

  tempoSlider.addEventListener('input', updateTempoDisplay);

  decreaseTempoBtn.addEventListener('click', () => {
    let current = Number(tempoSlider.value);
    if(current > Number(tempoSlider.min)) {
      tempoSlider.value = current - 1;
      updateTempoDisplay();
      if(metronomeInterval) { restartMetronome(); }
    }
  });

  increaseTempoBtn.addEventListener('click', () => {
    let current = Number(tempoSlider.value);
    if(current < Number(tempoSlider.max)) {
      tempoSlider.value = current + 1;
      updateTempoDisplay();
      if(metronomeInterval) { restartMetronome(); }
    }
  });

  function startMetronome() {
    const bpm = Number(tempoSlider.value);
    if(bpm > 0) {
      const interval = 60000 / bpm;
      metronomeInterval = setInterval(() => {
        metronomeVisual.style.animation = 'beat 0.2s ease';
        setTimeout(() => {
          metronomeVisual.style.animation = 'none';
        }, 200);
      }, interval);
      startStopBtn.textContent = 'Arrêter';
    }
  }

  function stopMetronome() {
    clearInterval(metronomeInterval);
    metronomeInterval = null;
    startStopBtn.textContent = 'Démarrer';
  }

  function restartMetronome() {
    if(metronomeInterval) {
      stopMetronome();
      startMetronome();
    }
  }

  startStopBtn.addEventListener('click', () => {
    if(metronomeInterval) {
      stopMetronome();
    } else {
      startMetronome();
    }
});
