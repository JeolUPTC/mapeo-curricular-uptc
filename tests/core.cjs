const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');const root=require('node:path').resolve(__dirname,'..');
const files=['data/examples','data/source','data/malla-source','data/competency-source','data/competencies','data/storage','data/interchange','ui/design','data/source-import','data/curriculum','data/merge','data/history','views/comparison','ui/graph-links','views/analytics'];let counter=0;
vm.runInNewContext(files.map(f=>fs.readFileSync(root+'/js/'+f+'.js','utf8')).join('\n')+`
const base=importCompetencies(importMallaSource(importCurricularSource(structuredClone(seed))));
const one=structuredClone(base);setProgramCompetency(one,'RA3','C2');appendHistory(base,one,'Reasignar RA3');assert(valid(one));assert.equal(one.history.entries.length,1);assert(one.history.entries[0].changes.some(c=>c.kind==='program'));assert(one.history.entries[0].changes.some(c=>c.kind==='link'));
const two=structuredClone(one);adoptComparisonText(two,'competency','C7','Texto de prueba independiente','Referencia');appendHistory(one,two,'Editar C7');assert(valid(two));
const undone=undoHistoryEntry(two,one.history.entries[0].id);assert(valid(undone));assert.equal(undone.program.find(r=>r.id==='RA3').competency,'C3');assert.equal(undone.competencies.find(c=>c.id==='C7').text,'Texto de prueba independiente');for(const l of undone.links.filter(l=>l.ra==='RA3'))assert.deepEqual(l,base.links.find(x=>x.ra===l.ra&&x.course===l.course));assert(undone.history.entries.find(e=>e.id===one.history.entries[0].id).undoneBy);
const overlap=structuredClone(one);setProgramCompetency(overlap,'RA3','C4');appendHistory(one,overlap,'Reasignar otra vez');assert(historyUndoReason(overlap,overlap.history.entries[0]));assert.throws(()=>undoHistoryEntry(overlap,overlap.history.entries[0].id));
assert(valid(JSON.parse(JSON.stringify(undone))));
const malformed=structuredClone(undone);malformed.history.entries[0].changes[0].fields[0].name='__proto__';assert(!valid(malformed));
const stats=contributionStatistics(base,base.courses.filter(c=>c.area==='sw'&&c.inStudyPlan!==false));assert.equal(stats.byAC.length,4);for(const r of stats.byRA)assert.equal(Object.values(r.counts).reduce((a,b)=>a+b),4);for(const c of stats.byAC)assert.equal(Object.values(c.counts).reduce((a,b)=>a+b),base.program.length);assert(contributionStatistics(base,[]).byRA.every(r=>Object.values(r.counts).every(n=>n===0)));
const encoded=encodeWorkspace(base);assert.equal(encoded.version,2);assert.equal(JSON.stringify(parseWorkspace(JSON.stringify(encoded))),JSON.stringify(base));
const test=structuredClone(base);const draft=test.links.find(l=>l.course==='isw2'&&l.ra==='RA3');draft.level='P';draft.why='';const none=test.links.find(l=>l.course==='isw2'&&l.ra==='RA1');none.level='N';none.outcomes=[];none.why='';
const transport=encodeWorkspace(test);assert.equal(transport.links.find(l=>l.course==='isw2'&&l.ra==='RA3').level,null);assert.equal(transport.links.find(l=>l.course==='isw2'&&l.ra==='RA3').reviewState,'draft');assert.equal(JSON.stringify(parseWorkspace(JSON.stringify(transport))),JSON.stringify(test));
const pkg=areaPackage(test,'sw');assert.equal(JSON.stringify(parseWorkspace(JSON.stringify(encodeWorkspace(pkg)))),JSON.stringify(pkg));
const invalid=structuredClone(transport);invalid.links.find(l=>l.contribution==='none').level='A';assert.throws(()=>parseWorkspace(JSON.stringify(invalid)));
const plan=planMerge(base,[{name:'sw.json',pkg:parseWorkspace(JSON.stringify(encodeWorkspace(areaPackage(base,'sw'))))}]);assert.equal(plan.conflicts.length,0);
selectedSemesters=['5','6'];assert(semesterMatches({semester:5}));assert(!semesterMatches({semester:4}));
console.log('JSON v1/v2, paquetes por área, integración sin cambios y filtros: OK.');
console.log('Historial: deshacer individual conserva ajustes independientes, bloquea superposiciones y restaura cruces. Dashboard: recuentos por RA/AC y filtros vacíos correctos. JSON validado.');
`,{structuredClone,assert,console,document:{addEventListener(){}},uid:()=>String(++counter)});

const storageCode=fs.readFileSync(root+'/js/data/storage.js','utf8');
const rootKey=vm.runInNewContext(storageCode+';key',{location:{pathname:'/'}});
const projectKey=vm.runInNewContext(storageCode+';key',{location:{pathname:'/mapeo-curricular/'}});
const otherKey=vm.runInNewContext(storageCode+';key',{location:{pathname:'/otro-proyecto/'}});
assert.equal(rootKey,'mapa-curricular-demo-v1');assert.notEqual(projectKey,otherKey);
console.log('Almacenamiento local separado por proyecto de GitHub Pages: OK.');
