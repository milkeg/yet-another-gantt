/**
 * defaults.js
 *
 * This file contains default configuration settings for the Gantt chart.
 * It includes:
 * - Default view modes (Hour, Quarter Day, Half Day, Day, Week, Month, Year)
 * - Default styling and layout options
 * - Date formatting configurations
 * - Default behaviors and interaction settings
 * - Popup and UI configuration defaults
 */

import date_utils from './date_utils';

// Helper function to get decade from date
function getDecade(d) {
    const year = d.getFullYear();
    return year - (year % 10) + '';
}

// Helper function to format week display
function formatWeek(d, ld, lang) {
    let endOfWeek = date_utils.add(d, 6, 'day');
    let endFormat = endOfWeek.getMonth() !== d.getMonth() ? 'D MMM' : 'D';
    let beginFormat = !ld || d.getMonth() !== ld.getMonth() ? 'D MMM' : 'D';
    return `${date_utils.format(d, beginFormat, lang)} - ${date_utils.format(endOfWeek, endFormat, lang)}`;
}

// Default view modes configuration
const DEFAULT_VIEW_MODES = [
    // Hour view mode
    {
        name: 'Hour',
        padding: '7d',
        step: '1h',
        date_format: 'YYYY-MM-DD HH:',
        lower_text: 'HH',
        upper_text: (d, ld, lang) =>
            !ld || d.getDate() !== ld.getDate()
                ? date_utils.format(d, 'D MMMM', lang)
                : '',
        upper_text_frequency: 24,
    },
    // Quarter Day view mode (6-hour intervals)
    {
        name: 'Quarter Day',
        padding: '7d',
        step: '6h',
        date_format: 'YYYY-MM-DD HH:',
        lower_text: 'HH',
        upper_text: (d, ld, lang) =>
            !ld || d.getDate() !== ld.getDate()
                ? date_utils.format(d, 'D MMM', lang)
                : '',
        upper_text_frequency: 4,
    },
    // Half Day view mode (12-hour intervals)
    {
        name: 'Half Day',
        padding: '14d',
        step: '12h',
        date_format: 'YYYY-MM-DD HH:',
        lower_text: 'HH',
        upper_text: (d, ld, lang) =>
            !ld || d.getDate() !== ld.getDate()
                ? d.getMonth() !== d.getMonth()
                    ? date_utils.format(d, 'D MMM', lang)
                    : date_utils.format(d, 'D', lang)
                : '',
        upper_text_frequency: 2,
    },
    // Day view mode
    {
        name: 'Day',
        padding: '7d',
        date_format: 'YYYY-MM-DD',
        step: '1d',
        lower_text: (d, ld, lang) =>
            !ld || d.getDate() !== ld.getDate()
                ? date_utils.format(d, 'D', lang)
                : '',
        upper_text: (d, ld, lang) =>
            !ld || d.getMonth() !== ld.getMonth()
                ? date_utils.format(d, 'MMMM', lang)
                : '',
        thick_line: (d) => d.getDay() === 1, // Thick line on Mondays
    },
    // Week view mode
    {
        name: 'Week',
        padding: '1m',
        step: '7d',
        date_format: 'YYYY-MM-DD',
        column_width: 140,
        lower_text: formatWeek,
        upper_text: (d, ld, lang) =>
            !ld || d.getMonth() !== ld.getMonth()
                ? date_utils.format(d, 'MMMM', lang)
                : '',
        thick_line: (d) => d.getDate() >= 1 && d.getDate() <= 7, // Thick line on first week
        upper_text_frequency: 4,
    },
    // Month view mode
    {
        name: 'Month',
        padding: '2m',
        step: '1m',
        column_width: 120,
        date_format: 'YYYY-MM',
        lower_text: 'MMMM',
        upper_text: (d, ld, lang) =>
            !ld || d.getFullYear() !== ld.getFullYear()
                ? date_utils.format(d, 'YYYY', lang)
                : '',
        thick_line: (d) => d.getMonth() % 3 === 0, // Thick line every quarter
        snap_at: '7d',
    },
    // Year view mode
    {
        name: 'Year',
        padding: '2y',
        step: '1y',
        column_width: 120,
        date_format: 'YYYY',
        upper_text: (d, ld, lang) =>
            !ld || getDecade(d) !== getDecade(ld) ? getDecade(d) : '',
        lower_text: 'YYYY',
        snap_at: '30d',
    },
];

// Default options for the Gantt chart
const DEFAULT_OPTIONS = {
    arrow_curve: 5,                // Curve radius for dependency arrows
    auto_move_label: false,        // Auto-move labels when scrolling
    bar_corner_radius: 3,          // Corner radius of task bars
    bar_height: 30,               // Height of task bars
    container_height: 'auto',      // Container height
    column_width: null,           // Column width (null = auto)
    date_format: 'YYYY-MM-DD HH:mm', // Default date format
    upper_header_height: 45,      // Height of upper header
    lower_header_height: 30,      // Height of lower header
    snap_at: null,               // Snap to grid interval
    infinite_padding: true,       // Enable infinite scrolling padding
    holidays: { 'var(--g-weekend-highlight-color)': 'weekend' }, // Holiday highlighting
    ignore: [],                  // Dates to ignore
    language: 'en',              // Default language
    lines: 'both',               // Grid line display
    move_dependencies: true,      // Move dependent tasks together
    padding: 18,                 // Padding between bars
    popup: (ctx) => {            // Default popup content generator
        ctx.set_title(ctx.task.name);
        if (ctx.task.description) ctx.set_subtitle(ctx.task.description);
        else ctx.set_subtitle('');

        const start_date = date_utils.format(
            ctx.task._start,
            'MMM D',
            ctx.chart.options.language,
        );
        const end_date = date_utils.format(
            date_utils.add(ctx.task._end, -1, 'second'),
            'MMM D',
            ctx.chart.options.language,
        );

        ctx.set_details(
            `${start_date} - ${end_date} (${ctx.task.actual_duration} days${ctx.task.ignored_duration ? ' + ' + ctx.task.ignored_duration + ' excluded' : ''})<br/>Progress: ${Math.floor(ctx.task.progress * 100) / 100}%`,
        );
    },
    popup_on: 'click',           // Popup trigger event
    readonly_progress: false,     // Readonly progress bar
    readonly_dates: false,       // Readonly task dates
    readonly: false,             // Completely readonly
    scroll_to: 'today',          // Initial scroll position
    show_expected_progress: false, // Show expected progress indicator
    today_button: true,          // Show Today button
    view_mode: 'Day',           // Default view mode
    view_mode_select: false,     // Show view mode selector
    view_modes: DEFAULT_VIEW_MODES, // Available view modes
};

export { DEFAULT_OPTIONS, DEFAULT_VIEW_MODES };
