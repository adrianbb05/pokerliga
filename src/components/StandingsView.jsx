const ENTRY_CENTS = 1000;
const formatMoney = (cents) => new Intl.NumberFormat('es-ES', {
  style: 'currency', currency: 'EUR', maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
}).format(cents / 100);
const formatBalance = (cents) => `${cents > 0 ? '+' : cents < 0 ? '−' : ''}${formatMoney(Math.abs(cents))}`;
const sameStanding = (a, b) => a && b && a.points === b.points && a.wins === b.wins && a.podiums === b.podiums;

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

  const pot = players.length * ENTRY_CENTS;
  const canDistribute = players.length >= 3;
  const remaining = canDistribute ? pot - ENTRY_CENTS : 0;
  const firstPrize = Math.round(remaining * 0.8);
  const prizes = canDistribute ? [firstPrize, remaining - firstPrize, ENTRY_CENTS] : [0, 0, 0];
  const tiedAt = (index) => sameStanding(standings[index], standings[index - 1]) || sameStanding(standings[index], standings[index + 1]);
  const hasPrizeTie = standings.slice(0, 3).some((_, index) => tiedAt(index));
  const goldEnd = canDistribute ? prizes[0] / pot * 100 : 0;
  const silverEnd = canDistribute ? (prizes[0] + prizes[1]) / pot * 100 : 0;
  const prizeLabels = ['80 % del restante', '20 % del restante', 'Recupera su entrada'];
  const prizeColors = ['gold', 'silver', 'bronze'];

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Liga</p>
          <h2>Clasificación General</h2>
        </div>
      </div>

      <div className="league-pot" aria-labelledby="league-pot-title">
        <div className="pot-overview">
          <div className="pot-summary">
            <span className="pot-status">Proyección al cierre</span>
            <h3 id="league-pot-title">El bote de la liga</h3>
            <p className="pot-total">{formatMoney(pot)}</p>
            <p className="pot-subtitle">{players.length} jugadores · {formatMoney(ENTRY_CENTS)} de entrada por persona</p>
            <p className="pot-rule">El tercero recupera sus 10 €. Los dos primeros se reparten el resto.</p>
          </div>
          <div className="pot-chart-wrapper">
            <div
              className="pot-chart"
              role="img"
              aria-label={canDistribute
                ? `Reparto del bote: primero ${formatMoney(prizes[0])}, segundo ${formatMoney(prizes[1])}, tercero ${formatMoney(prizes[2])}.`
                : 'Reparto pendiente: se necesitan al menos 3 jugadores.'}
              style={{ background: canDistribute
                ? `conic-gradient(from -90deg, #fbbf24 0% ${goldEnd}%, #a5b4fc ${goldEnd}% ${silverEnd}%, #d9956b ${silverEnd}% 100%)`
                : 'rgba(148, 163, 184, 0.15)' }}
            >
              <div className="pot-chart-center"><span>Bote total</span><strong>{formatMoney(pot)}</strong></div>
            </div>
          </div>
        </div>

        <div className="prize-grid">
          {prizes.map((prize, index) => {
            const player = standings[index];
            const decided = canDistribute && player && !tiedAt(index);
            const balance = prize - ENTRY_CENTS;
            return (
              <article className={`prize-card prize-${prizeColors[index]}`} key={index} aria-label={`Premio del ${index + 1}º puesto`}>
                <div className="prize-card-header">
                  <span className="prize-rank">{index + 1}º</span>
                  <span className="prize-share">{prizeLabels[index]}</span>
                </div>
                <h4>{decided ? player.name : 'Por decidir'}</h4>
                <p className="prize-amount">{canDistribute ? formatMoney(prize) : '—'}</p>
                <p className="prize-net">{canDistribute ? `${formatBalance(balance)} netos` : 'Reparto pendiente'}</p>
              </article>
            );
          })}
        </div>
        <p className="pot-note">
          {!canDistribute ? 'Se necesitan al menos 3 jugadores para repartir el bote.'
            : <>De los {formatMoney(pot)}, se reservan {formatMoney(ENTRY_CENTS)} para el tercero y se reparten {formatMoney(remaining)} al 80/20. El neto descuenta los 10 € de entrada.{hasPrizeTie ? ' Hay empates pendientes de resolver en los puestos con premio.' : ' Premios orientativos según la clasificación actual.'}</>}
        </p>
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
              <th>Premio previsto</th>
              <th>Balance neto</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((player, index) => {
              const prize = prizes[index] ?? 0;
              // Do not assign a prize to a player until their tied place is resolved.
              const prizePending = !canDistribute || (tiedAt(index) && (index < 3 || sameStanding(player, standings[2])));
              const balance = prize - ENTRY_CENTS;
              return (
              <tr key={player.id} className={index < 3 && !prizePending ? `standing-${prizeColors[index]}` : undefined}>
                <td><span className={`standing-rank ${index < 3 && !prizePending ? `rank-${prizeColors[index]}` : ''}`}>{index + 1}</span></td>
                <td>{player.name}</td>
                <td>{player.points}</td>
                <td>{player.matches}</td>
                <td>{player.wins}</td>
                <td>{player.podiums}</td>
                <td>{player.average.toFixed(1)}</td>
                <td className="standing-prize">{prizePending ? <span className="prize-pending">Pendiente</span> : formatMoney(prize)}</td>
                <td className={prizePending ? 'prize-pending' : balance > 0 ? 'balance-positive' : balance < 0 ? 'balance-negative' : 'balance-even'}>
                  {prizePending ? '—' : formatBalance(balance)}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default StandingsView;
