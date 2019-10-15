import { CursorManager } from './selection';

/**
 * класс для управления состоянием строки
 * и отображения в hmtl
 * 
 */
export class Doc {
    /**
     * @param {string} target - id редактируемого элемента
     */
    constructor(target) {
        this.el = document.getElementById(target);
        this.selection = new CursorManager(target);
    }

    /**
     * Геттер для получения состояния документ
     */
    get value() {
        return this._state;
    }

    /**
     * Обновление состояния документа и html
     * 
     * @param {string} newDoc 
     */
    updateDoc(newDoc) {
        this._state = newDoc;
        this.toHtml();
    }

    /**
     * Обновление состояния из редактируемого(target) элемента
     * вызвается, когда пользователь редактирует документ
     * 
     */
    fromHtml() {
        this._state = this.el.innerHTML.replace(/<br>/g, '\n');
        this._state = this._state == '\n' ? '' : this._state;
        return this._state;
    }

    /**
     * Рендеринг состояния в html
     */
    toHtml() {
        this.selection.render();
        this.el.innerHTML = this._state.replace(/\n/g, '<br>');
    }

}
