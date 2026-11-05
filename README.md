# Mapeo curricular UPTC y GIS

Piloto 0.1.0-piloto.1. Aplicación estática para organizar la malla, competencias, resultados de aprendizaje y aportes I/R/A. Se publica una sola aplicación; cada compañero trabaja sus AC y comparte archivos JSON por área.

## Uso

1. Abrir el enlace publicado. En Malla, filtrar por área y por uno o varios semestres.
2. Trabajar los RA propios y sus vínculos desde RA y contenidos, Relaciones o Matriz.
3. En Gestión > Archivos, exportar el área o respaldar la matriz general. El guardado del navegador es local; no hay sincronización automática ni cuentas de usuario.
4. Para integrar entregas, usar Reunir JSON de áreas y revisar las diferencias antes de aplicarlas. Cualquier compañero puede hacerlo. No hay coordinadores obligatorios.

Los datos personales del navegador no se suben a GitHub. El sitio sí publica los datos curriculares iniciales incorporados al código, las imágenes y las plantillas necesarias para generar documentos. Ver PUBLICACION.md antes de publicar.

## Desarrollo y validación

Requiere Node.js 22 o posterior. No hay dependencias que instalar.

```sh
npm run check
npm test
npm run build
npm run smoke
```

`dist/` contiene solo el sitio publicable; no se edita manualmente. `release.json` identifica la versión y las huellas SHA-256 de los archivos. Para revisar la aplicación localmente, servir la carpeta del proyecto o `dist/` mediante un servidor HTTP.

## Exportaciones

Excel incluye malla, matriz, RA propios, vínculos, nivel I/R/A, estados de revisión, decisiones de aporte, justificaciones y glosario. Formato oficial Word conserva únicamente la plantilla suministrada; Soporte del mapeo Word genera un documento independiente con trazabilidad y glosario.

JSON v2 separa nivel, revisión y decisión. Se pueden importar respaldos v1. El respaldo general incluye el historial; los paquetes de área mantienen su alcance. Ver JSON-FORMAT.md.

## Publicación

GitHub Actions valida el proyecto, prepara `dist/` y lo publica al actualizar `main`. Las solicitudes de cambio ejecutan las comprobaciones sin publicar. Configurar Settings > Pages > Source: GitHub Actions. Instrucciones en PUBLICACION.md.

Antes de cambiar de URL, navegador o equipo, exportar un respaldo JSON e importarlo en el nuevo destino. Los proyectos publicados bajo el mismo dominio mantienen almacenamientos separados por ruta.
