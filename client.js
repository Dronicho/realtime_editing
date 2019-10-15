import { opFromJson, Insert, Delete, transformOp, merge } from './operations';
import { Doc } from './doc';


export class Client {
    /**
     * 
     * @param {String} host 
     * @param {String} username 
     * @param {String} target 
     */
    constructor(host, username, target) {
        this.username = username;
        this.ws = this.createConn(host, username);
        this.input = document.getElementById(target);
        console.log(this.input, target);
        this.updateInput();
        this.sent = null;
        this.pending = [];
        this.doc = new Doc(target);
        this.revision = 0;
        this.sender = setInterval(() => this.sendOperation(), 1000);
    }

    /**
     * Добавления слушателя на редактируемый элемент
     */
    updateInput() {
        this.input.oninput = (e) => {
            this.handleInput(e);
        };
    }

    createConn(host, username) {
        const s = `${host}/${username}`;
        const ws = new WebSocket(s);
        console.log(s);
        ws.onopen = () => {
            ws.onmessage = (d) => {
                let data = JSON.parse(d.data);
                console.log(data);
                this.revision = data.revision;
                if (data.event === 'init') {
                    this.doc.updateDoc(data.doc);
                }
                else if (data.event === 'op') {
                    let op = opFromJson(data.operation);
                    this.doc.selection.updateCursor(data.username, op.cursorIndex, data.color);
                    this.transform(op);
                    this.apply(op);
                }
                else if (data.event === 'ack') {
                    this.sent = null;
                }
            };
        };
        return ws;
    }

    apply(operation) {
        this.doc.updateDoc(operation.apply(this.doc.value));
    }

    transform(op1) {
        this.pending = this.pending.map((op2) => {
            return transformOp(op1, op2);
        });
    }

    sendOperation() {
        if (this.pending.length === 0) return;
        if (!this.sent) {
            const op = this.pending.shift();
            console.log('sent operation: ', op);
            this.ws.send(JSON.stringify({
                username: this.username,
                operation: op.toObject(),
                revision: this.revision
            }));

            this.sent = op;
        }
    }


    pushOperation(op2) {
        console.log(this.pending);
        let op1 = this.pending.pop();
        if (!op1) {
            this.pending.push(op2);
            return;
        }
        this.pending.push(...merge(op1, op2));
    }

    handleInput(e) {
        let doc = this.doc.value;
        let newDoc = this.doc.fromHtml();
        console.log(doc, newDoc);
        console.log(e);
        let startIndex = 0;
        while (doc[startIndex] === newDoc[startIndex]) startIndex++;
        let endIndex = startIndex;
        while (doc[endIndex] !== newDoc[endIndex] && endIndex <= newDoc.length) endIndex++;
        if (startIndex === 0 && endIndex === 0) endIndex = 1;
        let op;
        if (e.inputType === 'insertText' || e.inputType === 'insertParagraph') {
            op = new Insert(startIndex, e.data || '\n');
        } else if (e.inputType === 'deleteContentBackward' || e.inputType === 'deleteContentForward') {
            console.log(doc.length, newDoc.length);
            op = new Delete(startIndex, startIndex + (doc.length - newDoc.length + (newDoc === '' ? 1 : 0)));
        }
        this.pushOperation(op);
    }
}