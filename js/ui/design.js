// Projection keeps historical JSON compatible: P/N are never displayed as levels.
let selectedSemesters=[];
function semesterMatches(course){return !selectedSemesters.length||selectedSemesters.includes(String(course.semester));}
function semesterPicker(){
 const semesters=[...new Set(data.courses.filter(c=>planScope==='all'||(planScope==='outside'?c.inStudyPlan===false:c.inStudyPlan!==false)).map(c=>c.semester))].sort((a,b)=>a-b);
 return '<details class="semester-picker"><summary>Semestres · '+(selectedSemesters.length?selectedSemesters.join(', '):'Todos')+'</summary><div><button type="button" id="clearSemesters">Mostrar todos</button>'+semesters.map(s=>'<label><input type="checkbox" data-semester-filter="'+s+'" '+(selectedSemesters.includes(String(s))?'checked':'')+'> Semestre '+s+'</label>').join('')+'</div></details>';
}
function contributionState(l){
 if(!l)return {level:null,status:'Sin revisar',decision:'Por definir',code:'U'};
 if(l.level==='N')return {level:null,status:'Revisado',decision:'Sin aporte',code:'N'};
 if(l.level==='P')return {level:null,status:'Borrador',decision:'Aporta',code:'P'};
 const complete=l.outcomes?.length&&l.why?.trim();
 return {level:l.level,status:complete?'Documentado':'Soporte pendiente',decision:'Aporta',code:complete?'D':'S'};
}
function kpiCards(items){return '<div class="summary-cards">'+items.map(([value,label,note])=>'<section><strong>'+esc(value)+'</strong><span>'+esc(label)+'</span>'+(note?'<small>'+esc(note)+'</small>':'')+'</section>').join('')+'</div>';}
document.addEventListener('change',e=>{if(e.target.hasAttribute('data-semester-filter')){const s=e.target.dataset.semesterFilter;selectedSemesters=e.target.checked?[...selectedSemesters,s].sort((a,b)=>+a-+b):selectedSemesters.filter(x=>x!==s);render();document.querySelector('.semester-picker')?.setAttribute('open','');}});
document.addEventListener('click',e=>{if(e.target.id==='clearSemesters'){selectedSemesters=[];render();}});

document.addEventListener('change',e=>{if(e.target.matches('#editor select[name="competency"]')){const description=document.querySelector('.competency-description');if(description)description.textContent=data.competencies.find(c=>c.id===e.target.value)?.text||'';}});
