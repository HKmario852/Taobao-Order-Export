// Minimal .xlsx writer: inline strings, numbers and HYPERLINK formulas, stored (uncompressed) zip.
// No dependencies, so the extension stays a few small files that anyone can read.

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Zips [files] ({ name, data: string }) without compression. */
function zipStore(files) {
  const enc = new TextEncoder();
  const parts = [];
  const central = [];
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name);
    const data = enc.encode(f.data);
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true); // version needed
    local.setUint16(6, 0x0800, true); // UTF-8 names
    local.setUint16(8, 0, true); // stored
    local.setUint16(10, 0, true); // time
    local.setUint16(12, 0x21, true); // date: 1980-01-01
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true);
    local.setUint16(28, 0, true);
    parts.push(new Uint8Array(local.buffer), name, data);

    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true);
    cd.setUint16(6, 20, true);
    cd.setUint16(8, 0x0800, true);
    cd.setUint16(10, 0, true);
    cd.setUint16(12, 0, true);
    cd.setUint16(14, 0x21, true);
    cd.setUint32(16, crc, true);
    cd.setUint32(20, data.length, true);
    cd.setUint32(24, data.length, true);
    cd.setUint16(28, name.length, true);
    cd.setUint32(42, offset, true);
    central.push(new Uint8Array(cd.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const cdSize = central.reduce((n, p) => n + p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true);
  end.setUint32(16, offset, true);
  const all = [...parts, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of all) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

function xmlText(v) {
  return String(v)
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function colName(i) {
  let s = '';
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

// Style ids, see STYLES below.
const S_HEADER = 1;
const S_MONEY = 2;
const S_LINK = 3;

/**
 * A cell is a string, a finite number, null/undefined (empty), { money: n } or { link: url, text }.
 * Links longer than Excel's 255-character formula limit are written as plain text.
 */
function cellXml(ref, v, header) {
  if (v === null || v === undefined || v === '') return '';
  if (header) return `<c r="${ref}" s="${S_HEADER}" t="inlineStr"><is><t xml:space="preserve">${xmlText(v)}</t></is></c>`;
  if (typeof v === 'number') return Number.isFinite(v) ? `<c r="${ref}"><v>${v}</v></c>` : '';
  if (typeof v === 'object' && 'money' in v) {
    return Number.isFinite(v.money) ? `<c r="${ref}" s="${S_MONEY}"><v>${v.money}</v></c>` : '';
  }
  if (typeof v === 'object' && 'link' in v) {
    const url = String(v.link).replace(/"/g, '%22');
    const text = String(v.text || v.link).replace(/"/g, '""');
    if (url.length > 255 || text.length > 255) return cellXml(ref, String(v.link), false);
    return (
      `<c r="${ref}" s="${S_LINK}" t="str"><f>${xmlText(`HYPERLINK("${url}","${text}")`)}</f>` +
      `<v>${xmlText(v.text || v.link)}</v></c>`
    );
  }
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlText(v)}</t></is></c>`;
}

function sheetXml(sheet) {
  const rows = [sheet.header, ...sheet.rows];
  const last = `${colName(sheet.header.length - 1)}${rows.length}`;
  const cols = sheet.widths
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join('');
  const body = rows
    .map((row, r) => {
      const cells = row.map((v, c) => cellXml(`${colName(c)}${r + 1}`, v, r === 0)).join('');
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join('');
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<sheetViews><sheetView workbookViewId="0">' +
    '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' +
    '</sheetView></sheetViews>' +
    `<cols>${cols}</cols><sheetData>${body}</sheetData>` +
    `<autoFilter ref="A1:${last}"/>` +
    '</worksheet>'
  );
}

const STYLES =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font>' +
  '<font><b/><sz val="11"/><name val="Calibri"/></font>' +
  '<font><u/><sz val="11"/><color rgb="FF0563C1"/><name val="Calibri"/></font></fonts>' +
  '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
  '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
  '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
  '<xf numFmtId="2" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
  '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>' +
  '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
  '</styleSheet>';

/** Builds an .xlsx file from [sheets] ({ name, header, widths, rows }). */
function writeXlsx(sheets) {
  const sheetName = (s) => xmlText(String(s.name).replace(/[\\/?*[\]:]/g, ' ').slice(0, 31));
  const files = [
    {
      name: '[Content_Types].xml',
      data:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        sheets
          .map(
            (_, i) =>
              `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ` +
              'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>',
          )
          .join('') +
        '</Types>',
    },
    {
      name: '_rels/.rels',
      data:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>',
    },
    {
      name: 'xl/workbook.xml',
      data:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
        sheets.map((s, i) => `<sheet name="${sheetName(s)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') +
        '</sheets><definedNames>' +
        sheets
          .map(
            (s, i) =>
              `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">` +
              `'${sheetName(s).replace(/'/g, "''")}'!$A$1:$${colName(s.header.length - 1)}$${s.rows.length + 1}` +
              '</definedName>',
          )
          .join('') +
        '</definedNames></workbook>',
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        sheets
          .map(
            (_, i) =>
              `<Relationship Id="rId${i + 1}" ` +
              'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" ' +
              `Target="worksheets/sheet${i + 1}.xml"/>`,
          )
          .join('') +
        `<Relationship Id="rId${sheets.length + 1}" ` +
        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
        '</Relationships>',
    },
    { name: 'xl/styles.xml', data: STYLES },
    ...sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: sheetXml(s) })),
  ];
  return zipStore(files);
}

function yuanNumber(v) {
  const n = Number.parseFloat(String(v === undefined || v === null ? '' : v));
  return Number.isFinite(n) ? n : null;
}

/**
 * Two sheets: one row per order (amount paid once per order, safe to sum) and
 * one row per item (with picture and item links). [t] gives the localised labels.
 */
function ordersWorkbook(orders, t) {
  const orderRows = orders.map((o) => [
    o.id,
    o.time,
    o.shop,
    o.status,
    (o.items || []).map((i) => (i.qty > 1 ? `${i.title} ×${i.qty}` : i.title)).join('；'),
    (o.items || []).reduce((n, i) => n + (i.qty || 0), 0),
    { money: yuanNumber(o.paid) },
  ]);
  const itemRows = [];
  for (const o of orders) {
    for (const i of o.items || []) {
      itemRows.push([
        o.id,
        o.time,
        o.shop,
        i.title,
        i.qty,
        { money: yuanNumber(i.price) },
        i.pic ? { link: i.pic, text: t.open } : null,
        i.url ? { link: i.url, text: t.open } : null,
      ]);
    }
  }
  return writeXlsx([
    {
      name: t.ordersSheet,
      header: [t.orderId, t.time, t.shop, t.status, t.items, t.qty, t.paid],
      widths: [22, 20, 24, 14, 60, 8, 12],
      rows: orderRows,
    },
    {
      name: t.itemsSheet,
      header: [t.orderId, t.time, t.shop, t.item, t.qty, t.price, t.picture, t.link],
      widths: [22, 20, 24, 60, 8, 12, 10, 10],
      rows: itemRows,
    },
  ]);
}

if (typeof module !== 'undefined') module.exports = { crc32, zipStore, writeXlsx, ordersWorkbook, colName };
