// Ensayo automático de docs/GUIA_DEMO.md (skill «demo»). Requiere la app corriendo con DEMO_MODE=true en http://localhost:3000
// y Playwright disponible (en la nube viene instalado). Uso: node scripts/guion-demo.cjs <carpeta-de-capturas>
// Recorre docs/GUIA_DEMO.md (10 pasos) con Playwright. Capturas a 360 y 1366 px + verificaciones por pantalla.
const { chromium } = require('playwright');
const DIR = process.argv[2] ?? 'capturas-demo';
require('node:fs').mkdirSync(DIR, { recursive: true });
const BASE = 'http://localhost:3000';
const resultados = [];
let n = 0;
const sufijo = String(Date.now()).slice(-6);

async function capturar(p, paso, nombre) {
  n++;
  const base = `${DIR}/paso-${String(paso).padStart(2, '0')}-${nombre}`;
  await p.setViewportSize({ width: 360, height: 800 });
  await p.waitForTimeout(250);
  const chk = await p.evaluate(() => {
    const aviso = [...document.querySelectorAll('[role=note]')].some(
      (e) => /Simulación académica/.test(e.textContent) && e.offsetParent !== null,
    );
    const texto = document.body.innerText.toLowerCase();
    const prohibido =
      /n[uú]mero de tarjeta|\bcvv\b|\bcvc\b|fecha de vencimiento de la tarjeta|cuenta bancaria|\bcard number\b/.test(
        texto,
      );
    const ccInputs = document.querySelectorAll(
      'input[autocomplete^="cc-"], input[name*="card" i], input[name*="tarjeta" i], input[name*="cvv" i]',
    ).length;
    const desborde = document.documentElement.scrollWidth > document.documentElement.clientWidth;
    return { aviso, prohibido, ccInputs, desborde };
  });
  await p.screenshot({ path: `${base}-360.png` });
  await p.setViewportSize({ width: 1366, height: 800 });
  await p.waitForTimeout(250);
  await p.screenshot({ path: `${base}-1366.png` });
  await p.setViewportSize({ width: 360, height: 800 });
  const fallas = [];
  if (!chk.aviso) fallas.push('sin aviso de simulación');
  if (chk.prohibido || chk.ccInputs) fallas.push('pide datos de tarjeta/bancarios');
  if (chk.desborde) fallas.push('desborde horizontal a 360 px');
  resultados.push({
    paso,
    pantalla: nombre,
    ok: fallas.length === 0,
    detalle: fallas.join('; ') || 'ok',
    captura: `${base}-{360,1366}.png`,
  });
}
function registrar(paso, pantalla, ok, detalle) {
  resultados.push({ paso, pantalla, ok, detalle, captura: '—' });
}

async function login(p, email, clave) {
  await p.goto(`${BASE}/login`);
  await p.fill('#email', email);
  await p.fill('#contrasena', clave);
  await p.getByRole('button', { name: 'Ingresar' }).click();
  await p.waitForURL((u) => !u.pathname.startsWith('/login'));
}
async function cotizar(p, { uso = 'PARTICULAR', anio = '2022', clase = 'AUTOMOVIL', modelo = 'Yaris', tel }) {
  await p.goto(`${BASE}/cotizar`);
  await p.selectOption('#uso', uso);
  await p.selectOption('#marca', 'Toyota');
  await p.fill('#modelo', modelo);
  await p.fill('#anio', anio);
  await p.selectOption('#clase', clase);
  await p.selectOption('#tipo', 'SEDAN');
  await p.selectOption('#departamento', 'Lima');
  await p.fill('#provincia', 'Lima');
  await p.fill('#distrito', 'Miraflores');
  await p.fill('#nombres', 'Cliente Demo');
  await p.fill('#telefono', tel ?? '9' + String(Date.now()).slice(-8));
  await p.click('button[type=submit]');
  await p.waitForTimeout(1200);
}
async function crearCuenta(p, tel) {
  await p.getByRole('tab', { name: 'Crear cuenta' }).click();
  await p.fill('#email', `demo${Date.now()}@demo.pe`);
  await p.fill('#contrasena', 'Secreta123');
  await p.fill('#nombres', 'Cliente Demo');
  await p.fill('#telefono', tel ?? '9' + String(Date.now()).slice(-8));
  await p.getByRole('button', { name: 'Crear cuenta' }).click();
}
async function datosYConfirmar(p, { cuotas } = {}) {
  await p.waitForURL(/\/compra\//);
  await p.getByRole('heading', { name: /Solo nos faltan|Condiciones y forma de pago/ }).waitFor();
  if (await p.locator('#numeroDocumento').count()) {
    await p.fill('#numeroDocumento', String(40000000 + Math.floor(Math.random() * 9999999)));
    await p.fill('#apellidos', 'Demo Pérez');
    await p.getByRole('button', { name: 'Continuar' }).click();
  }
  await p.getByText('Condiciones y forma de pago').waitFor();
  if (cuotas) {
    await p.getByLabel('En cuotas').check();
    await p.selectOption('#numeroCuotas', String(cuotas));
  }
  await p.getByLabel(/Acepto las condiciones/).check();
  await p.getByLabel(/Firmo la solicitud/).check();
  await p.getByRole('button', { name: 'Ver cronograma' }).click();
  await p.getByRole('button', { name: /Pagar/ }).waitFor();
}
async function demo(admin, accion) {
  await admin.goto(`${BASE}/demo`);
  await admin.getByRole('heading', { name: 'Modo demo' }).waitFor();
  await accion();
  await admin.waitForTimeout(600);
}

(async () => {
  const t0 = Date.now();
  const b = await chromium.launch();
  const paginas = [];
  const nuevo = async () => {
    const ctx = await b.newContext({ viewport: { width: 360, height: 800 }, acceptDownloads: true });
    const pg = await ctx.newPage();
    paginas.push(pg);
    return pg;
  };
  const admin = await nuevo();
  const asesor = await nuevo();
  try {
    // ── 1. Admin: reportes, catálogo, parámetros
    await login(admin, 'admin@svas.demo', 'Admin123!');
    // estado inicial limpio de la demo: reloj a hoy y sin fallos forzados
    await admin.evaluate(async () => {
      const h = {
        Authorization: `Bearer ${localStorage.getItem('svas.token')}`,
        'Content-Type': 'application/json',
      };
      await fetch('/api/demo/reloj/reiniciar', { method: 'POST', headers: h });
      await fetch('/api/demo/fallos', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          pagoRechazado: false,
          emisionFallida: false,
          envioMensajeFallido: false,
          aseguradoraCaida: null,
        }),
      });
    });
    await admin.getByTestId('total').waitFor();
    registrar(
      1,
      'reporte',
      /80 pólizas/.test(await admin.getByTestId('total').innerText()),
      await admin.getByTestId('total').innerText(),
    );
    await capturar(admin, 1, 'admin-reportes');
    await admin.getByRole('tab', { name: 'Aseguradoras y planes' }).click();
    await admin.getByTestId('aseguradora').first().waitFor();
    await capturar(admin, 1, 'admin-catalogo');
    await admin.getByRole('tab', { name: 'Parámetros' }).click();
    await admin.getByLabel(/Descuento máximo/).waitFor();
    registrar(
      1,
      'parametros',
      (await admin.getByLabel(/Descuento máximo/).inputValue()) === '10',
      'descuento máximo 10',
    );
    await capturar(admin, 1, 'admin-parametros');

    // ── 2. Invitado: cotiza 2022, se registra, 5 % primera compra, 6 cuotas, paga, PDF
    const c1 = await nuevo();
    const tel1 = '9' + String(Date.now()).slice(-8);
    await c1.goto(BASE);
    await capturar(c1, 2, 'inicio');
    await cotizar(c1, { tel: tel1 });
    await capturar(c1, 2, 'cotizador-comparativo');
    registrar(
      2,
      'comparativo',
      (await c1.getByTestId('plan').count()) === 15,
      `${await c1.getByTestId('plan').count()} planes`,
    );
    await c1.getByRole('link', { name: 'Comprar ahora' }).first().click();
    await capturar(c1, 2, 'comprar-resumen');
    await c1.getByRole('link', { name: 'Ingresar o crear cuenta' }).click();
    await capturar(c1, 2, 'login-registro');
    await crearCuenta(c1, tel1);
    await c1.waitForURL(/\/compra\//);
    await capturar(c1, 2, 'datos-faltantes');
    await datosYConfirmar(c1, { cuotas: 6 });
    registrar(
      2,
      'primera-compra',
      /5 % \(primera compra\)/.test(await c1.getByTestId('descuento').innerText()),
      await c1.getByTestId('descuento').innerText(),
    );
    await capturar(c1, 2, 'condiciones-pago');
    await c1.getByRole('button', { name: /Pagar/ }).click();
    await c1.getByText('¡Listo! Tu póliza fue emitida').waitFor();
    await capturar(c1, 2, 'confirmacion');
    const [descarga] = await Promise.all([
      c1.waitForEvent('download'),
      c1.getByRole('button', { name: 'Descargar póliza (PDF)' }).click(),
    ]);
    registrar(2, 'pdf', /\.pdf$/.test(descarga.suggestedFilename()), descarga.suggestedFilename());
    registrar(2, 'canal', /canal Autónomo/.test(await c1.locator('main').innerText()), 'canal AUTÓNOMO');
    await c1.goto(`${BASE}/mis-tramites`);
    await c1.getByTestId('tramite').first().waitFor();
    await capturar(c1, 2, 'mis-tramites');

    // ── 3. 2009 (4a), 2003 (no asegurable), camión (fuera de nicho)
    const inv = await nuevo();
    await cotizar(inv, { anio: '2009' });
    registrar(
      3,
      '2009',
      /La Positiva, Rímac/.test(await inv.getByTestId('sin-cotizar').innerText()),
      await inv.getByTestId('sin-cotizar').innerText(),
    );
    await capturar(inv, 3, 'auto-2009');
    await cotizar(inv, { anio: '2003' });
    registrar(
      3,
      '2003',
      await inv.getByText('Tu caso pasó a un asesor').isVisible(),
      'derivado sin pedir correo',
    );
    await capturar(inv, 3, 'auto-2003');
    await cotizar(inv, { uso: 'COMERCIAL_LIGERO', clase: 'CAMION' });
    registrar(
      3,
      'camion',
      await inv.getByText('No podemos cotizar este vehículo aquí').isVisible(),
      'fuera de nicho',
    );
    await capturar(inv, 3, 'camion');

    // ── 4. Taxi → solo Opción 2; primero en la cola del asesor
    await cotizar(inv, { uso: 'TRANSPORTE_PASAJEROS', modelo: `Taxi${sufijo}` });
    const habilitados = await inv.getByRole('link', { name: 'Comprar ahora' }).count();
    registrar(4, 'taxi', habilitados === 0, `${habilitados} botones "Comprar ahora" habilitados`);
    await capturar(inv, 4, 'taxi-comparativo');
    await login(asesor, 'asesor1@svas.demo', 'Asesor123!');
    await asesor.getByTestId('caso').first().waitFor();
    const primero = await asesor.getByTestId('caso').first().innerText();
    registrar(4, 'cola', primero.includes('Derivado'), primero.replace(/\n/g, ' '));
    await capturar(asesor, 4, 'asesor-cola');

    // ── 5. Asesoría: 12 % rechazado, 8 % aceptado, compra ASESORIA
    const c2 = await nuevo();
    const modelo5 = `Corolla${sufijo}`;
    await cotizar(c2, { modelo: modelo5 });
    const urlCot5 = c2.url();
    await c2.getByRole('link', { name: 'Prefiero que me asesoren' }).first().click();
    await c2.selectOption('#motivo', 'NEGOCIACION');
    await capturar(c2, 5, 'seleccion-canal');
    await c2.getByRole('link', { name: 'Ingresar o crear cuenta' }).click();
    await crearCuenta(c2);
    await c2.getByRole('button', { name: 'Solicitar asesoría' }).click();
    await c2.getByText('Solicitud registrada').waitFor();
    await capturar(c2, 5, 'solicitud-registrada');
    await asesor.goto(`${BASE}/asesor`);
    await asesor
      .getByTestId('caso')
      .filter({ hasText: modelo5 })
      .getByRole('button', { name: 'Abrir' })
      .click();
    await asesor.getByRole('button', { name: 'Tomar caso' }).click();
    await asesor.getByRole('button', { name: 'Cliente acepta' }).waitFor();
    const opcionFull = await asesor
      .locator('select[aria-label="Plan"] option', { hasText: 'Rímac · Full' })
      .getAttribute('value');
    await asesor.selectOption('select[aria-label="Plan"]', opcionFull);
    await asesor.getByLabel('Descuento (%)').fill('12');
    await asesor.getByRole('button', { name: 'Registrar descuento' }).click();
    await asesor.getByRole('alert').waitFor();
    registrar(
      5,
      'descuento-12',
      /máximo permitido de 10/.test(await asesor.getByRole('alert').innerText()),
      await asesor.getByRole('alert').innerText(),
    );
    await capturar(asesor, 5, 'asesor-descuento-rechazado');
    await asesor.getByLabel('Descuento (%)').fill('8');
    await asesor.getByRole('button', { name: 'Registrar descuento' }).click();
    await asesor.getByText(/8 % \(ofrecido\)/).waitFor();
    await asesor.getByRole('button', { name: 'Cliente acepta' }).click();
    await asesor.getByText(/Caso cerrado/).waitFor();
    await c2.goto(urlCot5);
    await c2
      .getByTestId('plan')
      .filter({ hasText: 'Rímac' })
      .filter({ hasText: 'Full' })
      .getByRole('link', { name: 'Comprar ahora' })
      .click();
    await datosYConfirmar(c2);
    registrar(
      5,
      'rn-09',
      /8 % \(negociado\)/.test(await c2.getByTestId('descuento').innerText()),
      await c2.getByTestId('descuento').innerText(),
    );
    await c2.getByRole('button', { name: /Pagar/ }).click();
    await c2.getByText('¡Listo! Tu póliza fue emitida').waitFor();
    registrar(5, 'canal', /canal Asesoría/.test(await c2.locator('main').innerText()), 'canal ASESORÍA');
    await capturar(c2, 5, 'compra-asesoria');

    // ── 6. Abandono → seguimiento → 2 intentos → cierre PRECIO → buzón → enlace → compra TELEMARKETING
    const c3 = await nuevo();
    const modelo6 = `Hilux${sufijo}`;
    await cotizar(c3, { modelo: modelo6 });
    await demo(admin, async () => {
      await admin.getByRole('button', { name: 'Adelantar 1 día' }).click();
      await admin.waitForTimeout(400);
      await admin.getByRole('button', { name: 'Procesar abandonos' }).click();
    });
    await admin.getByRole('status').waitFor();
    registrar(
      6,
      'abandonos',
      /pasaron a seguimiento/.test(await admin.getByRole('status').innerText()),
      await admin.getByRole('status').innerText(),
    );
    await capturar(admin, 6, 'demo-abandonos');
    await asesor.goto(`${BASE}/asesor`);
    await asesor.getByRole('tab', { name: 'Seguimiento' }).click();
    await asesor
      .getByTestId('seguimiento')
      .filter({ hasText: modelo6 })
      .getByRole('button', { name: 'Abrir' })
      .click();
    for (let i = 0; i < 2; i++) {
      await asesor.selectOption('select[aria-label="Resultado del intento"]', 'NO_RESPONDE');
      await asesor.getByRole('button', { name: 'Registrar intento' }).click();
      await asesor.waitForTimeout(500);
    }
    registrar(
      6,
      'intentos',
      /2 intentos, quedan 2/.test(await asesor.getByTestId('estado-seguimiento').innerText()),
      await asesor.getByTestId('estado-seguimiento').innerText(),
    );
    await capturar(asesor, 6, 'asesor-seguimiento');
    await asesor.selectOption('select[aria-label="Motivo de cierre"]', 'PRECIO');
    await asesor.getByRole('button', { name: 'Cerrar caso' }).click();
    await asesor.getByText('Mensaje final: enviado').waitFor();
    await demo(admin, async () => {});
    await admin.getByTestId('mensaje').first().waitFor();
    await capturar(admin, 6, 'demo-buzon');
    const enlace6 = await admin.getByTestId('mensaje').first().getByRole('link').getAttribute('href');
    await c3.goto(`${BASE}${enlace6}`);
    await c3.getByRole('heading', { name: 'Retoma tu compra' }).waitFor();
    await capturar(c3, 6, 'retomar');
    await c3.getByRole('link', { name: 'Comprar con este plan' }).click();
    await c3.getByRole('link', { name: 'Ingresar o crear cuenta' }).click();
    await crearCuenta(c3);
    await datosYConfirmar(c3);
    await c3.getByRole('button', { name: /Pagar/ }).click();
    await c3.getByText('¡Listo! Tu póliza fue emitida').waitFor();
    registrar(
      6,
      'canal',
      /canal Telemarketing/.test(await c3.locator('main').innerText()),
      'canal TELEMARKETING',
    );
    await capturar(c3, 6, 'compra-telemarketing');

    // ── 7. 4 intentos → cierre automático; enlace vencido tras 8 días
    const c4 = await nuevo();
    const modelo7 = `Rav${sufijo}`;
    await cotizar(c4, { modelo: modelo7 });
    await demo(admin, async () => {
      await admin.getByRole('button', { name: 'Adelantar 1 día' }).click();
      await admin.waitForTimeout(400);
      await admin.getByRole('button', { name: 'Procesar abandonos' }).click();
    });
    await asesor.goto(`${BASE}/asesor`);
    await asesor.getByRole('tab', { name: 'Seguimiento' }).click();
    await asesor
      .getByTestId('seguimiento')
      .filter({ hasText: modelo7 })
      .getByRole('button', { name: 'Abrir' })
      .click();
    for (let i = 0; i < 4; i++) {
      await asesor.selectOption('select[aria-label="Resultado del intento"]', 'NO_RESPONDE');
      await asesor.getByRole('button', { name: 'Registrar intento' }).click();
      await asesor.waitForTimeout(600);
    }
    const estado7 = await asesor.getByTestId('estado-seguimiento').innerText();
    registrar(
      7,
      'cierre-automatico',
      /Descartado.*No responde/.test(estado7) &&
        (await asesor.getByRole('button', { name: 'Registrar intento' }).count()) === 0,
      estado7,
    );
    await capturar(asesor, 7, 'asesor-4-intentos');
    await demo(admin, async () => {});
    const enlace7 = await admin.getByTestId('mensaje').first().getByRole('link').getAttribute('href');
    await demo(admin, async () => admin.getByRole('button', { name: 'Adelantar 8 días' }).click());
    await c4.goto(`${BASE}${enlace7}`);
    await c4.getByRole('heading', { name: 'Este enlace ya venció' }).waitFor();
    registrar(7, 'enlace-vencido', true, 'Este enlace ya venció');
    await capturar(c4, 7, 'enlace-vencido');

    // ── 8. Pago rechazado y emisión fallida
    const c5 = await nuevo();
    await cotizar(c5, {});
    await c5.getByRole('link', { name: 'Comprar ahora' }).first().click();
    await c5.getByRole('link', { name: 'Ingresar o crear cuenta' }).click();
    await crearCuenta(c5);
    await datosYConfirmar(c5);
    await demo(admin, async () => admin.getByLabel('Pago rechazado (CU-02 5a)').click());
    await c5.getByRole('button', { name: /Pagar/ }).click();
    await c5.getByRole('alert').waitFor();
    registrar(
      8,
      'pago-rechazado',
      /rechazado.*reintentar/i.test(await c5.getByRole('alert').innerText()),
      await c5.getByRole('alert').innerText(),
    );
    await capturar(c5, 8, 'pago-rechazado');
    await demo(admin, async () => {
      await admin.getByLabel('Pago rechazado (CU-02 5a)').click();
      await admin.waitForTimeout(400);
      await admin.getByLabel(/Emisión fallida/).click();
    });
    await capturar(admin, 8, 'demo-fallos');
    await c5.getByRole('button', { name: /Pagar/ }).click();
    await c5.waitForTimeout(1200);
    const alerta8 = await c5.getByRole('alert').innerText();
    registrar(8, 'emision-fallida', /no pudo emitir/.test(alerta8), alerta8);
    await capturar(c5, 8, 'emision-fallida');
    await demo(admin, async () => admin.getByLabel(/Emisión fallida/).click());

    // ── 9. Admin desactiva Quálitas → cotizador cambia en vivo; reportes con los 3 canales
    await admin.goto(`${BASE}/admin`);
    await admin.getByRole('tab', { name: 'Aseguradoras y planes' }).click();
    await admin.getByLabel('Quálitas activa').click();
    await admin.waitForTimeout(800);
    // RNF-13 / D-11: campo nuevo sin tocar código
    await admin.getByRole('tab', { name: 'Campos' }).click();
    await admin.selectOption('select[aria-label="Aseguradora del campo"]', { label: 'Rímac' });
    await admin.getByLabel('Nombre del campo').fill('color');
    await admin.selectOption('select[aria-label="Tipo del campo"]', 'LISTA');
    await admin.getByLabel('Valores permitidos').fill('Rojo, Negro');
    await admin.locator('form').getByLabel('Obligatorio').check();
    await admin.getByRole('button', { name: 'Agregar campo' }).click();
    await admin.waitForTimeout(800);
    await inv.goto(`${BASE}/cotizar`);
    await inv.getByText(/Comparamos/).waitFor();
    registrar(
      9,
      'en-vivo',
      /Comparamos 4 aseguradoras/.test(await inv.getByText(/Comparamos/).innerText()),
      await inv.getByText(/Comparamos/).innerText(),
    );
    registrar(
      9,
      'campo-nuevo',
      await inv.getByLabel('Color *').isVisible(),
      'campo «Color *» en el formulario',
    );
    await capturar(inv, 9, 'cotizador-sin-qualitas');
    await admin.getByLabel('Rímac color activo').click(); // desactivar, no borrar
    await admin.waitForTimeout(600);
    await admin.getByRole('tab', { name: 'Aseguradoras y planes' }).click();
    await admin.getByLabel('Quálitas activa').click();
    await admin.waitForTimeout(800);
    await admin.getByRole('tab', { name: 'Reportes' }).click();
    await admin.getByTestId('total').waitFor();
    registrar(
      9,
      'reportes',
      /8[3-9] pólizas|9\d pólizas/.test(await admin.getByTestId('total').innerText()),
      await admin.getByTestId('total').innerText(),
    );
    await capturar(admin, 9, 'admin-reportes-final');

    // ── 10. Asesor intenta /admin
    await asesor.goto(`${BASE}/admin`);
    await asesor.getByText('Acceso no permitido').waitFor();
    registrar(10, 'rf-32', true, 'Acceso no permitido');
    await capturar(asesor, 10, 'asesor-en-admin');
    const r = await asesor.evaluate(
      async () =>
        (
          await fetch('/api/admin/parametros', {
            headers: { Authorization: `Bearer ${localStorage.getItem('svas.token')}` },
          })
        ).status,
    );
    registrar(10, 'api-403', r === 403, `GET /api/admin/parametros como asesor → ${r}`);

    // limpieza: reloj a hoy
    await demo(admin, async () => admin.getByRole('button', { name: 'Volver a hoy' }).click());
  } catch (e) {
    registrar('!', 'error', false, e.message.split('\n')[0]);
    for (const [k, pg] of paginas.entries())
      await pg.screenshot({ path: `${DIR}/ERROR-${k}.png`, fullPage: true }).catch(() => {});
    console.error(
      'URLS',
      paginas.map((x) => x.url()),
    );
  } finally {
    await b.close();
    const fallas = resultados.filter((x) => !x.ok);
    const ok = resultados.filter((x) => x.ok);
    console.log(
      JSON.stringify({ duracionSeg: Math.round((Date.now() - t0) / 1000), capturas: n, fallas, ok }, null, 1),
    );
  }
})();
