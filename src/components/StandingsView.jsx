function StandingsView({ players, matches }) {
  const standings = players
    .map((player) => {
      const playerMatches = matches.filter((match) => match.player === player.name);
      const totalPoints = playerMatches.reduce((sum, match) => sum + Number(match.points || 0), 0);
      const victories = playerMatches.filter((match) => Number(match.position) === 1).length;
      const podiums = playerMatches.filter((match) => Number(match.position) <= 3).length;
      const average = playerMatches.length ? totalPoints / playerMatches.length : 0;

      return {
        ...player,
        matches: playerMatches.length,
        points: totalPoints,
        wins: victories,
        podiums,
        average,
      };
    })
    .sort((a, b) => b.points - a.points || b.wins - a.wins || b.podiums - a.podiums);

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Liga</p>
          <h2>Clasificación General</h2>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Jugador</th>
              <th>Puntos</th>
              <th>Partidas</th>
              <th>Victorias</th>
              <th>Podios</th>
              <th>Media</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((player, index) => (
              <tr key={player.id}>
                <td>{index + 1}</td>
                <td>{player.name}</td>
                <td>{player.points}</td>
                <td>{player.matches}</td>
                <td>{player.wins}</td>
                <td>{player.podiums}</td>
                <td>{player.average.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default StandingsView;
