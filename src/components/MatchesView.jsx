function MatchesView({ matches, onDeleteMatch }) {
  const orderedMatches = [...matches].sort((a, b) => {
    const weekDiff = Number(b.week) - Number(a.week);
    if (weekDiff !== 0) return weekDiff;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Historial</p>
          <h2>Resultados Registrados</h2>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="responsive-table results-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Semana</th>
              <th>Fecha</th>
              <th>Mesa</th>
              <th>Jugadores</th>
              <th>Jugador</th>
              <th>Posición</th>
              <th>Puntos</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {orderedMatches.map((match) => (
              <tr key={match.id}>
                <td data-label="#">{match.matchNumber || match.id}</td>
                <td data-label="Semana">{match.week}</td>
                <td data-label="Fecha">{match.date}</td>
                <td data-label="Mesa">{match.table}</td>
                <td data-label="Jugadores">{match.playerCount ?? '—'}</td>
                <td data-label="Jugador" className="result-player">{match.player}</td>
                <td data-label="Posición">{match.position}º</td>
                <td data-label="Puntos">{match.points}</td>
                <td data-label="Acción" className="result-action">
                  <button type="button" className="danger-button" onClick={() => onDeleteMatch(match.id)}>
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default MatchesView;
