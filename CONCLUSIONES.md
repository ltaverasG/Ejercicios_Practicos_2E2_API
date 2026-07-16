# Mis conclusiones del Challenge de Automatizacion

## 1. Que hice

Automatice dos flujos sobre `demoblaze.com`:

- **E2E (UI):** la compra completa de dos productos hasta la confirmacion del pedido, con Playwright + TypeScript y Page Object Model.
- **API:** los 4 casos de prueba sobre `signup` y `login` con el `APIRequestContext` de Playwright, y ademas los mismos casos resueltos en Cypress, que era el deseable.

Quiero empezar por lo que me parece mas importante de contar: **ejecute todo antes de entregarlo**, y eso cambio el resultado. En la primera corrida real se me cayeron pruebas en los dos frameworks y encontre una prueba que pasaba solo a veces. Si hubiera entregado sin ejecutar, habria entregado codigo roto que "se veia bien". Los dos bugs que encontre y como los resolvi son, para mi, lo mas valioso de este entregable, asi que los detallo mas abajo.

**Estado final:** 5/5 en verde (1 E2E + 4 API) en Playwright, 4/4 en Cypress, y el E2E validado con 5 corridas consecutivas sin reintentos.

### La ultima ejecucion

```
Running 5 tests using 1 worker

  ok 1 [e2e-ui] Flujo de compra E2E - agrega productos, revisa el carrito y finaliza la compra con confirmacion (6.5s)
  ok 2 [api]    Caso 1: crear un nuevo usuario en /signup
  ok 3 [api]    Caso 2: intentar crear un usuario ya existente
  ok 4 [api]    Caso 3: login con usuario y password correctos
  ok 5 [api]    Caso 4: login con usuario y/o password incorrectos

  5 passed (8.5s)
```

Y estas son las salidas reales que capture de la API (las deje tambien en [`evidence/api-outputs.json`](evidence/api-outputs.json)):

| Caso | Status | Body real |
|------|--------|-----------|
| Signup nuevo usuario | 200 | `""` (vacio) |
| Signup usuario existente | 200 | `{"errorMessage":"This user already exist."}` |
| Login correcto | 200 | `"Auth_token: cWFfdXNlcl8xNzg0MTUwNjQ3OTgxMTc4NDc1MA=="` |
| Login incorrecto | 200 | `{"errorMessage":"Wrong password."}` |

---

## 2. Lo que encontre

### 2.1 La API no usa los codigos HTTP de forma estandar

Tanto las respuestas exitosas como las de error de `POST /signup` y `POST /login` devuelven **HTTP 200**. La API nunca responde `400`, `401` ni `409` para errores de negocio como un usuario duplicado o credenciales invalidas. Lo unico que distingue un exito de un error es el **body**:

| Caso | Status | Body real (confirmado ejecutando) |
|------|--------|-----------------------------------|
| Signup exitoso | 200 | `""` (cadena vacia) |
| Signup usuario duplicado | 200 | `{"errorMessage": "This user already exist."}` |
| Login correcto | 200 | `"Auth_token: <token-base64>"` (string) |
| Login incorrecto | 200 | `{"errorMessage": "Wrong password."}` |

**Lo que esto significa para QA:** un pipeline que solo valide `response.status === 200` daria **falsos positivos** en los dos casos de error. Las pruebas pasarian siempre y no servirian para nada. Por eso las mias validan **status + contenido del body** en los 4 casos. Para mi este es el hallazgo mas importante del ejercicio de API, porque demuestra por que un smoke test de status code no alcanza cuando trabajas contra APIs de terceros o legacy.

### 2.2 Bug #1: el body no tiene un tipo consistente (se me cayeron los 2 frameworks)

Este lo encontre ejecutando, y no lo habria encontrado de otra forma.

Los casos de **error** devuelven un **objeto JSON** (`{"errorMessage": "..."}`), pero los casos de **exito** devuelven un **string** (vacio en signup, `"Auth_token: ..."` en login). Es decir, el mismo endpoint cambia el tipo del body segun el resultado.

Yo habia escrito las aserciones asumiendo que el body siempre era texto, usando `String(body)`. El problema es que `String()` sobre un objeto no da el JSON, da la cadena literal `"[object Object]"`. Resultado de la primera corrida real:

- **Playwright:** 1 fallo
- **Cypress:** 2 fallos

El error era siempre el mismo: `expected '[object Object]' to match /wrong|incorrect/i`.

**Como lo corregi:** agregue un helper `asText()` en ambos frameworks, que hace `JSON.stringify` cuando el body es un objeto y lo deja igual cuando ya es string:

```ts
const asText = (body: unknown): string =>
  typeof body === 'string' ? body : JSON.stringify(body);
```

Despues del fix: **Playwright 4/4, Cypress 4/4.**

Me parece interesante que el mismo defecto de la API se manifestara en los dos frameworks a la vez. Es una señal de que el problema no estaba en la herramienta sino en mi suposicion sobre el contrato de la API, y que ninguna herramienta te salva de una suposicion equivocada: solo ejecutar contra el servicio real te la corrige.

### 2.3 Bug #2: el carrito no garantiza el orden (una prueba flaky)

Este es el que mas me gusto encontrar, porque es el tipico bug que se cuela a produccion.

Mi prueba E2E validaba el carrito asi:

```ts
await expect(cart.productNames).toContainText([PRODUCT_1, PRODUCT_2]);
```

Y **paso en las primeras corridas**. Pero al volver a ejecutarla, fallo:

```
Array [
-   "Samsung galaxy s6",     <- lo que yo esperaba en la posicion 1
    "Nokia lumia 1520",
+   "Samsung galaxy s6",     <- lo que realmente vino
  ]
```

Lo importante: **no era un bug del sitio**. El carrito **si tenia los dos productos**. El bug era mio: `toContainText` con un array compara **elemento por elemento en orden**, y demoblaze devuelve los items del carrito en un orden **no determinista**. A veces salen en el orden en que los agregas, a veces al reves. Mi prueba dependia de algo que la aplicacion nunca prometio.

**Como lo corregi:** valido que ambos productos esten presentes, sin importar el orden:

```ts
const names = await cart.productNames.allTextContents();
expect(names.map((n) => n.trim())).toEqual(
  expect.arrayContaining([PRODUCT_1, PRODUCT_2]),
);
```

Y despues **la corri 5 veces seguidas sin reintentos** (`--repeat-each=5 --retries=0`) para comprobar que de verdad quedo estable:

```
  ok 1 ... (8.2s)
  ok 2 ... (7.1s)
  ok 3 ... (7.1s)
  ok 4 ... (7.1s)
  ok 5 ... (7.3s)
  5 passed (40.5s)
```

**La leccion que me llevo:** una sola corrida verde no significa que la prueba sea buena. Me engano. Una prueba E2E hay que repetirla antes de darla por buena, porque una corrida sola esconde las dependencias de orden y de timing. Por eso deje ese comando documentado en el README y como tarea de VS Code: quiero que sea facil repetir esa validacion.

### 2.4 Las alertas del carrito son nativas, no modales HTML

Cuando agregas un producto al carrito, demoblaze dispara un `window.alert()` nativo del navegador ("Product added"), no un modal de HTML. Hay que manejarlo con el evento `dialog` de Playwright (`page.waitForEvent('dialog')` + `dialog.accept()`). Si no lo manejas, la prueba se queda colgada esperando a que el alert se cierre y termina en timeout.

### 2.5 El texto de confirmacion no es el que dice el enunciado

El enunciado pide validar **"THANK YOU FOR YOUR ORDER"**, pero el texto real que muestra el sitio en el modal de confirmacion (un sweet-alert) es **"Thank you for your purchase!"**, seguido del detalle con `Id`, `Amount`, `Card Number`, `Name` y `Date`.

Decidi validar el texto real con una expresion flexible (`/thank you for your (purchase|order)/i`). Mi razonamiento: la intencion del requerimiento es confirmar que la orden se completo, y eso es lo que valido. Usar la expresion flexible cubre las dos variantes, asi que la prueba sigue sirviendo si el sitio cambia ese copy. Me parecio mas util que fallar por una diferencia de texto que no tiene que ver con el funcionamiento.

### 2.6 Genero los datos con timestamp

Para que las pruebas de API no fallen por colisiones entre corridas (un usuario que ya use en una ejecucion anterior), genero el username con timestamp: `qa_user_<timestamp>`. Esto me sirve tambien para encadenar los casos de forma logica: creo el usuario en el caso 1, y ese mismo usuario me sirve para probar "usuario ya existente" en el caso 2 y "login correcto" en el caso 3.

---

## 3. Por que tome estas decisiones

- **Page Object Model en el E2E:** separo la interaccion con el DOM (`pages/`) de las aserciones (`tests/e2e/`). Si demoblaze cambia un selector, toco un solo archivo y no el test.

- **`test.describe.serial` en las pruebas de API:** los 4 casos comparten el usuario que se crea en el primer test, asi que tienen que correr en orden y no en paralelo. Si corrieran en paralelo, el caso 2 podria ejecutarse antes de que exista el usuario.

- **Guardar la evidencia a disco** (`evidence/api-outputs.json`): ademas de las aserciones, guardo el `status` y el `body` crudo de cada llamada. El enunciado pedia "capturar las salidas", y me parecio que un JSON versionado en el repo es la forma mas util de entregarlo: se puede revisar sin tener que correr nada.

- **Resolver la API tambien en Cypress:** implemente los mismos 4 casos en Playwright y en Cypress para cubrir el deseable, manteniendo el mismo criterio de aceptacion en los dos. Los dos los ejecute de verdad (Cypress con `cypress run`) y los dos pasan 4/4.

---

## 4. Limitaciones y que haria despues

- **La suite corre contra el sitio real.** Eso es bueno porque valida de verdad, pero significa que si demoblaze esta caido o lento, las pruebas fallan por razones ajenas al codigo. En un proyecto real pondria estas pruebas contra un ambiente controlado, o al menos separaria el smoke E2E del set de regresion para no bloquear el pipeline.

- **Las aserciones dependen del texto de los mensajes.** Si demoblaze cambia el copy de los errores, mis regex (`/exist/i`, `/wrong|incorrect|not found/i`) son flexibles y deberian aguantar, pero conviene revisarlas de vez en cuando contra la evidencia capturada.

- **Proximo paso natural:** meter esto en CI (GitHub Actions) corriendo el set de API en cada push y el E2E en un schedule diario, con el reporte HTML y `api-outputs.json` publicados como artifacts. La estructura ya esta lista para eso.
