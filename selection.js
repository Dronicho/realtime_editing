class Cursor {
    constructor(index, color) {
        this.index = index;
        this.color = color;
    }

    render() {
        // TODO: render self cursor
        console.log(`render cursor at index ${this.index}`);
    }
}

export class CursorManager {
    constructor(target) {
        this.cursors = {};
        this.el = document.getElementById(target);
    }

    addCursor(username, index, color = '#000') {
        this.cursors[username] = new Cursor(index, color);
    }

    updateCursor(username, index, color) {
        if (!(username in this.cursors)) {
            this.addCursor(username, index, color);
        } else {
            this.cursors[username].index = index;
        }
        this.render();
    }

    render() {
        Object.values(this.cursors).forEach(cursor => {
            cursor.render();
        });
    }
}

