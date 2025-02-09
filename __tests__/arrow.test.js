import Arrow from '../src/arrow';
import { createSVG } from '../src/svg_utils';

// Mock svg_utils
jest.mock('../src/svg_utils', () => ({
    createSVG: jest.fn()
}));

describe('Arrow', () => {
    let gantt;
    let from_task;
    let to_task;
    let arrow;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Mock SVG element
        const mockElement = {
            setAttribute: jest.fn(),
            getAttribute: jest.fn(),
            appendChild: jest.fn()
        };

        // Setup mock gantt chart
        gantt = {
            options: {
                padding: 18,
                arrow_curve: 5,
                bar_height: 20
            },
            config: {
                header_height: 50
            }
        };

        // Setup mock tasks with bar elements
        from_task = {
            task: {
                id: 'task1',
                _index: 0
            },
            $bar: {
                getX: jest.fn().mockReturnValue(100),
                getY: jest.fn().mockReturnValue(20),
                getWidth: jest.fn().mockReturnValue(50),
                getHeight: jest.fn().mockReturnValue(20)
            }
        };

        to_task = {
            task: {
                id: 'task2',
                _index: 1
            },
            $bar: {
                getX: jest.fn().mockReturnValue(200),
                getY: jest.fn().mockReturnValue(70),
                getWidth: jest.fn().mockReturnValue(50),
                getHeight: jest.fn().mockReturnValue(20)
            }
        };

        // Mock createSVG to return our mock element
        createSVG.mockReturnValue(mockElement);

        // Create arrow instance
        arrow = new Arrow(gantt, from_task, to_task);
    });

    test('should initialize with correct properties', () => {
        expect(arrow.gantt).toBe(gantt);
        expect(arrow.from_task).toBe(from_task);
        expect(arrow.to_task).toBe(to_task);
        expect(arrow.element).toBeTruthy();
    });

    test('should calculate path for normal case', () => {
        arrow.calculate_path();
        const path = arrow.path.replace(/\s+/g, ' ').trim();
        
        // Split on both uppercase and lowercase commands
        const commands = path.split(/(?=[MmLlHhVvCcSsQqTtAaZz])/);
        
        // Check for presence of key path commands
        expect(commands.some(cmd => /^[Mm]/.test(cmd))).toBe(true); // Move to
        expect(commands.some(cmd => /^[Vv]/.test(cmd))).toBe(true); // Vertical line
        expect(commands.some(cmd => /^[Ll]/.test(cmd))).toBe(true); // Line to
        expect(commands.some(cmd => /^[aA]/.test(cmd))).toBe(true); // Arc
        
        // Check for arrowhead commands (relative move and lines)
        expect(commands.some(cmd => /^m -5 -5/.test(cmd))).toBe(true);
        expect(commands.some(cmd => /^l 5 5/.test(cmd))).toBe(true);
        expect(commands.some(cmd => /^l -5 5/.test(cmd))).toBe(true);
    });

    test('should calculate path when tasks are close', () => {
        // Move to_task closer to from_task
        to_task.$bar.getX.mockReturnValue(110);
        
        arrow.calculate_path();
        const path = arrow.path.replace(/\s+/g, ' ').trim();
        
        // Split on both uppercase and lowercase commands
        const commands = path.split(/(?=[MmLlHhVvCcSsQqTtAaZz])/);
        
        // Check for presence of key path commands
        expect(commands.some(cmd => /^[Mm]/.test(cmd))).toBe(true); // Move to
        expect(commands.some(cmd => /^[Vv]/.test(cmd))).toBe(true); // Vertical line
        expect(commands.some(cmd => /^[Ll]/.test(cmd))).toBe(true); // Line to
        expect(commands.some(cmd => /^[aA]/.test(cmd))).toBe(true); // Arc
        
        // Check for arrowhead commands (relative move and lines)
        expect(commands.some(cmd => /^m -5 -5/.test(cmd))).toBe(true);
        expect(commands.some(cmd => /^l 5 5/.test(cmd))).toBe(true);
        expect(commands.some(cmd => /^l -5 5/.test(cmd))).toBe(true);
    });

    test('should calculate path when target is above source', () => {
        // Swap task indices to make to_task appear above from_task
        from_task.task._index = 1;
        to_task.task._index = 0;
        
        arrow.calculate_path();
        const path = arrow.path.replace(/\s+/g, ' ').trim();
        
        // Split on both uppercase and lowercase commands
        const commands = path.split(/(?=[MmLlHhVvCcSsQqTtAaZz])/);
        
        // Check for presence of key path commands
        expect(commands.some(cmd => /^[Mm]/.test(cmd))).toBe(true); // Move to
        expect(commands.some(cmd => /^[Vv]/.test(cmd))).toBe(true); // Vertical line
        expect(commands.some(cmd => /^[Ll]/.test(cmd))).toBe(true); // Line to
        expect(commands.some(cmd => /^[aA]/.test(cmd))).toBe(true); // Arc
        
        // Check for arrowhead commands (relative move and lines)
        expect(commands.some(cmd => /^m -5 -5/.test(cmd))).toBe(true);
        expect(commands.some(cmd => /^l 5 5/.test(cmd))).toBe(true);
        expect(commands.some(cmd => /^l -5 5/.test(cmd))).toBe(true);
    });

    test('should create SVG path element with correct attributes', () => {
        arrow.draw();
        expect(createSVG).toHaveBeenCalledWith('path', {
            d: arrow.path,
            'data-from': 'task1',
            'data-to': 'task2'
        });
    });

    test('should update path when tasks move', () => {
        const originalPath = arrow.path;
        
        // Move the target task
        to_task.$bar.getX.mockReturnValue(300);
        
        arrow.update();
        expect(arrow.path).not.toBe(originalPath);
        expect(arrow.element.setAttribute).toHaveBeenCalledWith('d', arrow.path);
    });

    test('should handle minimum curve cases', () => {
        // Set tasks very close to each other
        from_task.$bar.getX.mockReturnValue(100);
        to_task.$bar.getX.mockReturnValue(110);
        
        arrow.calculate_path();
        const path = arrow.path.replace(/\s+/g, ' ').trim();
        
        // Split on both uppercase and lowercase commands
        const commands = path.split(/(?=[MmLlHhVvCcSsQqTtAaZz])/);
        
        // Check for presence of key path commands
        expect(commands.some(cmd => /^[Mm]/.test(cmd))).toBe(true); // Move to
        expect(commands.some(cmd => /^[Vv]/.test(cmd))).toBe(true); // Vertical line
        expect(commands.some(cmd => /^[Ll]/.test(cmd))).toBe(true); // Line to
        expect(commands.some(cmd => /^[aA]/.test(cmd))).toBe(true); // Arc
        
        // Check for arrowhead commands (relative move and lines)
        expect(commands.some(cmd => /^m -5 -5/.test(cmd))).toBe(true);
        expect(commands.some(cmd => /^l 5 5/.test(cmd))).toBe(true);
        expect(commands.some(cmd => /^l -5 5/.test(cmd))).toBe(true);
    });
}); 