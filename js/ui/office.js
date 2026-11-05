async function runOfficeExport(button,callback){
 const label=button.textContent;
 button.disabled=true;button.textContent='Generando…';
 try{
  await callback();
  $('status').textContent='Archivo generado con el formato suministrado';
 }catch(error){
  $('status').textContent='No se pudo generar el archivo. '+error.message;
 }finally{
  button.disabled=false;button.textContent=label;
 }
}
