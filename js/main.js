let data=structuredClone(seed);
let matrixSemester='',matrixSearch='';
let planScope='plan',mallaGroup='',mallaSearch='',mallaShowEmpty=false,mallaCompact=false,lastMove=null;
let tab='malla',area='',focus='',graphCourse='',configTab='areas',save;
try{
 data=readWorkspace();
 const expanded=importCompetencies(importMallaSource(importCurricularSource(data)));
 if(expanded!==data){
  localStorage.setItem(key+'-avant-import',JSON.stringify(data));
  writeWorkspace(expanded);data=expanded;
 }
 if(data.courses.length&&data.courses.every(course=>course.inStudyPlan===false))planScope='outside';
}catch(error){
 $('status').textContent='No se pudo recuperar o ampliar el espacio guardado. '+error.message;
}
function commit(next,options={}){
 const handled=next._historyHandled;delete next._historyHandled;
 if(options.track!==false&&!handled)appendHistory(data,next,options.label||($('editor').open?$('title').textContent:'Actualizar mapeo'));
 writeWorkspace(next);
 lastMove=null;data=next;
 $('status').textContent='Guardado en este navegador';
}
function render(){
 document.querySelectorAll('[data-tab]').forEach(button=>{
  const selected=button.dataset.tab===tab;
  button.classList.toggle('active',selected);
  button.setAttribute('aria-pressed',String(selected));
 });
 const views={malla,matrix,graph,catalog,exchange,configuration,glossary,competencies,history:historyView,program:programCatalog};
 $('screen').innerHTML=views[tab]();
}
document.addEventListener('click',event=>{
 const target=event.target.closest('[data-tab],[data-action]');
 if(!target)return;
 if(target.dataset.tab){tab=target.dataset.tab;document.querySelector('.nav-more')?.removeAttribute('open');render();}
 else formFor(target.dataset.action,target.dataset.id,target.dataset.ra,target.dataset.outcome);
});
$('screen').addEventListener('change',event=>{
 const id=event.target.id;
 if(id==='areaFilter'){
  area=event.target.value;matrixSemester='';graphCourse='';mallaGroup='';
  const owned=data.courses.filter(c=>c.area===area);
  if(area&&owned.length&&planScope!=='all'){
   if(owned.every(c=>c.inStudyPlan===false))planScope='outside';
   if(owned.every(c=>c.inStudyPlan!==false))planScope='plan';
  }
 }else if(id==='planScope'){
  planScope=event.target.value;matrixSemester='';graphCourse='';
 }else if(id==='mallaGroup')mallaGroup=event.target.value;
 else if(id==='mallaShowEmpty')mallaShowEmpty=event.target.checked;
 else if(id==='mallaCompact')mallaCompact=event.target.checked;
 else if(id==='matrixSemester')matrixSemester=event.target.value;
 else if(id==='graphCourse')graphCourse=event.target.value;
 else if(id==='raFilter')focus=event.target.value;
 else return;
 render();$(id)?.focus();
});
$('screen').addEventListener('input',event=>{
 const id=event.target.id;
 if(!['matrixSearch','mallaSearch'].includes(id))return;
 if(id==='matrixSearch')matrixSearch=event.target.value;else mallaSearch=event.target.value;
 const cursor=event.target.selectionStart;
 render();$(id).focus();$(id).setSelectionRange(cursor,cursor);
});
render();
