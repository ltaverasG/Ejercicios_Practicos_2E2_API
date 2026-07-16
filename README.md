# Challenge de Automatizacion QA — demoblaze.com

Hola. En este repositorio les dejo mi solucion al challenge de automatizacion. Lo construi con **TypeScript + Playwright** y cubre los dos ejercicios que me pidieron.

> **Nota sobre herramientas:** use Claude para la documentacion tecnica y subida al repositorios. 

1. **Ejercicio 1 (E2E):** el flujo completo de compra en [https://www.demoblaze.com](https://www.demoblaze.com/)
2. **Ejercicio 2 (API):** las pruebas de los servicios REST `signup` y `login` de [https://api.demoblaze.com](https://api.demoblaze.com)

Como me indicaron que Cypress era deseable para la parte de API, resolvi el mismo ejercicio tambien en ese framework. Lo dejo en la carpeta `cypress-example/`.

**Todo lo que esta aca lo ejecute de verdad antes de subirlo.** No les dejo codigo que "deberia funcionar": corri cada prueba contra los sitios reales y en el camino encontre dos bugs en mis propias pruebas que tuve que corregir. Los detalles de eso los cuento en [`CONCLUSIONES.md`](CONCLUSIONES.md), que creo que es la parte mas interesante del entregable.

**Estado final:** E2E estable (5 corridas seguidas en verde) + API 4/4 en Playwright + Cypress 4/4.

---

## 1. Como organice el proyecto

```
challenge_automatizacion/
├── pages/                        # Page Objects (POM) que arme para el ejercicio E2E
│   ├── HomePage.ts
│   ├── ProductPage.ts
│   ├── CartPage.ts
│   └── OrderModal.ts
├── tests/
│   ├── e2e/
│   │   └── purchase-flow.spec.ts # Ejercicio 1: el flujo de compra completo
│   └── api/
│       └── signup-login.spec.ts  # Ejercicio 2: signup y login
├── cypress-example/               # La version en Cypress de las pruebas de API
│   ├── cypress.config.ts
│   └── cypress/e2e/signup-login.cy.ts
├── evidence/                      # Las salidas que capture al ejecutar
│   └── api-outputs.json           # status + body real de las 4 llamadas
├── .vscode/                       # Deje VS Code preconfigurado (tareas y debug)
├── playwright.config.ts
├── package.json
├── tsconfig.json
├── README.md                      # Este archivo
└── CONCLUSIONES.md                # Mis hallazgos y conclusiones
```

Para el E2E use **Page Object Model**. La razon es simple: demoblaze cambia selectores de vez en cuando, y prefiero que si algo se rompe tenga que tocar un solo archivo en `pages/` y no el test completo.

---

## 2. Lo que necesitan tener instalado

- [Node.js](https://nodejs.org/) 18 o superior (yo lo probe con Node 24)
- npm (viene con Node.js)
- Conexion a internet, porque las pruebas corren contra los sitios reales `demoblaze.com` y `api.demoblaze.com`

Nada mas. Todo el proyecto corre con Node, no necesitan instalar nada externo.

---

## 3. Instalacion

Parense en la carpeta `challenge_automatizacion/` y corran:

```bash
# 1. Instalo las dependencias de Node
npm install

# 2. Instalo los navegadores que usa Playwright
npx playwright install
```

Si solo quieren correr las pruebas de API, el paso 2 no es obligatorio. Igual se los recomiendo para que puedan ver el E2E funcionando.

---

## 4. Como correr las pruebas

### 4.1 Ejercicio 1 — E2E (flujo de compra)

```bash
npm run test:e2e
```

Esto corre `tests/e2e/purchase-flow.spec.ts`, que hace exactamente lo que pedia el enunciado:

1. Agrega **dos productos** al carrito (Samsung galaxy s6 y Nokia lumia 1520)
2. Entra al carrito y **valida que ambos productos esten ahi**
3. Le da click a **"Place Order"** y **llena el formulario** de compra (nombre, pais, ciudad, tarjeta, mes, ano)
4. Le da click a **"Purchase"** y valida el mensaje de confirmacion, incluyendo el detalle de la orden (Id, Amount, Card Number, Name, Date)

Si lo quieren ver corriendo con el navegador visible (que es lo que yo hago cuando estoy depurando):

```bash
npm run test:headed
```

Y si quieren explorarlo paso a paso, el modo UI de Playwright es lo mejor que hay:

```bash
npm run test:ui
```

> **Un detalle sobre la confirmacion:** el enunciado pide validar **"THANK YOU FOR YOUR ORDER"**, pero cuando lo corri me di cuenta de que el texto real del sitio es **"Thank you for your purchase!"**. Lo explico a fondo en las conclusiones, pero adelanto que resolvi validando con una expresion flexible que cubre las dos variantes.

### 4.2 Ejercicio 2 — API (signup y login)

```bash
npm run test:api
```

Esto corre `tests/api/signup-login.spec.ts` contra `https://api.demoblaze.com` y cubre los 4 casos que me pidieron. Estas son las **salidas reales** que capture al ejecutarlo:

| # | Caso | Endpoint | Status | Body real que devuelve |
|---|------|----------|--------|------------------------|
| 1 | Crear un nuevo usuario | `POST /signup` | `200` | `""` (vacio) |
| 2 | Crear un usuario ya existente | `POST /signup` | `200` | `{"errorMessage":"This user already exist."}` |
| 3 | Login correcto | `POST /login` | `200` | `"Auth_token: cWFfdXNlcl8xNzg0..."` |
| 4 | Login incorrecto | `POST /login` | `200` | `{"errorMessage":"Wrong password."}` |

Cada usuario de prueba lo genero con un timestamp (`qa_user_<timestamp>`) para que no choquen entre corridas.

**Sobre la evidencia:** al terminar la suite se genera solo el archivo [`evidence/api-outputs.json`](evidence/api-outputs.json) con el `status` y el `body` completo de las 4 llamadas. Lo deje versionado en el repo para que puedan ver las salidas sin tener que correr nada. El reporte HTML de Playwright queda en `playwright-report/`.

### 4.3 Correr todo junto

```bash
npm test
```

### 4.4 Ver el reporte HTML

```bash
npm run report
```

### 4.5 Validar que el E2E no sea flaky

Este comando me parece importante y por eso lo dejo documentado. Corre el E2E 5 veces seguidas y sin reintentos:

```bash
npx playwright test tests/e2e --project=e2e-ui --repeat-each=5 --retries=0
```

Lo agregue porque, como cuento en las conclusiones, **una sola corrida verde me engano**: la prueba pasaba a veces y fallaba otras. Solo repitiendola descubri el problema.

---

## 5. Probarlo en Visual Studio Code

Deje la carpeta `.vscode/` ya configurada para que no tengan que armar nada.

### 5.1 Abrir el proyecto

Importante: abran **la carpeta `challenge_automatizacion`** directamente, no la carpeta padre. Si abren la de arriba, la extension de Playwright no encuentra el `playwright.config.ts` y no les va a detectar las pruebas.

```bash
code challenge_automatizacion
```

### 5.2 Instalar la extension

Al abrir el proyecto, VS Code les va a sugerir las extensiones recomendadas (las deje en `.vscode/extensions.json`). La que realmente importa es **Playwright Test for VSCode** (`ms-playwright.playwright`). Aceptenla, o busquenla a mano en el panel de extensiones.

### 5.3 Correr sin escribir comandos

Deje 9 tareas listas. Abran la paleta con **`Ctrl+Shift+P`** → escriban **`Tasks: Run Task`** y eligen:

| Tarea | Que hace |
|-------|----------|
| `0. Setup: instalar dependencias + navegadores` | Corranla primero, hace todo el setup |
| `1. Correr suite completa (E2E + API)` | Todo junto (tambien con `Ctrl+Shift+B`) |
| `2. Correr E2E con navegador visible` | Para verlo en accion |
| `3. Correr solo API (4 casos)` | Solo el ejercicio 2 |
| `4. Validar estabilidad E2E (5 corridas)` | El chequeo de flakiness que menciono arriba |
| `5. Abrir modo UI de Playwright` | El explorador interactivo |
| `6. Ver reporte HTML` | Abre el ultimo reporte |
| `7. Correr Cypress (API)` | La version en Cypress |
| `8. Verificar tipos TypeScript` | `tsc --noEmit`, sin errores |

### 5.4 Correr desde el panel de Testing

Con la extension de Playwright instalada, en la barra lateral les aparece el icono del matraz (**Testing**). Ahi ven el arbol completo de pruebas y pueden:

- Darle play a una prueba individual
- Ponerle un **breakpoint** en cualquier linea del `.spec.ts` y darle al boton de debug (se detiene ahi y pueden inspeccionar variables)
- Activar **"Show browser"** para ver el navegador mientras corre

### 5.5 Depurar con F5

Tambien deje 4 configuraciones de debug (`.vscode/launch.json`). Van a la pestana **Run and Debug** (`Ctrl+Shift+D`), eligen una del desplegable y le dan **F5**:

- `Debug: Prueba E2E (flujo de compra)` — corre el E2E con navegador visible
- `Debug: Pruebas de API (4 casos)` — corre solo la API
- `Debug: Archivo de prueba abierto` — corre el archivo que tengan abierto
- `Debug: Suite completa (E2E + API)` — todo

### 5.6 Como saber que quedo bien

Si al correr la tarea 1 ven esto, esta todo funcionando:

```
Running 5 tests using 1 worker
  ok 1 [e2e-ui] Flujo de compra E2E ...
  ok 2 [api]    Caso 1: crear un nuevo usuario en /signup
  ok 3 [api]    Caso 2: intentar crear un usuario ya existente
  ok 4 [api]    Caso 3: login con usuario y password correctos
  ok 5 [api]    Caso 4: login con usuario y/o password incorrectos
  5 passed
```

### 5.7 Si algo les falla

| Problema | Solucion |
|----------|----------|
| No aparecen las pruebas en el panel Testing | Abrieron la carpeta padre en vez de `challenge_automatizacion`. Cierren y abran la correcta. |
| `browserType.launch: Executable doesn't exist` | Falta `npx playwright install` (o corran la tarea 0). |
| Errores rojos de TypeScript en el editor | `Ctrl+Shift+P` → `TypeScript: Select TypeScript Version` → `Use Workspace Version`. |
| El E2E falla por timeout | Suele ser demoblaze que esta lento o caido. Verifiquen abriendo el sitio en el navegador. |

---

## 6. Una nota importante sobre la API de demoblaze

Esto me parece lo mas relevante que encontre y quiero dejarlo claro desde el README.

La API de `api.demoblaze.com` **no sigue las convenciones REST de codigos de estado**. Tanto los casos exitosos como los de error (usuario duplicado, credenciales malas) responden **HTTP 200**. La unica forma de distinguir exito de error es leyendo el **body**.

Y ademas hay un detalle que solo descubri ejecutando: **el body no tiene un tipo consistente**. Los errores vienen como objeto JSON (`{"errorMessage": "..."}`), pero los exitos vienen como string. Esto hizo fallar mis pruebas en los dos frameworks hasta que lo corregi.

Por eso mis pruebas validan **status + contenido del body**, nunca solo el status. Si solo validaran el `200`, los 4 casos pasarian siempre y las pruebas no servirian para nada. Lo explico completo en [`CONCLUSIONES.md`](CONCLUSIONES.md).

---

## 7. El ejemplo deseable: Cypress

Resolvi el mismo Ejercicio 2 (API) tambien en Cypress. **Lo ejecute y pasa 4/4.**

```bash
npm install        # Cypress ya viene en las devDependencies

npm run cy:open    # Modo interactivo
npm run cy:run     # Modo headless (para CI)
```

Archivo: [`cypress-example/cypress/e2e/signup-login.cy.ts`](cypress-example/cypress/e2e/signup-login.cy.ts). Uso `cy.request()` para pegarle directo a la API, con los mismos 4 casos que la version de Playwright.

Resultado de la corrida:

```
  √ Caso 1: crea un nuevo usuario en /signup (508ms)
  √ Caso 2: intenta crear un usuario ya existente (131ms)
  √ Caso 3: login con usuario y password correctos (222ms)
  √ Caso 4: login con password incorrecto (127ms)

  4 passing (1s)
```

---

## 8. Scripts disponibles

| Script | Que hace |
|--------|----------|
| `npm test` | Corre todas las pruebas de Playwright (E2E + API) |
| `npm run test:e2e` | Solo el ejercicio E2E |
| `npm run test:api` | Solo el ejercicio de API |
| `npm run test:headed` | Con el navegador visible |
| `npm run test:ui` | El modo UI interactivo de Playwright |
| `npm run report` | Abre el ultimo reporte HTML |
| `npm run cy:open` | Cypress en modo interactivo |
| `npm run cy:run` | Cypress en headless |

---

## 9. Entregables

- Este repositorio publico en Git con todo el codigo
- El archivo `.zip` con el codigo fuente completo
- Este `README.md` con las instrucciones y [`CONCLUSIONES.md`](CONCLUSIONES.md) con mis hallazgos
- La evidencia de las salidas de API en [`evidence/api-outputs.json`](evidence/api-outputs.json)
