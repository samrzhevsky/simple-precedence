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
