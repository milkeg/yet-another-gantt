/**
 * popup.js
 * 
 * This file manages the popup/tooltip functionality in the Gantt chart.
 * It provides functionality to:
 * - Create and manage popup windows for task information
 * - Show/hide popups based on user interactions
 * - Display customizable task details and information
 * - Handle popup positioning and content updates
 * - Support custom actions and buttons in popups
 */

export default class Popup {
    // Initialize popup with parent element, content generator function, and gantt instance
    constructor(parent, popup_func, gantt) {
        this.parent = parent;
        this.popup_func = popup_func;
        this.gantt = gantt;

        this.make();
    }

    // Create the popup DOM structure
    make() {
        // Create popup sections: title, subtitle, details, and actions
        this.parent.innerHTML = `
            <div class="title"></div>
            <div class="subtitle"></div>
            <div class="details"></div>
            <div class="actions"></div>
        `;
        this.hide();

        // Store references to popup sections
        this.title = this.parent.querySelector('.title');
        this.subtitle = this.parent.querySelector('.subtitle');
        this.details = this.parent.querySelector('.details');
        this.actions = this.parent.querySelector('.actions');
    }

    // Show popup at specified position with task information
    show({ x, y, task, target }) {
        // Clear previous actions
        this.actions.innerHTML = '';

        // Generate popup content using provided function
        let html = this.popup_func({
            task,
            chart: this.gantt,
            // Getter/setter functions for popup sections
            get_title: () => this.title,
            set_title: (title) => (this.title.innerHTML = title),
            get_subtitle: () => this.subtitle,
            set_subtitle: (subtitle) => (this.subtitle.innerHTML = subtitle),
            get_details: () => this.details,
            set_details: (details) => (this.details.innerHTML = details),
            // Function to add action buttons
            add_action: (html, func) => {
                let action = this.gantt.create_el({
                    classes: 'action-btn',
                    type: 'button',
                    append_to: this.actions,
                });
                if (typeof html === 'function') html = html(task);
                action.innerHTML = html;
                action.onclick = (e) => func(task, this.gantt, e);
            },
        });

        // If popup_func returns false, don't show popup
        if (html === false) return;
        // If popup_func returns HTML, use it instead of default structure
        if (html) this.parent.innerHTML = html;

        // Handle actions section visibility
        if (this.actions.innerHTML === '') this.actions.remove();
        else this.parent.appendChild(this.actions);

        // Position popup
        this.parent.style.left = x + 10 + 'px';
        this.parent.style.top = y - 10 + 'px';
        this.parent.classList.remove('hide');
    }

    // Hide the popup
    hide() {
        this.parent.classList.add('hide');
    }
}
