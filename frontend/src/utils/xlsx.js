// ============================================================
//  Generador minimo de archivos Excel (.xlsx) sin dependencias.
//
//  Un .xlsx es un ZIP con unos XML adentro. Aqui se arma ese ZIP
//  "sin comprimir" (metodo store), que Excel, LibreOffice y Google
//  Sheets abren sin problema. Los montos se guardan como NUMEROS
//  (se pueden sumar en Excel), con formato de miles y 2 decimales.
//
//  Uso:
//    const blob = crearXlsx({
//      hoja: 'Reporte',
//      anchos: [14, 30, 12],
//      filas: [
//        [{ v: 'Titulo', estilo: 'titulo' }],
//        [{ v: 'Fecha', estilo: 'encabezado' }, { v: 'Monto', estilo: 'encabezado' }],
//        ['01/10/2026', { v: 1500, estilo: 'monto' }],
//      ],
//    });
// ============================================================

// Estilos disponibles (indices de cellXfs en styles.xml)
const ESTILOS = {
    normal: 0,
    encabezado: 1, // negrita con fondo
    monto: 2, // #,##0.00
    titulo: 3, // negrita grande
    totalTexto: 4, // negrita
    totalMonto: 5, // negrita + #,##0.00
    nota: 6, // gris
};

const escaparXml = (texto) => String(texto)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    // Caracteres de control no permitidos en XML
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

// 0 -> 'A', 25 -> 'Z', 26 -> 'AA'
const letraColumna = (indice) => {
    let n = indice + 1;
    let letras = '';
    while (n > 0) {
        const r = (n - 1) % 26;
        letras = String.fromCharCode(65 + r) + letras;
        n = Math.floor((n - 1) / 26);
    }
    return letras;
};

const celdaXml = (celda, fila, col) => {
    const dato = celda !== null && typeof celda === 'object' ? celda : { v: celda };
    if (dato.v === null || dato.v === undefined || dato.v === '') return '';
    const ref = `${letraColumna(col)}${fila}`;
    const s = ESTILOS[dato.estilo] ?? 0;
    if (typeof dato.v === 'number' && Number.isFinite(dato.v)) {
        return `<c r="${ref}" s="${s}"><v>${dato.v}</v></c>`;
    }
    return `<c r="${ref}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${escaparXml(dato.v)}</t></is></c>`;
};

const hojaXml = ({ filas, anchos = [] }) => {
    const cols = anchos.length
        ? `<cols>${anchos.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>`
        : '';
    const rows = filas.map((fila, i) => {
        const celdas = (fila || []).map((c, j) => celdaXml(c, i + 1, j)).join('');
        return `<row r="${i + 1}">${celdas}</row>`;
    }).join('');
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        + `${cols}<sheetData>${rows}</sheetData></worksheet>`;
};

const ESTILOS_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
    + '<numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00"/></numFmts>'
    + '<fonts count="4">'
    + '<font><sz val="11"/><name val="Calibri"/></font>'
    + '<font><b/><sz val="11"/><name val="Calibri"/></font>'
    + '<font><b/><sz val="14"/><color rgb="FF132B3E"/><name val="Calibri"/></font>'
    + '<font><sz val="10"/><color rgb="FF64748B"/><name val="Calibri"/></font>'
    + '</fonts>'
    + '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>'
    + '<fill><patternFill patternType="solid"><fgColor rgb="FFE4EEF5"/><bgColor indexed="64"/></patternFill></fill></fills>'
    + '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
    + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
    + '<cellXfs count="7">'
    + '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
    + '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>'
    + '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'
    + '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
    + '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
    + '<xf numFmtId="164" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyNumberFormat="1"/>'
    + '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
    + '</cellXfs>'
    + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
    + '</styleSheet>';

const archivosXlsx = (hoja, nombreHoja) => ({
    '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        + '<Default Extension="xml" ContentType="application/xml"/>'
        + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
        + '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
        + '</Types>',
    '_rels/.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
        + '</Relationships>',
    'xl/workbook.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        + `<sheets><sheet name="${escaparXml(nombreHoja).slice(0, 31)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
        + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
        + '</Relationships>',
    'xl/styles.xml': ESTILOS_XML,
    'xl/worksheets/sheet1.xml': hoja,
});

// ------------------------------------------------------------
//  ZIP sin compresion (metodo "store")
// ------------------------------------------------------------

const TABLA_CRC = (() => {
    const tabla = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
        tabla[n] = c >>> 0;
    }
    return tabla;
})();

const crc32 = (bytes) => {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) crc = TABLA_CRC[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
};

const crearZip = (archivos) => {
    const codificar = new TextEncoder();
    const partes = [];
    const central = [];
    let desplazamiento = 0;

    Object.entries(archivos).forEach(([nombre, contenido]) => {
        const nombreBytes = codificar.encode(nombre);
        const datos = codificar.encode(contenido);
        const crc = crc32(datos);

        const local = new DataView(new ArrayBuffer(30));
        local.setUint32(0, 0x04034B50, true); // firma
        local.setUint16(4, 20, true); // version
        local.setUint16(6, 0x0800, true); // nombres en UTF-8
        local.setUint16(8, 0, true); // sin compresion
        local.setUint16(10, 0, true); // hora
        local.setUint16(12, 0x21, true); // fecha (1/1/1980)
        local.setUint32(14, crc, true);
        local.setUint32(18, datos.length, true);
        local.setUint32(22, datos.length, true);
        local.setUint16(26, nombreBytes.length, true);
        local.setUint16(28, 0, true);
        partes.push(new Uint8Array(local.buffer), nombreBytes, datos);

        const cd = new DataView(new ArrayBuffer(46));
        cd.setUint32(0, 0x02014B50, true);
        cd.setUint16(4, 20, true);
        cd.setUint16(6, 20, true);
        cd.setUint16(8, 0x0800, true);
        cd.setUint16(10, 0, true);
        cd.setUint16(12, 0, true);
        cd.setUint16(14, 0x21, true);
        cd.setUint32(16, crc, true);
        cd.setUint32(20, datos.length, true);
        cd.setUint32(24, datos.length, true);
        cd.setUint16(28, nombreBytes.length, true);
        cd.setUint32(42, desplazamiento, true);
        central.push(new Uint8Array(cd.buffer), nombreBytes);

        desplazamiento += 30 + nombreBytes.length + datos.length;
    });

    const tamanoCentral = central.reduce((s, b) => s + b.length, 0);
    const fin = new DataView(new ArrayBuffer(22));
    fin.setUint32(0, 0x06054B50, true);
    const total = Object.keys(archivos).length;
    fin.setUint16(8, total, true);
    fin.setUint16(10, total, true);
    fin.setUint32(12, tamanoCentral, true);
    fin.setUint32(16, desplazamiento, true);

    return new Blob([...partes, ...central, new Uint8Array(fin.buffer)], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
};

// Devuelve un Blob .xlsx con una hoja
export const crearXlsx = ({ hoja = 'Reporte', filas, anchos }) => crearZip(archivosXlsx(hojaXml({ filas, anchos }), hoja));
