const documentListKeys=['prerequisites','priorKnowledge','objectives','methodology','research','internationalization','evaluation','resources','bibliography'];
function legacyList(value){return Array.isArray(value)?value:String(value||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);}
function listItemMarkup(text=''){return '<div class="structured-item"><textarea aria-label="Elemento de la lista" rows="2">'+esc(text)+'</textarea><button type="button" data-list-remove aria-label="Eliminar elemento">Quitar</button></div>';}
function listField(key,label,values){
 return '<section class="structured-field" data-list-key="'+key+'"><h4>'+esc(label)+'</h4><div class="structured-items">'+legacyList(values).map(value=>listItemMarkup(value)).join('')+'</div><button type="button" data-list-add>+ Añadir elemento</button></section>';
}
function topicMarkup(topic={title:'',items:[]}){
 return '<section class="topic-row"><div class="topic-heading"><label>Tema <input class="topic-title" value="'+esc(topic.title)+'" placeholder="Nombre del tema"></label><button type="button" data-topic-remove>Quitar tema</button></div><div class="topic-items">'+(topic.items||[]).map(item=>listItemMarkup(item)).join('')+'</div><button type="button" data-subtopic-add>+ Añadir subtema</button></section>';
}
function topicsForm(course){
 const topics=course?.topics||legacyList(course?.contents).map(title=>({title,items:[]}));
 return '<section class="structured-field topics-editor"><h3>Contenidos temáticos</h3><p class="meta">Organiza temas y subtemas. Se exportan numerados en Word.</p><div id="topicRows">'+topics.map(topicMarkup).join('')+'</div><button type="button" id="addTopic">+ Añadir tema</button></section>';
}
function readTopics(){
 const topics=[...$('form').querySelectorAll('.topic-row')].map(row=>({title:row.querySelector('.topic-title').value.trim(),items:[...row.querySelectorAll('.topic-items textarea')].map(input=>input.value.trim()).filter(Boolean)}));
 if(topics.some(t=>!t.title&&t.items.length))throw Error('Escribe el nombre del tema que contiene subtemas.');
 const nonempty=topics.filter(t=>t.title);
 return {topics:nonempty,contents:nonempty.map((t,i)=>(i+1)+'. '+t.title+'\n'+t.items.map((item,j)=>(i+1)+'.'+(j+1)+' '+item).join('\n')).join('\n')};
}
function courseAutoSummary(course){
 if(!course)return '<p class="form-note">Al guardar la AC, sus datos alimentarán el formato Word. Los RA y vínculos se completan en Actividades o Relaciones.</p>';
 const linked=data.links.filter(l=>l.course===course.id&&l.level!=='N');
 return '<div class="form-note"><strong>Datos enlazados al Word</strong><p>'+esc(course.name)+' · Semestre '+course.semester+' · '+esc(course.credits??'Pendiente')+' créditos · '+areaBadge(course.area)+'</p><p>'+course.outcomes.length+' RA propios · RA del programa: '+esc([...new Set(linked.map(l=>l.ra))].join(', ')||'Por vincular')+'. Los RA, competencias y cruces se toman automáticamente del mapeo al exportar.</p></div>';
}
document.addEventListener('click',event=>{
 const target=event.target;
 if(target.id==='addTopic')$('topicRows').insertAdjacentHTML('beforeend',topicMarkup());
 if(target.hasAttribute('data-topic-remove'))target.closest('.topic-row').remove();
 if(target.hasAttribute('data-subtopic-add'))target.closest('.topic-row').querySelector('.topic-items').insertAdjacentHTML('beforeend',listItemMarkup());
 if(target.hasAttribute('data-list-add'))target.closest('[data-list-key]').querySelector('.structured-items').insertAdjacentHTML('beforeend',listItemMarkup());
 if(target.hasAttribute('data-list-remove'))target.closest('.structured-item').remove();
});
