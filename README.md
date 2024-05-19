# simple-precedence-matrix
Генератор множеств L, R и матрицы отношений простого предшествования по заданной грамматике.

---

## Пример использования 
### Грамматика:
S -> E  
E -> X+E  
E -> X  
T -> F*T  
T -> F  
X -> T  
F -> i

### Генерация и вывод
```javascript
const { SimplePrecedence } = require('./simple-precedence');

const rules = [
    ['S', 'E'],
    ['E', 'X+E'],
    ['E', 'X'],
    ['T', 'F*T'],
    ['T', 'F'],
    ['X' ,'T'],
    ['F', 'i']
];

const generator = new SimplePrecedence(rules, 'S', '$', true);
generator.printMatrix();

console.log('Terminals:', generator.getTerminals());
console.log('Non-terminals:', generator.getNonTerminals());
console.log('L(E):', generator.getL('E'));
console.log('R(E):', generator.getR('E'));
```

### Результат
|   | S | E | T | X | F | + | * | i | $ |
| - | - | - | - | - | - | - | - | - | - |
  S |   |   |   |   |   |   |   |   | > |
  E |   |   |   |   |   |   |   |   | > |
  T |   |   |   |   |   | > |   |   | > |
  X |   |   |   |   |   | = |   |   | > |
  F |   |   |   |   |   | > | = |   | > |
  \+|   | = | < | < | < |   |   | < |   |
  \*|   |   | = |   | < |   |   | < |   |
  i |   |   |   |   |   | > | > |   | > |
  $ | < | < | < | < | < |   |   | < |   |

```
Terminals: [ '+', '*', 'i', '$' ]
Non-terminals: [ 'S', 'E', 'T', 'X', 'F' ]
L(E): Set(4) { 'X', 'T', 'F', 'i' }
R(E): Set(5) { 'E', 'X', 'T', 'F', 'i' }
```
