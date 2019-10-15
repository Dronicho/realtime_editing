/**
 * Операция для вставки слова
 */
export class Insert {
    /**
     * 
     * @param {number} index - Индекс для вставки 
     * @param {string} word - Слово для вставки
     */
    constructor(index, word) {
        this.type = 'insert';
        this.index = index;
        this.word = word;
    }
    /**
     * Применяет операцию к строке
     * 
     * @param {string} string - Строка, к которой применяется вставка
     * 
     * @returns {String} - Измененная строка
     */
    apply(string) {
        return string.slice(0, this.index) + this.word + string.slice(this.index);
    }

    /**
     * Индекс курсора после применения операции
     * 
     * @returns {number} - индекс
     */
    get cursorIndex() {
        return this.index + this.word.length;
    }

    /**
     * @returns {json} - json представление операции
     */
    toJson() {
        return JSON.stringify(this.toJson());
    }

    /**
     * @returns {object} - объектное представление операции
     */
    toObject() {
        return {
            type: this.type,
            index: this.index,
            word: this.word
        };
    }
}

/**
 * Операция для удаления символов
 */
export class Delete {
    /**
     * 
     * @param {number} startIndex 
     * @param {number} endIndex 
     */
    constructor(startIndex, endIndex) {
        this.type = 'delete';
        this.startIndex = startIndex;
        this.endIndex = endIndex;
    }

    /**
     * Применяет операцию к строке
     * 
     * @param {string} string - Строка, к которой применяется удаление
     * 
     * @returns {String} - Измененная строка
     */
    apply(string) {
        return string.slice(0, this.startIndex) + string.slice(this.endIndex);
    }

    /**
     * Индекс курсора после применения операции
     * 
     * @returns {number} - индекс
     */
    get cursorIndex() {
        return this.startIndex;
    }

    /**
     * @returns {json} - json представление операции
     */
    toJson() {
        return JSON.stringify(this.toObject());
    }

    /**
     * @returns {object} - объектное представление операции
     */
    toObject() {
        return {
            type: this.type,
            startIndex: this.startIndex,
            endIndex: this.endIndex
        };
    }
}

export class Noop {
    constructor() { this.type = 'noop'; }

    apply(string) {
        return string;
    }

    toJson() {
        return JSON.stringify(this.toObject());
    }

    toObject() {
        return {
            type: this.type
        };
    }
}

/**
 * Функция для создания операции из json 
 * 
 * @param {json} json 
 * 
 * @returns {Insert|Delete} - операция
 */
export function opFromJson(json) {
    if (json.type === 'insert') {
        return new Insert(json.index, json.word);
    }
    if (json.type === 'delete') {
        return new Delete(json.startIndex, json.endIndex);
    }
}

/**
 * Функция для трансформации op2 с учетом применени op1
 * 
 * @param {Insert|Delete} op1
 * @param {Insert|Delete} op2
 */
export function transformOp(op1, op2) {
    if (op1 instanceof Insert && op2 instanceof Insert) {
        if (op1.index < op2.index) {
            return new Insert(op2.index + op1.word.length, op2.word);
        }
        return op2;
    } else if (op1 instanceof Insert && op2 instanceof Delete) {
        if (op1.index < op2.startIndex) {
            return new Delete(op2.startIndex + op1.word.length, op2.endIndex + op1.word.length);
        }
        return op2;
    } else if (op1 instanceof Delete && op2 instanceof Insert) {
        if (op1.startIndex < op2.index) {
            return new Insert(op2.index - 1, op2.word);
        }
    } else if (op1 instanceof Delete && op2 instanceof Delete) {
        let diff = op1.endIndex - op1.startIndex;
        if (op1.endIndex <= op2.startIndex) {
            return new Delete(op2.startIndex-diff, op2.endIndex-diff);
        } else if (op1.endIndex > op2.startIndex && op1.startIndex < op2.startIndex) {
            return new Delete(op1.endIndex, op2.endIndex)
        } else if (op1.startIndex > op2.startIndex && op1.endIndex < op2.endIndex) {
            return new Delete(op2.startIndex, op2.endIndex-n);
        } else {
            return op2;
        }
    }
}

/**
 * Функция для склейки одинаковых операций
 * 
 * @param {Insert|Delete} op1 
 * @param {Insert|Delete} op2 
 */
export function merge(op1, op2) {
    if (op1 instanceof Insert && op2 instanceof Insert) {
        return [new Insert(op1.index, op1.word + op2.word)];
    } else if (op2 instanceof Delete && op2 instanceof Delete) {
        return [new Delete(Math.min(op1.startIndex, op2.startIndex), Math.max(op1.endIndex, op2.endIndex))];
    }
    return [op1, op2];
}