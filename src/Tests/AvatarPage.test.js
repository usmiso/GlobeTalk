import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock Next.js app router hook so the component can render in tests
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn(), back: jest.fn() }),
}));

// Mock Firebase auth; we'll mutate currentUser in specific tests as needed
jest.mock('@/app/firebase/auth', () => ({
  auth: { currentUser: { uid: 'uid-1', email: 'e@e.com' } },
}));

import AvatarUsernameGen from '@/app/components/avatar/page';
import { auth } from '@/app/firebase/auth';

describe('AvatarUsernameGen (avatar/page.js)', () => {
  const origFetch = global.fetch;
  const origAlert = global.alert;

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
  });

  afterEach(() => {
    global.fetch = origFetch;
    global.alert = origAlert;
    // Reset auth user to default logged-in state
    auth.currentUser = { uid: 'uid-1', email: 'e@e.com' };
  });

  it('initially generates username and avatar via useEffect', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [{ login: { username: 'test_user' } }] }),
    });

    render(<AvatarUsernameGen />);

    // Username displayed after fetch
    await screen.findByText('test_user');

    // Avatar image should be present (generated via Math.random)
    const avatarImg = await screen.findByAltText('avatar');
    expect(avatarImg).toBeInTheDocument();
  });

  it('Generate Name button triggers another username fetch', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ results: [{ login: { username: 'first_user' } }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ results: [{ login: { username: 'second_user' } }] }) });

    render(<AvatarUsernameGen />);

    // First render result appears
    await screen.findByText('first_user');

    // Click Generate Name
    fireEvent.click(screen.getByRole('button', { name: /Generate Name/i }));

    // Expect second username to appear
    await screen.findByText('second_user');
  });

  it('Save New Avatar posts to API when logged in and calls onSuccess', async () => {
    // First call (useEffect username) and then Save POST
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ results: [{ login: { username: 'save_user' } }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) });

    const onSuccess = jest.fn();
    render(<AvatarUsernameGen onSuccess={onSuccess} />);

    // Wait initial username
    await screen.findByText('save_user');

    // Click Save
    fireEvent.click(screen.getByRole('button', { name: /Save New Avatar/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());

    // Ensure POST called to expected URL
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.NEXT_PUBLIC_API_URL}/api/profile/avatar`,
      expect.objectContaining({ method: 'POST', headers: expect.any(Object), body: expect.any(String) })
    );
  });

  it('alerts when not logged in on save', async () => {
    // Not logged in
    auth.currentUser = null;

    // First call (useEffect username)
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ results: [{ login: { username: 'u' } }] }) });

    render(<AvatarUsernameGen />);

    // Click Save
    fireEvent.click(screen.getByRole('button', { name: /Save New Avatar/i }));

    expect(global.alert).toHaveBeenCalledWith('User not logged in');
  });

  it('alerts when username API fails', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: false });
    render(<AvatarUsernameGen />);
    await waitFor(() => expect(global.alert).toHaveBeenCalledWith('Failed to fetch username'));
  });
});
