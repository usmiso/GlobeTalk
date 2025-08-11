/* eslint-disable react/display-name */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Index from '@/app/pages/index/index';
import { useRouter } from 'next/router';

// Mock the next/link component to just render children
jest.mock('next/link', () => {
    return ({ href, children, ...rest }) => (
        <a href={href} {...rest}>
            {children}
        </a>
    );
});

describe('Index page', () => {
    it('renders the welcome heading', () => {
        render(<Index />);
        expect(
            screen.getByRole('heading', { name: /Welcome to My Site/i })
        ).toBeInTheDocument();
    });

    it('renders Tailwind hello text', () => {
        render(<Index />);
        expect(
            screen.getByRole('heading', { name: /Hello, Tailwind!/i })
        ).toBeInTheDocument();
    });

    it('renders About link with correct href', () => {
        render(<Index />);
        const aboutLink = screen.getByRole('link', { name: /Go to About/i });
        expect(aboutLink).toHaveAttribute('href', '/pages/about');
    });

    it('renders Contact link with correct href', () => {
        render(<Index />);
        const contactLink = screen.getByRole('link', { name: /Go to Contact's/i });
        expect(contactLink).toHaveAttribute('href', '/pages/contact');

    });
});
