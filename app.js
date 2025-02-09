document.addEventListener('DOMContentLoaded', async () => {
  // Initialisation de Supabase
  const supabaseUrl = 'https://cjdqdixrvvrdwssoasel.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqZHFkaXhydnZyZHdzc29hc2VsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTA5ODI2NSwiZXhwIjoyMDU0Njc0MjY1fQ._SkGg4Lt1sdrz8WhxaeOS0npZ2gPCZi5SBLBatYN-KE';
  const supabase = supabase.createClient(supabaseUrl, supabaseKey);

  // --- Navigation entre onglets ---
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

  // Récupérer la session (l'utilisateur est déjà connecté si on est sur main.html)
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    // Si pas de session, rediriger vers la page de connexion
    window.location.href = 'login.html';
    return;
  }
  const userId = session.user.id;

  // ----------------- FONCTIONNALITÉS DU RÉPERTOIRE -----------------
  // Charger le répertoire de l'utilisateur depuis Supabase
  async function loadRepertoire() {
    const { data: repertoireItems, error } = await supabase
      .from('repertoire')
      .select('*')
      .eq('user_id', userId);
    if (error) {
      console.error(error);
      return;
    }
    renderRepertoire(repertoireItems);
    updatePieceSelect(repertoireItems);
  }

  // Afficher les pièces regroupées par catégorie
  function renderRepertoire(items) {
    const grouped = {};
    items.forEach(item => {
      if (!grouped[item.categorie]) grouped[item.categorie] = [];
      grouped[item.categorie].push(item);
    });
    const repertoireList = document.getElementById('repertoire-list');
    repertoireList.innerHTML = '';
    for (const cat in grouped) {
      const catDiv = document.createElement('div');
      catDiv.className = 'category-group';
      const catTitle = document.createElement('h3');
      catTitle.textContent = cat;
      catDiv.appendChild(catTitle);
      grouped[cat].forEach(item => {
        const div = document.createElement('div');
        div.className = 'repertoire-item';
        div.innerHTML = `
          <div class="repertoire-item-info">
            <p><strong>Compositeur :</strong> ${item.compositeur}</p>
            <p><strong>Titre :</strong> ${item.titre}</p>
            <p><strong>Catégorie :</strong> ${item.categorie}</p>
          </div>
          <div class="repertoire-item-actions">
            <button class="edit-btn" data-id="${item.id}">Modifier</button>
            <button class="delete-btn" data-id="${item.id}">Supprimer</button>
          </div>
        `;
        catDiv.appendChild(div);
      });
      repertoireList.appendChild(catDiv);
    }
  }

  // Gestion du formulaire d'ajout de pièce
  const openRepertoireFormBtn = document.getElementById('open-repertoire-form');
  const repertoireFormContainer = document.getElementById('repertoire-form-container');
  const repertoireForm = document.getElementById('repertoire-form');
  const closeRepertoireFormBtn = document.getElementById('close-repertoire-form');

  if (openRepertoireFormBtn) {
    openRepertoireFormBtn.addEventListener('click', () => {
      repertoireFormContainer.style.display = 'block';
    });
  }
  if (closeRepertoireFormBtn) {
    closeRepertoireFormBtn.addEventListener('click', () => {
      repertoireFormContainer.style.display = 'none';
    });
  }
  if (repertoireForm) {
    repertoireForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const compositeur = document.getElementById('compositeur').value.trim();
      const titre = document.getElementById('titre').value.trim();
      const categorie = document.getElementById('categorie').value;
      if (compositeur && titre) {
        const { data, error } = await supabase
          .from('repertoire')
          .insert([{ user_id: userId, compositeur, titre, categorie }]);
        if (error) console.error(error);
        repertoireForm.reset();
        repertoireFormContainer.style.display = 'none';
        loadRepertoire();
      }
    });
  }

  // Édition et suppression (délégation d'événement sur la liste)
  const repertoireList = document.getElementById('repertoire-list');
  if (repertoireList) {
    repertoireList.addEventListener('click', async (e) => {
      if (e.target.classList.contains('delete-btn')) {
        const id = e.target.dataset.id;
        const { error } = await supabase
          .from('repertoire')
          .delete()
          .eq('id', id);
        if (error) console.error(error);
        loadRepertoire();
      }
      if (e.target.classList.contains('edit-btn')) {
        const id = e.target.dataset.id;
        const { data: [item], error } = await supabase
          .from('repertoire')
          .select('*')
          .eq('id', id);
        if (error || !item) {
          console.error(error);
          return;
        }
        const newCompositeur = prompt("Modifier le compositeur :", item.compositeur);
        const newTitre = prompt("Modifier le titre :", item.titre);
        if (newCompositeur && newTitre) {
          const { error } = await supabase
            .from('repertoire')
            .update({ compositeur: newCompositeur.trim(), titre: newTitre.trim() })
            .eq('id', id);
          if (error) console.error(error);
          loadRepertoire();
        }
      }
    });
  }

  // ----------------- FONCTIONNALITÉS DU JOURNAL -----------------
  // Charger les entrées du journal de l'utilisateur
  async function loadJournal() {
    const { data: journalItems, error } = await supabase
      .from('journal')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      return;
    }
    renderJournal(journalItems);
  }

  // Afficher les entrées du journal sous forme de cartes
  function renderJournal(items) {
    const journalList = document.getElementById('journal-list');
    journalList.innerHTML = '';
    items.forEach(item => {
      const timeString = new Date(item.created_at).toLocaleString();
      const div = document.createElement('div');
      div.className = 'journal-entry';
      div.innerHTML = `
        <div class="journal-entry-header">
          <p class="journal-piece">Pièce ID: ${item.piece_id || 'N/A'}</p>
          <time class="journal-timestamp">${timeString}</time>
        </div>
        <div class="journal-entry-content">
          <p>${item.note_content}</p>
        </div>
      `;
      journalList.appendChild(div);
    });
  }

  // Mettre à jour le select des pièces dans le formulaire du journal
  function updatePieceSelect(items) {
    const pieceSelect = document.getElementById('piece-select');
    if (!pieceSelect) return;
    pieceSelect.innerHTML = `<option value="">-- Choisissez une pièce --</option>`;
    items.forEach(item => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = `${item.compositeur} - ${item.titre} [${item.categorie}]`;
      pieceSelect.appendChild(option);
    });
  }

  // Gestion du formulaire d'ajout d'une note dans le journal
  const journalForm = document.getElementById('journal-form');
  if (journalForm) {
    journalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pieceSelect = document.getElementById('piece-select');
      const noteContent = document.getElementById('note-content').value.trim();
      const pieceId = pieceSelect.value;
      if (pieceId && noteContent) {
        const { error } = await supabase
          .from('journal')
          .insert([{ user_id: userId, piece_id: pieceId, note_content: noteContent }]);
        if (error) console.error(error);
        journalForm.reset();
        loadJournal();
      }
    });
  }

  // Optionnel : tri des entrées du journal (le tri principal est effectué via la requête)
  const sortButton = document.getElementById('sort-button');
  const sortSelect = document.getElementById('sort-select');
  if (sortButton) {
    sortButton.addEventListener('click', () => {
      // Pour simplifier, on recharge le journal.
      // Le tri peut être étendu en triant le tableau récupéré côté client.
      loadJournal();
    });
  }

  // ----------------- FONCTIONNALITÉS DU MÉTRONOME -----------------
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

  if (tempoSlider) {
    tempoSlider.addEventListener('input', updateTempoDisplay);
  }
  if (decreaseTempoBtn) {
    decreaseTempoBtn.addEventListener('click', () => {
      let current = Number(tempoSlider.value);
      if (current > Number(tempoSlider.min)) {
        tempoSlider.value = current - 1;
        updateTempoDisplay();
        if (metronomeInterval) restartMetronome();
      }
    });
  }
  if (increaseTempoBtn) {
    increaseTempoBtn.addEventListener('click', () => {
      let current = Number(tempoSlider.value);
      if (current < Number(tempoSlider.max)) {
        tempoSlider.value = current + 1;
        updateTempoDisplay();
        if (metronomeInterval) restartMetronome();
      }
    });
  }
  function startMetronome() {
    const bpm = Number(tempoSlider.value);
    if (bpm > 0) {
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
    if (metronomeInterval) {
      stopMetronome();
      startMetronome();
    }
  }
  if (startStopBtn) {
    startStopBtn.addEventListener('click', () => {
      metronomeInterval ? stopMetronome() : startMetronome();
    });
  }

  // ----------------- INITIALISATION -----------------
  loadRepertoire();
  loadJournal();
});
