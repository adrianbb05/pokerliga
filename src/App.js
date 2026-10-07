import { useEffect, useRef, useState } from 'react';
import './App.css';
import MatchForm from './components/MatchForm';
import MatchesView from './components/MatchesView';
import Navbar from './components/Navbar';
import StandingsView from './components/StandingsView';
import StatsView from './components/StatsView';
import WeeklyView from './components/WeeklyView';
import { fetchResource, updateResource } from './services/api';

const DEFAULT_SETTINGS = {
  pointsSystem: { 1: 10, 2: 7, 3: 5, 4: 3, 5: 2, 6: 1 },
  currentWeek: 1,
};

const tabs = [
  { id: 'standings', label: 'Clasificación General' },
  { id: 'players', label: 'Jugadores' },
  { id: 'register', label: 'Registro de Partidas' },
  { id: 'weekly', label: 'Resumen Semanal' },
  { id: 'stats', label: 'Estadísticas' },
];

function App() {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState('standings');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const hasHydratedRef = useRef({
    players: false,
    matches: false,
    settings: false,
  });

  useEffect(() => {
    let isMounted = true;

    const loadResources = async () => {
      try {
        const [playersResponse, matchesResponse, settingsResponse] = await Promise.all([
          fetchResource('players'),
          fetchResource('matches'),
          fetchResource('settings'),
        ]);

        if (!isMounted) {
          return;
        }

        const nextPlayers = playersResponse?.players ?? playersResponse ?? [];
        const nextMatches = matchesResponse?.matches ?? matchesResponse ?? [];
        const nextSettings = {
          ...DEFAULT_SETTINGS,
          ...(settingsResponse ?? {}),
          pointsSystem: {
            ...DEFAULT_SETTINGS.pointsSystem,
            ...((settingsResponse && settingsResponse.pointsSystem) || {}),
          },
        };

        setPlayers(nextPlayers);
        setMatches(nextMatches);
        setSettings(nextSettings);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError.message || 'No se pudieron cargar los datos.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadResources();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!hasHydratedRef.current.players) {
      hasHydratedRef.current.players = true;
      return;
    }

    updateResource('players', { players });
  }, [players, loading]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!hasHydratedRef.current.matches) {
      hasHydratedRef.current.matches = true;
      return;
    }

    updateResource('matches', { matches });
  }, [matches, loading]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!hasHydratedRef.current.settings) {
      hasHydratedRef.current.settings = true;
      return;
    }

    updateResource('settings', settings);
  }, [settings, loading]);

  const handleAddPlayer = (event) => {
    event.preventDefault();
    const trimmedName = newPlayerName.trim();
    if (!trimmedName) {
      return;
    }

    const normalizedName = trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1);
    const isDuplicate = players.some((player) => player.name.toLowerCase() === normalizedName.toLowerCase());
    if (isDuplicate) {
      setError('Ese jugador ya existe.');
      return;
    }

    const nextPlayers = [
      ...players,
      {
        id: `p-${Date.now()}`,
        name: normalizedName,
      },
    ];

    setPlayers(nextPlayers);
    setNewPlayerName('');
    setError('');
  };

  const handleDeletePlayer = (playerId) => {
    const deletedPlayer = players.find((player) => player.id === playerId);
    if (!deletedPlayer) {
      return;
    }

    const nextPlayers = players.filter((player) => player.id !== playerId);
    setPlayers(nextPlayers);

    const nextMatches = matches.filter((match) => match.player !== deletedPlayer.name);
    setMatches(nextMatches);
  };

  const handleAddMatch = (newMatch) => {
    const nextMatch = {
      id: newMatch.id || `m-${Date.now()}`,
      matchNumber: matches.length + 1,
      ...newMatch,
    };

    const nextMatches = [nextMatch, ...matches];
    setMatches(nextMatches);

    const nextSettings = {
      ...settings,
      currentWeek: Math.max(Number(settings.currentWeek || 1), Number(newMatch.week || 1)),
    };

    setSettings(nextSettings);
  };

  const handleDeleteMatch = (matchId) => {
    const nextMatches = matches.filter((match) => match.id !== matchId);
    setMatches(nextMatches);
  };

  const renderContent = () => {
    const playersPanel = (
      <section className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Plantilla</p>
            <h2>Gestionar Jugadores</h2>
          </div>
        </div>

        <form className="match-form" onSubmit={handleAddPlayer}>
          <div className="field" style={{ gridColumn: 'span 2' }}>
            <label htmlFor="new-player-name">Nombre del jugador</label>
            <input
              id="new-player-name"
              type="text"
              value={newPlayerName}
              onChange={(event) => setNewPlayerName(event.target.value)}
              placeholder="Ej. Ana"
            />
          </div>

          <button type="submit" className="primary-button">
            Añadir jugador
          </button>
        </form>

        <div className="table-wrapper" style={{ marginTop: '20px' }}>
          <table>
            <thead>
              <tr>
                <th>Jugador</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id}>
                  <td>{player.name}</td>
                  <td>
                    <button type="button" className="danger-button" onClick={() => handleDeletePlayer(player.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );

    switch (activeTab) {
      case 'standings':
        return <StandingsView players={players} matches={matches} />;
      case 'players':
        return playersPanel;
      case 'register':
        return (
          <>
            <MatchForm players={players} settings={settings} onAddMatch={handleAddMatch} />
            <MatchesView matches={matches} onDeleteMatch={handleDeleteMatch} />
          </>
        );
      case 'weekly':
        return <WeeklyView matches={matches} />;
      case 'stats':
        return <StatsView players={players} matches={matches} />;
      default:
        return <StandingsView players={players} matches={matches} />;
    }
  };

  if (loading) {
    return (
      <div className="app-shell">
        <div className="status-panel load-state">Cargando liga…</div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Liga de Amigos</p>
          <h1>PokerLiga</h1>
        </div>

        <div className="topbar-summary">
          <span className="summary-pill">{players.length} jugadores</span>
          <span className="summary-pill">{matches.length} partidas</span>
          <span className="summary-pill">Semana {settings.currentWeek || 1}</span>
        </div>
      </header>

      {error ? <div className="status-panel error-banner">{error}</div> : null}

      <Navbar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {renderContent()}
    </div>
  );
}

export default App;
