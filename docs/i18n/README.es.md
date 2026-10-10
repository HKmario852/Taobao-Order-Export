<div align="center">

<img src="../../icons/128.png" width="96" height="96" alt="Icono de Order Exporter for Taobao">

# Order Exporter for Taobao

**Exporta todos tus pedidos de la página 已买到的宝贝 (artículos comprados) de Taobao a Excel o JSON, desde tu navegador.**

![Manifest V3](https://img.shields.io/badge/Manifest-V3-ff5000)
![Chrome | Edge | Brave](https://img.shields.io/badge/Chrome%20%7C%20Edge%20%7C%20Brave-supported-4285F4?logo=googlechrome&logoColor=white)
![No dependencies](https://img.shields.io/badge/dependencies-none-brightgreen)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)

[English](../../README.md) · [繁體中文](README.zh-TW.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · **Español**

</div>

<p align="center">
  <img src="../screenshots/toolbar.png" alt="Botón «Export all orders» junto al botón 导出订单 de Taobao" width="88%">
</p>
<p align="center">
  <img src="../screenshots/dialog-en.png" alt="Ventana de exportación en inglés" width="44%">
  &nbsp;
  <img src="../screenshots/dialog-zh-CN.png" alt="Ventana de exportación en chino" width="44%">
</p>

<details>
<summary>Más capturas</summary>

<p align="center"><img src="../screenshots/exporting.png" alt="La extensión pasando páginas durante una exportación" width="80%"></p>

Todas las capturas usan pedidos de demostración inventados.

</details>

> [!NOTE]
> La interfaz de la extensión solo está en inglés, chino simplificado y chino tradicional (no en español).

## ✨ Funciones

- 📦 **Todos tus pedidos**, hasta el más antiguo. El 导出订单 de Taobao se limita a 10 páginas por exportación.
- 📅 **Elige el rango**: todos los pedidos, las primeras *N* páginas o los pedidos entre dos fechas. También puedes excluir los pedidos cerrados (交易关闭).
- ☑️ **Elige los campos**, como en el diálogo de Taobao: n.º de pedido, fecha, estado, tienda, pagado, envío, total, descuento, artículo, variante, cantidad, importe, enlace del artículo e imagen.
- 📊 **Excel (.xlsx) o JSON.** En Excel cada fila de artículo conserva su n.º de pedido, los importes son números y una hoja «Orders» evita sumar dos veces.
- 🔒 **Solo local.** Sin cuenta, sin servidor y sin rastreo. Solo lee lo que la propia página de Taobao ya ha cargado.
- 🌐 **Interfaz en inglés, 简体中文 y 繁體中文**, según el idioma del navegador.

## 📥 Instalación

> [!NOTE]
> La extensión aún no está en la Chrome Web Store. Por ahora, instálala desde el zip de la release.

1. Descarga `taobao-order-export-<versión>.zip` de la [última release](https://github.com/HKmario852/Taobao-Order-Export/releases/latest) y descomprímelo.
2. Abre `chrome://extensions` (Edge: `edge://extensions`, Brave: `brave://extensions`).
3. Activa el **modo de desarrollador**, pulsa **Cargar descomprimida** y elige la carpeta que contiene `manifest.json`.

No borres la carpeta: el navegador carga la extensión desde ella. Para actualizar, sustituye la carpeta y pulsa ↻ en la extensión.

## 🚀 Uso

1. Inicia sesión en Taobao y abre **我的淘宝 › 已买到的宝贝**.
2. Pulsa **Export all orders**, junto al botón 导出订单 de Taobao o abajo a la derecha.
3. Elige campos, pedidos y formato, y pulsa **Export**.

La extensión pulsa «página siguiente» por sí sola, unos 2–4 segundos por página (30 pedidos por página), y luego descarga `taobao-orders-<fecha>.xlsx` o `.json`.
Si Taobao muestra una verificación deslizante, complétala y pulsa **Continue**. **Stop** termina antes.

| | 导出订单 de Taobao | Esta extensión |
| --- | --- | --- |
| Pedidos por exportación | hasta 10 páginas | todos, primeras *N* páginas o rango de fechas |
| Formatos | Excel | Excel, CSV o JSON |
| 2.º artículo y siguientes de un pedido | n.º de pedido, fecha y tienda en blanco | siempre rellenos |
| Importes | texto como `￥26.80` | números |
| Enlaces de imagen | no | sí |

La estructura de los archivos (hojas de Excel y esquema JSON) está en [docs/DEVELOPMENT.md](../DEVELOPMENT.md#output-files) (en inglés).

## 🛠️ Compilar desde el código

```bash
git clone https://github.com/HKmario852/Taobao-Order-Export.git
cd Taobao-Order-Export
node --test test/*.test.js          # Node 18 o superior
zip -r taobao-order-export.zip manifest.json *.js _locales icons   # paquete para la tienda
```

No hay nada que compilar. Cada push a `main` también genera en **Actions** un zip listo para la tienda. Cómo funciona, cómo regenerar las capturas y cómo añadir un idioma: [docs/DEVELOPMENT.md](../DEVELOPMENT.md).

**Tecnología:** JavaScript sin dependencias, Chrome Manifest V3, un pequeño generador de `.xlsx` propio y `node:test`. Playwright solo se usa para las capturas.

## 🔐 Privacidad

La extensión no hace peticiones de red propias ni tiene analítica. Tus opciones del diálogo se guardan en el almacenamiento local de la página de Taobao; los datos de pedidos se quedan en la pestaña abierta hasta que los descargas. Nunca exporta direcciones, teléfonos ni nombres de destinatarios. Detalles: [PRIVACY.md](../../PRIVACY.md) (en inglés).

## ⚠️ Aviso

No está afiliada a Taobao ni a Alibaba. Lee los datos que carga la propia página de Taobao (una respuesta interna sin documentar), así que un cambio en esa página puede romperla hasta que se actualice. El envío, el total y el descuento solo se exportan cuando Taobao los incluye; los números de seguimiento no se exportan.

## 📄 Licencia

[MIT](../../LICENSE) © HKmario852
