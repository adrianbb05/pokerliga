import { act, fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';
import { fetchResource, updateResource } from './services/api';
import { checkSession, login, logout } from './services/auth';

jest.mock('./services/api', () => ({
  clearLocalCache: jest.fn(),
  isLocalMode: () => false,
  fetchResource: jest.fn(),
  updateResource: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./services/auth', () => ({
  checkSession: jest.fn(), login: jest.fn(), logout: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  checkSession.mockResolvedValue({ authenticated: true });
  login.mockResolvedValue({ authenticated: true });
  logout.mockResolvedValue({ authenticated: false });
  updateResource.mockResolvedValue(undefined);
  fetchResource.mockImplementation(async (resource) => ({
    players: Array.from({ length: 12 }, (_, index) => ({ id: `p-${index}`, name: `Jugador ${index + 1}` })),
    matches: [{ id: 'old', week: 1, date: '2026-10-06', table: 'A', player: 'Jugador 2', position: 1, points: 10 }],
    settings: { currentWeek: 1 },
  }[resource]));
});

test('shows load failures and prevents editing unloaded data', async () => {
  fetchResource.mockRejectedValue(new Error('JSONBin HTTP 401'));
  render(<App />);
  expect(await screen.findByRole('alert')).toHaveTextContent('JSONBin HTTP 401');
  expect(screen.queryByRole('button', { name: 'Registro de Partidas' })).not.toBeInTheDocument();
  expect(updateResource).not.toHaveBeenCalled();
});

test('shows failed saves without adding a result or updating settings', async () => {
  updateResource.mockRejectedValue(new Error('JSONBin HTTP 403'));
  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: 'Registro de Partidas' }));
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Añadir resultado' }));
  });
  expect(screen.getByRole('alert')).toHaveTextContent('JSONBin HTTP 403');
  expect(screen.getByText('1 partidas')).toBeInTheDocument();
  expect(updateResource).toHaveBeenCalledTimes(1);
});

test('saves an adjustable player count and displays it alongside historical results', async () => {
  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: 'Registro de Partidas' }));
  const count = screen.getByLabelText('Número de jugadores');
  const position = screen.getByLabelText('Posición');
  expect(count).toHaveValue('6');
  fireEvent.change(count, { target: { value: '8' } });
  expect(within(position).getAllByRole('option')).toHaveLength(8);
  fireEvent.change(position, { target: { value: '8' } });
  expect(screen.getByText('0 pts')).toBeInTheDocument();
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Añadir resultado' }));
  });
  expect(updateResource).toHaveBeenCalledWith('matches', { matches: expect.arrayContaining([
    expect.objectContaining({ playerCount: 8, position: 8, points: 0 }),
  ]) });
  const resultRow = screen.getByRole('cell', { name: '8º' }).closest('tr');
  expect(within(resultRow).getByText('8')).toBeInTheDocument();
  expect(screen.getByText('—')).toBeInTheDocument();
});

test('reducing the player count clamps the position and recalculates the saved score', async () => {
  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: 'Registro de Partidas' }));
  fireEvent.change(screen.getByLabelText('Posición'), { target: { value: '6' } });
  fireEvent.change(screen.getByLabelText('Número de jugadores'), { target: { value: '3' } });
  expect(screen.getByLabelText('Posición')).toHaveValue('3');
  expect(within(screen.getByLabelText('Posición')).getAllByRole('option')).toHaveLength(3);
  expect(screen.getByText('5 pts')).toBeInTheDocument();
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Añadir resultado' }));
  });
  expect(updateResource).toHaveBeenCalledWith('matches', { matches: expect.arrayContaining([
    expect.objectContaining({ playerCount: 3, position: 3, points: 5 }),
  ]) });
});


test('waits for a session and loads no league data until login succeeds', async () => {
  checkSession.mockResolvedValue({ authenticated: false });
  render(<App />);
  expect(await screen.findByLabelText('Contraseña')).toBeInTheDocument();
  expect(fetchResource).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'private-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  expect(await screen.findByRole('button', { name: 'Registro de Partidas' })).toBeInTheDocument();
  expect(login).toHaveBeenCalledWith('private-password');
});

test('wrong passwords keep the league hidden and show the error', async () => {
  checkSession.mockResolvedValue({ authenticated: false });
  login.mockRejectedValue(new Error('Contraseña incorrecta.'));
  render(<App />);
  fireEvent.change(await screen.findByLabelText('Contraseña'), { target: { value: 'wrong' } });
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Contraseña incorrecta.');
  expect(screen.getByLabelText('Contraseña')).toHaveValue('');
  expect(fetchResource).not.toHaveBeenCalled();
});

test('logout hides league data and returns to the password screen', async () => {
  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));
  expect(await screen.findByLabelText('Contraseña')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Registro de Partidas' })).not.toBeInTheDocument();
  expect(logout).toHaveBeenCalledTimes(1);
});

test('an expired session immediately hides league data', async () => {
  render(<App />);
  await screen.findByRole('button', { name: 'Registro de Partidas' });
  act(() => window.dispatchEvent(new Event('pokerliga:unauthorized')));
  expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent('La sesión ha caducado');
  expect(screen.queryByRole('button', { name: 'Registro de Partidas' })).not.toBeInTheDocument();
});
