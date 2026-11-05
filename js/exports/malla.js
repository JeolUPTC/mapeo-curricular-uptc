function buildMallaSheet(files,workbook,relationships,workspace,cellStyles){
 const ns=OfficeNames.spreadsheet;
 const sourceEntry=[...workbook.getElementsByTagNameNS(ns,'sheet')].find(entry=>entry.getAttribute('name')==='Ajuste07092026');
 if(!sourceEntry)throw Error('Falta la hoja Ajuste07092026 en la plantilla.');
 const relationId=sourceEntry.getAttributeNS(OfficeNames.relationship,'id');
 const relationship=[...relationships.documentElement.children].find(entry=>entry.getAttribute('Id')===relationId);
 const target=relationship.getAttribute('Target').replace(/^\//,'');
 const path=target.startsWith('xl/')?target:'xl/'+target;
 const doc=OfficeFiles.xml(files,path),root=doc.documentElement;
 const body=doc.getElementsByTagNameNS(ns,'sheetData')[0];
 const oldRows=officeChildren(body,'row');
 const oldCells=new Map(oldRows.flatMap(row=>officeChildren(row,'c').map(cell=>[cell.getAttribute('r'),cell])));
 const retainedRows=oldRows.filter(row=>Number(row.getAttribute('r'))<5);
 body.replaceChildren(...retainedRows);
 const rowMap=new Map(retainedRows.map(row=>[Number(row.getAttribute('r')),row]));
 const merges=doc.getElementsByTagNameNS(ns,'mergeCells')[0]||officeElement(doc,ns,'mergeCells');
 merges.replaceChildren();
 if(!merges.parentNode)root.append(merges);
 function col(index){
  let result='';for(let value=index;value;value=Math.floor((value-1)/26))result=String.fromCharCode(65+(value-1)%26)+result;
  return result;
 }
 function row(index){
  if(!rowMap.has(index)){
   const element=officeElement(doc,ns,'row',{r:index,ht:19,customHeight:1});
   rowMap.set(index,element);body.append(element);
  }
  return rowMap.get(index);
 }
 function set(rowIndex,column,value,style=cellStyles.body,formula){
  const reference=col(column)+rowIndex;
  const cell=officeElement(doc,ns,'c',{r:reference,s:style});
  if(formula){
   if(typeof value==='string')cell.setAttribute('t','str');
   const f=officeElement(doc,ns,'f');f.textContent=formula;cell.append(f);
   const v=officeElement(doc,ns,'v');v.textContent=String(value??0);cell.append(v);
  }else if(typeof value==='number'){
   const v=officeElement(doc,ns,'v');v.textContent=String(value);cell.append(v);
  }else if(value!==null&&value!==undefined&&value!==''){
   cell.setAttribute('t','inlineStr');
   const inline=officeElement(doc,ns,'is'),text=officeElement(doc,ns,'t');text.textContent=String(value);inline.append(text);cell.append(inline);
  }
  const parent=row(rowIndex),existing=officeChildren(parent,'c').find(c=>c.getAttribute('r')===reference);
  if(existing)existing.replaceWith(cell);else parent.append(cell);
  return reference;
 }
 function merge(r1,c1,r2,c2){
  if(r1===r2&&c1===c2)return;
  merges.append(officeElement(doc,ns,'mergeCell',{ref:col(c1)+r1+':'+col(c2)+r2}));
 }
 function style(reference,fallback=cellStyles.body){
  return oldCells.get(reference)?.getAttribute('s')||fallback;
 }
 const courses=exportCourseOrder(workspace);
 const semesterCount=Math.max(9,...courses.map(course=>course.semester));
 if(semesterCount>3000)throw Error('La cantidad de semestres supera el ancho disponible en Excel.');
 const totalColumn=Math.max(53,8+semesterCount*5);
 // Los encabezados mantienen las bandas de cuatro columnas de la plantilla.
 for(const existing of retainedRows)existing.replaceChildren();
 merge(2,2,3,5);set(2,2,'Semestre',cellStyles.header);
 for(let semester=1;semester<=semesterCount;semester++){
  const column=6+(semester-1)*5;
  merge(2,column,3,column+3);set(2,column,'Semestre '+semester,cellStyles.header);
 }
 merge(2,totalColumn,3,totalColumn+3);set(2,totalColumn,'Totales',cellStyles.header);
 const locations=new Map(),creditsByScope={plan:[],outside:[]};
 const groups=[...(workspace.curriculum?.groups||[])];
 if(courses.some(course=>!groups.some(group=>group.id===course.curriculumGroup)))groups.push({id:'unplaced',name:'Por ubicar en la estructura',space:'',component:''});
 let current=5;
 function emitScope(inPlan){
  const scope=inPlan?'plan':'outside';
  if(!inPlan){
   merge(current,2,current,Math.min(totalColumn+3,50));set(current,2,'CRÉDITOS FUERA DEL PLAN DE ESTUDIOS',cellStyles.header);current+=2;
  }
  const labels=[];
  for(const group of groups){
   const assigned=courses.filter(course=>(course.inStudyPlan!==false)===inPlan&&(course.curriculumGroup===group.id||group.id==='unplaced'&&!workspace.curriculum?.groups.some(g=>g.id===course.curriculumGroup)));
   if(!assigned.length)continue;
   const slots=Math.max(1,...Array.from({length:semesterCount},(_,index)=>assigned.filter(course=>course.semester===index+1).length));
   const height=Math.max(6,slots*5+1),start=current,end=current+height-1;
   labels.push({start,end,space:group.space||'',component:group.component||''});
   merge(start,4,end,4);set(start,4,group.name,cellStyles.mallaMeta);
   const groupRefs=[];
   for(let semester=1;semester<=semesterCount;semester++){
    const column=6+(semester-1)*5;
    assigned.filter(course=>course.semester===semester).forEach((course,index)=>{
     const r=start+1+index*5,origin=mallaSource.courses.find(source=>source.id===course.mallaSource?.id);
     const sourceColumn=origin?.sourceColumn??6,sourceRow=origin?.sourceRow??6;
     const nameStyle=cellStyles.mallaCard(style(col(sourceColumn)+sourceRow));
     merge(r,column,r+1,column+3);
     const name=set(r,column,course.name,nameStyle);
     merge(r+2,column,r+2,column+1);
     const credit=set(r+2,column,course.credits,cellStyles.mallaCard(style(col(sourceColumn)+(sourceRow+2),cellStyles.center)));
     const presential=set(r+2,column+2,course.hours?.presential??null,cellStyles.mallaCard(style(col(sourceColumn+2)+(sourceRow+2),cellStyles.center)));
     const autonomous=set(r+2,column+3,course.hours?.autonomous??null,cellStyles.mallaCard(style(col(sourceColumn+3)+(sourceRow+2),cellStyles.center)));
     merge(r+3,column,r+3,column+3);set(r+3,column,course.details?.code||'',cellStyles.mallaCard(style(col(sourceColumn)+(sourceRow+3))));
     locations.set(course.id,{name,credit,presential,autonomous});
     groupRefs.push(credit);creditsByScope[scope].push({semester,credit,value:course.credits??0});
    });
   }
   const missing=assigned.some(course=>course.credits===null);
   merge(start+1,totalColumn,start+2,totalColumn+3);
   set(start+1,totalColumn,missing?'Total créditos conocidos':'Total créditos',cellStyles.header);
   merge(start+3,totalColumn,start+4,totalColumn+3);
   set(start+3,totalColumn,assigned.reduce((sum,course)=>sum+(course.credits??0),0),cellStyles.center,'SUM('+groupRefs.join(',')+')');
   current=end+2;
  }
  for(const [column,field] of [[2,'space'],[3,'component']]){
   let pending=null;
   function emitLabel(){
    if(!pending)return;
    merge(pending.start,column,pending.end,column);
    set(pending.start,column,pending.value,cellStyles.mallaMeta);
   }
   for(const label of labels){
    if(pending&&pending.value===label[field])pending.end=label.end;
    else{emitLabel();pending={start:label.start,end:label.end,value:label[field]};}
   }
   emitLabel();
  }
  merge(current,2,current+1,5);set(current,2,inPlan?'TOTAL CRÉDITOS DEL PLAN':'CRÉDITOS FUERA DEL PLAN (CONOCIDOS)',cellStyles.header);
  for(let semester=1;semester<=semesterCount;semester++){
   const column=6+(semester-1)*5,items=creditsByScope[scope].filter(item=>item.semester===semester);
   merge(current,column,current+1,column+3);
   set(current,column,items.reduce((sum,item)=>sum+item.value,0),cellStyles.header,'SUM('+(items.map(item=>item.credit).join(',')||'0')+')');
  }
  merge(current,totalColumn,current+1,totalColumn+3);
  set(current,totalColumn,creditsByScope[scope].reduce((sum,item)=>sum+item.value,0),cellStyles.header,'SUM('+(creditsByScope[scope].map(item=>item.credit).join(',')||'0')+')');
  current+=4;
 }
 emitScope(true);
 if(courses.some(course=>course.inStudyPlan===false))emitScope(false);
 merge(current,2,current,Math.min(totalColumn+3,50));set(current,2,'Cada tarjeta muestra: actividad / créditos / horas presenciales / horas autónomas / código.',cellStyles.body);
 current+=2;
 const missingCredits=courses.filter(course=>course.credits===null);
 if(missingCredits.length){merge(current,2,current,Math.min(totalColumn+3,50));set(current,2,missingCredits.length+' AC tienen los créditos pendientes de diligenciar.',cellStyles.body);}
 // Se completan los bordes de los rangos combinados de las tarjetas.
 function columnNumber(letters){
  let number=0;for(const letter of letters)number=number*26+letter.charCodeAt(0)-64;
  return number;
 }
 for(const range of [...merges.children]){
  const [first,last]=range.getAttribute('ref').split(':');
  const a=/([A-Z]+)([0-9]+)/.exec(first),b=/([A-Z]+)([0-9]+)/.exec(last);
  const firstRow=Number(a[2]),lastRow=Number(b[2]),firstColumn=columnNumber(a[1]),lastColumn=columnNumber(b[1]);
  const anchor=officeChildren(row(firstRow),'c').find(cell=>cell.getAttribute('r')===first);
  const cellStyle=anchor?.getAttribute('s')||cellStyles.body;
  for(let r=firstRow;r<=lastRow;r++){
   for(let c=firstColumn;c<=lastColumn;c++){
    if(r!==firstRow||c!==firstColumn)set(r,c,'',cellStyle);
   }
  }
 }
 for(const element of rowMap.values()){
  element.replaceChildren(...officeChildren(element,'c').sort((a,b)=>columnNumber(a.getAttribute('r').replace(/[0-9]/g,''))-columnNumber(b.getAttribute('r').replace(/[0-9]/g,''))));
 }
 body.replaceChildren(...[...rowMap.entries()].sort((a,b)=>a[0]-b[0]).map(([,element])=>element));
 merges.setAttribute('count',merges.children.length);
 for(const element of ['hyperlinks','drawing','legacyDrawing','conditionalFormatting','dataValidations','rowBreaks','colBreaks']){
  [...doc.getElementsByTagNameNS(ns,element)].forEach(node=>node.remove());
 }
 const dimension=doc.getElementsByTagNameNS(ns,'dimension')[0];if(dimension)dimension.setAttribute('ref','A1:'+col(totalColumn+3)+(current+1));
 const views=doc.getElementsByTagNameNS(ns,'sheetView')[0];
 if(views)views.replaceChildren(officeElement(doc,ns,'pane',{xSplit:5,ySplit:4,topLeftCell:'F5',activePane:'bottomRight',state:'frozen'}));
 const setup=doc.getElementsByTagNameNS(ns,'pageSetup')[0];
 if(setup){setup.setAttribute('orientation','landscape');setup.setAttribute('fitToWidth','1');setup.setAttribute('fitToHeight','0');}
 OfficeFiles.put(files,path,doc);
 return {path,entry:sourceEntry,relationId,locations};
}
