// app.js

// Estado global de la aplicación
let data = {
  teams: [],
  tournaments: [],
  matches: []
};

// Clave para localStorage
const STORAGE_KEY = 'volleyball_tournament_data';

// Colores disponibles para los equipos (Paleta clásica y elegante de club de campo)
const TEAM_COLORS = [
  '#b85d3b', // Teja / Terracota
  '#4c6a58', // Salvia / Sage Green
  '#d4a373', // Arena / Sandy Gold
  '#2b4c6f', // Azul Marino Clásico
  '#8c6239', // Cobre / Bronce
  '#2e7d32', // Verde Bosque
  '#c5a059', // Oro Viejo
  '#5b507a'  // Ciruela / Plum
];

// Cargar datos al iniciar
function loadData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      data = JSON.parse(stored);
      // Asegurar compatibilidad
      if (!data.teams) data.teams = [];
      if (!data.tournaments) data.tournaments = [];
      if (!data.matches) data.matches = [];
    } catch (e) {
      console.error("Error al cargar localStorage, reiniciando datos", e);
      saveData();
    }
  } else {
    // Datos semilla para demostración inmediata
    seedData();
  }
}

// Guardar datos
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Datos semilla para que el usuario vea la app activa desde el primer segundo
function seedData() {
  data.teams = [
    { id: 't1', name: 'Halcones Dorados', coach: 'Carlos Ortega', players: ['Luis G.', 'Pedro M.', 'Juan C.', 'Andres P.', 'Miguel A.', 'Roberto F.', 'David S.'], color: '#c5a059' },
    { id: 't2', name: 'Tiburones del Caribe', coach: 'Marina Gomez', players: ['Jose L.', 'Fernando R.', 'Hugo M.', 'Sandro T.', 'Gabriel V.', 'Alvaro C.', 'Esteban Z.'], color: '#2b4c6f' },
    { id: 't3', name: 'Fénix Vóley', coach: 'Ricardo Silva', players: ['Daniel P.', 'Mateo Q.', 'Javier O.', 'Tomas B.', 'Lucas N.', 'Diego E.', 'Felipe R.'], color: '#b85d3b' },
    { id: 't4', name: 'Spartans Club', coach: 'Jorge Valenzuela', players: ['Marcos A.', 'Julian F.', 'Nico H.', 'Santi D.', 'Juan M.', 'Samuel P.', 'Bruno G.'], color: '#4c6a58' }
  ];
  
  data.tournaments = [
    {
      id: 'tour_seed',
      name: 'Copa de Verano Voleibol 2026',
      type: 'round-robin', // Todos contra todos
      teams: ['t1', 't2', 't3', 't4'],
      status: 'active',
      winnerId: null
    }
  ];

  // Generar fixture Round Robin para Copa de Verano
  // 4 equipos -> 3 rondas (jornadas), 2 partidos por ronda
  data.matches = [
    // Ronda 1
    { id: 'm_seed_1', tournamentId: 'tour_seed', round: 1, teamAId: 't1', teamBId: 't4', sets: [{teamA: 25, teamB: 20}, {teamA: 25, teamB: 22}], winnerId: 't1', completed: true },
    { id: 'm_seed_2', tournamentId: 'tour_seed', round: 1, teamAId: 't2', teamBId: 't3', sets: [{teamA: 25, teamB: 18}, {teamA: 21, teamB: 25}, {teamA: 15, teamB: 13}], winnerId: 't2', completed: true },
    // Ronda 2
    { id: 'm_seed_3', tournamentId: 'tour_seed', round: 2, teamAId: 't1', teamBId: 't3', sets: [], winnerId: null, completed: false },
    { id: 'm_seed_4', tournamentId: 'tour_seed', round: 2, teamAId: 't4', teamBId: 't2', sets: [], winnerId: null, completed: false },
    // Ronda 3
    { id: 'm_seed_5', tournamentId: 'tour_seed', round: 3, teamAId: 't1', teamBId: 't2', sets: [], winnerId: null, completed: false },
    { id: 'm_seed_6', tournamentId: 'tour_seed', round: 3, teamAId: 't3', teamBId: 't4', sets: [], winnerId: null, completed: false }
  ];
  
  saveData();
}

// Inicialización de la SPA
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupNavigation();
  setupEventListeners();
  
  // Mostrar dashboard por defecto
  switchView('dashboard');
});

// Navegación SPA
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const view = item.getAttribute('data-view');
      if (view) {
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        switchView(view);
      }
    });
  });
}

function switchView(viewId) {
  // Ocultar todas las vistas
  document.querySelectorAll('.app-view').forEach(view => {
    view.classList.remove('active');
  });
  
  // Mostrar vista seleccionada
  const activeView = document.getElementById(viewId);
  if (activeView) {
    activeView.classList.add('active');
    
    // Renderizar contenido dinámico
    if (viewId === 'dashboard') renderDashboard();
    else if (viewId === 'teams') renderTeams();
    else if (viewId === 'create-tournament') renderCreateTournament();
    else if (viewId === 'matches') renderMatches();
    else if (viewId === 'standings') renderStandings();
  }
}

// Configuración de escuchas de eventos globales
let activeMatchForScore = null; // Guardará el partido que se está editando en el modal
let playerListInput = []; // Lista temporal de jugadores para el formulario de equipos
let selectedTeamColor = TEAM_COLORS[0]; // Color de equipo por defecto

function setupEventListeners() {
  // --- Gestión de Equipos ---
  const btnAddPlayer = document.getElementById('btn-add-player');
  const playerInput = document.getElementById('player-name-input');
  
  if (btnAddPlayer && playerInput) {
    const addPlayerFn = () => {
      const name = playerInput.value.trim();
      if (name) {
        playerListInput.push(name);
        playerInput.value = '';
        renderPlayerChips();
      }
    };
    
    btnAddPlayer.addEventListener('click', addPlayerFn);
    playerInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addPlayerFn();
      }
    });
  }
  
  // Selector de color
  const colorPickerContainer = document.getElementById('color-picker-container');
  if (colorPickerContainer) {
    colorPickerContainer.innerHTML = '';
    TEAM_COLORS.forEach((color, idx) => {
      const opt = document.createElement('div');
      opt.className = `color-option ${idx === 0 ? 'selected' : ''}`;
      opt.style.backgroundColor = color;
      opt.style.color = color;
      opt.addEventListener('click', () => {
        document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        selectedTeamColor = color;
      });
      colorPickerContainer.appendChild(opt);
    });
  }

  // Formulario guardar equipo
  const formTeam = document.getElementById('form-add-team');
  if (formTeam) {
    formTeam.addEventListener('submit', (e) => {
      e.preventDefault();
      const teamName = document.getElementById('team-name').value.trim();
      const coachName = document.getElementById('team-coach').value.trim();
      
      if (!teamName || !coachName) {
        alert('Por favor, ingresa el nombre del equipo y del entrenador.');
        return;
      }
      
      if (playerListInput.length < 6) {
        alert('Un equipo de voleibol debe tener al menos 6 jugadores inscritos.');
        return;
      }
      
      const newTeam = {
        id: 'team_' + Date.now(),
        name: teamName,
        coach: coachName,
        players: [...playerListInput],
        color: selectedTeamColor
      };
      
      data.teams.push(newTeam);
      saveData();
      
      // Limpiar formulario
      formTeam.reset();
      playerListInput = [];
      renderPlayerChips();
      
      // Re-renderizar
      renderTeams();
      alert('¡Equipo registrado con éxito!');
    });
  }

  // --- Gestión de Torneos ---
  const formTournament = document.getElementById('form-add-tournament');
  if (formTournament) {
    formTournament.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('tournament-name').value.trim();
      const type = document.getElementById('tournament-type').value;
      
      // Obtener equipos seleccionados
      const selectedCheckboxes = document.querySelectorAll('.team-checkbox:checked');
      const selectedTeamIds = Array.from(selectedCheckboxes).map(cb => cb.value);
      
      if (!name) {
        alert('Por favor, ingresa el nombre del torneo.');
        return;
      }
      
      if (selectedTeamIds.length < 2) {
        alert('Se requieren al menos 2 equipos para crear un torneo.');
        return;
      }
      
      const tournamentId = 'tour_' + Date.now();
      const newTournament = {
        id: tournamentId,
        name: name,
        type: type,
        teams: selectedTeamIds,
        status: 'active',
        winnerId: null
      };
      
      // Generar Fixture/Partidos
      let generatedMatches = [];
      if (type === 'round-robin') {
        generatedMatches = generateRoundRobinFixture(tournamentId, selectedTeamIds);
      } else {
        generatedMatches = generateSingleEliminationFixture(tournamentId, selectedTeamIds);
      }
      
      // Desactivar torneos anteriores
      data.tournaments.forEach(t => {
        if (t.status === 'active') t.status = 'setup';
      });
      
      data.tournaments.push(newTournament);
      data.matches = data.matches.concat(generatedMatches);
      saveData();
      
      formTournament.reset();
      alert('¡Torneo creado e iniciado con éxito!');
      switchView('dashboard');
    });
  }

  // --- Modal de Resultados ---
  const modalClose = document.getElementById('modal-close-btn');
  const modalOverlay = document.getElementById('modal-score-overlay');
  
  if (modalClose && modalOverlay) {
    modalClose.addEventListener('click', () => {
      modalOverlay.classList.remove('open');
      activeMatchForScore = null;
    });
  }

  const formScore = document.getElementById('form-match-score');
  if (formScore) {
    formScore.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!activeMatchForScore) return;
      
      const s1a = parseInt(document.getElementById('set1-a').value);
      const s1b = parseInt(document.getElementById('set1-b').value);
      const s2a = parseInt(document.getElementById('set2-a').value);
      const s2b = parseInt(document.getElementById('set2-b').value);
      const s3a = parseInt(document.getElementById('set3-a').value || '0');
      const s3b = parseInt(document.getElementById('set3-b').value || '0');
      
      if (isNaN(s1a) || isNaN(s1b) || isNaN(s2a) || isNaN(s2b)) {
        alert('Por favor, ingresa los resultados de al menos el Set 1 y el Set 2.');
        return;
      }
      
      if (!validateVoleySet(s1a, s1b, 25)) {
        alert('El Set 1 no cumple las reglas de voleibol (Ganador debe llegar a 25 puntos y ganar por diferencia de 2).');
        return;
      }
      if (!validateVoleySet(s2a, s2b, 25)) {
        alert('El Set 2 no cumple las reglas de voleibol (Ganador debe llegar a 25 puntos y ganar por diferencia de 2).');
        return;
      }
      
      let setsWonA = 0;
      let setsWonB = 0;
      
      if (s1a > s1b) setsWonA++; else setsWonB++;
      if (s2a > s2b) setsWonA++; else setsWonB++;
      
      let playedSets = [
        { teamA: s1a, teamB: s1b },
        { teamA: s2a, teamB: s2b }
      ];
      
      if (setsWonA === 1 && setsWonB === 1) {
        const s3InputA = document.getElementById('set3-a').value;
        const s3InputB = document.getElementById('set3-b').value;
        if (s3InputA === '' || s3InputB === '') {
          alert('Se requiere el resultado del Set 3 (desempate) ya que van empatados 1-1.');
          return;
        }
        if (!validateVoleySet(s3a, s3b, 15)) {
          alert('El Set 3 no cumple las reglas de voleibol (Ganador debe llegar a 15 puntos y ganar por diferencia de 2).');
          return;
        }
        
        playedSets.push({ teamA: s3a, teamB: s3b });
        if (s3a > s3b) setsWonA++; else setsWonB++;
      } else {
        if (document.getElementById('set3-a').value !== '' || document.getElementById('set3-b').value !== '') {
          if (!confirm('El partido se define en 2 sets. ¿Deseas ignorar el Set 3 ingresado?')) {
            return;
          }
        }
      }
      
      const match = data.matches.find(m => m.id === activeMatchForScore.id);
      if (match) {
        match.sets = playedSets;
        match.completed = true;
        match.winnerId = setsWonA > setsWonB ? match.teamAId : match.teamBId;
        
        if (match.nextMatchId) {
          propagatePlayoffWinner(match.id, match.winnerId);
        }
        
        saveData();
        checkTournamentCompletion();
        
        modalOverlay.classList.remove('open');
        activeMatchForScore = null;
        formScore.reset();
        
        renderMatches();
        alert('Resultado registrado exitosamente.');
      }
    });
  }
}

function renderPlayerChips() {
  const container = document.getElementById('player-chips-container');
  if (!container) return;
  container.innerHTML = '';
  
  playerListInput.forEach((player, index) => {
    const chip = document.createElement('span');
    chip.className = 'player-chip';
    chip.innerHTML = `${player} <span class="remove-chip" data-index="${index}">&times;</span>`;
    
    chip.querySelector('.remove-chip').addEventListener('click', () => {
      playerListInput.splice(index, 1);
      renderPlayerChips();
    });
    
    container.appendChild(chip);
  });
}

function validateVoleySet(scoreA, scoreB, minPoints) {
  if (scoreA === scoreB) return false;
  const max = Math.max(scoreA, scoreB);
  const min = Math.min(scoreA, scoreB);
  
  if (max < minPoints) return false;
  if (max - min < 2) return false;
  if (max > minPoints && max - min !== 2) return false;
  
  return true;
}

function generateRoundRobinFixture(tournamentId, teamIds) {
  let list = [...teamIds];
  let matches = [];
  
  const isOdd = list.length % 2 !== 0;
  if (isOdd) {
    list.push(null);
  }
  
  const numTeams = list.length;
  const totalRounds = numTeams - 1;
  
  for (let r = 0; r < totalRounds; r++) {
    for (let i = 0; i < numTeams / 2; i++) {
      const homeIdx = i;
      const awayIdx = numTeams - 1 - i;
      
      const home = list[homeIdx];
      const away = list[awayIdx];
      
      if (home !== null && away !== null) {
        matches.push({
          id: `match_${tournamentId}_r${r+1}_${i}`,
          tournamentId: tournamentId,
          round: r + 1,
          teamAId: home,
          teamBId: away,
          sets: [],
          winnerId: null,
          completed: false
        });
      }
    }
    list.splice(1, 0, list.pop());
  }
  
  return matches;
}

function generateSingleEliminationFixture(tournamentId, teamIds) {
  let shuffledTeams = [...teamIds].sort(() => Math.random() - 0.5);
  const N = Math.pow(2, Math.ceil(Math.log2(shuffledTeams.length)));
  
  while (shuffledTeams.length < N) {
    shuffledTeams.push(null);
  }
  
  const roundsCount = Math.log2(N);
  const rounds = [];
  
  for (let r = 1; r <= roundsCount; r++) {
    const matchesInRound = N / Math.pow(2, r);
    const roundList = [];
    for (let m = 0; m < matchesInRound; m++) {
      roundList.push({
        id: `match_${tournamentId}_r${r}_m${m}`,
        tournamentId: tournamentId,
        round: r,
        roundName: getRoundName(r, roundsCount),
        teamAId: null,
        teamBId: null,
        teamASourceMatchId: null,
        teamBSourceMatchId: null,
        sets: [],
        winnerId: null,
        completed: false,
        nextMatchId: null,
        nextMatchTeamSlot: null
      });
    }
    rounds.push(roundList);
  }
  
  for (let r = 0; r < roundsCount - 1; r++) {
    const currentRound = rounds[r];
    const nextRound = rounds[r + 1];
    for (let i = 0; i < currentRound.length; i++) {
      const match = currentRound[i];
      const nextMatchIdx = Math.floor(i / 2);
      const nextMatch = nextRound[nextMatchIdx];
      
      match.nextMatchId = nextMatch.id;
      match.nextMatchTeamSlot = (i % 2 === 0) ? 'A' : 'B';
      
      if (i % 2 === 0) {
        nextMatch.teamASourceMatchId = match.id;
      } else {
        nextMatch.teamBSourceMatchId = match.id;
      }
    }
  }
  
  const allMatches = rounds.flat();
  
  const round1Matches = rounds[0];
  for (let i = 0; i < round1Matches.length; i++) {
    const match = round1Matches[i];
    match.teamAId = shuffledTeams[2 * i];
    match.teamBId = shuffledTeams[2 * i + 1];
  }
  
  resolvePlayoffByes(allMatches, tournamentId);
  return allMatches;
}

function getRoundName(round, totalRounds) {
  const diff = totalRounds - round;
  if (diff === 0) return 'Gran Final';
  if (diff === 1) return 'Semifinales';
  if (diff === 2) return 'Cuartos de Final';
  if (diff === 3) return 'Octavos de Final';
  return `Ronda ${round}`;
}

function resolvePlayoffByes(matches, tournamentId) {
  let changeMade = true;
  while (changeMade) {
    changeMade = false;
    for (let match of matches) {
      if (match.completed) continue;
      
      const aReady = (match.teamAId !== null) || (match.teamASourceMatchId === null);
      const bReady = (match.teamBId !== null) || (match.teamBSourceMatchId === null);
      
      if (aReady && bReady) {
        const teamA = match.teamAId;
        const teamB = match.teamBId;
        
        if (teamA === null && teamB === null) {
          match.completed = true;
          match.winnerId = null;
          propagatePlayoffWinnerDirect(match.id, null, matches);
          changeMade = true;
        } else if (teamA === null) {
          match.completed = true;
          match.winnerId = teamB;
          propagatePlayoffWinnerDirect(match.id, teamB, matches);
          changeMade = true;
        } else if (teamB === null) {
          match.completed = true;
          match.winnerId = teamA;
          propagatePlayoffWinnerDirect(match.id, teamA, matches);
          changeMade = true;
        }
      }
    }
  }
}

function propagatePlayoffWinnerDirect(matchId, winnerId, allMatches) {
  const nextMatch = allMatches.find(m => m.teamASourceMatchId === matchId || m.teamBSourceMatchId === matchId);
  if (!nextMatch) return;
  
  if (nextMatch.teamASourceMatchId === matchId) {
    nextMatch.teamAId = winnerId;
  } else {
    nextMatch.teamBId = winnerId;
  }
}

function propagatePlayoffWinner(matchId, winnerId) {
  const nextMatch = data.matches.find(m => m.teamASourceMatchId === matchId || m.teamBSourceMatchId === matchId);
  if (!nextMatch) return;
  
  if (nextMatch.teamASourceMatchId === matchId) {
    nextMatch.teamAId = winnerId;
  } else {
    nextMatch.teamBId = winnerId;
  }
  
  if (nextMatch.teamAId === null && nextMatch.teamASourceMatchId === null && nextMatch.teamBId !== null) {
    nextMatch.completed = true;
    nextMatch.winnerId = nextMatch.teamBId;
    propagatePlayoffWinner(nextMatch.id, nextMatch.winnerId);
  } else if (nextMatch.teamBId === null && nextMatch.teamBSourceMatchId === null && nextMatch.teamAId !== null) {
    nextMatch.completed = true;
    nextMatch.winnerId = nextMatch.teamAId;
    propagatePlayoffWinner(nextMatch.id, nextMatch.winnerId);
  }
}

function checkTournamentCompletion() {
  const activeTournament = data.tournaments.find(t => t.status === 'active');
  if (!activeTournament) return;
  
  const tournamentMatches = data.matches.filter(m => m.tournamentId === activeTournament.id);
  
  if (activeTournament.type === 'round-robin') {
    const allDone = tournamentMatches.every(m => m.completed);
    if (allDone && tournamentMatches.length > 0) {
      const standings = calculateStandings(activeTournament.id);
      if (standings.length > 0) {
        activeTournament.winnerId = standings[0].teamId;
        activeTournament.status = 'finished';
        saveData();
        alert(`¡El torneo "${activeTournament.name}" ha finalizado! Campeón: ${standings[0].name}`);
      }
    }
  } else {
    const roundsCount = Math.log2(Math.pow(2, Math.ceil(Math.log2(activeTournament.teams.length))));
    const finalMatch = tournamentMatches.find(m => m.round === roundsCount);
    
    if (finalMatch && finalMatch.completed) {
      activeTournament.winnerId = finalMatch.winnerId;
      activeTournament.status = 'finished';
      saveData();
      const champion = data.teams.find(t => t.id === finalMatch.winnerId);
      alert(`¡El torneo de eliminación directa "${activeTournament.name}" ha finalizado! ¡Campeón: ${champion ? champion.name : 'N/A'}!`);
    }
  }
}

function renderDashboard() {
  const activeTour = data.tournaments.find(t => t.status === 'active');
  document.getElementById('stat-total-teams').textContent = data.teams.length;
  document.getElementById('stat-total-tournaments').textContent = data.tournaments.length;
  
  const dashboardDetails = document.getElementById('dashboard-active-details');
  if (!dashboardDetails) return;
  
  if (!activeTour) {
    dashboardDetails.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🏆</div>
        <h3>No hay torneos activos</h3>
        <p>Registra equipos y luego crea un torneo en la sección correspondiente para comenzar.</p>
        <button class="btn btn-primary" onclick="switchView('create-tournament')">Crear un Torneo</button>
      </div>
    `;
    return;
  }
  
  const tourMatches = data.matches.filter(m => m.tournamentId === activeTour.id);
  const completedCount = tourMatches.filter(m => m.completed).length;
  
  let recentMatchesHTML = '';
  const recentMatches = tourMatches.filter(m => m.completed).slice(-3).reverse();
  
  if (recentMatches.length === 0) {
    recentMatchesHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">Aún no hay partidos completados.</p>';
  } else {
    recentMatches.forEach(m => {
      const teamA = data.teams.find(t => t.id === m.teamAId) || { name: 'Desconocido', color: '#6b7e71' };
      const teamB = data.teams.find(t => t.id === m.teamBId) || { name: 'Desconocido', color: '#6b7e71' };
      
      const setsScore = m.sets.map(s => `${s.teamA}-${s.teamB}`).join(' | ');
      
      recentMatchesHTML += `
        <div class="match-card completed" style="margin-bottom: 10px;">
          <div class="match-teams">
            <div class="match-team-row ${m.winnerId === teamA.id ? 'winner' : 'loser'}">
              <span class="team-identity">
                <span class="match-team-color" style="background-color: ${teamA.color}"></span>
                <span class="team-name">${teamA.name}</span>
              </span>
            </div>
            <div class="match-team-row ${m.winnerId === teamB.id ? 'winner' : 'loser'}">
              <span class="team-identity">
                <span class="match-team-color" style="background-color: ${teamB.color}"></span>
                <span class="team-name">${teamB.name}</span>
              </span>
            </div>
          </div>
          <div style="font-size: 0.85rem; color: var(--accent-gold); font-weight: 500; text-align: right;">
            Sets: ${setsScore}
          </div>
        </div>
      `;
    });
  }
  
  const progressPercent = tourMatches.length > 0 ? Math.round((completedCount / tourMatches.length) * 100) : 0;
  
  dashboardDetails.innerHTML = `
    <div class="grid-2">
      <div class="glass-card">
        <h2 style="font-size: 1.5rem; margin-bottom: 1rem; color: var(--accent-gold);">${activeTour.name}</h2>
        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-secondary);">Modalidad:</span>
            <span style="font-weight: 600;">${activeTour.type === 'round-robin' ? 'Todos contra todos (Round Robin)' : 'Eliminación Directa'}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-secondary);">Equipos participantes:</span>
            <span style="font-weight: 600; color: var(--accent-gold);">${activeTour.teams.length}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-secondary);">Partidos Jugados:</span>
            <span><strong>${completedCount}</strong> de <strong>${tourMatches.length}</strong></span>
          </div>
        </div>
        
        <div style="margin-bottom: 0.5rem; font-size: 0.85rem; color: var(--text-secondary); display: flex; justify-content: space-between;">
          <span>Progreso del torneo</span>
          <span>${progressPercent}%</span>
        </div>
        <div style="background-color: rgba(255,255,255,0.03); height: 10px; border-radius: 5px; overflow: hidden;">
          <div style="background: var(--accent-green-gradient); width: ${progressPercent}%; height: 100%; transition: var(--transition);"></div>
        </div>
      </div>
      
      <div class="glass-card">
        <h3 style="font-size: 1.2rem; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-light); padding-bottom: 8px;">Últimos Resultados</h3>
        ${recentMatchesHTML}
      </div>
    </div>
  `;
}

function renderTeams() {
  const grid = document.getElementById('teams-grid');
  if (!grid) return;
  
  if (data.teams.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">🏐</div>
        <h3>No hay equipos registrados</h3>
        <p>Completa el formulario de la izquierda para registrar a los primeros equipos.</p>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = '';
  data.teams.forEach(team => {
    const card = document.createElement('div');
    card.className = 'glass-card team-card';
    
    let playersHTML = '';
    team.players.forEach(p => {
      playersHTML += `<li>${p}</li>`;
    });
    
    card.innerHTML = `
      <div class="team-card-header">
        <h3 style="font-size: 1.2rem; font-weight: 700; color: #fff;">${team.name}</h3>
        <span class="team-color-badge" style="color: ${team.color}; background-color: ${team.color}"></span>
      </div>
      <div class="team-info">
        <p><strong style="color: var(--text-secondary);">Entrenador:</strong> ${team.coach}</p>
        <p style="margin-top: 10px; font-weight: 500; color: var(--accent-gold); font-size: 0.85rem;">Plantilla (${team.players.length} Jugadores):</p>
      </div>
      <ul class="team-players-list">
        ${playersHTML}
      </ul>
      <div style="margin-top: 1.5rem; text-align: right;">
        <button class="btn btn-danger btn-sm" onclick="deleteTeam('${team.id}')">Eliminar</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function deleteTeam(id) {
  const inActiveTour = data.tournaments.some(t => t.status === 'active' && t.teams.includes(id));
  if (inActiveTour) {
    alert('No puedes eliminar un equipo que está participando en un torneo activo.');
    return;
  }
  
  if (confirm('¿Estás seguro de que deseas eliminar este equipo?')) {
    data.teams = data.teams.filter(t => t.id !== id);
    saveData();
    renderTeams();
  }
}

function renderCreateTournament() {
  const container = document.getElementById('teams-selection-container');
  if (!container) return;
  
  if (data.teams.length < 2) {
    container.innerHTML = `
      <div class="empty-state">
        <p style="color: #f87171; font-weight: 500;">Se requieren al menos 2 equipos para poder crear un torneo.</p>
        <button class="btn btn-secondary btn-sm" style="margin-top: 10px;" onclick="switchView('teams')">Registrar Equipos</button>
      </div>
    `;
    return;
  }
  
  container.innerHTML = '';
  data.teams.forEach(team => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '10px';
    row.style.marginBottom = '8px';
    row.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
    row.style.padding = '8px 12px';
    row.style.borderRadius = '6px';
    row.style.border = '1px solid var(--border-light)';
    
    row.innerHTML = `
      <input type="checkbox" id="chk_${team.id}" class="team-checkbox" value="${team.id}" checked style="width: 18px; height: 18px; cursor: pointer;">
      <span style="width: 10px; height: 10px; border-radius: 50%; background-color: ${team.color}; display: inline-block;"></span>
      <label for="chk_${team.id}" style="cursor: pointer; font-weight: 500; font-size: 0.95rem; flex-grow: 1;">${team.name}</label>
      <span style="font-size: 0.8rem; color: var(--text-muted);">${team.players.length} jug.</span>
    `;
    container.appendChild(row);
  });
}

function renderMatches() {
  const container = document.getElementById('matches-list-view');
  if (!container) return;
  
  const activeTour = data.tournaments.find(t => t.status === 'active');
  
  if (!activeTour) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📅</div>
        <h3>No hay torneos activos</h3>
        <p>Registra y empieza un torneo para ver y registrar resultados.</p>
      </div>
    `;
    return;
  }
  
  const tourMatches = data.matches.filter(m => m.tournamentId === activeTour.id);
  
  if (tourMatches.length === 0) {
    container.innerHTML = '<p>Este torneo no tiene partidos programados.</p>';
    return;
  }
  
  container.innerHTML = '';
  
  const rounds = {};
  tourMatches.forEach(match => {
    if (!rounds[match.round]) rounds[match.round] = [];
    rounds[match.round].push(match);
  });
  
  Object.keys(rounds).sort((a,b) => a-b).forEach(r => {
    const roundDiv = document.createElement('div');
    roundDiv.className = 'matches-container';
    roundDiv.style.styleFloat = 'none';
    roundDiv.style.marginBottom = '2.5rem';
    
    const roundName = rounds[r][0].roundName || `Jornada ${r}`;
    
    roundDiv.innerHTML = `
      <div class="round-header">
        <span>${roundName}</span>
      </div>
      <div class="matches-grid"></div>
    `;
    
    const grid = roundDiv.querySelector('.matches-grid');
    
    rounds[r].forEach(m => {
      if (m.teamAId === null && m.teamBId === null && m.completed && m.winnerId === null) {
        return; 
      }
      
      const teamA = data.teams.find(t => t.id === m.teamAId) || { name: 'BYE / Libre', color: '#6b7e71', id: null };
      const teamB = data.teams.find(t => t.id === m.teamBId) || { name: 'BYE / Libre', color: '#6b7e71', id: null };
      
      let scoreDisplayA = '';
      let scoreDisplayB = '';
      
      if (m.completed && m.sets.length > 0) {
        m.sets.forEach((set, idx) => {
          const classA = set.teamA > set.teamB ? 'winner-set' : '';
          const classB = set.teamB > set.teamA ? 'winner-set' : '';
          
          scoreDisplayA += `<span class="set-score-box ${classA}">${set.teamA}</span>`;
          scoreDisplayB += `<span class="set-score-box ${classB}">${set.teamB}</span>`;
        });
      }
      
      const isPlayoffBye = (teamA.id === null || teamB.id === null) && m.completed;
      
      const card = document.createElement('div');
      card.className = `match-card ${m.completed ? 'completed' : 'pending'}`;
      
      card.innerHTML = `
        <div class="match-teams">
          <div class="match-team-row ${m.completed && m.winnerId === teamA.id ? 'winner' : ''} ${m.completed && m.winnerId !== teamA.id ? 'loser' : ''}">
            <span class="team-identity">
              <span class="match-team-color" style="background-color: ${teamA.color}"></span>
              <span class="team-name" style="${teamA.id === null ? 'font-style: italic; color: var(--text-muted);' : ''}">${teamA.name}</span>
            </span>
            <div class="team-score-display">${scoreDisplayA}</div>
          </div>
          <div class="match-team-row ${m.completed && m.winnerId === teamB.id ? 'winner' : ''} ${m.completed && m.winnerId !== teamB.id ? 'loser' : ''}">
            <span class="team-identity">
              <span class="match-team-color" style="background-color: ${teamB.color}"></span>
              <span class="team-name" style="${teamB.id === null ? 'font-style: italic; color: var(--text-muted);' : ''}">${teamB.name}</span>
            </span>
            <div class="team-score-display">${scoreDisplayB}</div>
          </div>
        </div>
        
        <div class="match-meta">
          <span class="match-status ${m.completed ? 'completed' : 'pending'}">
            ${m.completed ? (isPlayoffBye ? 'Bye Resolv.' : 'Finalizado') : 'Pendiente'}
          </span>
          ${!m.completed && teamA.id !== null && teamB.id !== null ? `
            <button class="btn btn-accent btn-sm" onclick="openScoreModal('${m.id}')">Registrar Marcador</button>
          ` : ''}
          ${m.completed && !isPlayoffBye ? `
            <button class="btn btn-secondary btn-sm" style="opacity: 0.6; padding: 4px 8px; font-size: 0.75rem;" onclick="openScoreModal('${m.id}')">Modificar</button>
          ` : ''}
        </div>
      `;
      grid.appendChild(card);
    });
    
    container.appendChild(roundDiv);
  });
}

window.openScoreModal = function(matchId) {
  const match = data.matches.find(m => m.id === matchId);
  if (!match) return;
  
  activeMatchForScore = match;
  
  const teamA = data.teams.find(t => t.id === match.teamAId);
  const teamB = data.teams.find(t => t.id === match.teamBId);
  
  document.getElementById('modal-team-a-name').textContent = teamA.name;
  document.getElementById('modal-team-b-name').textContent = teamB.name;
  
  document.querySelectorAll('.team-label-a').forEach(el => el.textContent = teamA.name);
  document.querySelectorAll('.team-label-b').forEach(el => el.textContent = teamB.name);
  
  if (match.completed && match.sets.length > 0) {
    document.getElementById('set1-a').value = match.sets[0].teamA;
    document.getElementById('set1-b').value = match.sets[0].teamB;
    document.getElementById('set2-a').value = match.sets[1].teamA;
    document.getElementById('set2-b').value = match.sets[1].teamB;
    if (match.sets[2]) {
      document.getElementById('set3-a').value = match.sets[2].teamA;
      document.getElementById('set3-b').value = match.sets[2].teamB;
    } else {
      document.getElementById('set3-a').value = '';
      document.getElementById('set3-b').value = '';
    }
  } else {
    document.getElementById('set1-a').value = '';
    document.getElementById('set1-b').value = '';
    document.getElementById('set2-a').value = '';
    document.getElementById('set2-b').value = '';
    document.getElementById('set3-a').value = '';
    document.getElementById('set3-b').value = '';
  }
  
  const modalOverlay = document.getElementById('modal-score-overlay');
  modalOverlay.classList.add('open');
};

function renderStandings() {
  const activeTour = data.tournaments.find(t => t.status === 'active');
  const container = document.getElementById('standings-view-content');
  if (!container) return;
  
  if (!activeTour) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <h3>No hay torneos activos</h3>
        <p>Crea un torneo para ver su clasificación o árbol de eliminatorias.</p>
      </div>
    `;
    return;
  }
  
  if (activeTour.type === 'round-robin') {
    const standings = calculateStandings(activeTour.id);
    
    let tbodyHTML = '';
    standings.forEach((s, idx) => {
      const ratioSets = s.setsLost === 0 ? s.setsWon : (s.setsWon / s.setsLost).toFixed(3);
      const ratioPoints = s.pointsLost === 0 ? s.pointsWon : (s.pointsWon / s.pointsLost).toFixed(3);
      
      tbodyHTML += `
        <tr>
          <td class="rank-number">${idx + 1}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="width: 10px; height: 10px; border-radius: 50%; background-color: ${s.color}; display: inline-block;"></span>
              <strong>${s.name}</strong>
            </div>
          </td>
          <td style="font-weight: 700; color: var(--accent-gold);">${s.pts}</td>
          <td>${s.played}</td>
          <td>${s.won}</td>
          <td>${s.lost}</td>
          <td>${s.setsWon}-${s.setsLost} (${ratioSets})</td>
          <td>${s.pointsWon}-${s.pointsLost} (${ratioPoints})</td>
        </tr>
      `;
    });
    
    container.innerHTML = `
      <div class="glass-card">
        <h3 style="font-size: 1.25rem; margin-bottom: 1.25rem; color: var(--accent-gold);">Tabla de Posiciones - FIVB Voleibol</h3>
        <div class="table-wrapper">
          <table class="posiciones-table">
            <thead>
              <tr>
                <th style="width: 50px;">Pos</th>
                <th>Equipo</th>
                <th>Pts</th>
                <th>PJ</th>
                <th>PG</th>
                <th>PP</th>
                <th>Sets (Cociente)</th>
                <th>Puntos Set (Cociente)</th>
              </tr>
            </thead>
            <tbody>
              ${tbodyHTML}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else {
    const tourMatches = data.matches.filter(m => m.tournamentId === activeTour.id);
    
    const roundsMap = {};
    tourMatches.forEach(m => {
      if (!roundsMap[m.round]) roundsMap[m.round] = [];
      roundsMap[m.round].push(m);
    });
    
    const sortedRounds = Object.keys(roundsMap).sort((a,b) => a-b);
    let roundsHTML = '';
    
    sortedRounds.forEach(r => {
      let matchesHTML = '';
      const roundName = roundsMap[r][0].roundName || `Ronda ${r}`;
      
      roundsMap[r].forEach(m => {
        if (m.teamAId === null && m.teamBId === null && m.completed && m.winnerId === null) {
          return;
        }
        
        const teamA = data.teams.find(t => t.id === m.teamAId) || { name: 'Por definir', color: '#6b7e71', id: null };
        const teamB = data.teams.find(t => t.id === m.teamBId) || { name: 'Por definir', color: '#6b7e71', id: null };
        
        const setsScoreA = m.completed && m.sets.length > 0 ? m.sets.filter(s => s.teamA > s.teamB).length : '';
        const setsScoreB = m.completed && m.sets.length > 0 ? m.sets.filter(s => s.teamB > s.teamA).length : '';
        
        matchesHTML += `
          <div class="bracket-match-node ${m.completed ? 'completed' : ''}">
            <div class="bracket-team ${m.completed && m.winnerId === teamA.id ? 'winner' : ''}">
              <span style="display: flex; align-items: center; gap: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px;">
                ${teamA.id !== null ? `<span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${teamA.color}; display: inline-block;"></span>` : ''}
                ${teamA.name}
              </span>
              <span class="bracket-team-score">${setsScoreA}</span>
            </div>
            <div class="bracket-team ${m.completed && m.winnerId === teamB.id ? 'winner' : ''}">
              <span style="display: flex; align-items: center; gap: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px;">
                ${teamB.id !== null ? `<span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${teamB.color}; display: inline-block;"></span>` : ''}
                ${teamB.name}
              </span>
              <span class="bracket-team-score">${setsScoreB}</span>
            </div>
          </div>
        `;
      });
      
      roundsHTML += `
        <div class="bracket-round">
          <div class="bracket-round-title">${roundName}</div>
          ${matchesHTML}
        </div>
      `;
    });
    
    container.innerHTML = `
      <div class="glass-card">
        <h3 style="font-size: 1.25rem; margin-bottom: 1.5rem; text-align: center; color: var(--accent-gold);">Diagrama de Eliminatoria Directa</h3>
        <div class="bracket-wrapper">
          <div class="bracket-container">
            ${roundsHTML}
          </div>
        </div>
      </div>
    `;
  }
}

function calculateStandings(tournamentId) {
  const tournament = data.tournaments.find(t => t.id === tournamentId);
  if (!tournament) return [];
  
  const tourMatches = data.matches.filter(m => m.tournamentId === tournamentId && m.completed);
  
  const standingsMap = {};
  tournament.teams.forEach(teamId => {
    const team = data.teams.find(t => t.id === teamId);
    if (team) {
      standingsMap[teamId] = {
        teamId: teamId,
        name: team.name,
        color: team.color,
        played: 0,
        won: 0,
        lost: 0,
        pts: 0,
        setsWon: 0,
        setsLost: 0,
        pointsWon: 0,
        pointsLost: 0
      };
    }
  });
  
  tourMatches.forEach(m => {
    const sMapA = standingsMap[m.teamAId];
    const sMapB = standingsMap[m.teamBId];
    
    if (sMapA && sMapB) {
      sMapA.played++;
      sMapB.played++;
      
      let setsWonA = 0;
      let setsWonB = 0;
      
      m.sets.forEach(set => {
        if (set.teamA > set.teamB) {
          setsWonA++;
        } else {
          setsWonB++;
        }
        
        sMapA.pointsWon += set.teamA;
        sMapA.pointsLost += set.teamB;
        sMapB.pointsWon += set.teamB;
        sMapB.pointsLost += set.teamA;
      });
      
      sMapA.setsWon += setsWonA;
      sMapA.setsLost += setsWonB;
      sMapB.setsWon += setsWonB;
      sMapB.setsLost += setsWonA;
      
      // Adaptado FIVB a 3 sets
      if (setsWonA > setsWonB) {
        sMapA.won++;
        sMapB.lost++;
        
        if (setsWonA === 2 && setsWonB === 0) {
          sMapA.pts += 3;
          sMapB.pts += 0;
        } else {
          sMapA.pts += 2;
          sMapB.pts += 1;
        }
      } else {
        sMapB.won++;
        sMapA.lost++;
        
        if (setsWonB === 2 && setsWonA === 0) {
          sMapB.pts += 3;
          sMapA.pts += 0;
        } else {
          sMapB.pts += 2;
          sMapA.pts += 1;
        }
      }
    }
  });
  
  return Object.values(standingsMap).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.won !== a.won) return b.won - a.won;
    
    const ratioA_sets = a.setsLost === 0 ? a.setsWon : a.setsWon / a.setsLost;
    const ratioB_sets = b.setsLost === 0 ? b.setsWon : b.setsWon / b.setsLost;
    if (ratioB_sets !== ratioA_sets) return ratioB_sets - ratioA_sets;
    
    const ratioA_pts = a.pointsLost === 0 ? a.pointsWon : a.pointsWon / a.pointsLost;
    const ratioB_pts = b.pointsLost === 0 ? b.pointsWon : b.pointsWon / b.pointsLost;
    return ratioB_pts - ratioA_pts;
  });
}