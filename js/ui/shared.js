const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>crypto.randomUUID?.() ?? Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-');
const opt=(v,t,s)=>'<option value="'+esc(v)+'" '+(v===s?'selected':'')+'>'+esc(t)+'</option>';
const button=(action,id,label,extra='')=>'<button type="button" data-action="'+action+'" data-id="'+esc(id)+'" '+extra+'>'+esc(label)+'</button>';
const courses=()=>data.courses.filter(c=>(!area||c.area===area)&&(planScope==='all'||(planScope==='outside'?c.inStudyPlan===false:c.inStudyPlan!==false))).sort((a,b)=>a.semester-b.semester||(a.order??a.sourceNumber??999)-(b.order??b.sourceNumber??999)||a.name.localeCompare(b.name,'es'));
const areaName=id=>data.areas.find(a=>a.id===id)?.name;
const link=(c,r)=>data.links.find(l=>l.course===c&&l.ra===r);
const filters=()=>'<div class="bar"><label>Área <select id="areaFilter">'+opt('','Todas las áreas',area)+data.areas.map(a=>opt(a.id,a.name,area)).join('')+'</select></label><label>Ubicación <select id="planScope">'+opt('plan','Dentro del plan',planScope)+opt('outside','Fuera del plan',planScope)+opt('all','Todas',planScope)+'</select></label></div>';
const demoNote='<p class="muted">Datos ilustrativos. Los enunciados del programa están abreviados y los aportes de muestra son hipotéticos.</p>';



// A single stable palette keyed by area ID, shared across every view.
function areaHue(id){
 let hash=0;for(const character of id||'unassigned')hash=(hash*31+character.charCodeAt(0))|0;
 return Math.abs(hash)%360;
}
function areaBadge(id){
 return '<span class="area-badge" style="--area-hue:'+areaHue(id)+'">'+esc(areaName(id))+'</span>';
}
