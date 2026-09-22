# Revisión de seguridad Firebase — adjudicaciones

Alcance: reglas prototipo para la base `adjudications`, estudio, registros clínicos, entregas individuales, referencias y ranking.

## Controles evaluados

- Lectura pública: bloqueada por la regla de denegación final.
- Acceso de otro anotador: bloqueado; una entrega sólo se lee y escribe cuando `request.auth.uid` coincide con el ID de documento.
- Elevación de privilegios: bloqueada; el rol de investigador se lee sólo desde el *custom claim* `researcher`, que el cliente no puede escribir.
- Cambio de titularidad: bloqueado; `ownerUid`, identificador de discrepancia, fila, hash fuente y fecha de creación son inmutables tras la creación.
- Escrituras inválidas: bloqueadas por validadores de esquema, enumeraciones, tipos, longitudes y marcas temporales recientes en creación y actualización.
- Mezcla de datos: los documentos de miembros no contienen correo ni otros datos personales; el acceso a evidencia clínica se restringe a miembros del estudio o investigador.
- Ranking manipulable: bloqueado para clientes; las escrituras quedan cerradas para reservarlas a un proceso administrativo de servidor.

## Riesgos operativos pendientes

1. La asignación de la marca `researcher` requiere un proceso administrativo confiable (Admin SDK o servicio de servidor); nunca se otorga desde el navegador.
2. Los documentos clínicos y las asignaciones deben cargarse desde un proceso administrativo, no en GitHub Pages.
3. Antes de abrir el estudio a una cohorte amplia, probar estas reglas con dos cuentas reales y el emulador de Firestore.
