function StatsView({ players, matches }) {
  const standings = players
    .map((player) => {
      const playerMatches = matches.filter((match) => match.player === player.name);
      const points = playerMatches.reduce((total, match) => total + Number(match.points || 0), 0);
      const wins = playerMatches.filter((match) => Number(match.position) === 1).length;
      const podiums = playerMatches.filter((match) => Number(match.position) <= 3).length;

      return {
        ...player,
        points,
        wins,
        podiums,
      };
    })
    .sort((a, b) => b.points - a.points || b.wins - a.wins || b.podiums - a.podiums);

  const topScorer = standings[0];
  const mostWins = [...standings].sort((a, b) => b.wins - a.wins)[0];
  const mostPodiums = [...standings].sort((a, b) => b.podiums - a.podiums)[0];
  const totalMatches = matches.length;
  const totalWeeks = new Set(matches.map((match) => match.week)).size;

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Records</p>
          <h2>Estadísticas</h2>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Máximo anotador</span>
          <strong>{topScorer ? `${topScorer.name} (${topScorer.points} pts)` : 'Sin datos'}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Más victorias</span>
          <strong>{mostWins ? `${mostWins.name} (${mostWins.wins})` : 'Sin datos'}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Más podios</span>
          <strong>{mostPodiums ? `${mostPodiums.name} (${mostPodiums.podiums})` : 'Sin datos'}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Partidas registradas</span>
          <strong>{totalMatches}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Semanas jugadas</span>
          <strong>{totalWeeks}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Jugadores activos</span>
          <strong>{players.length}</strong>
        </div>
      </div>
    </section>
  );
}

export default StatsView;
