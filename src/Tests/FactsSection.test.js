/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import FactsSection from '../app/pages/userprofile/components/FactsSection';

describe('FactsSection', () => {
  test('renders textarea and calls setFacts on change', () => {
    const setFacts = jest.fn();
    render(<FactsSection facts="Some fact" setFacts={setFacts} />);

    const ta = screen.getByPlaceholderText(/fun facts about your country/i);
    fireEvent.change(ta, { target: { value: 'New facts' } });
    expect(setFacts).toHaveBeenCalledWith('New facts');
  });
});
