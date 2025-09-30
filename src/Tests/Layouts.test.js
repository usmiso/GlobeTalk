// Tests for page layouts under src/app/pages/(each)/layout.js
// Ensures they render children through ProtectedLayout and pass redirectTo prop
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next/image to avoid non-standard props errors in Jest
jest.mock('next/image', () => {
  function MockNextImage({ src, alt, fill, priority, ...rest }) {
    return <img src={src} alt={alt} {...rest} />;
  }
  MockNextImage.displayName = 'MockNextImage';
  return { __esModule: true, default: MockNextImage };
});

// Mock ProtectedLayout to capture props and render a marker with children
jest.mock('@/app/components/ProtectedLayout', () => {
  return function ProtectedLayoutMock(props) {
    return (
      <div data-testid="protected-layout" data-redirect-to={props.redirectTo}>
        <div data-testid="layout-children">{props.children}</div>
      </div>
    );
  };
});

import DashboardLayout from '@/app/pages/dashboard/layout';
import MatchmakingLayout from '@/app/pages/matchmaking/layout';
import InboxLayout from '@/app/pages/inbox/layout';
import UserProfileLayout from '@/app/pages/userprofile/layout';
import ExploreLayout from '@/app/pages/explore/layout';

function itBehavesLikeProtectedLayout(LayoutComponent, name) {
  test(`${name} wraps children in ProtectedLayout with redirectTo=/`, () => {
    render(
      <LayoutComponent>
        <span>Inner Content</span>
      </LayoutComponent>
    );

    const container = screen.getByTestId('protected-layout');
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute('data-redirect-to', '/');

    expect(screen.getByTestId('layout-children')).toHaveTextContent('Inner Content');
  });
}

describe('Page Layouts', () => {
  itBehavesLikeProtectedLayout(DashboardLayout, 'Dashboard layout');
  itBehavesLikeProtectedLayout(MatchmakingLayout, 'Matchmaking layout');
  itBehavesLikeProtectedLayout(InboxLayout, 'Inbox layout');
  itBehavesLikeProtectedLayout(UserProfileLayout, 'UserProfile layout');
  itBehavesLikeProtectedLayout(ExploreLayout, 'Explore layout');
});
