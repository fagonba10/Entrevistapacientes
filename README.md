# Cuestionario dietético para pacientes

Web sencilla (sin servidor ni base de datos) para enviar a tus pacientes. Ellos la rellenan desde el móvil u ordenador y **el informe te llega a tu correo**. Incluye:

1. Datos básicos del paciente
2. Cuestionario de actividad física (laborable / festivo, debe sumar 24 h)
3. Comidas habituales de una semana tipo: para cada comida (desayuno, media mañana, comida, merienda, cena) el paciente marca todo lo que suele tomar, con cuántos días a la semana la hace, hora y cantidades opcionales
4. Frecuencia de consumo: Sí / No por alimento y, si es Sí, cada cuánto (todos los alimentos de tu plantilla)
5. Preferencias y observaciones
6. Información de protección de datos, consentimiento explícito y firma manuscrita
7. Revisión y envío → correo con informe legible + copia de datos

Los pacientes pueden hacerlo poco a poco: se guarda solo en su dispositivo y, al enviar, se borra.

## Puesta en marcha (≈15 minutos)

### 1. Publicar en GitHub Pages
1. Crea una cuenta en github.com y un repositorio nuevo (por ejemplo `cuestionario`). Puede ser público: **no contiene datos de pacientes**, solo la web.
2. Sube todo el contenido de esta carpeta (botón *Add file → Upload files*).
3. *Settings → Pages → Build and deployment → Deploy from a branch → main / (root) → Save*.
4. En 1-2 minutos tendrás la web en `https://TU-USUARIO.github.io/cuestionario/`.

### 2. Activar el envío por correo (Web3Forms, gratuito)
1. Entra en https://web3forms.com, escribe **tu correo** y te enviarán una *Access Key*.
2. Abre `js/config.js` y pega la clave en `web3formsKey`.
3. Rellena el resto de `config.js` (nombre de la consulta, datos del responsable para la protección de datos…).
4. Prueba la web tú mismo antes de enviarla a nadie.

Mientras no haya clave, la web funciona en **modo de prueba** (no envía nada).

### 3. Enviar el enlace a cada paciente
Abre `…/generador.html`: escribes el nombre del paciente y copias el enlace o lo mandas por WhatsApp/correo.

### 4. Recibir y archivar el informe
Te llega un correo con el informe en texto ordenado. Para tener un **PDF con formato** para la ficha del paciente: abre `…/visor.html`, pega el campo `copia_datos_json` del correo y pulsa *Imprimir / Guardar PDF* (incluye la firma). Todo ocurre en tu navegador.

## Importante: protección de datos
- Los datos de salud son de **categoría especial (art. 9 RGPD)**. El texto de consentimiento incluido es una plantilla razonable, pero **hazlo revisar por tu asesor/DPO** y completa tus datos en `config.js`.
- Web3Forms actúa como **encargado del tratamiento**: revisa sus condiciones, su política de privacidad y firma el contrato de encargo si procede. Si prefieres otro proveedor europeo, solo hay que cambiar la función `send()` de `js/app.js`.
- La web no usa cookies, analítica ni fuentes externas.
- Los correos con datos de pacientes quedan en tu bandeja: aplica tu política de conservación y borrado.

## Limitaciones conocidas
- En el plan gratuito de Web3Forms no se adjuntan archivos: por eso el PDF se genera con el visor.
- Los pacientes pueden guardar su propia copia en PDF al terminar.
- La tabla de medidas caseras de tu PDF no está incluida (se puede añadir como ayuda en el diario).

## Archivos
`index.html` (cuestionario) · `generador.html` · `visor.html` · `js/config.js` (**lo único que debes editar**) · `js/data.js` (alimentos y actividades) · `css/styles.css`
