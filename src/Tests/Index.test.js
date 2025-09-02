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
    const aboutLinks = screen.getAllByRole('link', { name: /About/i });
    // Find the one with the correct href
    const aboutLink = aboutLinks.find(link => link.getAttribute('href') === '/pages/about');
    expect(aboutLink).toBeInTheDocument();
  });

  it('renders the Explore link with correct href', () => {
    render(<Index />);
    const exploreLinks = screen.getAllByRole('link', { name: /Explore/i });
    const exploreLink = exploreLinks.find(link => link.getAttribute('href') === '/pages/explore');
    expect(exploreLink).toBeInTheDocument();
  });

  it('renders the Login button and triggers router.push on click', () => {
    render(<Index />);
    const loginButtons = screen.getAllByRole('button', { name: /Login/i });
    // Find the button with text 'Login'
    const loginButton = loginButtons.find(btn => btn.textContent.match(/Login/i));
    expect(loginButton).toBeInTheDocument();

    loginButton.click();
    expect(pushMock).toHaveBeenCalledWith('/pages/signin');
  });

  it('renders the Start Chatting button and triggers router.push on click', () => {
    render(<Index />);
    const chatButtons = screen.getAllByRole('button', { name: /Start Chatting!/i });
    const chatButton = chatButtons.find(btn => btn.textContent.match(/Start Chatting!/i));
    expect(chatButton).toBeInTheDocument();

    chatButton.click();
    expect(pushMock).toHaveBeenCalledWith('/pages/signin');
  });

  it('renders the Sign Up button and triggers router.push on click', () => {
    render(<Index />);
    const signUpButtons = screen.getAllByRole('button', { name: /Sign Up/i });
    const signUpButton = signUpButtons.find(btn => btn.textContent.match(/Sign Up/i));
    expect(signUpButton).toBeInTheDocument();

    signUpButton.click();
    expect(pushMock).toHaveBeenCalledWith('/pages/signin');
  });

  it('renders the mobile menu with correct links when opened', () => {
  const { container } = render(<Index />);

  // Open the <details> menu by clicking its <summary>
  const summary = container.querySelector('summary');
  fireEvent.click(summary);

  // Now check the links inside mobile nav
  const mobileLinks = screen.getAllByRole('link');
  expect(mobileLinks.some(link => link.textContent.match(/Home/i) && link.getAttribute('href') === '/')).toBeTruthy();
  expect(mobileLinks.some(link => link.textContent.match(/About/i) && link.getAttribute('href') === '/pages/about')).toBeTruthy();
  expect(mobileLinks.some(link => link.textContent.match(/Explore/i) && link.getAttribute('href') === '/pages/explore')).toBeTruthy();
  expect(mobileLinks.some(link => link.textContent.match(/LogIn/i) && link.getAttribute('href') === '/pages/signin')).toBeTruthy();
  expect(mobileLinks.some(link => link.textContent.match(/SIgnUp/i) && link.getAttribute('href') === '/pages/signup')).toBeTruthy();
  });
});
