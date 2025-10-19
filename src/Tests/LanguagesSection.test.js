/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import LanguagesSection from '../app/pages/userprofile/components/LanguagesSection';

describe('LanguagesSection', () => {
  function setup(overrides = {}) {
    const props = {
      language: ['English'],
      removeLanguage: jest.fn(),
      selectedLang: '',
      setSelectedLang: jest.fn(),
      filteredLangs: ['English', 'French', 'Spanish'],
      handleSelectedLang: jest.fn(),
      customLanguage: '',
      setCustomLanguage: jest.fn(),
      ...overrides,
    };
    render(<LanguagesSection {...props} />);
    return props;
  }

  test('renders selected languages and allows removing one', () => {
    const props = setup();
    // remove by clicking × in the chip
    const removeBtn = screen.getByText('✕');
    fireEvent.click(removeBtn);
    expect(props.removeLanguage).toHaveBeenCalledWith('English');
  });

  test('changes dropdown triggers handler', () => {
    const props = setup();
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'French' } });
    expect(props.handleSelectedLang).toHaveBeenCalled();
  });

  test('enter in custom language input does not change language list here', () => {
    const props = setup({ customLanguage: 'Zulu' });
    const input = screen.getByPlaceholderText(/type your own/i);
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', preventDefault: () => {} });
    // Component intentionally leaves adding logic to parent; ensure no remove is called
    expect(props.removeLanguage).not.toHaveBeenCalled();
    // But typing should be managed via setCustomLanguage elsewhere; ensure controlled input change works
    fireEvent.change(input, { target: { value: 'Xhosa' } });
    expect(props.setCustomLanguage).toHaveBeenCalledWith('Xhosa');
  });
});
