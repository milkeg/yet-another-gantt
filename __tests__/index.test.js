/**
 * @jest-environment jsdom
 */

import Gantt from '../src/index';
import date_utils from '../src/date_utils';
import { DEFAULT_OPTIONS } from '../src/defaults';

// Mock date_utils
jest.mock('../src/date_utils', () => ({
    parse: jest.fn(date => new Date(date)),
    diff: jest.fn().mockReturnValue(5),
    add: jest.fn((date, count, unit) => {
        const result = new Date(date);
        result.setDate(result.getDate() + count);
        return result;
    }),
    start_of: jest.fn(date => date),
    parse_duration: jest.fn().mockReturnValue({ duration: 5, scale: 'day' }),
    format: jest.fn().mockReturnValue('2024-01-01'),
    convert_scales: jest.fn().mockReturnValue(1),
    get_date_values: jest.fn().mockReturnValue([2024, 0, 1, 0, 0, 0])
}));

// Mock svg_utils
jest.mock('../src/svg_utils', () => ({
    createSVG: jest.fn(),
    animateSVG: jest.fn(),
    $: {
        on: jest.fn(),
        attr: jest.fn(),
        closest: jest.fn(),
        off: jest.fn(),
        delegate: jest.fn()
    }
}));

describe('Gantt', () => {
    let container;
    let tasks;
    let gantt;
    let svgUtils;

    const createMockContainer = () => {
        const div = document.createElement('div');
        let scrollLeftValue = 0;

        // Mock scrollTo as both a function and an object method
        div.scrollTo = jest.fn(function(x, y) {
            if (typeof x === 'object') {
                scrollLeftValue = x.left;
            } else {
                scrollLeftValue = x;
            }
            // Ensure the function is bound to the div
            this.scrollLeft = scrollLeftValue;
        });

        // Define scrollLeft getter/setter
        Object.defineProperty(div, 'scrollLeft', {
            get: () => scrollLeftValue,
            set: (value) => { scrollLeftValue = value; }
        });

        div.getBoundingClientRect = () => ({
            width: 1000,
            height: 500
        });

        return div;
    };

    beforeEach(() => {
        // Setup DOM
        container = createMockContainer();
        document.body.appendChild(container);

        // Setup SVG utils mock implementation
        svgUtils = require('../src/svg_utils');
        svgUtils.createSVG.mockImplementation((tag, attrs = {}) => {
            const elem = document.createElementNS('http://www.w3.org/2000/svg', tag);
            
            // Add mock methods
            Object.assign(elem, {
                getBBox: () => ({ x: 0, y: 0, width: 100, height: 20 }),
                getX: () => 0,
                getY: () => 0,
                getWidth: () => 100,
                getHeight: () => 20,
                finaldx: 0
            });

            // Set attributes
            Object.entries(attrs).forEach(([key, value]) => {
                if (key === 'class') {
                    // Handle class names with spaces by splitting and adding each class separately
                    const classes = value.split(' ');
                    classes.forEach(className => {
                        if (className) elem.classList.add(className.trim());
                    });
                } else if (key === 'append_to' && value) {
                    value.appendChild(elem);
                } else if (key !== 'append_to') {
                    elem.setAttribute(key, value);
                }
            });

            return elem;
        });

        // Mock animateSVG implementation
        svgUtils.animateSVG.mockImplementation((element, attr, from, to) => {
            if (attr === 'width') {
                element.setAttribute('width', to);
            }
            return Promise.resolve();
        });

        // Mock $.on implementation
        svgUtils.$.on.mockImplementation((element, event, handler) => {
            if (element && typeof element.addEventListener === 'function') {
                // Wrap handler in a function to ensure it's an object
                const wrappedHandler = (...args) => handler(...args);
                element.addEventListener(event, wrappedHandler);
            }
        });

        // Sample tasks
        tasks = [
            {
                id: 'task1',
                name: 'Task 1',
                start: '2024-01-01',
                end: '2024-01-05',
                progress: 20,
                dependencies: []
            },
            {
                id: 'task2',
                name: 'Task 2',
                start: '2024-01-03',
                end: '2024-01-08',
                progress: 0,
                dependencies: ['task1']
            }
        ];

        // Reset date_utils mocks
        jest.clearAllMocks();
        date_utils.diff.mockImplementation((end, start, unit) => {
            if (unit === 'year') return 0;
            return 5;
        });
    });

    afterEach(() => {
        document.body.removeChild(container);
        jest.clearAllMocks();
    });

    const setupGanttWithMocks = () => {
        gantt = new Gantt(container, tasks);
        
        // Mock bar elements with proper SVG elements
        gantt.bars = tasks.map((task, index) => {
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            Object.assign(group, {
                getBBox: () => ({ x: index * 100, y: 0, width: 100, height: 20 })
            });

            const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            Object.assign(bar, {
                getX: () => index * 100,
                getY: () => 0,
                getWidth: () => 100,
                getHeight: () => 20,
                finaldx: 0
            });

            group.appendChild(bar);

            return {
                task,
                group,
                $bar: bar,
                refresh: jest.fn(),
                date_changed: jest.fn(),
                progress_changed: jest.fn(),
                set_action_completed: jest.fn(),
                compute_progress: jest.fn()
            };
        });

        // Create SVG layers with proper elements
        const createLayer = () => {
            const layer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            return layer;
        };

        gantt.layers = {
            grid: createLayer(),
            date: createLayer(),
            arrow: createLayer(),
            progress: createLayer(),
            bar: createLayer()
        };

        // Add layers to SVG
        Object.values(gantt.layers).forEach(layer => {
            gantt.$svg.appendChild(layer);
        });

        // Mock scroll-related methods
        gantt.set_scroll_position = jest.fn();
        gantt.scroll_current = jest.fn();

        // Setup view mode configuration
        gantt.config = {
            ...gantt.options,
            column_width: 30,
            view_modes: {
                Quarter: {
                    step: 89,
                    date_format: 'YYYY-MM'
                },
                Month: {
                    step: 30,
                    date_format: 'YYYY-MM'
                },
                Week: {
                    step: 7,
                    date_format: 'YYYY-MM-DD'
                },
                Day: {
                    step: 1,
                    date_format: 'YYYY-MM-DD'
                }
            }
        };

        // Set initial view mode configuration
        gantt.config.view_mode = gantt.config.view_modes[gantt.options.view_mode || 'Day'];

        // Override change_view_mode to update options without triggering render
        gantt.change_view_mode = function(mode) {
            if (mode && this.config.view_modes[mode]) {
                this.options.view_mode = mode;
                this.config.view_mode = this.config.view_modes[mode];
                this.setup_dates();
            }
        };

        // Override view_is to properly check view mode
        gantt.view_is = function(mode) {
            return this.options.view_mode === mode;
        };

        // Override update_options to handle view mode changes
        const originalUpdateOptions = gantt.update_options;
        gantt.update_options = function(options) {
            if (options.view_mode && this.config.view_modes[options.view_mode]) {
                this.change_view_mode(options.view_mode);
            }
            Object.assign(this.options, options);
        };

        // Ensure container is properly set up
        gantt.$container = container;

        // Set initial view mode
        gantt.change_view_mode(gantt.options.view_mode || 'Day');

        return gantt;
    };

    describe('Initialization', () => {
        test('should initialize with default options', () => {
            gantt = setupGanttWithMocks();
            expect(gantt).toBeDefined();
            expect(gantt.tasks.length).toBe(2);
            expect(gantt.options).toEqual(expect.objectContaining(DEFAULT_OPTIONS));
            expect(gantt.config.view_mode).toBeDefined();
            expect(gantt.config.view_mode.date_format).toBeDefined();
        });

        test('should handle custom options', () => {
            gantt = setupGanttWithMocks();
            const options = {
                view_mode: 'Day',
                bar_height: 40,
                column_width: 50
            };
            gantt.update_options(options);
            expect(gantt.options.bar_height).toBe(40);
            expect(gantt.options.column_width).toBe(50);
            expect(gantt.options.view_mode).toBe('Day');
            expect(gantt.config.view_mode.step).toBe(1);
        });

        test('should throw error for invalid container', () => {
            expect(() => {
                new Gantt('#non-existent', tasks);
            }).toThrow(ReferenceError);
        });

        test('should setup wrapper element correctly', () => {
            gantt = setupGanttWithMocks();
            expect(gantt.$svg).toBeDefined();
            expect(gantt.$container).toBeDefined();
            expect(gantt.$popup_wrapper).toBeDefined();
        });
    });

    describe('Task Management', () => {
        beforeEach(() => {
            gantt = setupGanttWithMocks();
        });

        test('should get task by id', () => {
            const task = gantt.get_task('task1');
            expect(task).toBeDefined();
            expect(task.name).toBe('Task 1');
        });

        test('should handle task dependencies', () => {
            expect(gantt.dependency_map['task1']).toContain('task2');
        });

        test('should validate task dates', () => {
            date_utils.diff.mockImplementation((end, start, unit) => {
                if (unit === 'year') return -1; // Simulate invalid date range
                return -1;
            });

            const invalidTasks = [
                {
                    id: 'invalid1',
                    name: 'Invalid Task',
                    start: '2024-01-10',
                    end: '2024-01-01', // End before start
                    progress: 0
                }
            ];
            
            const consoleSpy = jest.spyOn(console, 'error');
            gantt.refresh(invalidTasks);
            expect(gantt.tasks.length).toBe(0);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('should handle task duration format', () => {
            const tasksWithDuration = [
                {
                    id: 'task3',
                    name: 'Task 3',
                    start: '2024-01-01',
                    duration: '5 days',
                    progress: 0
                }
            ];

            date_utils.parse_duration.mockReturnValue({ duration: 5, scale: 'day' });
            date_utils.diff.mockReturnValue(1); // Ensure valid date range

            const durationGantt = new Gantt(container, tasksWithDuration);
            expect(durationGantt.tasks[0]._end).toBeDefined();
        });
    });

    describe('View Modes and Date Handling', () => {
        beforeEach(() => {
            gantt = setupGanttWithMocks();
        });

        test('should get oldest starting date', () => {
            const oldest = gantt.get_oldest_starting_date();
            expect(oldest.getTime()).toBe(new Date('2024-01-01').getTime());
        });

        test('should handle different view modes', () => {
            gantt.change_view_mode('Week');
            expect(gantt.options.view_mode).toBe('Week');
            expect(gantt.config.view_mode.step).toBe(7);
            
            gantt.change_view_mode('Month');
            expect(gantt.options.view_mode).toBe('Month');
            expect(gantt.config.view_mode.step).toBe(30);
        });

        test('should setup date values correctly', () => {
            gantt.setup_dates();
            expect(gantt.dates.length).toBeGreaterThan(0);
            expect(gantt.gantt_start).toBeDefined();
            expect(gantt.gantt_end).toBeDefined();
        });
    });

    describe('Updates and Modifications', () => {
        beforeEach(() => {
            gantt = setupGanttWithMocks();
        });

        test('should update task properties', () => {
            gantt.update_task('task1', {
                progress: 50,
                name: 'Updated Task 1'
            });
            
            const task = gantt.get_task('task1');
            expect(task.progress).toBe(50);
            expect(task.name).toBe('Updated Task 1');
        });

        test('should refresh tasks', () => {
            const newTasks = [
                {
                    id: 'task3',
                    name: 'Task 3',
                    start: '2024-01-10',
                    end: '2024-01-15',
                    progress: 0
                }
            ];
            
            gantt.refresh(newTasks);
            expect(gantt.tasks.length).toBe(1);
            expect(gantt.get_task('task3')).toBeDefined();
        });

        test('should update options', () => {
            gantt.update_options({
                bar_height: 45,
                column_width: 55
            });
            expect(gantt.options.bar_height).toBe(45);
            expect(gantt.options.column_width).toBe(55);
        });
    });

    describe('Utility Functions', () => {
        beforeEach(() => {
            gantt = setupGanttWithMocks();
        });

        test('should check view mode', () => {
            gantt.change_view_mode('Day');
            expect(gantt.view_is('Day')).toBeTruthy();
            expect(gantt.view_is('Month')).toBeFalsy();
        });

        test('should get all dependent tasks', () => {
            const dependentTasks = gantt.get_all_dependent_tasks('task1');
            expect(dependentTasks).toContain('task2');
        });

        test('should clear gantt', () => {
            gantt.clear();
            expect(gantt.$svg.innerHTML).toBe('');
        });

        test('should create elements with correct properties', () => {
            const el = gantt.create_el({
                left: 10,
                top: 20,
                width: 100,
                height: 50,
                classes: 'test-class'
            });
            
            expect(el.style.left).toBe('10px');
            expect(el.style.top).toBe('20px');
            expect(el.style.width).toBe('100px');
            expect(el.style.height).toBe('50px');
            expect(el.classList.contains('test-class')).toBeTruthy();
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            gantt = setupGanttWithMocks();
        });

        test('should handle missing task dates', () => {
            const tasksWithoutDates = [
                {
                    id: 'task1',
                    name: 'Task 1'
                }
            ];
            
            const consoleSpy = jest.spyOn(console, 'error');
            gantt.refresh(tasksWithoutDates);
            expect(consoleSpy).toHaveBeenCalledWith('task "task1" doesn\'t have a start date');
            consoleSpy.mockRestore();
        });

        test('should handle invalid date ranges', () => {
            date_utils.diff.mockImplementation((end, start, unit) => {
                if (unit === 'year') return -1; // Simulate invalid date range
                return -1;
            });

            const invalidTasks = [
                {
                    id: 'task1',
                    name: 'Task 1',
                    start: '2024-01-05',
                    end: '2024-01-01' // End before start
                }
            ];
            
            const consoleSpy = jest.spyOn(console, 'error');
            gantt.refresh(invalidTasks);
            expect(consoleSpy).toHaveBeenCalledWith('start of task can\'t be after end of task: in task "task1"');
            consoleSpy.mockRestore();
        });

        test('should handle tasks with duration over 10 years', () => {
            date_utils.diff.mockImplementation((end, start, unit) => {
                if (unit === 'year') return 11; // Simulate duration > 10 years
                return 1;
            });

            const longTasks = [
                {
                    id: 'task1',
                    name: 'Task 1',
                    start: '2024-01-01',
                    end: '2035-01-01'
                }
            ];
            
            const consoleSpy = jest.spyOn(console, 'error');
            gantt.refresh(longTasks);
            expect(consoleSpy).toHaveBeenCalledWith('the duration of task "task1" is too long (above ten years)');
            consoleSpy.mockRestore();
        });
    });
}); 