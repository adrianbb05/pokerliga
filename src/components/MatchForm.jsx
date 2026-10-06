import { useEffect, useState } from 'react';

function MatchForm({ players, settings, onAddMatch }) {
  const [playerId, setPlayerId] = useState('');
  const [table, setTable] = useState('A');
  const [week, setWeek] = useState(settings?.currentWeek || 1);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [position, setPosition] = useState(1);

  useEffect(() => {
    if (players.length && !playerId) {
      setPlayerId(players[0].id);
    }
  }, [players, playerId]);

  useEffect(() => {
    setWeek(settings?.currentWeek || week);
  }, [settings, week]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!playerId) {
      return;
    }

    const selectedPlayer = players.find((player) => player.id === playerId);
    if (!selectedPlayer) {
      return;
    }

    const numericPosition = Number(position);
    const points = Number(settings?.pointsSystem?.[numericPosition] ?? 0);

    onAddMatch({
      week: Number(week),
      date,
      table,
      player: selectedPlayer.name,
      position: numericPosition,
      points,
    });
  };

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Resultados</p>
          <h2>Registrar Partida</h2>
        </div>
      </div>

      <form className="match-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="match-player">Jugador</label>
          <select id="match-player" value={playerId} onChange={(event) => setPlayerId(event.target.value)}>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="match-week">Semana</label>
          <input
            id="match-week"
            type="number"
            min="1"
            value={week}
            onChange={(event) => setWeek(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="match-date">Fecha</label>
          <input id="match-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="match-table">Mesa</label>
          <select id="match-table" value={table} onChange={(event) => setTable(event.target.value)}>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="match-position">Posición</label>
          <select id="match-position" value={position} onChange={(event) => setPosition(event.target.value)}>
            {[1, 2, 3, 4, 5, 6].map((value) => (
              <option key={value} value={value}>
                {value}º
              </option>
            ))}
          </select>
        </div>

        <div className="field points-preview">
          <label>Puntuación</label>
          <div className="score-pill">{settings?.pointsSystem?.[position] ?? 0} pts</div>
        </div>

        <button type="submit" className="primary-button">
          Añadir resultado
        </button>
      </form>
    </section>
  );
}

export default MatchForm;
