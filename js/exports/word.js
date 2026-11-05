async function exportWord(workspace,course,kind='official'){
 const files=await OfficeFiles.template('assets/templates/contenidos-ac.docx');
 const doc=OfficeFiles.xml(files,'word/document.xml'),w=OfficeNames.word;
 const body=doc.getElementsByTagNameNS(w,'body')[0];
 const tables=officeChildren(body,'tbl');
 if(tables.length!==19)throw Error('La plantilla de contenidos no coincide con el formato esperado.');
 const rows=table=>officeChildren(table,'tr');
 function cells(row){
  const logical=[];
  for(const cell of officeChildren(row,'tc')){
   const span=Number(cell.getElementsByTagNameNS(w,'gridSpan')[0]?.getAttributeNS(w,'val')||1);
   for(let i=0;i<span;i++)logical.push(cell);
  }
  return logical;
 }
 function paragraph(text,bold=false){
  const p=officeElement(doc,w,'w:p');
  const r=officeElement(doc,w,'w:r'),properties=officeElement(doc,w,'w:rPr');
  properties.append(officeElement(doc,w,'w:sz',{'w:val':20}),officeElement(doc,w,'w:color',{'w:val':'222222'}));
  if(bold)properties.append(officeElement(doc,w,'w:b'));
  r.append(properties);
  const t=officeElement(doc,w,'w:t');t.setAttributeNS('http://www.w3.org/XML/1998/namespace','xml:space','preserve');t.textContent=String(text??'');
  r.append(t);p.append(r);return p;
 }
 function text(cell,value){
  const properties=officeChildren(cell,'tcPr')[0];
  cell.replaceChildren(...(properties?[properties]:[]));
  for(const line of String(value??'').split(/\r?\n/))cell.append(paragraph(line));
 }
 function write(table,row,column,value){text(cells(rows(tables[table])[row])[column],value);}
 function value(input){return input===null||input===undefined||input===''?'Pendiente de diligenciar':input;}
 const details=course.details||{},hours=course.hours||{},group=curriculumGroup(workspace,course.curriculumGroup);
 const allLinks=workspace.links.filter(l=>l.course===course.id);
 const links=allLinks.filter(l=>l.level!=='N');
 const linkedPrograms=workspace.program.filter(r=>links.some(l=>l.ra===r.id));
 const competencies=[...new Set(linkedPrograms.map(r=>r.competency))];
 for(const row of [0,1])for(const column of [1,2,3])write(0,row,column,'');
 write(0,0,1,details.createdAt||'');write(0,1,1,details.updatedAt||'');
 write(0,2,1,details.version||'');
 write(1,0,1,details.faculty||'INGENIERÍA');
 write(1,0,3,details.programName||'SISTEMAS Y COMPUTACIÓN');
 write(3,0,2,course.name);write(3,1,2,details.code||'');write(3,2,2,course.semester);
 write(3,3,1,course.credits);write(3,3,5,hours.theory??'');write(3,3,8,hours.practice??'');write(3,3,11,hours.autonomous??'');
 const metadata=[
  [4,details.maxStudents],[5,course.nature],[6,details.modality],[7,details.campus],[8,details.category],
  [9,details.trainingSpace||group?.space],[10,details.component||group?.component],[11,details.origin||group?.name],[12,exportArea(workspace,course.area)],[13,details.efsh],
  [16,competencies.map(id=>competencyDescription(workspace,id)).join('\n')],[17,linkedPrograms.map(r=>r.id+'. '+r.text).join('\n')]
 ];
 for(const [row,content] of metadata)write(3,row,2,value(content));
 write(3,14,2,value(details.complementarity));write(3,14,10,details.complementarityPlaces||'');
 write(3,15,2,details.transversal||'');write(3,15,6,details.transversalGroups||'');
 write(4,3,0,details.teachers||'');write(4,3,1,value(details.teacherProfile));write(4,3,2,hours.presential??'');
 const sectionList=key=>details.lists?.[key]?.map((text,index)=>(index+1)+'. '+text).join('\n')||details[key];
 const thematicContents=course.topics?.length?course.topics.map((topic,i)=>(i+1)+'. '+topic.title+'\n'+topic.items.map((item,j)=>(i+1)+'.'+(j+1)+' '+item).join('\n')).join('\n'):course.contents;
 const sections=[
  [6,1,details.presentation],[6,2,''],[7,1,sectionList('prerequisites')],[7,3,sectionList('priorKnowledge')],
  [8,1,sectionList('objectives')],[9,1,course.outcomes.map((o,i)=>'RA-AC '+(i+1)+'. '+o.text+'\nBloom: '+o.level).join('\n\n')],
  [11,1,thematicContents],[12,1,sectionList('methodology')],[13,1,sectionList('research')],[14,1,sectionList('internationalization')],
  [15,1,sectionList('evaluation')],[16,1,sectionList('resources')],[17,1,sectionList('bibliography')]
 ];
 for(const [table,row,content] of sections)write(table,row,0,content===''?'':value(content));
 for(const table of [11,12,13,14,15])write(table,2,0,'');
 const author=[...body.children].find(el=>el.localName==='p'&&el.textContent.trim()==='Elaboró:');
 if(author){author.replaceChildren(...paragraph('Elaboró: '+(details.author||'Pendiente de diligenciar')).childNodes);}
 const annex=tables[18];
 write(18,1,0,value(competencies.map(id=>competencyDescription(workspace,id)).join('\n')));
 write(18,3,0,value(linkedPrograms.map(r=>r.id+'. '+r.text).join('\n')));
 const prototype=rows(annex)[6].cloneNode(true);
 const totalsPrototype=rows(annex).at(-1).cloneNode(true);
 rows(annex).slice(6).forEach(row=>row.remove());
 const outcomes=course.outcomes.length?course.outcomes:[null];
 for(const [index,outcome] of outcomes.entries()){
  const row=prototype.cloneNode(true);
  const hours=outcome?.hours||{};
  const total=['theory','practice','autonomous'].every(k=>typeof hours[k]==='number')?hours.theory+hours.practice+hours.autonomous:'';
  const mapped=outcome?links.filter(l=>l.outcomes.includes(outcome.id)):[];
  const values=[outcome?.competencyType||'',outcome?.competencyText||'',outcome?'RA-AC '+(index+1):'Pendiente',
   outcome?outcome.text+'\nAporta a: '+(mapped.map(l=>l.ra).join(', ')||'Pendiente'):value(),
   outcome?'Bloom: '+outcome.level:'',hours.theory??'',hours.practice??'',hours.autonomous??'',total];
  const logical=cells(row);values.forEach((value,i)=>text(logical[i],value));
  [...row.getElementsByTagNameNS(w,'trHeight')].forEach(n=>n.remove());
  annex.append(row);
 }
 const totals=totalsPrototype.cloneNode(true),totalCells=cells(totals);
 text(totalCells[0],'TOTAL HORAS');
 const sums={};
 for(const key of ['theory','practice','autonomous']){
  sums[key]=course.outcomes.length&&course.outcomes.every(o=>typeof o.hours?.[key]==='number')?course.outcomes.reduce((sum,o)=>sum+o.hours[key],0):null;
 }
 ['theory','practice','autonomous'].forEach((key,index)=>text(totalCells[index+5],sums[key]??''));
 text(totalCells[8],Object.values(sums).every(n=>typeof n==='number')?sums.theory+sums.practice+sums.autonomous:'');
 annex.append(totals);
 if(kind==='official'){
  for(const table of tables)for(const row of rows(table))[...row.getElementsByTagNameNS(w,'trHeight')].forEach(n=>n.remove());
  OfficeFiles.put(files,'word/document.xml',doc);
  downloadFile((kind==='support'?'Soporte-':'')+course.name.replace(/[^\p{L}\p{N}-]+/gu,'-')+'.docx',OfficeFiles.zip(files),'application/vnd.openxmlformats-officedocument.wordprocessingml.document');return;
 }
 const finalSection=officeChildren(body,'sectPr')[0];body.replaceChildren(...(finalSection?[finalSection]:[]));
 body.insertBefore(paragraph('Soporte del mapeo de '+course.name,true),finalSection||null);

 const heading=paragraph('TRAZABILIDAD DEL MAPEO CURRICULAR',true);
 const trace=officeElement(doc,w,'w:tbl');
 const properties=officeElement(doc,w,'w:tblPr');
 properties.append(officeElement(doc,w,'w:tblW',{'w:w':12900,'w:type':'dxa'}));
 const borders=officeElement(doc,w,'w:tblBorders');
 for(const side of ['top','left','bottom','right','insideH','insideV'])borders.append(officeElement(doc,w,'w:'+side,{'w:val':'single','w:sz':4,'w:color':'B4B4A8'}));
 properties.append(borders);trace.append(properties);
 const widths=[1200,1100,1100,700,1700,1400,4700],grid=officeElement(doc,w,'w:tblGrid');
 widths.forEach(width=>grid.append(officeElement(doc,w,'w:gridCol',{'w:w':width})));trace.append(grid);
 function traceRow(values,isHeader=false){
  const row=officeElement(doc,w,'w:tr');
  if(isHeader){const pr=officeElement(doc,w,'w:trPr');pr.append(officeElement(doc,w,'w:tblHeader'));row.append(pr);}
  values.forEach((content,index)=>{
   const cell=officeElement(doc,w,'w:tc'),pr=officeElement(doc,w,'w:tcPr');
   pr.append(officeElement(doc,w,'w:tcW',{'w:w':widths[index],'w:type':'dxa'}));
   if(isHeader)pr.append(officeElement(doc,w,'w:shd',{'w:fill':'FFCC29'}));
   cell.append(pr);
   String(content??'').split(/\r?\n/).forEach(line=>cell.append(paragraph(line,isHeader)));
   row.append(cell);
  });
  trace.append(row);
 }
 traceRow(['RA de la AC','RA del programa','Competencia','I/R/A','Estado de revisión','Decisión de aporte','Justificación y evaluación'],true);
 for(const link of allLinks){
  const program=workspace.program.find(r=>r.id===link.ra);
  const codes=link.outcomes.map(id=>'RA-AC '+(course.outcomes.findIndex(o=>o.id===id)+1));
  traceRow([codes.join(', ')||'Pendiente',link.ra,program.competency,exportLevel(link),exportLinkState(link),exportContribution(link),link.why||'—']);
 }
 for(const outcome of course.outcomes.filter(o=>!links.some(l=>l.outcomes.includes(o.id)))){
  traceRow(['RA-AC '+(course.outcomes.indexOf(outcome)+1),'Pendiente','','','Sin vincular','Por definir','Resultado de la actividad pendiente de vincular.']);
 }
 for(const r of workspace.program.filter(r=>!allLinks.some(l=>l.ra===r.id)))traceRow(['—',r.id,r.competency,'','Sin revisar','Por definir','—']);
 const section=officeChildren(body,'sectPr')[0];
 body.insertBefore(heading,section||null);body.insertBefore(trace,section||null);
 body.insertBefore(paragraph('La columna I/R/A indica el aporte de la actividad al RA del programa. Bloom describe el desempeño del RA de la actividad.'),section||null);
 // Las filas de datos pueden crecer al diligenciar el formato.
 for(const table of tables){
  for(const row of rows(table)){
   [...row.getElementsByTagNameNS(w,'trHeight')].forEach(n=>n.remove());
  }
 }
 // Separate the documentary annex in portrait without changing the template sections.
 if(section){
  const sectionBreak=officeElement(doc,w,'w:p'),breakPr=officeElement(doc,w,'w:pPr');
  breakPr.append(section.cloneNode(true));sectionBreak.append(breakPr);body.insertBefore(sectionBreak,section);
  const portrait=[...body.getElementsByTagNameNS(w,'sectPr')].find(candidate=>{const size=candidate.getElementsByTagNameNS(w,'pgSz')[0];return size&&Number(size.getAttributeNS(w,'w'))<Number(size.getAttributeNS(w,'h'));});
  if(portrait){
   for(const type of ['headerReference','footerReference'])officeChildren(section,type).forEach(node=>node.remove());
   [...officeChildren(portrait,'headerReference'),...officeChildren(portrait,'footerReference')].reverse().forEach(node=>section.prepend(node.cloneNode(true)));
  }
  const size=section.getElementsByTagNameNS(w,'pgSz')[0];
  if(size){size.setAttributeNS(w,'w:w','11906');size.setAttributeNS(w,'w:h','16838');size.setAttributeNS(w,'w:orient','portrait');}
 }
 function supportParagraph(content,bold=false){
  const p=paragraph(content,bold);p.getElementsByTagNameNS(w,'sz')[0].setAttribute('w:val',bold?24:22);
  const spacing=officeElement(doc,w,'w:pPr');spacing.append(officeElement(doc,w,'w:spacing',{'w:after':120}));p.prepend(spacing);return p;
 }
 const supportTitle=supportParagraph('GLOSARIO Y CRITERIOS DEL MAPEO',true);
 const pagePr=officeChildren(supportTitle,'pPr')[0];pagePr.append(officeElement(doc,w,'w:keepNext'));body.insertBefore(supportTitle,section||null);
 for(const row of documentationRows(workspace).slice(1)){
  const title=supportParagraph(row[0]+' · '+row[1],true);
  const pr=officeChildren(title,'pPr')[0];pr.append(officeElement(doc,w,'w:keepNext'));body.insertBefore(title,section||null);
  for(const line of String(row[2]).split(/\r?\n/))body.insertBefore(supportParagraph(line),section||null);
  body.insertBefore(supportParagraph('Estado / alcance: '+row[3]+(row[4]?' · '+row[4]:'')),section||null);
 }
 OfficeFiles.put(files,'word/document.xml',doc);
 downloadFile((kind==='support'?'Soporte-':'')+course.name.replace(/[^\p{L}\p{N}-]+/gu,'-')+'.docx',OfficeFiles.zip(files),'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
}



