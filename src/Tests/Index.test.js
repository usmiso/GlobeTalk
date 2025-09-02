/* eslint-disable react/display-name */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Index from '@/app/pages/index/index';

// ✅ Mock next/link
jest.mock('next/link', () => {
  return ({ href, children, ...rest }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

// ✅ Mock next/image (so tests don’t complain about <Image />)
jest.mock('next/image', () => (props) => {
  return <img {...props} />;
});

// ✅ Mock useRouter from next/navigation
const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe('Index page', () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it('renders the main heading', () => {
    render(<Index />);
    expect(
      screen.getByRole('heading', { name: /Say Hello to your New Random Bestie!/i })
    ).toBeInTheDocument();
  });

  it('renders the About link with correct href', () => {
    render(<Index />);
    const aboutLink = screen.getByRole('link', { name: /About/i });
    expect(aboutLink).toHaveAttribute('href', '/pages/about');
  });

  it('renders the Explore link with correct href', () => {
    render(<Index />);
    const exploreLink = screen.getByRole('link', { name: /Explore/i });
    expect(exploreLink).toHaveAttribute('href', '/pages/explore');
  });

  it('renders the Login button and triggers router.push on click', () => {
    render(<Index />);
    const loginButton = screen.getByRole('button', { name: /Login/i });
    expect(loginButton).toBeInTheDocument();

    loginButton.click();
    expect(pushMock).toHaveBeenCalledWith('/pages/signin');
  });

  it('renders the Start Chatting button and triggers router.push on click', () => {
    render(<Index />);
    const chatButton = screen.getByRole('button', { name: /Start Chatting!/i });
    expect(chatButton).toBeInTheDocument();

    chatButton.click();
    expect(pushMock).toHaveBeenCalledWith('/pages/signin');
  });

  it('renders the Sign Up button and triggers router.push on click', () => {
    render(<Index />);
    const signUpButton = screen.getByRole('button', { name: /Sign Up/i });
    expect(signUpButton).toBeInTheDocument();

    signUpButton.click();
    expect(pushMock).toHaveBeenCalledWith('/pages/signin');
  });

  it('renders the mobile menu with correct links when opened', () => {
    render(<Index />);

    // Open the <details> menu by clicking its <summary>
    const summary = screen.getByRole('button', { hidden: true });
    fireEvent.click(summary);

    // Now check the links inside mobile nav
    expect(screen.getByRole('link', { name: /Home/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /About/i })).toHaveAttribute('href', '/pages/about');
    expect(screen.getByRole('link', { name: /Explore/i })).toHaveAttribute('href', '/pages/explore');
    expect(screen.getByRole('link', { name: /LogIninn/i })).toHaveAttribute('href', '/pages/signin');
    expect(screen.getByRole('link', { name: /SIgnUp/i })).toHaveAttribute('href', '/pages/signup');
  });
});
