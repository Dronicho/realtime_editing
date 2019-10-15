const { opFromJson } =  require('./operations');

/**
 * Обработчик 
 */
export class DocManager {
    /**
     * 
     * @param {String} baseState - начальное состояние документа 
     */
    constructor(baseState) {
        this.revision = 0; // текущая версия документа
        this.pending = []; // необработанные операции
        this.history = [];
        this.state = baseState;
        this.clients = {};
        this.sendInitData(Object.values(this.clients));

        setInterval(() => {
            this.notify();
        }, 500);
    }

    /**
     * @param {Insert|Delete} op 
     */
    push(op) {
        this.history.push(op);
        this.pending.push(op);
    }

    /**
     * Отправляет текущее состояние документа
     * 
     * @param {Array[WebSocket]} sockets 
     */
    sendInitData(sockets) {
        sockets.forEach((ws) => {
            ws.send(JSON.stringify({
                event: 'init',
                doc: this.state,
                revision: this.revision
            }));

        });
    }


    /**
     * Добавляет нового пользователя, и настраивает слушатель
     * 
     * @param {String} username 
     * @param {WebSocket} ws 
     */
    connect(username, ws) {
        ws.on('message', (d) => {
            let data = JSON.parse(d);
            data.operation = opFromJson(data.operation);
            this.pending.push({
                username: data.username,
                operation: data.operation,
                revision: data.revision
            });
        });

        this.sendInitData([ws]);
        this.clients[username] = {};
        this.clients[username].ws = ws;
        this.clients[username].color = '#000'; // TODO: select random color

    }

    /**
     * Функция для обработки pending операций
     */
    notify() {
        if (!this.pending.length) return;
        let event = this.pending.shift();
        let username = event.username;
        let event_revision = event.revision;
        let op = event.operation;
        if (event_revision < this.revision) {
            console.log(event_revision, this.revision);
            this.history.slice(event_revision - 1).forEach((oldOp) => {
                console.log(op);
                op = operations.transformOp(oldOp, op);
            });
        }
        this.revision++;
        this.state = op.apply(this.state);
        this.isUnsaved = true;
        console.log(this.state);
        for (let k in this.clients) {
            if (k != username) {
                this.clients[k].ws.send(JSON.stringify({
                    event: 'op',
                    operation: op.toObject(),
                    color: this.clients[k].color,
                    revision: this.revision
                }));
            } else {
                this.clients[k].ws.send(JSON.stringify({
                    event: 'ack',
                    revision: this.revision
                }));
            }
        }
    }
}
