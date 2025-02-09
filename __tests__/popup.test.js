import Popup from '../src/popup';

describe('Popup', () => {
    let parent, popup_func, popup, gantt, mockTask;

    beforeEach(() => {
        parent = document.createElement('div');
        mockTask = {
            id: 'task1',
            name: 'Test Task',
            start: '2024-01-01',
            end: '2024-01-31'
        };
        gantt = {
            create_el: jest.fn(({ type = 'div', classes = '', append_to = null }) => {
                const el = document.createElement(type);
                if (classes) el.className = classes;
                if (append_to) append_to.appendChild(el);
                return el;
            })
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('initialization', () => {
        test('should create popup structure', () => {
            popup = new Popup(parent, () => {}, gantt);
            expect(parent.querySelector('.title')).toBeTruthy();
            expect(parent.querySelector('.subtitle')).toBeTruthy();
            expect(parent.querySelector('.details')).toBeTruthy();
            expect(parent.querySelector('.actions')).toBeTruthy();
        });

        test('should start hidden', () => {
            popup = new Popup(parent, () => {}, gantt);
            expect(parent.classList.contains('hide')).toBe(true);
        });
    });

    describe('show', () => {
        test('should show popup with correct content', () => {
            popup_func = jest.fn(ctx => {
                ctx.set_title('Test Title');
                ctx.set_subtitle('Test Subtitle');
                ctx.set_details('Test Details');
            });

            popup = new Popup(parent, popup_func, gantt);
            popup.show({
                x: 100,
                y: 50,
                task: mockTask,
                target: document.createElement('div')
            });

            expect(parent.querySelector('.title').innerHTML).toBe('Test Title');
            expect(parent.querySelector('.subtitle').innerHTML).toBe('Test Subtitle');
            expect(parent.querySelector('.details').innerHTML).toBe('Test Details');
            expect(parent.classList.contains('hide')).toBe(false);
        });

        test('should position popup correctly', () => {
            popup_func = jest.fn();
            popup = new Popup(parent, popup_func, gantt);
            
            popup.show({
                x: 100,
                y: 50,
                task: mockTask,
                target: document.createElement('div')
            });

            expect(parent.style.left).toBe('110px');
            expect(parent.style.top).toBe('40px');
        });

        test('should handle multiple actions', () => {
            const action1 = jest.fn();
            const action2 = jest.fn();
            
            popup_func = jest.fn(ctx => {
                ctx.add_action('Action 1', action1);
                ctx.add_action('Action 2', action2);
            });

            popup = new Popup(parent, popup_func, gantt);
            popup.show({
                x: 100,
                y: 50,
                task: mockTask,
                target: document.createElement('div')
            });

            const buttons = parent.querySelectorAll('.action-btn');
            expect(buttons.length).toBe(2);
            expect(buttons[0].innerHTML).toBe('Action 1');
            expect(buttons[1].innerHTML).toBe('Action 2');

            buttons[0].click();
            expect(action1).toHaveBeenCalledWith(mockTask, gantt, expect.any(MouseEvent));
        });

        test('should handle dynamic action HTML', () => {
            popup_func = jest.fn(ctx => {
                ctx.add_action(task => `Action for ${task.name}`, () => {});
            });

            popup = new Popup(parent, popup_func, gantt);
            popup.show({
                x: 100,
                y: 50,
                task: mockTask,
                target: document.createElement('div')
            });

            const button = parent.querySelector('.action-btn');
            expect(button.innerHTML).toBe('Action for Test Task');
        });

        test('should handle empty actions', () => {
            popup_func = jest.fn(ctx => {
                ctx.set_title('Test Title');
            });

            popup = new Popup(parent, popup_func, gantt);
            popup.show({
                x: 100,
                y: 50,
                task: mockTask,
                target: document.createElement('div')
            });

            expect(parent.querySelector('.actions')).toBeNull();
        });
    });

    describe('hide', () => {
        test('should hide popup', () => {
            popup_func = jest.fn();
            popup = new Popup(parent, popup_func, gantt);
            
            popup.show({
                x: 100,
                y: 50,
                task: mockTask,
                target: document.createElement('div')
            });

            popup.hide();
            expect(parent.classList.contains('hide')).toBe(true);
        });

        test('should be safe to call multiple times', () => {
            popup = new Popup(parent, () => {}, gantt);
            popup.hide();
            popup.hide();
            expect(parent.classList.contains('hide')).toBe(true);
        });

        test('should be safe to call before show', () => {
            popup = new Popup(parent, () => {}, gantt);
            popup.hide();
            expect(parent.classList.contains('hide')).toBe(true);
        });
    });
}); 