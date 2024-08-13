class SimplePrecedence {
    #throwOnConflict;

    #rules;
    #start;
    #end;
    #LR;
    #matrix;

    #terminals;
    #nonTerminals;
    #all;

    /**
     * @param {string[][]} rules Правила грамматики
     * @param {string} startSymbol Стартовый символ (по умолчанию `S`)
     * @param {string} endSymbol Симмол окончания (по умолчанию `$`)
     * @param {boolean} throwOnConflict Останавливать построение матрицы при появлении неоднозначности
     */
    constructor(rules, startSymbol = 'S', endSymbol = '$', throwOnConflict = true) {
        this.#throwOnConflict = throwOnConflict;
        this.#rules = rules.map(rule => [rule[0], rule[1].replace(new RegExp(`\\${endSymbol}`, 'g'), '')]);
        this.#start = startSymbol;
        this.#end = endSymbol;

        this.#nonTerminals = [];
        this.#terminals = [];

        // собираем массив нетерминалов
        for (const rule of this.#rules) {
            if (this.#nonTerminals.includes(rule[0])) {
                continue;
            }

            this.#nonTerminals.push(rule[0]);
        }

        // собираем массив терминалов
        for (const rule of this.#rules) {
            for (const t of rule[1]) {
                if (this.#nonTerminals.includes(t) || this.#terminals.includes(t)) {
                    continue;
                }

                this.#terminals.push(t);
            }
        }
        this.#terminals.push(endSymbol);

        this.#all = [...this.#nonTerminals, ...this.#terminals];

        // заполянем таблицу пустыми значениями
        this.#matrix = [];
        for (let i = 0; i < this.#all.length; i++) {
            this.#matrix[i] = new Array(this.#all.length).fill('');
        }

        this.#buildLR();
    }

    /**
     * Построение множеств L и R
     */
    #buildLR() {
        this.#LR = {};

        for (const nonTerminal of this.#nonTerminals) {
            const L = new Set;
            const R = new Set;

            const addL = (nonTerminal) => {
                for (const rule of this.#rules) {
                    if (rule[0] !== nonTerminal) {
                        continue;
                    }

                    L.add(rule[1][0]);
                }
            };
            const addR = (nonTerminal) => {
                for (const rule of this.#rules) {
                    if (rule[0] !== nonTerminal) {
                        continue;
                    }

                    R.add(rule[1][rule[1].length - 1]);
                }
            };

            addL(nonTerminal);
            addR(nonTerminal);

            // По-хорошему надо проверять, изменилось ли что-то
            // и после этого переставать повторные попытки заполнения
            for (let l = 0; l < 1000; l++) {
                for (const k of L.values()) {
                    if (this.#nonTerminals.includes(k)) {
                        addL(k);
                    }
                }

                for (const k of R.values()) {
                    if (this.#nonTerminals.includes(k)) {
                        addR(k);
                    }
                }
            }

            if (nonTerminal === this.#start) {
                L.add(nonTerminal);
                R.add(nonTerminal);
            }

            this.#LR[nonTerminal] = { L, R };
        }
    }

    /**
     * Установка отношения в ячейку с проверкой уже имеющегося значения
     * @param {string} a Символ по строке
     * @param {string} b Символ по столбцу
     * @param {string} val Устанавливаемое отношение
     */
    #checkAndSet(a, b, val) {
        const i = this.#all.indexOf(a);
        if (i === -1) {
            throw new Error(`Неизвестный символ: ${a}`);
        }

        const j = this.#all.indexOf(b);
        if (j === -1) {
            throw new Error(`Неизвестный символ: ${b}`);
        }

        if (this.#matrix[i][j] !== '' && this.#matrix[i][j] !== val) {
            const message = `Неоднозначность: matrix[${a}][${b}] (matrix[${i}][${j}]) содержит ${this.#matrix[i][j]}, пытаемся установить ${val}`;

            if (this.#throwOnConflict) {
                throw new Error(message);
            } else {
                console.error(message);
            }
        }

        this.#matrix[i][j] = val;
    }

    /**
     * Получение L(a)
     */
    getL(a) {
        return this.#LR[a]?.L;
    }

    /**
     * Получение R(a)
     */
    getR(a) {
        return this.#LR[a]?.R;
    }

    /**
     * Получение всех терминальных символов грамматики
     */
    getTerminals() {
        return this.#terminals;
    }

    /**
     * Получение всех не-терминальных символов грамматики
     */
    getNonTerminals() {
        return this.#nonTerminals;
    }

    /**
     * Генерация матрицы предшествования
     */
    generateMatrix() {
        for (const X of this.#all) {
            // $ < X
            if (this.#LR[this.#start].L.has(X)) {
                this.#checkAndSet(this.#end, X, '<');
            }

            for (const Y of this.#all) {
                // Y > $
                if (X === this.#end && this.#LR[this.#start].R.has(Y)) {
                    this.#checkAndSet(Y, X, '>');
                }

                for (const rule of this.#rules) {
                    // Расставляем =
                    if (rule[1].indexOf(X + Y) !== -1) {
                        this.#checkAndSet(X, Y, '=');
                    }

                    // Расставляем <
                    for (const B of this.#nonTerminals) {
                        if (rule[1].indexOf(X + B) !== -1) {
                            for (const t of this.#LR[B].L) {
                                this.#checkAndSet(X, t, '<');
                            }
                        }
                    }
                }
            }

            // Расставляем >
            for (const y of this.#terminals) {
                for (const rule of this.#rules) {
                    for (const B of this.#nonTerminals) {
                        if (rule[1].indexOf(B + y) !== -1 && this.#LR[B].R.has(X)) {
                            this.#checkAndSet(X, y, '>');
                        }

                        for (const C of this.#nonTerminals) {
                            if (rule[1].indexOf(B + C) !== -1 && this.#LR[B].R.has(X) && this.#LR[C].L.has(y)) {
                                this.#checkAndSet(X, y, '>');
                            }
                        }
                    }
                }
            }
        }

        return this.#matrix;
    }

    /**
     * Вывод матрицы
     */
    printMatrix() {
        this.generateMatrix();

        const printableMatrix = {};
        for (const [i, a] of this.#all.entries()) {
            printableMatrix[a] = {};

            for (const [j, b] of this.#all.entries()) {
                printableMatrix[a][b] = this.#matrix[i][j];
            }
        }

        console.table(printableMatrix);
    }
}

module.exports = {
    SimplePrecedence
};
