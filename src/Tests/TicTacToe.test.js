import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TicTacToe from '@/app/components/TicTacToe';

function clickCell(i) {
  fireEvent.click(screen.getAllByRole('button')[i + 1]);
  // +1 because the first button is the close (×) button
}

describe('TicTacToe component', () => {
  test("renders title and close button", () => {
    const onClose = jest.fn();
    render(<TicTacToe onClose={onClose} />);
    expect(screen.getByText('Tic Tac Toe')).toBeInTheDocument();
    const closeBtn = screen.getByTitle('Close');
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  test('allows You to play X then O alternates to Friend', () => {
    render(<TicTacToe onClose={() => {}} />);
    expect(screen.getByText(/You's turn \(X\)/i)).toBeInTheDocument();

    clickCell(0);
    clickCell(4); // should be blocked because now it's Friend's turn and Friend !== 'You'

    // Only first cell should be X; second click should be ignored
    const cells = screen.getAllByRole('button').slice(1, 10);
    expect(cells[0]).toHaveTextContent('X');
    expect(cells[4]).toHaveTextContent('');
  });

  test('declares a winner when 3 in a row', () => {
    // Allow both X and O turns by making both players "You"
    render(<TicTacToe playerX="You" playerO="You" onClose={() => {}} />);

    clickCell(0); // X
    clickCell(3); // O

    clickCell(1); // X
    clickCell(4); // O

    clickCell(2); // X wins top row

    expect(screen.getByText(/You wins!/i)).toBeInTheDocument();

    // All cells should now be disabled
    const cells = screen.getAllByRole('button').slice(1, 10);
    cells.forEach(btn => expect(btn).toBeDisabled());
  });

  test('reset button clears the board and turn', () => {
    render(<TicTacToe onClose={() => {}} />);
    clickCell(0); // X
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    const cells = screen.getAllByRole('button').slice(1, 10);
    cells.forEach(btn => expect(btn).toHaveTextContent(''));
    expect(screen.getByText(/You's turn \(X\)/i)).toBeInTheDocument();
  });

  test('when playerX is not You, first click is blocked', () => {
    render(<TicTacToe playerX="Alice" playerO="You" onClose={() => {}} />);

    // It's Alice's turn (X), but current player is not 'You', so clicking should do nothing
    clickCell(0);
    const cells = screen.getAllByRole('button').slice(1, 10);
    expect(cells[0]).toHaveTextContent('');

    // The message should indicate Alice's turn as X
    expect(screen.getByText(/Alice's turn \(X\)/i)).toBeInTheDocument();
  });
});
