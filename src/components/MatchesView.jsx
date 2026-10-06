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
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Semana</th>
              <th>Fecha</th>
              <th>Mesa</th>
              <th>Jugador</th>
              <th>Posición</th>
              <th>Puntos</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {orderedMatches.map((match) => (
              <tr key={match.id}>
                <td>{match.matchNumber || match.id}</td>
                <td>{match.week}</td>
                <td>{match.date}</td>
                <td>{match.table}</td>
                <td>{match.player}</td>
                <td>{match.position}º</td>
                <td>{match.points}</td>
                <td>
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
