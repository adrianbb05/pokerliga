function WeeklyView({ matches }) {
  const weeklySummary = Object.entries(
    matches.reduce((groups, match) => {
      if (!groups[match.week]) {
        groups[match.week] = [];
      }

      groups[match.week].push(match);
      return groups;
    }, {})
  )
    .map(([week, weekMatches]) => {
      const byPlayer = weekMatches.reduce((acc, match) => {
        acc[match.player] = (acc[match.player] || 0) + Number(match.points || 0);
        return acc;
      }, {});

      const leaderboard = Object.entries(byPlayer)
        .map(([player, points]) => ({ player, points }))
        .sort((a, b) => b.points - a.points)
        .slice(0, 3);

      return {
        week: Number(week),
        leaderboard,
      };
    })
    .sort((a, b) => b.week - a.week);

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Resumen</p>
          <h2>Semanas</h2>
        </div>
      </div>

      <div className="weekly-grid">
        {weeklySummary.length ? (
          weeklySummary.map((week) => (
            <article key={week.week} className="weekly-card">
              <h3>Semana {week.week}</h3>
              <ul>
                {week.leaderboard.map((entry, index) => (
                  <li key={`${week.week}-${entry.player}`}>
                    <span>{index + 1}. {entry.player}</span>
                    <strong>{entry.points} pts</strong>
                  </li>
                ))}
              </ul>
            </article>
          ))
        ) : (
          <p className="empty-state">Todavía no hay resultados registrados en ninguna semana.</p>
        )}
      </div>
    </section>
  );
}

export default WeeklyView;
