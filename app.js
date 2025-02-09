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

  // Ici, intègre le code de tes fonctionnalités pour le répertoire, le journal et le métronome.
});
