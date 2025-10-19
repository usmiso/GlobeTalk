import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FiltersPanel from '@/app/pages/matchmaking/components/FiltersPanel';

const SearchIcon = () => <span data-testid="search-icon" />;
const TimezoneIcon = () => <span data-testid="tz-icon" />;
const LanguageIcon = () => <span data-testid="lang-icon" />;

function setup(overrides = {}) {
  const props = {
    timezoneOptionsRef: { current: null },
    timezoneSearch: overrides.timezoneSearch ?? '',
    setTimezoneSearch: jest.fn(),
    showTimezoneOptions: overrides.showTimezoneOptions ?? false,
    setShowTimezoneOptions: jest.fn(),
    timezoneOptions: overrides.timezoneOptions ?? [
      { id: '1', name: 'UTC+1' },
      { id: '2', value: 'UTC+2' },
      { id: '3', text: 'UTC+3' },
    ],
    timezone: overrides.timezone ?? '',
    setTimezone: jest.fn(),

    languageOptionsRef: { current: null },
    languageSearch: overrides.languageSearch ?? '',
    setLanguageSearch: jest.fn(),
    showLanguageOptions: overrides.showLanguageOptions ?? false,
    setShowLanguageOptions: jest.fn(),
    languageOptions: overrides.languageOptions ?? [
      { id: 'l1', name: 'English' },
      { id: 'l2', value: 'Zulu' },
    ],
    selectedLanguage: overrides.selectedLanguage ?? '',
    setSelectedLanguage: jest.fn(),

    SearchIcon,
    TimezoneIcon,
    LanguageIcon,
    ...overrides,
  };

  const utils = render(<FiltersPanel {...props} />);
  return { props, ...utils };
}

describe('FiltersPanel', () => {
  test('timezone: focus shows options via setter', () => {
    const { props } = setup({ showTimezoneOptions: false });
    const tzInput = screen.getByPlaceholderText('Search timezone...');
    fireEvent.focus(tzInput);
    expect(props.setShowTimezoneOptions).toHaveBeenCalledWith(true);
  });

  test('timezone: select option sets timezone and hides list', () => {
    const { props } = setup({ showTimezoneOptions: true });
    // Click on one of the options (label derived from name/value/text)
    fireEvent.click(screen.getByText('UTC+2'));
    expect(props.setTimezone).toHaveBeenCalledWith('UTC+2');
    expect(props.setShowTimezoneOptions).toHaveBeenCalledWith(false);
  });

  test('timezone: clear button resets timezone and search', () => {
    const { props } = setup({ timezone: 'UTC+1' });
    const clearBtn = screen.getByRole('button', { name: /Clear/i });
    fireEvent.click(clearBtn);
    expect(props.setTimezone).toHaveBeenCalledWith('');
    expect(props.setTimezoneSearch).toHaveBeenCalledWith('');
  });

  test('timezone: shows No results when list empty', () => {
    setup({ showTimezoneOptions: true, timezoneOptions: [] });
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  test('language: focus shows options via setter and select option sets language and hides list', () => {
    const { props } = setup({ showLanguageOptions: true });
    const langInput = screen.getByPlaceholderText('Search language...');
    fireEvent.focus(langInput);
    expect(props.setShowLanguageOptions).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByText('Zulu'));
    expect(props.setSelectedLanguage).toHaveBeenCalledWith('Zulu');
    expect(props.setShowLanguageOptions).toHaveBeenCalledWith(false);
  });

  test('language: clear resets selected and search; selected indicator visible', () => {
    const { props } = setup({ selectedLanguage: 'English' });
    // indicator shows
    expect(screen.getByText(/Selected: English/)).toBeInTheDocument();

    const clearBtn = screen.getAllByRole('button', { name: /Clear/i })[0];
    fireEvent.click(clearBtn);
    expect(props.setSelectedLanguage).toHaveBeenCalledWith('');
    expect(props.setLanguageSearch).toHaveBeenCalledWith('');
  });

  test('language: shows No results when list empty', () => {
    setup({ showLanguageOptions: true, languageOptions: [] });
    expect(screen.getByText('No results')).toBeInTheDocument();
  });
});
