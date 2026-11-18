import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { crearXlsx } from './xlsx';
import { formatBs } from '../constants/finanzasMock';

// ============================================================
//  Exportacion de reportes a PDF y Excel con UNA sola definicion.
//
//  reporte = {
//    titulo:    'Estado financiero',
//    subtitulo: 'Periodo: Noviembre 2026',
//    resumen:   [{ etiqueta: 'Ingresos', valor: 1348, tipo: 'monto' }, ...],
//    secciones: [{
//      titulo:   'Estado de resultados',
//      columnas: [{ titulo: 'Concepto' }, { titulo: 'Monto', tipo: 'monto' }],
//      filas:    [['Expensas', 1348], ...],
//      totales:  ['Total', 1348],          (opcional)
//    }],
//    notas:     ['...'],                   (opcional)
//    archivo:   'estado-financiero-noviembre-2026',
//  }
//  tipo de columna: 'texto' (defecto) | 'monto' (Bs) | 'numero'
// ============================================================

const EDIFICIO = 'Edificio XYZ - Sistema de Gestion';

const ahora = () => {
    const d = new Date();
    return `${d.toLocaleDateString('es-BO')} ${d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}`;
};

// 'Estado financiero - Noviembre 2026' -> 'estado-financiero-noviembre-2026'
export const nombreArchivo = (...partes) => partes.join('-').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const textoCelda = (valor, tipo) => {
    if (valor === null || valor === undefined || valor === '') return '';
    if (tipo === 'monto' && typeof valor === 'number') return formatBs(valor);
    return String(valor);
};

const descargar = (blob, nombre) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// ------------------------------------------------------------
//  PDF
// ------------------------------------------------------------

export const exportarPDF = (reporte) => {
    const muchasColumnas = reporte.secciones.some((s) => s.columnas.length > 6);
    const doc = new jsPDF({ orientation: muchasColumnas ? 'landscape' : 'portrait' });
    const ancho = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.setTextColor(19, 43, 62);
    doc.text(reporte.titulo, 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(reporte.subtitulo || '', 14, 25);
    doc.text(`${EDIFICIO} · Generado el ${ahora()}`, 14, 30);
    let y = 36;

    if (reporte.resumen?.length) {
        autoTable(doc, {
            startY: y,
            theme: 'plain',
            body: reporte.resumen.map((r) => [r.etiqueta, textoCelda(r.valor, r.tipo)]),
            styles: { fontSize: 9, cellPadding: 1.2 },
            columnStyles: { 0: { textColor: [100, 116, 139] }, 1: { fontStyle: 'bold', halign: 'right' } },
            tableWidth: Math.min(110, ancho - 28),
        });
        y = doc.lastAutoTable.finalY + 6;
    }

    reporte.secciones.forEach((s) => {
        if (s.titulo) {
            doc.setFontSize(11);
            doc.setTextColor(19, 43, 62);
            doc.text(s.titulo, 14, y);
            y += 3;
        }
        const derecha = Object.fromEntries(s.columnas
            .map((c, i) => [i, c.tipo === 'monto' || c.tipo === 'numero'])
            .filter(([, alinear]) => alinear)
            .map(([i]) => [i, { halign: 'right' }]));
        autoTable(doc, {
            startY: y,
            head: [s.columnas.map((c) => c.titulo)],
            body: s.filas.length
                ? s.filas.map((f) => f.map((v, i) => textoCelda(v, s.columnas[i]?.tipo)))
                : [[{ content: s.vacio || 'Sin datos en este periodo', colSpan: s.columnas.length, styles: { halign: 'center', textColor: 120 } }]],
            foot: s.totales ? [s.totales.map((v, i) => textoCelda(v, s.columnas[i]?.tipo))] : undefined,
            headStyles: { fillColor: [31, 95, 139], textColor: 255, fontStyle: 'bold' },
            footStyles: { fillColor: [228, 238, 245], textColor: [19, 43, 62], fontStyle: 'bold' },
            styles: { fontSize: 8.5, cellPadding: 2 },
            columnStyles: derecha,
        });
        y = doc.lastAutoTable.finalY + 8;
    });

    if (reporte.notas?.length) {
        doc.setFontSize(8.5);
        doc.setTextColor(100);
        reporte.notas.forEach((n) => {
            const lineas = doc.splitTextToSize(n, ancho - 28);
            doc.text(lineas, 14, y);
            y += lineas.length * 4 + 1;
        });
    }

    const nombre = `${reporte.archivo}.pdf`;
    doc.save(nombre);
    return nombre;
};

// ------------------------------------------------------------
//  EXCEL (.xlsx)
// ------------------------------------------------------------

const celdaExcel = (valor, tipo, total = false) => {
    if (typeof valor === 'number' && (tipo === 'monto' || tipo === 'numero')) {
        return { v: valor, estilo: total ? 'totalMonto' : (tipo === 'monto' ? 'monto' : 'normal') };
    }
    return { v: valor ?? '', estilo: total ? 'totalTexto' : 'normal' };
};

export const exportarExcel = (reporte) => {
    const filas = [
        [{ v: reporte.titulo, estilo: 'titulo' }],
        [{ v: reporte.subtitulo || '', estilo: 'nota' }],
        [{ v: `${EDIFICIO} · Generado el ${ahora()}`, estilo: 'nota' }],
        [],
    ];
    if (reporte.resumen?.length) {
        reporte.resumen.forEach((r) => filas.push([{ v: r.etiqueta, estilo: 'totalTexto' }, celdaExcel(r.valor, r.tipo)]));
        filas.push([]);
    }
    reporte.secciones.forEach((s) => {
        if (s.titulo) filas.push([{ v: s.titulo, estilo: 'totalTexto' }]);
        filas.push(s.columnas.map((c) => ({ v: c.titulo, estilo: 'encabezado' })));
        if (s.filas.length === 0) filas.push([{ v: s.vacio || 'Sin datos en este periodo', estilo: 'nota' }]);
        s.filas.forEach((f) => filas.push(f.map((v, i) => celdaExcel(v, s.columnas[i]?.tipo))));
        if (s.totales) filas.push(s.totales.map((v, i) => celdaExcel(v, s.columnas[i]?.tipo, true)));
        filas.push([]);
    });
    (reporte.notas || []).forEach((n) => filas.push([{ v: n, estilo: 'nota' }]));

    // Ancho de cada columna segun su contenido (sin contar titulos de una sola celda)
    const columnas = Math.max(2, ...reporte.secciones.map((s) => s.columnas.length));
    const anchos = Array.from({ length: columnas }, (_, i) => {
        const largos = reporte.secciones.flatMap((s) => [
            s.columnas[i]?.titulo, ...s.filas.map((f) => textoCelda(f[i], s.columnas[i]?.tipo)),
        ]).filter(Boolean).map((t) => String(t).length);
        if (i < 2) largos.push(...(reporte.resumen || []).map((r) => String(i === 0 ? r.etiqueta : textoCelda(r.valor, r.tipo)).length));
        return Math.min(48, Math.max(10, ...largos) + 2);
    });

    const nombre = `${reporte.archivo}.xlsx`;
    descargar(crearXlsx({ hoja: reporte.titulo, filas, anchos }), nombre);
    return nombre;
};
