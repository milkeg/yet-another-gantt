/**
 * svg_utils.js
 *
 * This file provides utility functions for SVG manipulation and DOM operations.
 * It includes functionality to:
 * - Create and modify SVG elements
 * - Handle SVG animations
 * - Manage event listeners and delegation
 * - Provide DOM helper functions
 * - Handle element attributes and properties
 */

// Query selector helper function
export function $(expr, con) {
    return typeof expr === 'string'
        ? (con || document).querySelector(expr)
        : expr || null;
}

// Create SVG element with specified attributes
export function createSVG(tag, attrs) {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (let attr in attrs) {
        if (attr === 'append_to') {
            const parent = attrs.append_to;
            parent.appendChild(elem);
        } else if (attr === 'innerHTML') {
            elem.innerHTML = attrs.innerHTML;
        } else if (attr === 'clipPath') {
            elem.setAttribute('clip-path', 'url(#' + attrs[attr] + ')');
        } else {
            elem.setAttribute(attr, attrs[attr]);
        }
    }
    return elem;
}

// Create and apply SVG animation
export function animateSVG(svgElement, attr, from, to) {
    const animatedSvgElement = getAnimationElement(svgElement, attr, from, to);

    if (animatedSvgElement === svgElement) {
        // triggered 2nd time programmatically
        // trigger artificial click event
        const event = document.createEvent('HTMLEvents');
        event.initEvent('click', true, true);
        event.eventName = 'click';
        animatedSvgElement.dispatchEvent(event);
    }
}

// Create or update animation element for SVG
function getAnimationElement(
    svgElement,
    attr,
    from,
    to,
    dur = '0.4s',
    begin = '0.1s',
) {
    // Check if animation already exists
    const animEl = svgElement.querySelector('animate');
    if (animEl) {
        // Update existing animation
        $.attr(animEl, {
            attributeName: attr,
            from,
            to,
            dur,
            begin: 'click + ' + begin, // artificial click
        });
        return svgElement;
    }

    // Create new animation element
    const animateElement = createSVG('animate', {
        attributeName: attr,
        from,
        to,
        dur,
        begin,
        calcMode: 'spline',
        values: from + ';' + to,
        keyTimes: '0; 1',
        keySplines: cubic_bezier('ease-out'),
    });
    svgElement.appendChild(animateElement);

    return svgElement;
}

// Get cubic bezier values for animation easing
function cubic_bezier(name) {
    return {
        ease: '.25 .1 .25 1',
        linear: '0 0 1 1',
        'ease-in': '.42 0 1 1',
        'ease-out': '0 0 .58 1',
        'ease-in-out': '.42 0 .58 1',
    }[name];
}

// Add event listener with optional delegation
$.on = (element, event, selector, callback) => {
    if (!callback) {
        callback = selector;
        $.bind(element, event, callback);
    } else {
        $.delegate(element, event, selector, callback);
    }
};

// Remove event listener
$.off = (element, event, handler) => {
    element.removeEventListener(event, handler);
};

// Bind event listener directly to element
$.bind = (element, event, callback) => {
    event.split(/\s+/).forEach(function (event) {
        element.addEventListener(event, callback);
    });
};

// Delegate event listener to descendant elements matching selector
$.delegate = (element, event, selector, callback) => {
    element.addEventListener(event, function (e) {
        const delegatedTarget = e.target.closest(selector);
        if (delegatedTarget) {
            e.delegatedTarget = delegatedTarget;
            callback.call(this, e, delegatedTarget);
        }
    });
};

// Find closest ancestor matching selector
$.closest = (selector, element) => {
    if (!element) return null;

    if (element.matches(selector)) {
        return element;
    }

    return $.closest(selector, element.parentNode);
};

// Get or set element attributes
$.attr = (element, attr, value) => {
    // Get attribute value
    if (!value && typeof attr === 'string') {
        return element.getAttribute(attr);
    }

    // Set multiple attributes
    if (typeof attr === 'object') {
        for (let key in attr) {
            $.attr(element, key, attr[key]);
        }
        return;
    }

    // Set single attribute
    element.setAttribute(attr, value);
};
