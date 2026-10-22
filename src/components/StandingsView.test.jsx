import { render, screen, within } from '@testing-library/react';
import StandingsView from './StandingsView';

const players = Array.from({ length: 12 }, (_, index) => ({ id: `p-${index}`, name: `Jugador ${index + 1}` }));
const matches = [
  { player: 'Jugador 3', position: 3, points: 5 },
  { player: 'Jugador 1', position: 1, points: 10 },
  { player: 'Jugador 2', position: 2, points: 7 },
];

test('splits a 120 euro pot into 88, 22 and 10 euros and shows net balances', () => {
  render(<StandingsView players={players} matches={matches} />);
  const first = screen.getByRole('article', { name: 'Premio del 1º puesto' });
  expect(within(first).getByRole('heading')).toHaveTextContent('Jugador 1');
  expect(within(first).getByText('88 €')).toBeInTheDocument();
  expect(within(first).getByText('+78 € netos')).toBeInTheDocument();
  const second = screen.getByRole('article', { name: 'Premio del 2º puesto' });
  expect(within(second).getByText('22 €')).toBeInTheDocument();
  expect(within(second).getByText('+12 € netos')).toBeInTheDocument();
  const third = screen.getByRole('article', { name: 'Premio del 3º puesto' });
  expect(within(third).getByText('10 €')).toBeInTheDocument();
  expect(within(third).getByText('0 € netos')).toBeInTheDocument();
  const loser = screen.getByRole('cell', { name: 'Jugador 4' }).closest('tr');
  expect(within(loser).getByText('0 €')).toBeInTheDocument();
  expect(within(loser).getByText('−10 €')).toBeInTheDocument();
  expect(screen.getByRole('img')).toHaveAccessibleName(/primero 88.*segundo 22.*tercero 10/);
});

test('recalculates when the roster changes without returning the entry twice', () => {
  const { rerender } = render(<StandingsView players={players} matches={matches} />);
  rerender(<StandingsView players={players.slice(0, 3)} matches={matches} />);
  expect(within(screen.getByRole('article', { name: 'Premio del 1º puesto' })).getByText('16 €')).toBeInTheDocument();
  const second = screen.getByRole('article', { name: 'Premio del 2º puesto' });
  expect(within(second).getByText('4 €')).toBeInTheDocument();
  expect(within(second).getByText('−6 € netos')).toBeInTheDocument();
  expect(within(screen.getByRole('article', { name: 'Premio del 3º puesto' })).getByText('10 €')).toBeInTheDocument();
});

test('does not arbitrarily award tied players a prize', () => {
  render(<StandingsView players={players} matches={[]} />);
  expect(screen.getAllByRole('heading', { name: 'Por decidir' })).toHaveLength(3);
  expect(screen.getAllByRole('cell', { name: 'Pendiente' })).toHaveLength(12);
  expect(screen.getByText(/empates pendientes/)).toBeInTheDocument();
});

test.each([0, 1, 2])('waits for at least three players instead of distributing an incomplete pot (%s)', (count) => {
  render(<StandingsView players={players.slice(0, count)} matches={[]} />);
  expect(screen.getByText('Se necesitan al menos 3 jugadores para repartir el bote.')).toBeInTheDocument();
  expect(screen.getAllByText('Reparto pendiente')).toHaveLength(3);
});
