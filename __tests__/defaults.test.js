import { DEFAULT_OPTIONS, DEFAULT_VIEW_MODES } from '../src/defaults';
import date_utils from '../src/date_utils';

// Mock date_utils
jest.mock('../src/date_utils', () => ({
    format: jest.fn(),
    add: jest.fn()
}));

describe('defaults', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('DEFAULT_VIEW_MODES', () => {
        test('should have all required view modes', () => {
            const expectedModes = ['Hour', 'Quarter Day', 'Half Day', 'Day', 'Week', 'Month', 'Year'];
            const actualModes = DEFAULT_VIEW_MODES.map(mode => mode.name);
            expect(actualModes).toEqual(expectedModes);
        });

        test('should have valid properties for each view mode', () => {
            DEFAULT_VIEW_MODES.forEach(mode => {
                expect(mode).toHaveProperty('padding');
                expect(mode).toHaveProperty('step');
                expect(mode).toHaveProperty('date_format');
                expect(mode).toHaveProperty('lower_text');
                expect(mode).toHaveProperty('upper_text');
            });
        });

        describe('Hour view mode', () => {
            const hourMode = DEFAULT_VIEW_MODES.find(mode => mode.name === 'Hour');

            test('should have correct configuration', () => {
                expect(hourMode.padding).toBe('7d');
                expect(hourMode.step).toBe('1h');
                expect(hourMode.date_format).toBe('YYYY-MM-DD HH:');
                expect(hourMode.lower_text).toBe('HH');
                expect(hourMode.upper_text_frequency).toBe(24);
            });

            test('should format upper text correctly', () => {
                const date = new Date('2024-01-01');
                const lastDate = new Date('2024-01-01');
                const lang = 'en';

                date_utils.format.mockReturnValue('1 January');
                
                // When dates are different
                expect(hourMode.upper_text(date, null, lang)).toBe('1 January');
                expect(date_utils.format).toHaveBeenCalledWith(date, 'D MMMM', lang);

                // When dates are the same
                expect(hourMode.upper_text(date, lastDate, lang)).toBe('');
            });
        });

        describe('Quarter Day view mode', () => {
            const quarterDayMode = DEFAULT_VIEW_MODES.find(mode => mode.name === 'Quarter Day');

            test('should have correct configuration', () => {
                expect(quarterDayMode.padding).toBe('7d');
                expect(quarterDayMode.step).toBe('6h');
                expect(quarterDayMode.date_format).toBe('YYYY-MM-DD HH:');
                expect(quarterDayMode.lower_text).toBe('HH');
                expect(quarterDayMode.upper_text_frequency).toBe(4);
            });

            test('should format upper text correctly', () => {
                const date = new Date('2024-01-01');
                const lastDate = new Date('2024-01-01');
                const lang = 'en';

                date_utils.format.mockReturnValue('1 Jan');
                
                expect(quarterDayMode.upper_text(date, null, lang)).toBe('1 Jan');
                expect(quarterDayMode.upper_text(date, lastDate, lang)).toBe('');
            });
        });

        describe('Half Day view mode', () => {
            const halfDayMode = DEFAULT_VIEW_MODES.find(mode => mode.name === 'Half Day');

            test('should have correct configuration', () => {
                expect(halfDayMode.padding).toBe('14d');
                expect(halfDayMode.step).toBe('12h');
                expect(halfDayMode.date_format).toBe('YYYY-MM-DD HH:');
                expect(halfDayMode.lower_text).toBe('HH');
                expect(halfDayMode.upper_text_frequency).toBe(2);
            });

            test('should format upper text correctly', () => {
                const date = new Date('2024-01-01');
                const lastDate = new Date('2024-01-01');
                const lang = 'en';

                date_utils.format
                    .mockReturnValueOnce('1 Jan')  // D MMM format
                    .mockReturnValueOnce('1');     // D format

                // Different month
                expect(halfDayMode.upper_text(date, null, lang)).toBe('1 Jan');
                
                // Same month, different date
                const sameMonthDate = new Date('2024-01-02');
                expect(halfDayMode.upper_text(sameMonthDate, date, lang)).toBe('1');

                // Same date
                expect(halfDayMode.upper_text(date, lastDate, lang)).toBe('');
            });
        });

        describe('Day view mode', () => {
            const dayMode = DEFAULT_VIEW_MODES.find(mode => mode.name === 'Day');

            test('should have correct configuration', () => {
                expect(dayMode.padding).toBe('7d');
                expect(dayMode.step).toBe('1d');
                expect(dayMode.date_format).toBe('YYYY-MM-DD');
            });

            test('should format lower text correctly', () => {
                const date = new Date('2024-01-01');
                const lastDate = new Date('2024-01-01');
                const lang = 'en';

                date_utils.format.mockReturnValue('1');

                expect(dayMode.lower_text(date, null, lang)).toBe('1');
                expect(dayMode.lower_text(date, lastDate, lang)).toBe('');
            });

            test('should format upper text correctly', () => {
                const date = new Date('2024-01-01');
                const lastDate = new Date('2024-01-01');
                const lang = 'en';

                date_utils.format.mockReturnValue('January');

                expect(dayMode.upper_text(date, null, lang)).toBe('January');
                expect(dayMode.upper_text(date, lastDate, lang)).toBe('');
            });

            test('should handle thick line condition', () => {
                const monday = new Date('2024-01-01'); // A Monday
                const tuesday = new Date('2024-01-02');
                
                expect(dayMode.thick_line(monday)).toBe(true);
                expect(dayMode.thick_line(tuesday)).toBe(false);
            });
        });

        describe('Week view mode', () => {
            const weekMode = DEFAULT_VIEW_MODES.find(mode => mode.name === 'Week');

            test('should have correct configuration', () => {
                expect(weekMode.padding).toBe('1m');
                expect(weekMode.step).toBe('7d');
                expect(weekMode.date_format).toBe('YYYY-MM-DD');
                expect(weekMode.column_width).toBe(140);
                expect(weekMode.upper_text_frequency).toBe(4);
            });

            test('should format week text correctly', () => {
                const date = new Date('2024-01-01');
                const endDate = new Date('2024-01-07');
                const lang = 'en';

                date_utils.add.mockReturnValue(endDate);
                date_utils.format
                    .mockReturnValueOnce('1')  // First format call for start date
                    .mockReturnValueOnce('7');  // Second format call for end date

                const result = weekMode.lower_text(date, null, lang);
                expect(result).toBe('1 - 7');

                expect(date_utils.add).toHaveBeenCalledWith(date, 6, 'day');
                expect(date_utils.format).toHaveBeenCalledWith(date, 'D MMM', lang);
                expect(date_utils.format).toHaveBeenCalledWith(endDate, 'D', lang);
            });

            test('should format week text with month change', () => {
                const date = new Date('2024-01-29');
                const endDate = new Date('2024-02-04');
                const lang = 'en';

                date_utils.add.mockReturnValue(endDate);
                date_utils.format
                    .mockReturnValueOnce('29 Jan')  // Start date with month
                    .mockReturnValueOnce('4 Feb');  // End date with month (different month)

                const result = weekMode.lower_text(date, null, lang);
                expect(result).toBe('29 Jan - 4 Feb');
            });

            test('should handle thick line condition', () => {
                const firstWeek = new Date('2024-01-01');
                const secondWeek = new Date('2024-01-08');
                
                expect(weekMode.thick_line(firstWeek)).toBe(true);
                expect(weekMode.thick_line(secondWeek)).toBe(false);
            });
        });

        describe('Month view mode', () => {
            const monthMode = DEFAULT_VIEW_MODES.find(mode => mode.name === 'Month');

            test('should have correct configuration', () => {
                expect(monthMode.padding).toBe('2m');
                expect(monthMode.step).toBe('1m');
                expect(monthMode.date_format).toBe('YYYY-MM');
                expect(monthMode.column_width).toBe(120);
                expect(monthMode.lower_text).toBe('MMMM');
                expect(monthMode.snap_at).toBe('7d');
            });

            test('should format upper text correctly', () => {
                const date = new Date('2024-01-01');
                const lastDate = new Date('2024-01-01');
                const lang = 'en';

                date_utils.format.mockReturnValue('2024');

                expect(monthMode.upper_text(date, null, lang)).toBe('2024');
                expect(monthMode.upper_text(date, lastDate, lang)).toBe('');
            });

            test('should handle thick line condition', () => {
                const q1Start = new Date('2024-01-01');
                const q2Start = new Date('2024-04-01');
                const midQuarter = new Date('2024-02-01');
                
                expect(monthMode.thick_line(q1Start)).toBe(true);
                expect(monthMode.thick_line(q2Start)).toBe(true);
                expect(monthMode.thick_line(midQuarter)).toBe(false);
            });
        });

        describe('Year view mode', () => {
            const yearMode = DEFAULT_VIEW_MODES.find(mode => mode.name === 'Year');

            test('should have correct configuration', () => {
                expect(yearMode.padding).toBe('2y');
                expect(yearMode.step).toBe('1y');
                expect(yearMode.date_format).toBe('YYYY');
                expect(yearMode.column_width).toBe(120);
                expect(yearMode.lower_text).toBe('YYYY');
                expect(yearMode.snap_at).toBe('30d');
            });

            test('should format upper text correctly', () => {
                const date2024 = new Date('2024-01-01');  // Decade: 2020
                const date2025 = new Date('2025-01-01');  // Decade: 2020
                const date2030 = new Date('2030-01-01');  // Decade: 2030
                
                // Same decade
                expect(yearMode.upper_text(date2024, date2025)).toBe('');
                
                // Different decade
                expect(yearMode.upper_text(date2030, null)).toBe('2030');
                expect(yearMode.upper_text(date2030, date2024)).toBe('2030');
            });
        });
    });

    describe('DEFAULT_OPTIONS', () => {
        test('should have all required properties', () => {
            const requiredProps = [
                'arrow_curve',
                'bar_height',
                'bar_corner_radius',
                'date_format',
                'language',
                'padding',
                'popup_on',
                'view_mode',
                'view_modes'
            ];

            requiredProps.forEach(prop => {
                expect(DEFAULT_OPTIONS).toHaveProperty(prop);
            });
        });

        test('should have correct default values', () => {
            expect(DEFAULT_OPTIONS.arrow_curve).toBe(5);
            expect(DEFAULT_OPTIONS.bar_height).toBe(30);
            expect(DEFAULT_OPTIONS.bar_corner_radius).toBe(3);
            expect(DEFAULT_OPTIONS.date_format).toBe('YYYY-MM-DD HH:mm');
            expect(DEFAULT_OPTIONS.language).toBe('en');
            expect(DEFAULT_OPTIONS.padding).toBe(18);
            expect(DEFAULT_OPTIONS.popup_on).toBe('click');
            expect(DEFAULT_OPTIONS.view_mode).toBe('Day');
        });

        test('should have correct boolean flags', () => {
            expect(DEFAULT_OPTIONS.auto_move_label).toBe(false);
            expect(DEFAULT_OPTIONS.infinite_padding).toBe(true);
            expect(DEFAULT_OPTIONS.move_dependencies).toBe(true);
            expect(DEFAULT_OPTIONS.readonly).toBe(false);
            expect(DEFAULT_OPTIONS.readonly_dates).toBe(false);
            expect(DEFAULT_OPTIONS.readonly_progress).toBe(false);
            expect(DEFAULT_OPTIONS.show_expected_progress).toBe(false);
            expect(DEFAULT_OPTIONS.today_button).toBe(true);
            expect(DEFAULT_OPTIONS.view_mode_select).toBe(false);
        });

        test('should have valid popup function', () => {
            const ctx = {
                task: {
                    name: 'Test Task',
                    description: 'Test Description',
                    _start: new Date('2024-01-01'),
                    _end: new Date('2024-01-05'),
                    progress: 50,
                    actual_duration: 5,
                },
                chart: {
                    options: {
                        language: 'en'
                    }
                },
                set_title: jest.fn(),
                set_subtitle: jest.fn(),
                set_details: jest.fn()
            };

            date_utils.format
                .mockReturnValueOnce('Jan 1')  // First format call for start date
                .mockReturnValueOnce('Jan 5');  // Second format call for end date

            DEFAULT_OPTIONS.popup(ctx);

            expect(ctx.set_title).toHaveBeenCalledWith('Test Task');
            expect(ctx.set_subtitle).toHaveBeenCalledWith('Test Description');
            expect(ctx.set_details).toHaveBeenCalledWith(
                'Jan 1 - Jan 5 (5 days)<br/>Progress: 50%'
            );
        });

        test('should handle popup without description', () => {
            const ctx = {
                task: {
                    name: 'Test Task',
                    _start: new Date('2024-01-01'),
                    _end: new Date('2024-01-05'),
                    progress: 50,
                    actual_duration: 5,
                },
                chart: {
                    options: {
                        language: 'en'
                    }
                },
                set_title: jest.fn(),
                set_subtitle: jest.fn(),
                set_details: jest.fn()
            };

            date_utils.format
                .mockReturnValueOnce('Jan 1')
                .mockReturnValueOnce('Jan 5');

            DEFAULT_OPTIONS.popup(ctx);

            expect(ctx.set_title).toHaveBeenCalledWith('Test Task');
            expect(ctx.set_subtitle).toHaveBeenCalledWith('');
        });

        test('should handle popup with ignored duration', () => {
            const ctx = {
                task: {
                    name: 'Test Task',
                    _start: new Date('2024-01-01'),
                    _end: new Date('2024-01-05'),
                    progress: 50,
                    actual_duration: 5,
                    ignored_duration: 2,
                },
                chart: {
                    options: {
                        language: 'en'
                    }
                },
                set_title: jest.fn(),
                set_subtitle: jest.fn(),
                set_details: jest.fn()
            };

            date_utils.format
                .mockReturnValueOnce('Jan 1')
                .mockReturnValueOnce('Jan 5');

            DEFAULT_OPTIONS.popup(ctx);

            expect(ctx.set_details).toHaveBeenCalledWith(
                'Jan 1 - Jan 5 (5 days + 2 excluded)<br/>Progress: 50%'
            );
        });

        test('should handle holidays configuration', () => {
            expect(DEFAULT_OPTIONS.holidays).toEqual({
                'var(--g-weekend-highlight-color)': 'weekend'
            });
        });

        test('should have empty ignore list', () => {
            expect(DEFAULT_OPTIONS.ignore).toEqual([]);
        });

        test('should have correct header heights', () => {
            expect(DEFAULT_OPTIONS.upper_header_height).toBe(45);
            expect(DEFAULT_OPTIONS.lower_header_height).toBe(30);
        });

        test('should have container height set to auto', () => {
            expect(DEFAULT_OPTIONS.container_height).toBe('auto');
        });

        test('should have null column width', () => {
            expect(DEFAULT_OPTIONS.column_width).toBeNull();
        });

        test('should have null snap_at', () => {
            expect(DEFAULT_OPTIONS.snap_at).toBeNull();
        });

        test('should have lines set to both', () => {
            expect(DEFAULT_OPTIONS.lines).toBe('both');
        });
    });
}); 