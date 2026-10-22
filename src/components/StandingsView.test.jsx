import { render, screen, within } from '@testing-library/react';
import StandingsView from './StandingsView';

const players = Array.from({ length: 12 }, (_, index) => ({ id: `p-${index}`, name: `Jugador ${index + 1}` }));
const matches = [
  { player: 'Jugador 3', position: 3, points: 5 },
  { player: 'Jugador 1', position: 1, points: 10 },
  { player: 'Jugador 2', position: 2, points: 7 },
];

test('splits a 120 euro pot into 71.50, 38.50 and 10 euros and shows net balances', () => {
  render(<StandingsView players={players} matches={matches} />);
  const first = screen.getByRole('article', { name: 'Premio del 1º puesto' });
  expect(within(first).getByRole('heading')).toHaveTextContent('Jugador 1');
  expect(within(first).getByText('71,50 €')).toBeInTheDocument();
  expect(within(first).getByText('+61,50 € netos')).toBeInTheDocument();
  const second = screen.getByRole('article', { name: 'Premio del 2º puesto' });
  expect(within(second).getByText('38,50 €')).toBeInTheDocument();
  expect(within(second).getByText('+28,50 € netos')).toBeInTheDocument();
  const third = screen.getByRole('article', { name: 'Premio del 3º puesto' });
  expect(within(third).getByText('10 €')).toBeInTheDocument();
  expect(within(third).getByText('0 € netos')).toBeInTheDocument();
  const loser = screen.getByRole('cell', { name: 'Jugador 4' }).closest('tr');
  expect(within(loser).getByText('0 €')).toBeInTheDocument();
  expect(within(loser).getByText('−10 €')).toBeInTheDocument();
  expect(screen.getByRole('img')).toHaveAccessibleName(/primero 71,50.*segundo 38,50.*tercero 10/);
});

test('recalculates when the roster changes without returning the entry twice', () => {
  const { rerender } = render(<StandingsView players={players} matches={matches} />);
  rerender(<StandingsView players={players.slice(0, 4)} matches={matches} />);
  expect(within(screen.getByRole('article', { name: 'Premio del 1º puesto' })).getByText('19,50 €')).toBeInTheDocument();
  const second = screen.getByRole('article', { name: 'Premio del 2º puesto' });
  expect(within(second).getByText('10,50 €')).toBeInTheDocument();
  expect(within(second).getByText('+0,50 € netos')).toBeInTheDocument();
  expect(within(screen.getByRole('article', { name: 'Premio del 3º puesto' })).getByText('10 €')).toBeInTheDocument();
});

test('does not arbitrarily award tied players a prize', () => {
  render(<StandingsView players={players} matches={[]} />);
  expect(screen.getAllByRole('heading', { name: 'Por decidir' })).toHaveLength(3);
  expect(screen.getAllByRole('cell', { name: 'Pendiente' })).toHaveLength(12);
  expect(screen.getByText(/empates pendientes/)).toBeInTheDocument();
});

test.each([0, 1, 2, 3])('waits for at least four players so second place cannot lose money (%s)', (count) => {
  render(<StandingsView players={players.slice(0, count)} matches={[]} />);
  expect(screen.getByText('Se necesitan al menos 4 jugadores para que el segundo reciba más de 10 €.')).toBeInTheDocument();
  expect(screen.getAllByText('Reparto pendiente')).toHaveLength(3);
});
