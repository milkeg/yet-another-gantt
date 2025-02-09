/**
 * arrow.js
 *
 * This file handles the creation and management of dependency arrows in the Gantt chart.
 * It provides functionality to:
 * - Calculate and draw SVG paths for arrows connecting dependent tasks
 * - Update arrow positions when tasks move
 * - Handle different arrow path calculations based on task positions
 */

import { createSVG } from './svg_utils';

export default class Arrow {
    // Constructor takes the gantt instance and the source/target task bars
    constructor(gantt, from_task, to_task) {
        this.gantt = gantt;
        this.from_task = from_task;
        this.to_task = to_task;

        this.calculate_path();
        this.draw();
    }

    // Calculate the SVG path for the arrow based on task positions
    calculate_path() {
        // Calculate starting x position (middle of source task bar)
        let start_x =
            this.from_task.$bar.getX() + this.from_task.$bar.getWidth() / 2;

        // Adjust start position if tasks are too close together
        const condition = () =>
            this.to_task.$bar.getX() < start_x + this.gantt.options.padding &&
            start_x > this.from_task.$bar.getX() + this.gantt.options.padding;

        while (condition()) {
            start_x -= 10;
        }
        start_x -= 10;

        // Calculate starting y position based on source task's vertical position
        let start_y =
            this.gantt.config.header_height +
            this.gantt.options.bar_height +
            (this.gantt.options.padding + this.gantt.options.bar_height) *
                this.from_task.task._index +
            this.gantt.options.padding / 2;

        // Calculate ending positions based on target task
        let end_x = this.to_task.$bar.getX() - 13;
        let end_y =
            this.gantt.config.header_height +
            this.gantt.options.bar_height / 2 +
            (this.gantt.options.padding + this.gantt.options.bar_height) *
                this.to_task.task._index +
            this.gantt.options.padding / 2;

        // Determine if source task is below target task
        const from_is_below_to =
            this.from_task.task._index > this.to_task.task._index;

        // Set curve parameters for arrow path
        let curve = this.gantt.options.arrow_curve;
        const clockwise = from_is_below_to ? 1 : 0;
        let curve_y = from_is_below_to ? -curve : curve;

        // Handle case where target task is before source task
        if (
            this.to_task.$bar.getX() <=
            this.from_task.$bar.getX() + this.gantt.options.padding
        ) {
            // Calculate path for backward-pointing arrow
            let down_1 = this.gantt.options.padding / 2 - curve;
            if (down_1 < 0) {
                down_1 = 0;
                curve = this.gantt.options.padding / 2;
                curve_y = from_is_below_to ? -curve : curve;
            }
            const down_2 =
                this.to_task.$bar.getY() +
                this.to_task.$bar.getHeight() / 2 -
                curve_y;
            const left = this.to_task.$bar.getX() - this.gantt.options.padding;
            
            // Create SVG path with curves for backward arrow
            this.path = `
                M ${start_x} ${start_y}
                v ${down_1}
                a ${curve} ${curve} 0 0 1 ${-curve} ${curve}
                H ${left}
                a ${curve} ${curve} 0 0 ${clockwise} ${-curve} ${curve_y}
                V ${down_2}
                a ${curve} ${curve} 0 0 ${clockwise} ${curve} ${curve_y}
                L ${end_x} ${end_y}
                m -5 -5
                l 5 5
                l -5 5`;
        } else {
            // Handle case where target task is after source task
            if (end_x < start_x + curve) curve = end_x - start_x;

            let offset = from_is_below_to ? end_y + curve : end_y - curve;

            // Create SVG path with curves for forward arrow
            this.path = `
              M ${start_x} ${start_y}
              V ${offset}
              a ${curve} ${curve} 0 0 ${clockwise} ${curve} ${curve}
              L ${end_x} ${end_y}
              m -5 -5
              l 5 5
              l -5 5`;
        }
    }

    // Create the SVG path element for the arrow
    draw() {
        this.element = createSVG('path', {
            d: this.path,
            'data-from': this.from_task.task.id,
            'data-to': this.to_task.task.id,
        });
    }

    // Update arrow position when tasks move
    update() {
        this.calculate_path();
        this.element.setAttribute('d', this.path);
    }
}
