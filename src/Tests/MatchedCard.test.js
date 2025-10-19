import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MatchedCard from '@/app/pages/matchmaking/components/MatchedCard';

const ChatIcon = () => <span data-testid="chat-icon" />;
const UserIcon = () => <span data-testid="user-icon" />;

function setup(overrides = {}) {
  const props = {
    match: overrides.match || {
      username: 'user123',
      avatar: '/a.png',
      name: 'Test Name',
      email: 't@e.com',
      language: 'English',
      timezone: 'UTC+2',
      intro: 'Hello!',
      ageMin: 20,
      ageMax: 30,
      hobbies: ['Reading', 'Music'],
    },
    chatType: overrides.chatType || '',
    setChatType: jest.fn(),
    handleProceedToChat: jest.fn(),
    proceeding: overrides.proceeding || false,
    proceeded: overrides.proceeded || false,
    ChatIcon,
    UserIcon,
  };
  const utils = render(<MatchedCard {...props} />);
  return { props, ...utils };
}

describe('MatchedCard', () => {
  test('renders full details and allows choosing chat type', () => {
    const { props } = setup();

    expect(screen.getByText(/Matched User/)).toBeInTheDocument();
    expect(screen.getByAltText('avatar')).toBeInTheDocument();
    expect(screen.getByText(/Username:/)).toBeInTheDocument();
    expect(screen.getByText(/Name:/)).toBeInTheDocument();
    expect(screen.getByText(/Email:/)).toBeInTheDocument();
    expect(screen.getByText(/Language:/)).toBeInTheDocument();
    expect(screen.getByText(/Timezone:/)).toBeInTheDocument();
    expect(screen.getByText(/borderLight:/)).toBeInTheDocument();
    expect(screen.getByText(/Age Range:/)).toBeInTheDocument();
    expect(screen.getByText(/Hobbies:/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /One Time Chat/i }));
    expect(props.setChatType).toHaveBeenCalledWith('one-time');

    fireEvent.click(screen.getByRole('button', { name: /Long Term Chat/i }));
    expect(props.setChatType).toHaveBeenCalledWith('long-term');
  });

  test('when chatType selected, proceed button states change based on flags', () => {
    const { props, rerender } = setup({ chatType: 'one-time' });

    // Render shows Selected: One Time Chat
    expect(screen.getByText(/Selected: One Time Chat/)).toBeInTheDocument();

    // Default (not proceeding/proceeded): clicking calls handler
    fireEvent.click(screen.getByRole('button', { name: /Proceed to chat/i }));
    expect(props.handleProceedToChat).toHaveBeenCalled();

    // proceeding state
    rerender(
      <MatchedCard {...props} chatType="one-time" proceeding={true} />
    );
    expect(screen.getByText(/Processing.../)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Processing.../ })).toBeDisabled();

    // proceeded state
    rerender(
      <MatchedCard {...props} chatType="one-time" proceeding={false} proceeded={true} />
    );
    expect(screen.getByText(/Match Created!/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Match Created!/ })).toBeDisabled();
  });

  test('renders fallback JSON when no display fields', () => {
    setup({ match: {} });
    expect(() => screen.getByText(/Matched User/)).not.toThrow();
    expect(screen.getByText('{}')).toBeInTheDocument();
  });
});
