# Publicación del piloto en GitHub Pages

Estado: preparado localmente; todavía sin repositorio remoto ni sitio publicado.

## Información necesaria

- Cuenta propietaria. La sesión local identificó JeolUPTC, pendiente de confirmar.
- Nombre del repositorio; propuesta: mapeo-curricular-uptc.
- Visibilidad del repositorio y autorización para publicar los datos curriculares iniciales, textos y plantillas incluidos en la aplicación. GitHub Pages normalmente deja el sitio accesible públicamente, incluso con repositorio privado. GitHub Free requiere repositorio público para Pages.
- Sesión de GitHub válida con permiso para crear o administrar ese repositorio y configurar Pages.

La credencial local de GitHub CLI aparece inválida. El propietario debe ejecutar `gh auth login --hostname github.com --web` y completar la autenticación en el navegador. No enviar contraseñas ni tokens por el chat.

## Qué se publica

Solo `index.html`, `css/`, `js/`, `assets/`, `.nojekyll` y el manifiesto `release.json`. Incluye los logos UPTC y GIS, datos curriculares iniciales codificados en JavaScript y las dos plantillas Office. Estos recursos son descargables por quien tenga acceso al sitio.

Los JSON diligenciados, respaldos, archivos exportados y credenciales no se incluyen en `dist/`. `.gitignore` excluye los JSON de trabajo y los documentos exportados; únicamente permite las dos plantillas de `assets/templates/`. Revisar siempre los archivos preparados antes del primer envío. No se añaden licencias de terceros ni autorizaciones institucionales que no se hayan suministrado.

## Primera publicación

1. Crear un repositorio vacío con el nombre y la visibilidad acordados. Subir el proyecto completo, incluidos `.github/workflows/pages.yml`, scripts y pruebas. No subir `dist/` ni los JSON de trabajo.
2. Mantener la rama principal como `main`.
3. En Settings > Pages, seleccionar GitHub Actions como fuente. Si la primera ejecución falla porque Pages aún no estaba configurado, volver a ejecutarla desde Actions.
4. Ejecutar el flujo Publicar piloto en GitHub Pages. Revisar que validación, pruebas, construcción y publicación terminen correctamente.
5. La URL será `https://CUENTA.github.io/REPOSITORIO/`. La página del flujo también informa la URL real.
6. En esa URL, verificar importación/exportación de JSON por área, integración con conflictos, matriz, grafo y las tres exportaciones Office. Importar un JSON de prueba en un navegador de prueba para evitar sustituir el trabajo personal.
7. Crear la etiqueta `v0.1.0-piloto.1` apuntando al commit publicado y registrar el enlace del commit. Compartir el enlace estable y la guía PILOTO.md.

## Trabajo cotidiano y respaldos

Cada compañero abre el enlace y completa sus AC. Al terminar exporta el área con fecha; antes de abrir o integrar otros archivos guarda un respaldo general. Los archivos se comparten por el medio que ya use el equipo, no a través del repositorio de código.

Cualquier compañero puede reunir JSON de áreas. Revisar los conflictos, guardar el resultado con fecha y compartirlo como nuevo punto de partida. Los catálogos de competencias y RA deben coincidir para integrar paquetes; compartir un respaldo actualizado tras cambiar el catálogo común.

## Actualizaciones y recuperación

Antes de actualizar: respaldar los datos de trabajo. Preparar el cambio en una rama, ejecutar las pruebas y fusionar a `main`; el flujo publica la nueva versión. Actualizar la versión de package.json y los identificadores de caché del HTML cuando cambien archivos de la aplicación.

Para revertir el código, revertir el commit de la actualización y volver a publicar. Los datos del navegador no se restauran al revertir código: se recuperan importando el JSON correspondiente en una versión compatible. No volver a una versión anterior a JSON v2 con entregas v2 sin revisar compatibilidad.

No cambiar el nombre del repositorio o el dominio durante el piloto sin preparar la migración de respaldos. La dirección nueva tiene otro almacenamiento local. Nunca asumir que el enlace recupera automáticamente los cambios de otro compañero.

## Referencias

- https://docs.github.com/en/get-started/start-your-journey/deploying-your-website-automatically
- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
