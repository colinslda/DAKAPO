// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js";
import { 
  getFirestore, collection, query, where, getDocs, addDoc, deleteDoc, updateDoc, doc, orderBy, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js";

// --- Configuration Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyDepmXmfXTRwRjX610Q7KX6XPrHMWdgR_8",
  authDomain: "dacapo-25d3e.firebaseapp.com",
  projectId: "dacapo-25d3e",
  storageBucket: "dacapo-25d3e.firebasestorage.app",
  messagingSenderId: "149584465970",
  appId: "1:149584465970:web:c18e47ca6e03228900ec2b",
  measurementId: "G-6LNF70B3QJ"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Exécution lorsque le DOM est prêt ---
document.addEventListener('DOMContentLoaded', () => {
  
  // Vérifier l'authentification de l'utilisateur
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // Pas d'utilisateur connecté : rediriger vers login.html
      window.location.href = 'login.html';
      return;
    }
    const userId = user.uid;

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

    // ----------------- FONCTIONNALITÉS DU RÉPERTOIRE -----------------
    // Charger le répertoire de l'utilisateur depuis Firestore
    async function loadRepertoire() {
      try {
        const q = query(collection(db, "repertoire"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        const items = [];
        querySnapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() });
        });
        renderRepertoire(items);
        updatePieceSelect(items);
      } catch (error) {
        console.error("Erreur au chargement du répertoire :", error);
      }
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
          try {
            await addDoc(collection(db, "repertoire"), {
              userId,
              compositeur,
              titre,
              categorie,
              createdAt: serverTimestamp()
            });
            repertoireForm.reset();
            repertoireFormContainer.style.display = 'none';
            loadRepertoire();
          } catch (error) {
            console.error("Erreur lors de l'ajout d'une pièce :", error);
          }
        }
      });
    }

    // Édition et suppression (délégation d'événement sur la liste)
    const repertoireList = document.getElementById('repertoire-list');
    if (repertoireList) {
      repertoireList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
          const id = e.target.dataset.id;
          try {
            await deleteDoc(doc(db, "repertoire", id));
            loadRepertoire();
          } catch (error) {
            console.error("Erreur lors de la suppression :", error);
          }
        }
        if (e.target.classList.contains('edit-btn')) {
          const id = e.target.dataset.id;
          // Récupérer les données du document
          const q = query(collection(db, "repertoire"), where("__name__", "==", id));
          const querySnapshot = await getDocs(q);
          if (querySnapshot.empty) {
            console.error("Document non trouvé");
            return;
          }
          let item;
          querySnapshot.forEach((docSnap) => { item = { id: docSnap.id, ...docSnap.data() }; });
          const newCompositeur = prompt("Modifier le compositeur :", item.compositeur);
          const newTitre = prompt("Modifier le titre :", item.titre);
          if (newCompositeur && newTitre) {
            try {
              await updateDoc(doc(db, "repertoire", id), {
                compositeur: newCompositeur.trim(),
                titre: newTitre.trim()
              });
              loadRepertoire();
            } catch (error) {
              console.error("Erreur lors de la mise à jour :", error);
            }
          }
        }
      });
    }

    // ----------------- FONCTIONNALITÉS DU JOURNAL -----------------
    // Charger les entrées du journal de l'utilisateur
    async function loadJournal() {
      try {
        const q = query(
          collection(db, "journal"),
          where("userId", "==", userId),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const items = [];
        querySnapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() });
        });
        renderJournal(items);
      } catch (error) {
        console.error("Erreur au chargement du journal :", error);
      }
    }

    // Afficher les entrées du journal sous forme de cartes
    function renderJournal(items) {
      const journalList = document.getElementById('journal-list');
      journalList.innerHTML = '';
      items.forEach(item => {
        const timeString = item.createdAt
          ? new Date(item.createdAt.seconds * 1000).toLocaleString()
          : '';
        const div = document.createElement('div');
        div.className = 'journal-entry';
        div.innerHTML = `
          <div class="journal-entry-header">
            <p class="journal-piece">Pièce ID: ${item.pieceId || 'N/A'}</p>
            <time class="journal-timestamp">${timeString}</time>
          </div>
          <div class="journal-entry-content">
            <p>${item.noteContent}</p>
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
          try {
            await addDoc(collection(db, "journal"), {
              userId,
              pieceId,
              noteContent,
              createdAt: serverTimestamp()
            });
            journalForm.reset();
            loadJournal();
          } catch (error) {
            console.error("Erreur lors de l'ajout d'une note :", error);
          }
        }
      });
    }

    // Optionnel : tri des entrées du journal (on recharge simplement le journal)
    const sortButton = document.getElementById('sort-button');
    const sortSelect = document.getElementById('sort-select');
    if (sortButton) {
      sortButton.addEventListener('click', () => {
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
    
  }); // Fin de onAuthStateChanged
}); // Fin de DOMContentLoaded
