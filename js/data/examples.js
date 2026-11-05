const bloom = [
 ['Recordar','Recuperar información','Identificar componentes de una arquitectura.'],
 ['Comprender','Explicar e interpretar','Explicar para qué sirve un patrón.'],
 ['Aplicar','Usar un procedimiento','Implementar una solución con un método conocido.'],
 ['Analizar','Distinguir relaciones y partes','Comparar dependencias entre componentes.'],
 ['Evaluar','Emitir un juicio con criterios','Justificar una decisión de diseño.'],
 ['Crear','Construir una propuesta','Diseñar una solución para una necesidad del entorno.']
];
const seed = {version:1,areas:[{id:'math',name:'Matemáticas'},{id:'sw',name:'Ingeniería de Software'},{id:'prog',name:'Programación'}],
program:[
 ['Comprender','Comprende conceptos, teorías, métodos, técnicas y procedimientos fundamentales de las áreas disciplinares.'],
 ['Crear','Formula soluciones tecnológicas creativas e innovadoras a partir de necesidades del contexto.'],
 ['Aplicar','Implementa soluciones tecnológicas con métodos y herramientas pertinentes y criterios de calidad.'],
 ['Crear','Propone alternativas mediante la aplicación crítica y ética del método científico.'],
 ['Aplicar','Desarrolla el trabajo individual y colaborativo con liderazgo, ética y empatía.'],
 ['Aplicar','Comunica ideas, propuestas y soluciones a públicos especializados y no especializados.'],
 ['Evaluar','Gestiona de manera proactiva y autónoma su proceso de aprendizaje.']
].map(([level,text],i)=>({id:'RA'+(i+1),competency:'C'+(i+1),level,text})),
courses:[
 {id:'calc',name:'Cálculo Diferencial',area:'math',semester:1,credits:3,outcomes:[{id:'calc-1',text:'Interpreta tasas de cambio en un ejercicio guiado de rendimiento de un sistema.',level:'Comprender'}]},
 {id:'alg',name:'Fundamentos de Algoritmos y Programación',area:'prog',semester:1,credits:3,outcomes:[]},
 {id:'isw2',name:'Ingeniería de Software II',area:'sw',semester:6,credits:3,outcomes:[{id:'sw-1',text:'Implementa un prototipo a partir de decisiones de diseño justificadas.',level:'Aplicar'},{id:'sw-2',text:'Verifica la calidad del prototipo con pruebas y criterios explícitos.',level:'Evaluar'}]}
],links:[
 {course:'calc',ra:'RA1',level:'I',outcomes:['calc-1'],why:'Ejercicio guiado que conecta la derivada con la interpretación del rendimiento. Ejemplo hipotético.'},
 {course:'isw2',ra:'RA3',level:'A',outcomes:['sw-1','sw-2'],why:'Entrega integrada con decisiones autónomas, implementación y verificación de calidad. Ejemplo hipotético.'}
]};
const softwareExamples = [
 {id:'requirements',name:'Fundamentos e Ingeniería de Requisitos',semester:4,ra:'RA1',level:'I',bloom:'Comprender',text:'Explica la diferencia entre requisitos funcionales y de calidad a partir de un caso guiado.'},
 {id:'isw1',name:'Ingeniería de Software I',semester:5,ra:'RA1',level:'R',bloom:'Aplicar',text:'Relaciona requisitos con decisiones de diseño y justifica la elección de un patrón en un caso dado.'},
 {id:'isw3',name:'Ingeniería de Software III',semester:7,ra:'RA3',level:'A',bloom:'Crear',text:'Integra y verifica una solución de software y defiende sus decisiones frente a criterios de calidad.'}
];
for(const example of softwareExamples){
 const {id,name,semester,ra,level,bloom,text}=example;
 const outcome=id+'-1';
 seed.courses.push({id,name,semester,area:'sw',credits:3,outcomes:[{id:outcome,text,level:bloom}]});
 seed.links.push({course:id,ra,level,outcomes:[outcome],why:'Ejemplo hipotético. '+text});
}
