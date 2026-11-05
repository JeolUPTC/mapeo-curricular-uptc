# JSON de intercambio versión 2

Las relaciones actuales de `links` y de `deletedCourses[].links` usan tres campos independientes:

- `level`: `I`, `R`, `A` o `null` si no hay nivel confirmado.
- `reviewState`: `documented`, `support-pending`, `draft` o `reviewed`.
- `contribution`: `contributes` o `none`.

`none` requiere nivel nulo y estado `reviewed`. Un borrador requiere nivel nulo y decisión `contributes`. Los aportes con nivel distinguen soporte completo de soporte pendiente. Una combinación AC × RA sin registro sigue sin revisar; no equivale a sin aporte.

La importación acepta versiones 1 y 2 y comprueba contradicciones antes de sustituir datos. El almacenamiento interno conserva un adaptador v1 para mantener el historial y la integración de paquetes por área. Los registros históricos antes/después conservan su formato original: no se reescribe la evidencia de decisiones anteriores.

El respaldo general conserva el historial; los paquetes por área conservan el alcance de sus AC y cruces. Todas las áreas deben usar esta versión de la aplicación para abrir archivos v2.

Los estados de soporte se derivan de los RA propios seleccionados y la justificación; no son una aprobación académica. Los acuerdos de criterios tienen responsable, fecha y referencia propios.
