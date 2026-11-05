async function exportExcel(workspace){
 const files=await OfficeFiles.template('assets/templates/mapeo-curricular.xlsx');
 const ns=OfficeNames.spreadsheet;
 const styles=OfficeFiles.xml(files,'xl/styles.xml');
 const fonts=styles.getElementsByTagNameNS(ns,'fonts')[0];
 const fills=styles.getElementsByTagNameNS(ns,'fills')[0];
 const borders=styles.getElementsByTagNameNS(ns,'borders')[0];
 const formats=styles.getElementsByTagNameNS(ns,'cellXfs')[0];
 function font(bold=false,white=false){
  const index=fonts.children.length,node=officeElement(styles,ns,'font');
  node.append(officeElement(styles,ns,'sz',{val:10}),officeElement(styles,ns,'name',{val:'Calibri'}),officeElement(styles,ns,'color',{rgb:white?'FFFFFFFF':'FF20201E'}));
  if(bold)node.append(officeElement(styles,ns,'b'));
  fonts.append(node);fonts.setAttribute('count',fonts.children.length);return index;
 }
 function fill(color){
  const index=fills.children.length,node=officeElement(styles,ns,'fill'),pattern=officeElement(styles,ns,'patternFill',{patternType:'solid'});
  pattern.append(officeElement(styles,ns,'fgColor',{rgb:color}),officeElement(styles,ns,'bgColor',{indexed:64}));node.append(pattern);
  fills.append(node);fills.setAttribute('count',fills.children.length);return index;
 }
 const normalFont=font(),boldFont=font(true),whiteFont=font(true,true);
 const yellowFill=fill('FFFFCC29'),paleFill=fill('FFFFF7DA'),darkFill=fill('FF292925');
 const borderId=borders.children.length,border=officeElement(styles,ns,'border');
 for(const side of ['left','right','top','bottom']){
  const line=officeElement(styles,ns,side,{style:'thin'});line.append(officeElement(styles,ns,'color',{rgb:'FFDDE1D5'}));border.append(line);
 }
 borders.append(border);borders.setAttribute('count',borders.children.length);
 function format(fontId,fillId=0,center=false){
  const id=formats.children.length,node=officeElement(styles,ns,'xf',{numFmtId:0,fontId,fillId,borderId,xfId:0,applyFont:1,applyFill:1,applyBorder:1,applyAlignment:1});
  node.append(officeElement(styles,ns,'alignment',{horizontal:center?'center':'left',vertical:'center',wrapText:1}));
  formats.append(node);formats.setAttribute('count',formats.children.length);return String(id);
 }
 const cellStyles={body:format(normalFont),center:format(normalFont,0,true),header:format(boldFont,yellowFill,true),I:format(boldFont,paleFill,true),R:format(boldFont,yellowFill,true),A:format(whiteFont,darkFill,true)};
 const mallaStyleCache=new Map();
 cellStyles.mallaCard=original=>{
  const key=String(original);
  if(mallaStyleCache.has(key))return mallaStyleCache.get(key);
  const copy=formats.children[Number(original)].cloneNode(true);
  const originalFont=fonts.children[Number(copy.getAttribute('fontId'))].cloneNode(true);
  let size=officeChildren(originalFont,'sz')[0];
  if(!size){size=officeElement(styles,ns,'sz');originalFont.append(size);}
  size.setAttribute('val','10');
  const fontId=fonts.children.length;fonts.append(originalFont);fonts.setAttribute('count',fonts.children.length);
  copy.setAttribute('fontId',fontId);copy.setAttribute('borderId',borderId);copy.setAttribute('applyBorder','1');copy.setAttribute('applyAlignment','1');
  officeChildren(copy,'alignment').forEach(node=>node.remove());
  copy.append(officeElement(styles,ns,'alignment',{horizontal:'center',vertical:'center',wrapText:1}));
  const styleId=String(formats.children.length);formats.append(copy);formats.setAttribute('count',formats.children.length);
  mallaStyleCache.set(key,styleId);return styleId;
 };
 const meta=formats.children[Number(cellStyles.center)].cloneNode(true);
 officeChildren(meta,'alignment')[0].setAttribute('textRotation','90');
 officeChildren(meta,'alignment')[0].setAttribute('shrinkToFit','1');
 cellStyles.mallaMeta=String(formats.children.length);formats.append(meta);formats.setAttribute('count',formats.children.length);

 OfficeFiles.put(files,'xl/styles.xml',styles);
 const workbook=OfficeFiles.xml(files,'xl/workbook.xml');
 const relationships=OfficeFiles.xml(files,'xl/_rels/workbook.xml.rels');
 const mallaSheet=buildMallaSheet(files,workbook,relationships,workspace,cellStyles);
 OfficeFiles.put(files,'xl/styles.xml',styles);
 const sheetEntry=[...workbook.getElementsByTagNameNS(ns,'sheet')].find(s=>s.getAttribute('name')==='Mapeo Curricular');
 const relationId=sheetEntry.getAttributeNS(OfficeNames.relationship,'id');
 const relation=[...relationships.documentElement.children].find(r=>r.getAttribute('Id')===relationId);
 const target=relation.getAttribute('Target').replace(/^\//,'');
 const path=target.startsWith('xl/')?target:'xl/'+target;
 const main=OfficeFiles.xml(files,path);
 const sheetData=main.getElementsByTagNameNS(ns,'sheetData')[0];
 const templateRows=officeChildren(sheetData,'row');
 const header=templateRows.filter(row=>Number(row.getAttribute('r'))<=6);
 const prototype=templateRows.find(row=>row.getAttribute('r')==='7');
 const styleByColumn=new Map(officeChildren(prototype,'c').map(cell=>[cell.getAttribute('r').replace(/\d/g,''),cell.getAttribute('s')]));
 function column(index){
  let label='';
  for(let value=index+1;value;value=Math.floor((value-1)/26))label=String.fromCharCode(65+(value-1)%26)+label;
  return label;
 }
 function cell(doc,index,row,value,style){
  const node=officeElement(doc,ns,'c',{r:column(index)+row});
  if(style)node.setAttribute('s',style);
  if(typeof value==='number'){
   const v=officeElement(doc,ns,'v');v.textContent=String(value);node.append(v);
  }else if(value!==null&&value!==undefined&&value!==''){
   node.setAttribute('t','inlineStr');
   const text=officeElement(doc,ns,'t');text.setAttributeNS('http://www.w3.org/XML/1998/namespace','xml:space','preserve');text.textContent=String(value);
   const inline=officeElement(doc,ns,'is');inline.append(text);node.append(inline);
  }
  return node;
 }
 function setCell(doc,row,reference,value){
  const old=officeChildren(row,'c').find(c=>c.getAttribute('r')===reference);
  const letters=reference.replace(/\d/g,'');
  let index=0;for(const letter of letters)index=index*26+letter.charCodeAt(0)-64;
  const node=cell(doc,index-1,Number(row.getAttribute('r')),value,old?.getAttribute('s'));
  if(old)old.replaceWith(node);else row.append(node);
 }
 sheetData.replaceChildren(...header);
 for(const row of header){
  for(const node of officeChildren(row,'c')){
   const column=node.getAttribute('r').replace(/\d/g,'');
   if(column.length>1||column>'Q')node.remove();
   else node.setAttribute('s',cellStyles.header);
  }
 }
 const columnDefinitions=main.getElementsByTagNameNS(ns,'col');
 for(const definition of [...columnDefinitions]){
  definition.removeAttribute('hidden');
  if(Number(definition.getAttribute('min'))>17)definition.remove();
 }
 const raCount=workspace.program.length,creditCol=4+raCount,lastCol=creditCol+5;
 const allCourses=exportCourseOrder(workspace);
 const sorted=allCourses.filter(course=>course.inStudyPlan!==false);
 const byLink=(c,r)=>workspace.links.find(l=>l.course===c&&l.ra===r);
 sorted.forEach((course,index)=>{
  const rowIndex=index+7;
  const hours=course.hours||{};
  const values=[index+1,course.semester,course.name,course.nature||'',...workspace.program.map(r=>exportLevel(byLink(course.id,r.id))),course.credits,hours.theory,hours.practice,hours.presential,hours.autonomous,hours.total];
  const row=officeElement(main,ns,'row',{r:rowIndex,ht:32,customHeight:1});
  values.forEach((value,col)=>row.append(cell(main,col,rowIndex,value,col>=4&&col<creditCol?(cellStyles[value]||cellStyles.center):col===2||col===3?cellStyles.body:cellStyles.center)));
  const location=mallaSheet.locations.get(course.id);
  function linked(columnIndex,address,value){
   if(!location||value===null||value===undefined)return;
   const existing=officeChildren(row,'c').find(c=>c.getAttribute('r')===column(columnIndex)+rowIndex);
   const replacement=officeElement(main,ns,'c',{r:column(columnIndex)+rowIndex,s:existing.getAttribute('s')});
   if(typeof value==='string')replacement.setAttribute('t','str');
   const formula=officeElement(main,ns,'f');formula.textContent="'Ajuste07092026'!"+address;
   const cached=officeElement(main,ns,'v');cached.textContent=String(value);replacement.append(formula,cached);existing.replaceWith(replacement);
  }
  linked(2,location?.name,course.name);linked(creditCol,location?.credit,course.credits);
  linked(creditCol+3,location?.presential,hours.presential);linked(creditCol+4,location?.autonomous,hours.autonomous);
  sheetData.append(row);
 });
 const totalRow=sorted.length+7;
 const total=officeElement(main,ns,'row',{r:totalRow,ht:26,customHeight:1});
 total.append(cell(main,2,totalRow,'TOTAL CRÉDITOS',cellStyles.header),cell(main,creditCol,totalRow,sorted.reduce((sum,c)=>sum+c.credits,0),cellStyles.header));
 sheetData.append(total);
 const headerRow=(n)=>officeChildren(sheetData,'row').find(row=>row.getAttribute('r')===String(n));
 if(raCount!==7){
  for(const row of header)row.replaceChildren();
  [...main.getElementsByTagNameNS(ns,'mergeCells')].forEach(node=>node.remove());
  ['N.º','Semestre','Actividad curricular','Naturaleza'].forEach((label,i)=>setCell(main,headerRow(6),column(i)+'6',label));
  ['Créditos','H. teoría','H. práctica','H. presenciales','H. autónomas','H. totales'].forEach((label,i)=>setCell(main,headerRow(6),column(creditCol+i)+'6',label));
  const cols=main.getElementsByTagNameNS(ns,'cols')[0];
  if(cols){cols.replaceChildren();for(let i=0;i<=lastCol;i++)cols.append(officeElement(main,ns,'col',{min:i+1,max:i+1,width:i===2?48:i===3?22:16,customWidth:1}));}
 }
 workspace.program.forEach((r,index)=>{
  setCell(main,headerRow(2),column(index+4)+'2',r.competency);
  setCell(main,headerRow(4),column(index+4)+'4',r.id);
  setCell(main,headerRow(6),column(index+4)+'6',r.level);
 });
 for(const tag of ['autoFilter','conditionalFormatting','hyperlinks','drawing','legacyDrawing','rowBreaks','colBreaks']){
  [...main.getElementsByTagNameNS(ns,tag)].forEach(element=>element.remove());
 }
 const dimension=main.getElementsByTagNameNS(ns,'dimension')[0];if(dimension)dimension.setAttribute('ref','A1:'+column(lastCol)+totalRow);
 const view=main.getElementsByTagNameNS(ns,'sheetView')[0];
 if(view){view.replaceChildren(officeElement(main,ns,'pane',{xSplit:4,ySplit:6,topLeftCell:'E7',activePane:'bottomRight',state:'frozen'}));}
 const setup=main.getElementsByTagNameNS(ns,'pageSetup')[0];
 if(setup){setup.setAttribute('orientation','landscape');setup.setAttribute('fitToWidth','1');setup.setAttribute('fitToHeight','0');}
 OfficeFiles.put(files,path,main);
 const sheets=workbook.getElementsByTagNameNS(ns,'sheets')[0];sheets.replaceChildren(mallaSheet.entry,sheetEntry);
 [...relationships.documentElement.children].filter(r=>r.getAttribute('Type')?.endsWith('/worksheet')&&r.getAttribute('Id')!==relationId&&r.getAttribute('Id')!==mallaSheet.relationId||r.getAttribute('Type')?.endsWith('/calcChain')).forEach(r=>r.remove());
 [...workbook.getElementsByTagNameNS(ns,'definedNames')].forEach(n=>n.remove());
 const types=OfficeFiles.xml(files,'[Content_Types].xml');
 const details=[['Área','Actividad curricular','RA de la AC','Enunciado RA de la AC','Bloom RA de la AC','RA del programa','Enunciado RA del programa','Competencia','I/R/A','Justificación y evaluación','Estado de revisión','Decisión de aporte','Celda de origen','Ubicación']];
 const outcomes=[['Área','Semestre','Actividad curricular','RA de la AC','Enunciado','Bloom','RA del programa vinculados','Ubicación']];
 for(const course of allCourses){
  const detailStart=details.length,outcomeStart=outcomes.length;
  if(!course.outcomes.length)outcomes.push([exportArea(workspace,course.area),course.semester,course.name,'Pendiente','Pendiente de diligenciar','','']);
  if(!course.outcomes.length&&!workspace.links.some(l=>l.course===course.id))details.push([exportArea(workspace,course.area),course.name,'Pendiente','','','','','','','','Sin revisar','Por definir','']);
  for(const [index,outcome] of course.outcomes.entries()){
   const links=workspace.links.filter(l=>l.course===course.id&&l.outcomes.includes(outcome.id));
   outcomes.push([exportArea(workspace,course.area),course.semester,course.name,'RA-AC '+(index+1),outcome.text,outcome.level,links.map(l=>l.ra).join(', ')]);
   if(!links.length)details.push([exportArea(workspace,course.area),course.name,'RA-AC '+(index+1),outcome.text,outcome.level,'','','','','','Sin vincular','Por definir','']);
  }
  for(const link of workspace.links.filter(l=>l.course===course.id)){
   const program=workspace.program.find(r=>r.id===link.ra);
   const linked=link.outcomes.length?link.outcomes:[null];
   for(const id of linked){
    const index=course.outcomes.findIndex(o=>o.id===id),outcome=course.outcomes[index];
    details.push([exportArea(workspace,course.area),course.name,outcome?'RA-AC '+(index+1):'Pendiente',outcome?.text||'',outcome?.level||'',program.id,program.text,program.competency,exportLevel(link),link.why,exportLinkState(link),exportContribution(link),link.source?.cell||'']);
   }
  }
  const scope=course.inStudyPlan===false?'Fuera del plan':'Dentro del plan';
  for(let i=detailStart;i<details.length;i++)details[i].push(scope);
  for(let i=outcomeStart;i<outcomes.length;i++)outcomes[i].push(scope);
 }
 const reviewRows=[['Área','Actividad curricular','RA del programa','Nivel I/R/A','Estado de revisión','Decisión de aporte','Justificación']];
 for(const c of allCourses)for(const r of workspace.program){const l=byLink(c.id,r.id);reviewRows.push([exportArea(workspace,c.area),c.name,r.id,exportLevel(l),exportLinkState(l),exportContribution(l),l?.why||'']);}
 const criteria=[['Origen','Contenido'],...curricularSource.guidance.filter(Boolean).map(text=>['Notas del Excel de origen',text]),['Lectura del archivo','Las áreas no están informadas en la hoja. Los RA de las AC y sus justificaciones se completan en la aplicación.']];
 for(const note of mallaSource.notes||[]){
  criteria.push(['Ajuste07092026 · opción registrada, sin aplicar',note.text+' · Valores originales: '+note.values.map(([cell,value])=>cell+' = '+value).join(', ')]);
 }
 function addSheet(name,rows,widths){
  const index=sheets.children.length+1;
  const newPath='xl/worksheets/export-'+index+'.xml';
  const id='exportSheet'+index;
  const entry=officeElement(workbook,ns,'sheet',{name,sheetId:100+index});
  entry.setAttributeNS(OfficeNames.relationship,'r:id',id);sheets.append(entry);
  relationships.documentElement.append(officeElement(relationships,OfficeNames.packageRelationship,'Relationship',{Id:id,Type:OfficeNames.relationship+'/worksheet',Target:newPath.slice(3)}));
  types.documentElement.append(officeElement(types,OfficeNames.content,'Override',{PartName:'/'+newPath,ContentType:'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml'}));
  const doc=document.implementation.createDocument(ns,'worksheet');
  const root=doc.documentElement;
  const views=officeElement(doc,ns,'sheetViews'),v=officeElement(doc,ns,'sheetView',{workbookViewId:0});
  v.append(officeElement(doc,ns,'pane',{ySplit:1,topLeftCell:'A2',activePane:'bottomLeft',state:'frozen'}));views.append(v);root.append(views);
  const cols=officeElement(doc,ns,'cols');
  widths.forEach((width,i)=>cols.append(officeElement(doc,ns,'col',{min:i+1,max:i+1,width,customWidth:1})));root.append(cols);
  const body=officeElement(doc,ns,'sheetData');
  rows.forEach((values,i)=>{
   const lines=Math.max(...values.map((value,j)=>String(value??'').split(/\r?\n/).reduce((count,line)=>count+Math.max(1,Math.ceil(line.length/(widths[j]||40))),0)));
   const row=officeElement(doc,ns,'row',{r:i+1,ht:i===0?32:Math.min(300,Math.max(28,lines*14+8)),customHeight:1});
   values.forEach((value,j)=>row.append(cell(doc,j,i+1,value,i===0?cellStyles.header:cellStyles.body)));
   body.append(row);
  });
  root.append(body);
  root.append(officeElement(doc,ns,'autoFilter',{ref:'A1:'+column(rows[0].length-1)+rows.length}));
  OfficeFiles.put(files,newPath,doc);
 }
 addSheet('Estado del mapeo',reviewRows,[28,48,18,14,28,22,85]);
 addSheet('RA de las AC',outcomes,[26,12,48,14,85,18,26,20]);
 addSheet('Trazabilidad',details,[26,48,14,80,18,18,85,14,10,85,28,22,18,20]);
 addSheet('Catálogo del programa',[['RA','Competencia','Bloom','Enunciado'],...workspace.program.map(r=>[r.id,r.competency,r.level,r.text])],[12,16,18,100]);
 addSheet('Criterios de origen',criteria,[32,120]);
 const contentRows=[['Área','AC','Sección','Orden','Contenido','Ubicación']];
 for(const course of workspace.courses){
  const append=(section,order,text)=>contentRows.push([exportArea(workspace,course.area),course.name,section,order,text,course.inStudyPlan===false?'Fuera del plan':'Dentro del plan']);
  if(course.topics?.length)course.topics.forEach((topic,i)=>{append('Tema',String(i+1),topic.title);topic.items.forEach((item,j)=>append('Subtema',(i+1)+'.'+(j+1),item));});
  else if(course.contents)append('Contenidos anteriores','',course.contents);
  for(const [key,list] of Object.entries(course.details?.lists||{}))list.forEach((item,i)=>append((typeof courseDocumentFields!=='undefined'&&courseDocumentFields.find(([id])=>id===key)?.[1])||key,String(i+1),item));
 }
 addSheet('Contenidos de las AC',contentRows,[28,48,35,12,105,20]);
 addSheet('Competencias',[['Código','Enunciado actual','Fuente','Objetivos','RA vinculados','Estado','Acuerdo','Propuestas pendientes'],...(workspace.competencies||[]).map(c=>[c.id,c.text,c.source,c.objectives.join(', '),workspace.program.filter(r=>r.competency===c.id).map(r=>r.id).join(', '),c.status==='agreed'?'Acuerdo registrado':'Pendiente de validar',[c.responsible,c.date,c.reference].filter(Boolean).join(' · '),(c.proposals||[]).map(p=>p.cell+': '+p.text).join('\n')])],[12,90,40,18,24,28,50,110]);
 addSheet('Referencia PAE',[['Código PAE','Enunciado','Página','Alcance'],...competencySource.pae.map(c=>[c.id,c.text,c.page,competencySource.note])],[14,100,12,100]);
 addSheet('Glosario y criterios',documentationRows(workspace),[28,38,100,40,55]);
 for(const name of Object.keys(files)){
  if(name.startsWith('xl/worksheets/')&&name!==path&&name!==mallaSheet.path&&!name.includes('/export-'))delete files[name];
 }
 [...types.documentElement.children].filter(e=>{
  const part=e.getAttribute('PartName');
  return part?.startsWith('/xl/worksheets/')&&!files[part.slice(1)];
 }).forEach(e=>e.remove());
 delete files['xl/calcChain.xml'];
 [...types.documentElement.children].filter(e=>e.getAttribute('PartName')==='/xl/calcChain.xml').forEach(e=>e.remove());
 for(const view of workbook.getElementsByTagNameNS(ns,'workbookView'))view.setAttribute('activeTab','0');
 OfficeFiles.put(files,'xl/workbook.xml',workbook);OfficeFiles.put(files,'xl/_rels/workbook.xml.rels',relationships);OfficeFiles.put(files,'[Content_Types].xml',types);
 downloadFile('Mapeo-curricular.xlsx',OfficeFiles.zip(files),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}




