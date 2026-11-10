import os
import sys
from datetime import datetime

# Matplotlib para generación de diagramas en alta resolución
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

# Python-docx para generación del manual corporativo
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUTPUT_DOCX_FULL = os.path.join(OUTPUT_DIR, 'manual_usuario_appmottus_completo.docx')
OUTPUT_DOCX_STD = os.path.join(OUTPUT_DIR, 'manual_usuario_appmottus.docx')
FRONTEND_PUBLIC_DOCX = os.path.join(OUTPUT_DIR, 'frontend', 'public', 'manual_usuario_appmottus.docx')
FRONTEND_DIST_DOCX = os.path.join(OUTPUT_DIR, 'frontend', 'dist', 'manual_usuario_appmottus.docx')
ASSETS_DIR = os.path.join(OUTPUT_DIR, 'manual_assets')
os.makedirs(ASSETS_DIR, exist_ok=True)

# Paleta de Colores Mottus Gym
COLOR_PRIMARY_HEX = "4D602E"       # Verde militar profundo
COLOR_SECONDARY_HEX = "89A854"     # Verde oliva claro
COLOR_ACCENT_HEX = "6E8842"        # Verde corporativo
COLOR_DARK_BG_HEX = "161D16"       # Fondo oscuro institucional
COLOR_LIGHT_BG_HEX = "F4F6F1"      # Fondo suave para tablas alternas
COLOR_DARK_TEXT_HEX = "1A201A"     # Texto principal
COLOR_MUTED_HEX = "5A665A"         # Texto secundario / gris técnico
COLOR_ALERT_HEX = "B3261E"         # Rojo alerta médica
COLOR_SUCCESS_HEX = "2E6930"       # Verde éxito / completado

# -----------------------------------------------------------------------------
# UTILIDADES XML PARA FORMATO TABLAS Y CELDAS EN DOCX
# -----------------------------------------------------------------------------

def set_cell_background(cell, fill_hex):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tc_pr.append(shd)

def set_cell_margins(cell, top=140, bottom=140, left=160, right=160):
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_mar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tc_pr.append(tc_mar)

def set_table_clean_borders(table, border_color_hex="D0D7CA"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="6" w:space="0" w:color="{border_color_hex}"/>'
        f'<w:bottom w:val="single" w:sz="6" w:space="0" w:color="{border_color_hex}"/>'
        f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="{border_color_hex}"/>'
        f'<w:insideV w:val="none"/>'
        f'<w:left w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def make_callout(doc, text, title="NOTA TÉCNICA"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    tbl.columns[0].width = Inches(6.5)
    cell = tbl.cell(0, 0)
    set_cell_background(cell, "F2F5ED")
    set_cell_margins(cell, top=140, bottom=140, left=200, right=160)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:left w:val="single" w:sz="24" w:space="0" w:color="{COLOR_PRIMARY_HEX}"/>'
        f'<w:top w:val="none"/>'
        f'<w:bottom w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    run_t = p.add_run(f"[{title}] ")
    run_t.font.name = "Arial"
    run_t.font.size = Pt(10)
    run_t.font.bold = True
    run_t.font.color.rgb = RGBColor(0x4D, 0x60, 0x2E)
    
    run_txt = p.add_run(text)
    run_txt.font.name = "Arial"
    run_txt.font.size = Pt(9.5)
    run_txt.font.italic = True
    run_txt.font.color.rgb = RGBColor(0x2D, 0x3B, 0x24)
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

# -----------------------------------------------------------------------------
# GENERADORES DE LAS 6 INFOGRAFÍAS Y DIAGRAMAS TÉCNICOS (PNG 200 DPI)
# -----------------------------------------------------------------------------

def generate_architecture_diagram():
    fig, ax = plt.subplots(figsize=(9.2, 4.8), dpi=200)
    fig.patch.set_facecolor('#0E130E')
    ax.set_facecolor('#0E130E')
    ax.axis('off')

    boxes = [
        {"x": 0.04, "y": 0.58, "w": 0.26, "h": 0.36, "title": "CAPA CLIENTE (SPA)", 
         "desc": "React 19 + Vite 8.2\nTailwind / Glass UI\nWorkout Logger Serie a Serie\nRest Timer (Web Audio)\nComparador Side-by-Side", "color": "#6E8842"},
        {"x": 0.04, "y": 0.08, "w": 0.26, "h": 0.36, "title": "CAPA ADMINISTRACIÓN", 
         "desc": "Workout Builder Pro\n3 Bloques (Warmup/Main/Cool)\nPlantillas & Mesociclos\nFicha Clínica & Feed V°B°\nInbox 1 a 1 en Directo", "color": "#4D602E"},
        {"x": 0.37, "y": 0.20, "w": 0.27, "h": 0.62, "title": "BACKEND API (FASTAPI)", 
         "desc": "FastAPI + Uvicorn (Puerto 8006)\nSQLAlchemy 2.0 ORM\nsearch_path = bdmottus,public\nAutenticación JWT (HS256)\nCriptografía Bcrypt (72 bytes)\nAlgoritmo 1RM Epley\nDescarga Streaming Docx", "color": "#89A854"},
        {"x": 0.70, "y": 0.20, "w": 0.26, "h": 0.62, "title": "PERSISTENCIA AWS RDS", 
         "desc": "PostgreSQL 15 RDS\nEsquema: bdmottus\n14 Tablas Relacionales\nHistorial logs serie a serie\nMétricas Corporales & Fotos\nDirect Messages & Comentarios\nTransacciones ACID", "color": "#2D3B24"}
    ]

    for b in boxes:
        rect = patches.FancyBboxPatch((b['x'], b['y']), b['w'], b['h'],
                                      boxstyle="round,pad=0.02,rounding_size=0.03",
                                      linewidth=1.8, edgecolor=b['color'], facecolor='#161F16')
        ax.add_patch(rect)
        ax.text(b['x'] + b['w']/2, b['y'] + b['h'] - 0.05, b['title'], color='#DEEAC1',
                fontsize=10.5, fontweight='bold', ha='center', va='center')
        ax.text(b['x'] + b['w']/2, b['y'] + b['h']/2 - 0.03, b['desc'], color='#D1DDD0',
                fontsize=8.5, ha='center', va='center', linespacing=1.35)

    arrow_kw = dict(arrowstyle="->,head_width=0.4,head_length=0.6", color="#89A854", lw=2)
    ax.annotate("", xy=(0.37, 0.62), xytext=(0.30, 0.62), arrowprops=arrow_kw)
    ax.annotate("", xy=(0.37, 0.38), xytext=(0.30, 0.38), arrowprops=arrow_kw)
    ax.annotate("", xy=(0.70, 0.51), xytext=(0.64, 0.51), arrowprops=arrow_kw)
    ax.annotate("", xy=(0.64, 0.49), xytext=(0.70, 0.49), arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6", color="#6E8842", lw=2))

    ax.text(0.335, 0.65, "JSON/REST", color="#DEEAC1", fontsize=7.5, ha='center')
    ax.text(0.335, 0.41, "REST Admin", color="#DEEAC1", fontsize=7.5, ha='center')
    ax.text(0.67, 0.54, "SQL / Pool", color="#DEEAC1", fontsize=7.5, ha='center')

    ax.text(0.50, 0.94, "TOPOLOGIA TECNICA DE APPMOTTUS STUDIO (TRES CAPAS)",
            color="#FFF", fontsize=12, fontweight='bold', ha='center')
    ax.text(0.50, 0.03, "HTTPS: appmottus.raevsi.cl  |  Nginx Reverse Proxy  |  Uvicorn 127.0.0.1:8006  |  PostgreSQL RDS",
            color="#89A854", fontsize=8, ha='center')

    plt.tight_layout()
    path = os.path.join(ASSETS_DIR, 'diagram_architecture.png')
    plt.savefig(path, facecolor=fig.get_facecolor(), edgecolor='none', dpi=200)
    plt.close()
    return path

def generate_workout_logger_mockup():
    fig, ax = plt.subplots(figsize=(9.2, 5.2), dpi=200)
    fig.patch.set_facecolor('#121712')
    ax.set_facecolor('#121712')
    ax.axis('off')

    frame = patches.FancyBboxPatch((0.03, 0.03), 0.94, 0.94, boxstyle="round,pad=0.02,rounding_size=0.03",
                                   linewidth=2, edgecolor='#4D602E', facecolor='#182118')
    ax.add_patch(frame)

    header = patches.Rectangle((0.05, 0.84), 0.90, 0.10, facecolor='#222E22', edgecolor='#6E8842', linewidth=1)
    ax.add_patch(header)
    ax.text(0.08, 0.90, "SESION: TORSO FUERZA - SEMANA 3", color='#FFF', fontsize=12, fontweight='bold', va='center')
    ax.text(0.08, 0.86, "Coach: Roderick Espinoza  |  Bloques: 3 (Warmup · Main Workout · Cooldown)", color='#A3BA88', fontsize=8.5, va='center')
    ax.text(0.85, 0.89, "REGULAR / A1-A2", color='#DEEAC1', fontsize=9, fontweight='bold', ha='center', va='center',
            bbox=dict(boxstyle="round,pad=0.3", facecolor='#4D602E', edgecolor='#89A854'))

    warmup = patches.Rectangle((0.05, 0.72), 0.90, 0.09, facecolor='#1A231A', edgecolor='#3A4A3A', linewidth=1)
    ax.add_patch(warmup)
    ax.text(0.07, 0.77, "BLOQUE 1: CALENTAMIENTO & MOVILIDAD (WARM-UP)", color='#DEEAC1', fontsize=9.5, fontweight='bold')
    ax.text(0.07, 0.74, "5 min Elíptica suave + Movilidad torácica + Rotadores externos con banda (2 series x 15 reps)", color='#C5D4BE', fontsize=8)

    main_box = patches.Rectangle((0.05, 0.22), 0.90, 0.47, facecolor='#1A231A', edgecolor='#6E8842', linewidth=1.2)
    ax.add_patch(main_box)
    ax.text(0.07, 0.65, "BLOQUE 2: ENTRENAMIENTO PRINCIPAL (SUPERSET A1 / A2)", color='#FFF', fontsize=10.5, fontweight='bold')
    ax.text(0.07, 0.62, "A1: Press de Banca Plano con Barra  ·  Tempo: 3-1-1-0  ·  Descanso: 90s", color='#DEEAC1', fontsize=8.5)

    badge = patches.Rectangle((0.07, 0.54), 0.86, 0.06, facecolor='#263326', edgecolor='#89A854', linewidth=0.8)
    ax.add_patch(badge)
    ax.text(0.09, 0.57, "ULTIMO REGISTRO (LAST PERFORMANCE): 80.0 kg x 6 reps  (1RM Estimado Epley: 96.0 kg)",
            color='#DEEAC1', fontsize=8, fontweight='bold', va='center')

    rows_y = [0.46, 0.38, 0.30]
    set_labels = ["SET 1", "SET 2", "SET 3"]
    targets = ["Prescrito: 80 kg x 6 (RPE 8.0)", "Prescrito: 82.5 kg x 6 (RPE 8.5)", "Prescrito: 85 kg x 6 (RPE 9.0)"]
    actuals = ["Real: 80.0 kg x 6  · RPE: 8.0", "Real: 82.5 kg x 6  · RPE: 8.5", "Pendiente de registro..."]
    checks = ["[OK] COMPLETADA", "[OK] COMPLETADA", "[ ] PENDIENTE"]

    for y, slab, tgt, act, chk in zip(rows_y, set_labels, targets, actuals, checks):
        row_bg = '#222E22' if '[OK]' in chk else '#1D251D'
        rpatch = patches.Rectangle((0.07, y), 0.86, 0.065, facecolor=row_bg, edgecolor='#3E4F3E', linewidth=0.8)
        ax.add_patch(rpatch)
        ax.text(0.09, y + 0.033, slab, color='#FFF', fontsize=8.5, fontweight='bold', va='center')
        ax.text(0.20, y + 0.033, tgt, color='#A3BA88', fontsize=8, va='center')
        ax.text(0.53, y + 0.033, act, color='#DEEAC1', fontsize=8, fontweight='bold', va='center')
        color_chk = '#89A854' if '[OK]' in chk else '#E2E8F0'
        ax.text(0.85, y + 0.033, chk, color=color_chk, fontsize=8, fontweight='bold', ha='center', va='center')

    cooldown = patches.Rectangle((0.05, 0.12), 0.90, 0.08, facecolor='#1A231A', edgecolor='#3A4A3A', linewidth=1)
    ax.add_patch(cooldown)
    ax.text(0.07, 0.165, "BLOQUE 3: VUELTA A LA CALMA (COOL-DOWN)", color='#DEEAC1', fontsize=9.5, fontweight='bold')
    ax.text(0.07, 0.135, "Estiramiento estático pectoral en marco de puerta (2 x 30s) + Respiración diafragmática 3 min", color='#C5D4BE', fontsize=8)

    timer_box = patches.FancyBboxPatch((0.58, 0.04), 0.35, 0.15, boxstyle="round,pad=0.02,rounding_size=0.03",
                                       linewidth=2, edgecolor='#DEEAC1', facecolor='#2A382A')
    ax.add_patch(timer_box)
    ax.text(0.60, 0.15, "REST TIMER ACTIVO", color='#DEEAC1', fontsize=8, fontweight='bold')
    ax.text(0.75, 0.10, "01:28", color='#FFF', fontsize=18, fontweight='bold', ha='center', va='center')
    ax.text(0.64, 0.06, "[-15s]", color='#A3BA88', fontsize=7.5, fontweight='bold')
    ax.text(0.74, 0.06, "[Pausa]", color='#DEEAC1', fontsize=7.5, fontweight='bold')
    ax.text(0.84, 0.06, "[+15s]", color='#A3BA88', fontsize=7.5, fontweight='bold')

    plt.tight_layout()
    path = os.path.join(ASSETS_DIR, 'diagram_workout_logger.png')
    plt.savefig(path, facecolor=fig.get_facecolor(), edgecolor='none', dpi=200)
    plt.close()
    return path

def generate_epley_progression_chart():
    fig, ax = plt.subplots(figsize=(9.2, 4.8), dpi=200)
    fig.patch.set_facecolor('#0E130E')
    ax.set_facecolor('#161F16')

    weeks = np.array([1, 2, 3, 4, 5, 6, 7, 8])
    actual_weight = np.array([80, 82.5, 85, 75, 87.5, 90, 92.5, 95])
    reps_done = np.array([6, 6, 5, 6, 5, 4, 4, 3])
    epley_1rm = actual_weight * (1 + reps_done / 30.0)

    ax.plot(weeks, epley_1rm, color='#89A854', marker='o', linewidth=2.8, markersize=8, label='1RM Estimado (Fórmula de Epley)')
    ax.plot(weeks, actual_weight, color='#DEEAC1', marker='s', linewidth=2, linestyle='--', markersize=6, label='Carga Real Levantada (kg)')

    ax.fill_between(weeks, epley_1rm * 0.90, epley_1rm, color='#6E8842', alpha=0.18, label='Zona de Fuerza Máxima (>90%)')
    ax.fill_between(weeks, epley_1rm * 0.75, epley_1rm * 0.90, color='#4D602E', alpha=0.15, label='Zona de Hipertrofia Efectiva (75-90%)')

    ax.annotate('Descarga Planificada\n(Semana 4)', xy=(4, 90), xytext=(3.2, 102),
                arrowprops=dict(facecolor='#DEEAC1', shrink=0.08, width=1.5, headwidth=6),
                color='#DEEAC1', fontsize=8.5, fontweight='bold', ha='center',
                bbox=dict(boxstyle="round,pad=0.3", facecolor='#263326', edgecolor='#89A854'))

    ax.annotate('Peak de 1RM: 104.5 kg\n(Semana 8)', xy=(8, 104.5), xytext=(7.1, 95),
                arrowprops=dict(facecolor='#89A854', shrink=0.08, width=1.5, headwidth=6),
                color='#DEEAC1', fontsize=8.5, fontweight='bold', ha='center',
                bbox=dict(boxstyle="round,pad=0.3", facecolor='#263326', edgecolor='#89A854'))

    ax.set_title('PROGRESION ANALITICA DE 1RM & SOBRECARGA (MESOCICLO 8 SEMANAS)',
                 color='#FFF', fontsize=11, fontweight='bold', pad=15)
    ax.set_xlabel('Semana de Entrenamiento', color='#C5D4BE', fontsize=9.5)
    ax.set_ylabel('Carga / Fuerza Teórica (kg)', color='#C5D4BE', fontsize=9.5)
    ax.set_xticks(weeks)
    ax.set_xticklabels([f"S{w}" for w in weeks], color='#C5D4BE')
    ax.tick_params(colors='#C5D4BE')
    ax.grid(True, linestyle=':', alpha=0.25, color='#89A854')

    ax.spines['bottom'].set_color('#89A854')
    ax.spines['top'].set_color((1.0, 1.0, 1.0, 0.15))
    ax.spines['right'].set_color((1.0, 1.0, 1.0, 0.15))
    ax.spines['left'].set_color((1.0, 1.0, 1.0, 0.2))

    legend = ax.legend(facecolor='#161F16', edgecolor='#4D602E', fontsize=8, loc='upper left')
    for text in legend.get_texts():
        text.set_color('#DEEAC1')

    plt.tight_layout()
    path = os.path.join(ASSETS_DIR, 'diagram_epley_chart.png')
    plt.savefig(path, facecolor=fig.get_facecolor(), edgecolor='none', dpi=200)
    plt.close()
    return path

def generate_comparator_mockup():
    fig, ax = plt.subplots(figsize=(9.2, 5.0), dpi=200)
    fig.patch.set_facecolor('#0E130E')
    ax.set_facecolor('#0E130E')
    ax.axis('off')

    title_box = patches.Rectangle((0.04, 0.88), 0.92, 0.09, facecolor='#1E281E', edgecolor='#4D602E')
    ax.add_patch(title_box)
    ax.text(0.50, 0.935, "COMPARADOR FOTOGRAFICO & ANTROPOMETRICO SIDE-BY-SIDE",
            color='#FFF', fontsize=11.5, fontweight='bold', ha='center', va='center')
    ax.text(0.50, 0.895, "Alumno: Carlos Mendoza  |  Comparativa: 15 Ene 2026  vs  15 Mar 2026 (8 Semanas)",
            color='#A3BA88', fontsize=8.5, ha='center', va='center')

    # Tarjetas de Fotos
    photo_cards = [
        {"x": 0.04, "title": "FOTO FRONTAL (INICIAL)", "date": "15/01/2026", "badge": "Semana 1"},
        {"x": 0.28, "title": "FOTO FRONTAL (ACTUAL)", "date": "15/03/2026", "badge": "Semana 8"},
        {"x": 0.52, "title": "FOTO PERFIL (INICIAL)", "date": "15/01/2026", "badge": "Semana 1"},
        {"x": 0.76, "title": "FOTO PERFIL (ACTUAL)", "date": "15/03/2026", "badge": "Semana 8"}
    ]

    for c in photo_cards:
        rect = patches.FancyBboxPatch((c['x'], 0.44), 0.20, 0.40, boxstyle="round,pad=0.015,rounding_size=0.02",
                                      linewidth=1.2, edgecolor='#6E8842', facecolor='#182118')
        ax.add_patch(rect)
        ax.text(c['x'] + 0.10, 0.80, c['title'], color='#DEEAC1', fontsize=7.5, fontweight='bold', ha='center')
        ax.text(c['x'] + 0.10, 0.76, c['date'], color='#89A854', fontsize=7, ha='center')

        inner_photo = patches.Rectangle((c['x'] + 0.02, 0.47), 0.16, 0.26, facecolor='#253225', edgecolor='#4D602E')
        ax.add_patch(inner_photo)
        ax.text(c['x'] + 0.10, 0.60, "[SILUETA]", color='#5A6E5A', fontsize=9, fontweight='bold', ha='center')
        ax.text(c['x'] + 0.10, 0.49, c['badge'], color='#FFF', fontsize=7, ha='center',
                bbox=dict(boxstyle="round,pad=0.2", facecolor='#4D602E', edgecolor='none'))

    # Métricas y Delta
    metrics_panel = patches.FancyBboxPatch((0.04, 0.06), 0.92, 0.34, boxstyle="round,pad=0.02,rounding_size=0.02",
                                           linewidth=1.5, edgecolor='#89A854', facecolor='#161F16')
    ax.add_patch(metrics_panel)
    ax.text(0.07, 0.35, "BALANCE BIOMETRICO & VARIACION NETA (DELTA)", color='#DEEAC1', fontsize=9.5, fontweight='bold')

    mcards = [
        {"x": 0.07, "label": "PESO CORPORAL", "v1": "82.4 kg", "v2": "78.8 kg", "diff": "-3.6 kg", "fav": True},
        {"x": 0.25, "label": "PERIM. CINTURA", "v1": "88.0 cm", "v2": "82.5 cm", "diff": "-5.5 cm", "fav": True},
        {"x": 0.43, "label": "PERIM. PECHO", "v1": "101.0 cm", "v2": "103.5 cm", "diff": "+2.5 cm", "fav": True},
        {"x": 0.61, "label": "PERIM. BRAZO", "v1": "36.5 cm", "v2": "37.8 cm", "diff": "+1.3 cm", "fav": True},
        {"x": 0.79, "label": "PERIM. MUSLO", "v1": "57.0 cm", "v2": "58.2 cm", "diff": "+1.2 cm", "fav": True}
    ]

    for m in mcards:
        box = patches.Rectangle((m['x'], 0.10), 0.155, 0.21, facecolor='#222E22', edgecolor='#3E4F3E', linewidth=1)
        ax.add_patch(box)
        ax.text(m['x'] + 0.0775, 0.27, m['label'], color='#A3BA88', fontsize=7, fontweight='bold', ha='center')
        ax.text(m['x'] + 0.0775, 0.22, f"Ini: {m['v1']}", color='#C5D4BE', fontsize=7.5, ha='center')
        ax.text(m['x'] + 0.0775, 0.18, f"Act: {m['v2']}", color='#FFF', fontsize=8, fontweight='bold', ha='center')
        ax.text(m['x'] + 0.0775, 0.13, f"DELTA {m['diff']}", color='#DEEAC1', fontsize=8, fontweight='bold', ha='center',
                bbox=dict(boxstyle="round,pad=0.2", facecolor='#4D602E', edgecolor='#89A854'))

    plt.tight_layout()
    path = os.path.join(ASSETS_DIR, 'diagram_comparator.png')
    plt.savefig(path, facecolor=fig.get_facecolor(), edgecolor='none', dpi=200)
    plt.close()
    return path

def generate_calendar_feed_mockup():
    fig, ax = plt.subplots(figsize=(9.2, 5.0), dpi=200)
    fig.patch.set_facecolor('#0E130E')
    ax.set_facecolor('#0E130E')
    ax.axis('off')

    # Titulo
    title_box = patches.Rectangle((0.04, 0.88), 0.92, 0.09, facecolor='#1E281E', edgecolor='#4D602E')
    ax.add_patch(title_box)
    ax.text(0.50, 0.935, "VISTA DE CALENDARIO SEMANAL & LIVE ACTIVITY FEED (COACH)",
            color='#FFF', fontsize=11.5, fontweight='bold', ha='center', va='center')
    ax.text(0.50, 0.895, "Supervisión institucional, programación multi-semana y aprobación en tiempo real",
            color='#A3BA88', fontsize=8.5, ha='center', va='center')

    # Panel Calendario (Izquierda)
    cal_panel = patches.FancyBboxPatch((0.04, 0.06), 0.52, 0.79, boxstyle="round,pad=0.015,rounding_size=0.02",
                                       linewidth=1.2, edgecolor='#6E8842', facecolor='#161F16')
    ax.add_patch(cal_panel)
    ax.text(0.06, 0.81, "CALENDARIO SEMANAL DE RUTINAS", color='#DEEAC1', fontsize=9.5, fontweight='bold')

    days = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"]
    cards_cal = [
        {"d": "LUN", "t": "Torso A", "st": "[OK] Hecho", "c": "#4D602E"},
        {"d": "MAR", "t": "Pierna A", "st": "[OK] Hecho", "c": "#4D602E"},
        {"d": "MIE", "t": "Descanso", "st": "Recupera", "c": "#222E22"},
        {"d": "JUE", "t": "Torso B", "st": "[OK] Hecho", "c": "#4D602E"},
        {"d": "VIE", "t": "Pierna B", "st": "[*] Hoy", "c": "#89A854"},
        {"d": "SAB", "t": "Cardio/HIIT", "st": "[ ] Pendiente", "c": "#263326"},
        {"d": "DOM", "t": "Descanso", "st": "Recupera", "c": "#222E22"}
    ]

    for i, c in enumerate(cards_cal):
        y_pos = 0.71 - (i * 0.095)
        drect = patches.Rectangle((0.06, y_pos), 0.48, 0.08, facecolor=c['c'], edgecolor='#4D602E', linewidth=0.8)
        ax.add_patch(drect)
        ax.text(0.09, y_pos + 0.04, c['d'], color='#FFF', fontsize=8.5, fontweight='bold', va='center')
        ax.text(0.18, y_pos + 0.04, c['t'], color='#DEEAC1', fontsize=8, va='center')
        ax.text(0.48, y_pos + 0.04, c['st'], color='#FFF', fontsize=7.5, fontweight='bold', ha='right', va='center')

    # Panel Feed (Derecha)
    feed_panel = patches.FancyBboxPatch((0.58, 0.06), 0.38, 0.79, boxstyle="round,pad=0.015,rounding_size=0.02",
                                        linewidth=1.2, edgecolor='#89A854', facecolor='#161F16')
    ax.add_patch(feed_panel)
    ax.text(0.60, 0.81, "LIVE ACTIVITY FEED (AUDITORIA)", color='#DEEAC1', fontsize=9.5, fontweight='bold')

    events = [
        {"user": "Carlos Mendoza", "act": "Completo Torso Fuerza (100%)", "time": "Hace 15m", "btn": "V°B° Aprobado"},
        {"user": "Valeria Silva", "act": "Registro 2,150 kcal y 130g prot", "time": "Hace 42m", "btn": "Visto"},
        {"user": "Andres Soto", "act": "Completo Pierna Hipertrofia", "time": "Hace 1h", "btn": "V°B° Aprobado"},
        {"user": "Fernanda Rios", "act": "Actualizo fotos comparativas", "time": "Hace 2h", "btn": "Revisado"}
    ]

    for i, ev in enumerate(events):
        y_pos = 0.68 - (i * 0.16)
        ev_box = patches.Rectangle((0.60, y_pos), 0.34, 0.13, facecolor='#222E22', edgecolor='#3E4F3E', linewidth=1)
        ax.add_patch(ev_box)
        ax.text(0.62, y_pos + 0.095, ev['user'], color='#FFF', fontsize=8.5, fontweight='bold')
        ax.text(0.62, y_pos + 0.06, ev['act'], color='#C5D4BE', fontsize=7.2)
        ax.text(0.62, y_pos + 0.025, ev['time'], color='#89A854', fontsize=6.8)
        ax.text(0.88, y_pos + 0.04, f"[{ev['btn']}]", color='#DEEAC1', fontsize=7, fontweight='bold', ha='center',
                bbox=dict(boxstyle="round,pad=0.2", facecolor='#4D602E', edgecolor='#89A854'))

    plt.tight_layout()
    path = os.path.join(ASSETS_DIR, 'diagram_calendar_feed.png')
    plt.savefig(path, facecolor=fig.get_facecolor(), edgecolor='none', dpi=200)
    plt.close()
    return path

def generate_student_lifecycle_flow():
    fig, ax = plt.subplots(figsize=(9.2, 4.6), dpi=200)
    fig.patch.set_facecolor('#0E130E')
    ax.set_facecolor('#0E130E')
    ax.axis('off')

    title_box = patches.Rectangle((0.04, 0.88), 0.92, 0.09, facecolor='#1E281E', edgecolor='#4D602E')
    ax.add_patch(title_box)
    ax.text(0.50, 0.935, "FLUJO DEL CICLO DE VIDA DEL ALUMNO & FICHA CLINICA",
            color='#FFF', fontsize=11.5, fontweight='bold', ha='center', va='center')
    ax.text(0.50, 0.895, "Estados operativos desde el alta por invitación hasta la auditoría periódica",
            color='#A3BA88', fontsize=8.5, ha='center', va='center')

    steps = [
        {"x": 0.04, "y": 0.48, "w": 0.27, "h": 0.34, "step": "1. INVITACION & ALTA",
         "desc": "Coach emite token único\nAsociado a RUT del alumno\nSin dependencia SMTP\nLink directo seguro", "color": "#4D602E"},
        {"x": 0.365, "y": 0.48, "w": 0.27, "h": 0.34, "step": "2. REGISTRO & PERFIL",
         "desc": "Nombre, Apellido, Nacimiento\nUbicación, Género, Peso, Talla\nPreferencia: kg/cm vs lbs/in\nFicha Clínica (Lesiones/Metas)", "color": "#6E8842"},
        {"x": 0.69, "y": 0.48, "w": 0.27, "h": 0.34, "step": "3. PRESCRIPCION PRO",
         "desc": "Constructor en 3 Bloques\nSuperseries A1/A2, Tempo, RPE\nPlantillas Maestras\nMesociclos 4/8/12 semanas", "color": "#89A854"},
        {"x": 0.04, "y": 0.06, "w": 0.27, "h": 0.34, "step": "6. AUDITORIA & METRICAS",
         "desc": "Analítica 1RM Epley\nTonelaje total acumulado\nComparador Side-by-Side Delta\nFeedback & Chat 1 a 1", "color": "#2D3B24"},
        {"x": 0.365, "y": 0.06, "w": 0.27, "h": 0.34, "step": "5. FEED & REVISION COACH",
         "desc": "Live Activity Feed en tiempo real\nLectura de notas y videos\nOtorgamiento de V°B° oficial\nis_reviewed_by_coach = True", "color": "#4D602E"},
        {"x": 0.69, "y": 0.06, "w": 0.27, "h": 0.34, "step": "4. ENTRENAMIENTO EN VIVO",
         "desc": "Interactive Workout Logger\nRegistro de peso, reps y RPE\nRest Timer flotante interactivo\nAuto-completado de rutina", "color": "#6E8842"}
    ]

    for s in steps:
        box = patches.FancyBboxPatch((s['x'], s['y']), s['w'], s['h'], boxstyle="round,pad=0.015,rounding_size=0.02",
                                     linewidth=1.5, edgecolor=s['color'], facecolor='#161F16')
        ax.add_patch(box)
        ax.text(s['x'] + s['w']/2, s['y'] + s['h'] - 0.06, s['step'], color='#DEEAC1',
                fontsize=9.5, fontweight='bold', ha='center')
        ax.text(s['x'] + s['w']/2, s['y'] + s['h']/2 - 0.03, s['desc'], color='#D1DDD0',
                fontsize=8, ha='center', linespacing=1.35)

    arrow_kw = dict(arrowstyle="->,head_width=0.4,head_length=0.6", color="#89A854", lw=2)
    ax.annotate("", xy=(0.365, 0.65), xytext=(0.31, 0.65), arrowprops=arrow_kw)
    ax.annotate("", xy=(0.69, 0.65), xytext=(0.635, 0.65), arrowprops=arrow_kw)
    ax.annotate("", xy=(0.825, 0.40), xytext=(0.825, 0.48), arrowprops=arrow_kw)
    ax.annotate("", xy=(0.635, 0.23), xytext=(0.69, 0.23), arrowprops=arrow_kw)
    ax.annotate("", xy=(0.31, 0.23), xytext=(0.365, 0.23), arrowprops=arrow_kw)

    plt.tight_layout()
    path = os.path.join(ASSETS_DIR, 'diagram_lifecycle.png')
    plt.savefig(path, facecolor=fig.get_facecolor(), edgecolor='none', dpi=200)
    plt.close()
    return path

# -----------------------------------------------------------------------------
# COMPILADOR PRINCIPAL DEL DOCUMENTO WORD EXHAUSTIVO
# -----------------------------------------------------------------------------

def build_complete_user_manual():
    print("Iniciando compilación del Manual Completo y Extenso de AppMottus (v4.0)...")

    # 1. Generar los 6 diagramas en alta resolución
    print("-> Generando Diagrama 1: Topología de Arquitectura...")
    diag_arch = generate_architecture_diagram()

    print("-> Generando Diagrama 2: Mockup Workout Logger...")
    diag_logger = generate_workout_logger_mockup()

    print("-> Generando Diagrama 3: Gráfica Analítica 1RM Epley...")
    diag_epley = generate_epley_progression_chart()

    print("-> Generando Diagrama 4: Comparador Side-by-Side...")
    diag_comp = generate_comparator_mockup()

    print("-> Generando Diagrama 5: Calendario Semanal & Activity Feed...")
    diag_cal = generate_calendar_feed_mockup()

    print("-> Generando Diagrama 6: Ciclo de Vida del Alumno...")
    diag_life = generate_student_lifecycle_flow()

    doc = Document()

    # Configuración de márgenes estándar de 1 pulgada (72 pt / 1440 dxa)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # -------------------------------------------------------------------------
    # PORTADA INSTITUCIONAL
    # -------------------------------------------------------------------------
    p_pre = doc.add_paragraph()
    p_pre.paragraph_format.space_before = Pt(36)
    p_pre.paragraph_format.space_after = Pt(4)
    run_pre = p_pre.add_run("DOCUMENTO TÉCNICO OFICIAL  |  APPMOTTUS STUDIO")
    run_pre.font.name = "Arial"
    run_pre.font.size = Pt(10)
    run_pre.font.bold = True
    run_pre.font.color.rgb = RGBColor(0x6E, 0x88, 0x42)

    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(4)
    p_title.paragraph_format.space_after = Pt(8)
    run_title = p_title.add_run("MANUAL DE USUARIO Y ARQUITECTURA TÉCNICA")
    run_title.font.name = "Arial Black"
    run_title.font.size = Pt(25)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(0x16, 0x1D, 0x16)

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_after = Pt(28)
    run_sub = p_sub.add_run(
        "Guía Integral de Operaciones para Coaches, Administradores y Atletas.\n"
        "Arquitectura Cloud, Diccionario de Datos Relacional, Prescripción Biomecánica y DevOps."
    )
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(12)
    run_sub.font.color.rgb = RGBColor(0x4D, 0x60, 0x2E)

    # Tabla de Metadatos de Portada
    meta_table = doc.add_table(rows=5, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.autofit = False
    meta_table.columns[0].width = Inches(2.2)
    meta_table.columns[1].width = Inches(4.3)
    set_table_clean_borders(meta_table)

    meta_data = [
        ("Plataforma Web:", "AppMottus Studio (https://appmottus.raevsi.cl)"),
        ("Versión del Sistema:", "Versión 4.0 - Enterprise Edition (Paridad Total TrueCoach)"),
        ("Fecha de Publicación:", datetime.now().strftime("%d de %B de %Y")),
        ("Autor y Arquitectura:", "Equipo de Ingeniería de Software & Ciencias del Ejercicio"),
        ("Clasificación del Documento:", "Manual Operativo & Especificación de Software (Uso Autorizado)")
    ]

    for i, (k, v) in enumerate(meta_data):
        c0, c1 = meta_table.cell(i, 0), meta_table.cell(i, 1)
        set_cell_background(c0, "F2F5ED")
        set_cell_background(c1, "FFFFFF")
        set_cell_margins(c0, top=100, bottom=100, left=140, right=140)
        set_cell_margins(c1, top=100, bottom=100, left=140, right=140)

        pk = c0.paragraphs[0]
        pk.paragraph_format.space_before = Pt(2)
        pk.paragraph_format.space_after = Pt(2)
        rk = pk.add_run(k)
        rk.font.name = "Arial"
        rk.font.size = Pt(9.5)
        rk.font.bold = True
        rk.font.color.rgb = RGBColor(0x2D, 0x3B, 0x24)

        pv = c1.paragraphs[0]
        pv.paragraph_format.space_before = Pt(2)
        pv.paragraph_format.space_after = Pt(2)
        rv = pv.add_run(v)
        rv.font.name = "Arial"
        rv.font.size = Pt(9.5)
        rv.font.color.rgb = RGBColor(0x1A, 0x20, 0x1A)

    doc.add_page_break()

    # -------------------------------------------------------------------------
    # RESUMEN EJECUTIVO & ÍNDICE GENERAL
    # -------------------------------------------------------------------------
    p_h1 = doc.add_paragraph()
    r = p_h1.add_run("RESUMEN EJECUTIVO & ALCANCE DEL SISTEMA")
    r.font.name = "Arial"
    r.font.size = Pt(17)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x4D, 0x60, 0x2E)
    p_h1.paragraph_format.space_before = Pt(12)
    p_h1.paragraph_format.space_after = Pt(8)

    p_intro = doc.add_paragraph()
    p_intro.paragraph_format.space_after = Pt(8)
    p_intro.paragraph_format.line_spacing = 1.15
    p_intro.add_run(
        "AppMottus Studio es una plataforma cloud integral de alto rendimiento diseñada específicamente "
        "para centros de entrenamiento personalizado, entrenadores de fuerza y acondicionamiento físico, "
        "y atletas que exigen un control milimétrico sobre su progreso cinético, biomecánico y nutricional. "
        "El sistema combina la fluidez y velocidad de respuesta de una Single Page Application (SPA) en React 19 "
        "con la robustez asíncrona de FastAPI, garantizando transacciones atómicas bajo el estándar ACID sobre PostgreSQL RDS en AWS.\n\n"
        "La plataforma replica y perfecciona las capacidades de las herramientas líderes del mercado (como TrueCoach), "
        "integrando en un ecosistema unificado: el registro de cargas serie por serie en tiempo real, "
        "cronometría de descanso con retroalimentación sonora sintetizada, prescripción avanzada por bloques (Warm-up, "
        "Main Workout y Cool-down), gestión de superseries (A1/A2), control de tempo de 4 dígitos, alertas médicas y "
        "fichas clínicas confidenciales, comparador fotográfico y antropométrico con cálculo de variaciones netas (Delta), "
        "y auditoría mediante un Live Activity Feed institucional."
    )

    make_callout(
        doc,
        "Este manual está diseñado para servir tanto de guía de usuario final (para entrenadores y atletas) "
        "como de especificación técnica y de DevOps para administradores de sistemas y desarrolladores que operen sobre el esquema 'bdmottus'.",
        title="PROPÓSITO DEL DOCUMENTO"
    )

    # Índice
    p_idx_h = doc.add_paragraph()
    r = p_idx_h.add_run("ESTRUCTURA Y CONTENIDO GENERAL DEL MANUAL")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x16, 0x1D, 0x16)
    p_idx_h.paragraph_format.space_before = Pt(14)
    p_idx_h.paragraph_format.space_after = Pt(6)

    index_items = [
        ("Capítulo 1", "Arquitectura Técnica y Modelo de Datos de bdmottus", "Topología de 3 capas, diccionario completo de 14 tablas, seguridad JWT y Bcrypt."),
        ("Capítulo 2", "Guía Operativa para el Administrador y el Coach", "Workout Builder Pro en 3 bloques, superseries A1/A2, plantillas, ficha clínica y Live Feed."),
        ("Capítulo 3", "Manual de Uso para el Atleta (Alumno)", "Interactive Workout Logger, Rest Timer reactivo, seguimiento de hábitos y comparador Side-by-Side."),
        ("Capítulo 4", "Análisis de Rendimiento, Fórmulas y Ciencia del Entrenamiento", "Matemática del 1RM (Epley), tonelaje total, escala RPE/RIR y cadencia de Tempo (4 dígitos)."),
        ("Capítulo 5", "Apéndice de Troubleshooting y Operaciones (DevOps)", "Resolución de incidencias en backend, variables de entorno, migraciones y script deploy.sh.")
    ]

    for cap, tit, desc in index_items:
        p_item = doc.add_paragraph(style='List Bullet')
        p_item.paragraph_format.space_after = Pt(3)
        r_c = p_item.add_run(f"{cap}: {tit} — ")
        r_c.font.name = "Arial"
        r_c.font.size = Pt(9.5)
        r_c.font.bold = True
        r_c.font.color.rgb = RGBColor(0x4D, 0x60, 0x2E)
        r_d = p_item.add_run(desc)
        r_d.font.name = "Arial"
        r_d.font.size = Pt(9.5)
        r_d.font.color.rgb = RGBColor(0x3A, 0x4A, 0x3A)

    doc.add_page_break()

    # -------------------------------------------------------------------------
    # CAPÍTULO 1: ARQUITECTURA TÉCNICA Y MODELO DE DATOS DE BDMOTTUS
    # -------------------------------------------------------------------------
    p_c1 = doc.add_paragraph()
    r = p_c1.add_run("CAPÍTULO 1: ARQUITECTURA TÉCNICA Y MODELO DE DATOS DE BDMOTTUS")
    r.font.name = "Arial"
    r.font.size = Pt(17)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x4D, 0x60, 0x2E)
    p_c1.paragraph_format.space_before = Pt(12)
    p_c1.paragraph_format.space_after = Pt(8)

    p_c1_sub = doc.add_paragraph()
    p_c1_sub.paragraph_format.space_after = Pt(8)
    p_c1_sub.paragraph_format.line_spacing = 1.15
    p_c1_sub.add_run(
        "La infraestructura de AppMottus está desacoplada en tres capas independientes y altamente cohesionadas, "
        "optimizadas para soportar cargas concurrentes de lectura y escritura en tiempo real sin degradación de latencia. "
        "A continuación se describe la especificación de cada componente:"
    )

    doc.add_picture(diag_arch, width=Inches(6.5))
    p_cap = doc.add_paragraph()
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap.paragraph_format.space_after = Pt(12)
    r_cap = p_cap.add_run("Figura 1.1: Diagrama de Topología de Red, Comunicación y Persistencia en Tres Capas.")
    r_cap.font.name = "Arial"
    r_cap.font.size = Pt(8.5)
    r_cap.font.italic = True
    r_cap.font.color.rgb = RGBColor(0x5A, 0x66, 0x5A)

    # 1.1 Capas
    p_h2 = doc.add_paragraph()
    r = p_h2.add_run("1.1 Desglose de Capas de la Plataforma")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x16, 0x1D, 0x16)
    p_h2.paragraph_format.space_before = Pt(10)
    p_h2.paragraph_format.space_after = Pt(6)

    layers_info = [
        ("Capa Cliente (Frontend SPA):", 
         "Construida sobre React 19 y empaquetada mediante Vite 8.2. Hace uso intensivo de Custom Hooks para la gestión de estados globales "
         "(autenticación con JWT, cronómetro de descanso flotante en background y caché local de ejercicios). La interfaz implementa componentes "
         "Glassmorphism con 'backdrop-filter: blur', paleta corporativa oscura inspirada en Mottus Studio y gráficos analíticos interactivos "
         "desarrollados en SVG nativo sin dependencias externas pesadas."),
        ("Capa de Red & Proxy Inverso (Nginx):", 
         "Servidor web Nginx configurado en el servidor Ubuntu de AWS. Termina las conexiones seguras SSL/TLS (HTTPS) bajo el dominio 'appmottus.raevsi.cl'. "
         "Sirve de manera estática y con compresión gzip todos los archivos optimizados del frontend compilado en '/var/www/html/appmottus.raevsi.cl' "
         "y redirige mediante proxy inverso cualquier petición a la ruta '/api' hacia el backend interno en 'http://127.0.0.1:8006'."),
        ("Capa de Aplicación y Lógica de Negocio (FastAPI):", 
         "Servicio backend desarrollado en Python 3.10+ utilizando el framework FastAPI montado sobre el servidor ASGI Uvicorn. "
         "La gestión de base de datos se implementa con SQLAlchemy 2.0 en modo transaccional seguro. Cada solicitud HTTP recibe una sesión de base de datos "
         "dedicada mediante el generador de inyección de dependencias 'get_db()', asegurando el commit o rollback estricto de transacciones."),
        ("Capa de Persistencia Relacional (AWS RDS PostgreSQL):", 
         "Instancia gestionada de PostgreSQL en Amazon Web Services (AWS RDS). Todas las tablas, vistas y secuencias residen estrictamente dentro del esquema "
         "aislado 'bdmottus'. Esto aísla por completo los datos de la aplicación y previene cualquier colisión con el esquema 'public'. "
         "La conexión del backend fuerza 'options=-csearch_path=bdmottus,public' en el connection string.")
    ]

    for title, desc in layers_info:
        p_layer = doc.add_paragraph()
        p_layer.paragraph_format.space_after = Pt(4)
        p_layer.paragraph_format.line_spacing = 1.15
        r_t = p_layer.add_run(f"• {title} ")
        r_t.font.name = "Arial"
        r_t.font.size = Pt(9.5)
        r_t.font.bold = True
        r_t.font.color.rgb = RGBColor(0x4D, 0x60, 0x2E)
        r_d = p_layer.add_run(desc)
        r_d.font.name = "Arial"
        r_d.font.size = Pt(9.5)
        r_d.font.color.rgb = RGBColor(0x1A, 0x20, 0x1A)

    # 1.2 Diccionario de Datos
    p_h2 = doc.add_paragraph()
    r = p_h2.add_run("1.2 Diccionario de Datos Completo (Esquema 'bdmottus')")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x16, 0x1D, 0x16)
    p_h2.paragraph_format.space_before = Pt(12)
    p_h2.paragraph_format.space_after = Pt(6)

    p_dict_intro = doc.add_paragraph()
    p_dict_intro.paragraph_format.space_after = Pt(8)
    p_dict_intro.paragraph_format.line_spacing = 1.15
    p_dict_intro.add_run(
        "A continuación se presenta la especificación exhaustiva de las 14 tablas estructurales que conforman el núcleo relacional "
        "de la plataforma en PostgreSQL bajo el esquema 'bdmottus':"
    )

    tables_dict = [
        ("bdmottus.users", "Usuarios del Sistema", [
            ("id", "UUID", "PK", "Identificador único universal del usuario."),
            ("rut", "VARCHAR(20)", "UNIQUE", "RUT único chileno validado (ej. 12345678-9)."),
            ("hashed_password", "VARCHAR(255)", "NOT NULL", "Hash Bcrypt de la contraseña con salt."),
            ("role_id", "UUID", "FK -> roles.id", "Rol de acceso del usuario (admin, coach o user)."),
            ("is_active", "BOOLEAN", "DEFAULT TRUE", "Estado de habilitación del usuario en la plataforma."),
            ("created_at", "TIMESTAMP", "DEFAULT NOW()", "Fecha y hora de registro en la base de datos.")
        ]),
        ("bdmottus.students", "Ficha de Atletas y Alumnos", [
            ("id", "UUID", "PK", "Identificador único de la ficha del alumno."),
            ("user_id", "UUID", "FK -> users.id", "Usuario asociado con credenciales de acceso."),
            ("name", "VARCHAR(100)", "NOT NULL", "Nombre de pila del atleta."),
            ("last_name", "VARCHAR(100)", "NULLABLE", "Apellido paterno/materno del atleta."),
            ("email", "VARCHAR(150)", "NULLABLE", "Correo electrónico de contacto (uso interno sin SMTP)."),
            ("phone", "VARCHAR(50)", "NULLABLE", "Número telefónico o móvil de contacto."),
            ("birth_date", "DATE", "NULLABLE", "Fecha de nacimiento (para cálculo automático de edad y FC máx)."),
            ("location", "VARCHAR(150)", "NULLABLE", "Ciudad o comuna de residencia del atleta."),
            ("gender", "VARCHAR(20)", "DEFAULT 'Masculino'", "Género para calibración de fórmulas antropométricas."),
            ("unit_preference", "VARCHAR(20)", "DEFAULT 'metric'", "Preferencia de visualización: 'metric' (kg/cm) o 'imperial' (lbs/in)."),
            ("injuries_notes", "TEXT", "NULLABLE", "Antecedentes médicos y lesiones activas con alerta en builder."),
            ("goals", "TEXT", "NULLABLE", "Objetivos deportivos declarados (hipertrofia, recomposición, etc.)."),
            ("equipment_available", "TEXT", "NULLABLE", "Equipamiento disponible en su lugar de entrenamiento."),
            ("private_coach_notes", "TEXT", "NULLABLE", "Notas privadas confidenciales exclusivas del entrenador.")
        ]),
        ("bdmottus.routines", "Prescripción de Rutinas", [
            ("id", "UUID", "PK", "Identificador único de la sesión prescrita."),
            ("student_id", "UUID", "FK -> students.id", "Atleta al cual está asignada la rutina."),
            ("coach_id", "UUID", "FK -> users.id", "Entrenador creador o responsable de la rutina."),
            ("name", "VARCHAR(150)", "NOT NULL", "Título de la sesión (ej. Torso Fuerza A)."),
            ("date", "DATE", "NOT NULL", "Fecha programada para la ejecución en el calendario."),
            ("warmup_notes", "TEXT", "NULLABLE", "Instrucciones del Bloque 1: Calentamiento y movilidad."),
            ("cooldown_notes", "TEXT", "NULLABLE", "Instrucciones del Bloque 3: Vuelta a la calma y estiramientos."),
            ("training_format", "VARCHAR(50)", "DEFAULT 'regular'", "Formato: 'regular', 'superset', 'circuit', 'amrap', 'emom'."),
            ("is_executed", "BOOLEAN", "DEFAULT FALSE", "Bandera de completitud general de la rutina."),
            ("is_reviewed_by_coach", "BOOLEAN", "DEFAULT FALSE", "Estado de Visto Bueno otorgado por el coach en el feed."),
            ("coach_reviewed_at", "TIMESTAMP", "NULLABLE", "Fecha y hora del Visto Bueno otorgado por el coach.")
        ]),
        ("bdmottus.routine_exercises", "Ejercicios Prescritos en Rutina", [
            ("id", "UUID", "PK", "Identificador del ejercicio asignado a la rutina."),
            ("routine_id", "UUID", "FK -> routines.id", "Rutina a la cual pertenece."),
            ("exercise_id", "UUID", "FK -> exercises.id", "Ejercicio del catálogo maestro."),
            ("sets", "INTEGER", "NOT NULL", "Cantidad total de series programadas."),
            ("reps", "VARCHAR(50)", "NOT NULL", "Rango o meta de repeticiones (ej. '6-8' o '12')."),
            ("target_weight", "NUMERIC(6,2)", "NULLABLE", "Carga en kilogramos o libras prescrita por el coach."),
            ("target_rpe", "NUMERIC(3,1)", "NULLABLE", "Esfuerzo percibido objetivo según escala Borg/RPE (1-10)."),
            ("tempo", "VARCHAR(20)", "NULLABLE", "Cadencia de movimiento en 4 dígitos (ej. '3-1-1-0')."),
            ("superset_group", "VARCHAR(10)", "NULLABLE", "Identificador de superserie (ej. 'A1', 'A2', 'B1')."),
            ("order_index", "INTEGER", "DEFAULT 0", "Posición ordinal de ejecución en la sesión.")
        ]),
        ("bdmottus.exercise_logs", "Logs Serie por Serie (Workout Logger)", [
            ("id", "UUID", "PK", "Identificador único del registro de serie."),
            ("routine_exercise_id", "UUID", "FK -> routine_exercises.id", "Ejercicio programado al que corresponde la serie."),
            ("set_number", "INTEGER", "NOT NULL", "Número de serie ejecutada (1, 2, 3, etc.)."),
            ("actual_weight", "NUMERIC(6,2)", "NOT NULL", "Carga real levantada por el atleta en la serie."),
            ("actual_reps", "INTEGER", "NOT NULL", "Repeticiones logradas en la serie."),
            ("actual_rpe", "NUMERIC(3,1)", "NULLABLE", "RPE real experimentado por el atleta en la serie."),
            ("notes", "TEXT", "NULLABLE", "Comentarios técnicos del alumno sobre sensaciones o molestias."),
            ("video_url", "VARCHAR(500)", "NULLABLE", "Enlace de video subido para revisión biomecánica del coach."),
            ("is_completed", "BOOLEAN", "DEFAULT TRUE", "Confirmación de ejecución de la serie.")
        ]),
        ("bdmottus.routine_templates", "Plantillas Maestras de Rutinas", [
            ("id", "UUID", "PK", "Identificador de la plantilla reutilizable."),
            ("coach_id", "UUID", "FK -> users.id", "Entrenador propietario de la plantilla."),
            ("title", "VARCHAR(150)", "NOT NULL", "Nombre de la plantilla (ej. 'Full Body Básico A')."),
            ("description", "TEXT", "NULLABLE", "Descripción de objetivos y nivel de atleta sugerido."),
            ("category_tag", "VARCHAR(50)", "DEFAULT 'general'", "Etiqueta: 'fuerza', 'hipertrofia', 'movilidad', etc."),
            ("training_format", "VARCHAR(50)", "DEFAULT 'regular'", "Formato de entrenamiento configurado.")
        ]),
        ("bdmottus.body_metrics", "Métricas Corporales & Antropometría", [
            ("id", "UUID", "PK", "Identificador de la toma antropométrica."),
            ("student_id", "UUID", "FK -> students.id", "Atleta evaluado."),
            ("date", "DATE", "NOT NULL", "Fecha de la medición."),
            ("weight", "NUMERIC(5,2)", "NULLABLE", "Peso corporal total verificado."),
            ("waist_circ", "NUMERIC(5,2)", "NULLABLE", "Perímetro de cintura en centímetros."),
            ("hip_circ", "NUMERIC(5,2)", "NULLABLE", "Perímetro de cadera en centímetros."),
            ("chest_circ", "NUMERIC(5,2)", "NULLABLE", "Perímetro de pecho / tórax en centímetros."),
            ("arm_circ", "NUMERIC(5,2)", "NULLABLE", "Perímetro de brazo flexionado en centímetros."),
            ("thigh_circ", "NUMERIC(5,2)", "NULLABLE", "Perímetro de muslo medio en centímetros."),
            ("photo_front_url", "VARCHAR(500)", "NULLABLE", "URL de fotografía corporal frontal."),
            ("photo_side_url", "VARCHAR(500)", "NULLABLE", "URL de fotografía corporal de perfil lateral."),
            ("photo_back_url", "VARCHAR(500)", "NULLABLE", "URL de fotografía corporal posterior / espalda.")
        ]),
        ("bdmottus.habit_logs", "Registro Holístico de Hábitos", [
            ("id", "UUID", "PK", "Identificador del registro diario."),
            ("student_id", "UUID", "FK -> students.id", "Atleta."),
            ("date", "DATE", "NOT NULL", "Fecha del día evaluado."),
            ("calories", "INTEGER", "NULLABLE", "Ingesta energética total en kilocalorías (kcal)."),
            ("protein_g", "INTEGER", "NULLABLE", "Gramos de proteína consumidos en el día."),
            ("water_l", "NUMERIC(3,1)", "NULLABLE", "Litros de agua consumidos durante el día."),
            ("daily_steps", "INTEGER", "NULLABLE", "Pasos registrados mediante podómetro o smartwatch."),
            ("sleep_hours", "NUMERIC(3,1)", "NULLABLE", "Horas de sueño continuo reportadas.")
        ]),
        ("bdmottus.direct_messages", "Mensajería Directa 1 a 1", [
            ("id", "UUID", "PK", "Identificador único del mensaje."),
            ("sender_id", "UUID", "FK -> users.id", "Usuario emisor del mensaje."),
            ("recipient_id", "UUID", "FK -> users.id", "Usuario receptor del mensaje."),
            ("student_id", "UUID", "FK -> students.id", "Atleta objeto de la conversación."),
            ("message", "TEXT", "NOT NULL", "Cuerpo del mensaje."),
            ("is_read", "BOOLEAN", "DEFAULT FALSE", "Bandera de lectura para badges de notificación."),
            ("created_at", "TIMESTAMP", "DEFAULT NOW()", "Estampa de tiempo del envío.")
        ])
    ]

    for tbl_name, tbl_desc, cols in tables_dict:
        p_tbl_tit = doc.add_paragraph()
        p_tbl_tit.paragraph_format.space_before = Pt(8)
        p_tbl_tit.paragraph_format.space_after = Pt(3)
        r_tt = p_tbl_tit.add_run(f"Tabla: {tbl_name} — {tbl_desc}")
        r_tt.font.name = "Arial"
        r_tt.font.size = Pt(10)
        r_tt.font.bold = True
        r_tt.font.color.rgb = RGBColor(0x4D, 0x60, 0x2E)

        table = doc.add_table(rows=len(cols) + 1, cols=4)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False
        table.columns[0].width = Inches(1.8)
        table.columns[1].width = Inches(1.3)
        table.columns[2].width = Inches(1.2)
        table.columns[3].width = Inches(2.2)
        set_table_clean_borders(table)

        # Header
        headers = ["Columna", "Tipo de Dato", "Restricción", "Descripción Funcional"]
        for c_idx, h_text in enumerate(headers):
            cell = table.cell(0, c_idx)
            set_cell_background(cell, COLOR_PRIMARY_HEX)
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            rh = p.add_run(h_text)
            rh.font.name = "Arial"
            rh.font.size = Pt(8.5)
            rh.font.bold = True
            rh.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

        # Rows
        for r_idx, (col_name, col_type, col_constr, col_expl) in enumerate(cols):
            bg_col = "FFFFFF" if r_idx % 2 == 0 else COLOR_LIGHT_BG_HEX
            for c_idx, val in enumerate([col_name, col_type, col_constr, col_expl]):
                cell = table.cell(r_idx + 1, c_idx)
                set_cell_background(cell, bg_col)
                set_cell_margins(cell, top=60, bottom=60, left=100, right=100)
                p = cell.paragraphs[0]
                p.paragraph_format.space_before = Pt(2)
                p.paragraph_format.space_after = Pt(2)
                rv = p.add_run(val)
                rv.font.name = "Arial"
                rv.font.size = Pt(8)
                if c_idx == 0:
                    rv.font.bold = True
                    rv.font.color.rgb = RGBColor(0x16, 0x1D, 0x16)
                elif c_idx == 2 and "PK" in val:
                    rv.font.bold = True
                    rv.font.color.rgb = RGBColor(0x4D, 0x60, 0x2E)
                else:
                    rv.font.color.rgb = RGBColor(0x2D, 0x3B, 0x24)

    # 1.3 Seguridad y Criptografía
    p_h2 = doc.add_paragraph()
    r = p_h2.add_run("1.3 Seguridad, Criptografía y Control de Acceso")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x16, 0x1D, 0x16)
    p_h2.paragraph_format.space_before = Pt(12)
    p_h2.paragraph_format.space_after = Pt(6)

    p_sec = doc.add_paragraph()
    p_sec.paragraph_format.space_after = Pt(6)
    p_sec.paragraph_format.line_spacing = 1.15
    p_sec.add_run(
        "La arquitectura de seguridad de AppMottus aplica principios de privilegio mínimo (Least Privilege), "
        "defensa en profundidad y sanitización estricta de credenciales en cada capa:\n\n"
        "1. Hashing de Contraseñas con Bcrypt: La autenticación utiliza la librería passlib con el esquema de derivación de claves Bcrypt. "
        "Dado que la especificación de Bcrypt trunca entradas a un límite estricto de 72 bytes, la capa de autenticación en 'security.py' "
        "aplica un truncamiento seguro de bytes previo al hashing, garantizando total compatibilidad y eliminando cualquier excepción en tiempo de ejecución.\n\n"
        "2. Emisión y Validación de Tokens JWT (JSON Web Tokens): Tras una autenticación exitosa vía '/api/v1/auth/login', el backend firma "
        "criptográficamente un token JWT utilizando el algoritmo simétrico HMAC-SHA256 (HS256) y una clave secreta robusta alojada en variables de entorno. "
        "El token contiene los claims 'sub' (identificador de usuario) y 'exp' (expiración fijada en 30 días para evitar desconexiones accidentales "
        "durante el entrenamiento en gimnasios).\n\n"
        "3. Inyección de Dependencias Dual ('get_current_user' vs 'get_current_student'): Los endpoints administrativos y de coaching exigen "
        "la resolución del usuario autenticado con validación de rol ('admin' o 'coach'), mientras que las vistas del atleta validan de forma "
        "automática la existencia de su ficha en 'bdmottus.students', bloqueando cualquier intento de manipulación cruzada de identificadores (IDOR)."
    )

    doc.add_page_break()

    # -------------------------------------------------------------------------
    # CAPÍTULO 2: GUÍA OPERATIVA PARA EL ADMINISTRADOR Y EL COACH
    # -------------------------------------------------------------------------
    p_c2 = doc.add_paragraph()
    r = p_c2.add_run("CAPÍTULO 2: GUÍA OPERATIVA PARA EL ADMINISTRADOR Y EL COACH")
    r.font.name = "Arial"
    r.font.size = Pt(17)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x4D, 0x60, 0x2E)
    p_c2.paragraph_format.space_before = Pt(12)
    p_c2.paragraph_format.space_after = Pt(8)

    doc.add_picture(diag_cal, width=Inches(6.5))
    p_cap2 = doc.add_paragraph()
    p_cap2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap2.paragraph_format.space_after = Pt(12)
    r_cap2 = p_cap2.add_run("Figura 2.1: Interfaz Operativa del Entrenador: Calendario de Rutinas y Live Activity Feed.")
    r_cap2.font.name = "Arial"
    r_cap2.font.size = Pt(8.5)
    r_cap2.font.italic = True
    r_cap2.font.color.rgb = RGBColor(0x5A, 0x66, 0x5A)

    # 2.1 Gestión de Accesos e Invitaciones
    p_h2 = doc.add_paragraph()
    r = p_h2.add_run("2.1 Gestión de Accesos e Invitaciones por RUT")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x16, 0x1D, 0x16)
    p_h2.paragraph_format.space_before = Pt(10)
    p_h2.paragraph_format.space_after = Pt(6)

    p_inv = doc.add_paragraph()
    p_inv.paragraph_format.space_after = Pt(6)
    p_inv.paragraph_format.line_spacing = 1.15
    p_inv.add_run(
        "AppMottus elimina los problemas habituales de entrega y spam asociados al correo electrónico tradicional mediante un "
        "sistema de Invitación Criptográfica de Enlace Único:\n\n"
        "• Flujo de Creación: Desde la vista 'Alumnos & Registro', el coach ingresa el RUT del nuevo atleta y el sistema genera "
        "un token hexadecimal seguro de un solo uso.\n"
        "• Enlace Generado: El enlace resultante sigue la estructura: 'https://appmottus.raevsi.cl/#/register?rut={RUT}&token={TOKEN}'.\n"
        "• Transmisión Directa: El coach copia el enlace en un clic y lo envía al atleta a través de WhatsApp, mensaje de texto o en persona.\n"
        "• Consumo Seguro: Al ser utilizado, el token se invalida automáticamente en la base de datos, impidiendo cualquier reutilización no autorizada."
    )

    # 2.2 Workout Builder Pro
    p_h2 = doc.add_paragraph()
    r = p_h2.add_run("2.2 El Constructor de Rutinas Pro (Workout Builder)")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x16, 0x1D, 0x16)
    p_h2.paragraph_format.space_before = Pt(10)
    p_h2.paragraph_format.space_after = Pt(6)

    p_wb = doc.add_paragraph()
    p_wb.paragraph_format.space_after = Pt(6)
    p_wb.paragraph_format.line_spacing = 1.15
    p_wb.add_run(
        "El Workout Builder Pro replica la experiencia de prescripción rápida y modular de TrueCoach, estructurando "
        "cada sesión de entrenamiento en 3 bloques independientes:\n\n"
        "1. Bloque 1: Calentamiento & Movilidad (Warm-up): Campo de texto enriquecido para documentar la activación neuromuscular, "
        "protocolos RAMP (Raise, Activate, Mobilize, Potentiate) y movilidad articular previa a las cargas.\n"
        "2. Bloque 2: Entrenamiento Principal (Workout): Parrilla interactiva donde se seleccionan ejercicios del catálogo maestro, "
        "se define el formato (Regular, Superserie, Circuito, AMRAP, EMOM) y se prescriben las variables cinéticas:\n"
        "   - Carga Objetivo ('target_weight'): En kg o lbs.\n"
        "   - RPE Objetivo ('target_rpe'): En escala 1.0 a 10.0.\n"
        "   - Tempo de 4 Dígitos ('tempo'): Cadencia de movimiento (ej. '3-1-1-0').\n"
        "   - Agrupación de Superserie ('superset_group'): Asignación de identificadores 'A1', 'A2', 'B1', 'B2' para indicar ejecución alternada.\n"
        "3. Bloque 3: Vuelta a la Calma & Recuperación (Cool-down): Sección para prescribir estiramientos pasivos, trabajo diafragmático "
        "o protocolos de descarga del sistema nervioso simpático."
    )

    # 2.3 Plantillas y Mesociclos
    p_h2 = doc.add_paragraph()
    r = p_h2.add_run("2.3 Creación de Plantillas Maestras y Clonación de Mesociclos")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x16, 0x1D, 0x16)
    p_h2.paragraph_format.space_before = Pt(10)
    p_h2.paragraph_format.space_after = Pt(6)

    p_tpl = doc.add_paragraph()
    p_tpl.paragraph_format.space_after = Pt(6)
    p_tpl.paragraph_format.line_spacing = 1.15
    p_tpl.add_run(
        "Para maximizar la eficiencia del entrenador, cualquier rutina diseñada puede guardarse como Plantilla Maestra en la tabla "
        "'bdmottus.routine_templates' mediante el botón 'Guardar como Plantilla'. Estas plantillas se etiquetan por categoría "
        "(Fuerza, Hipertrofia, Core, Acondicionamiento) y pueden aplicarse a cualquier atleta en un solo clic.\n\n"
        "Asimismo, el motor de clonación multi-fecha ('duplicate_to_dates' y 'apply-program') permite al coach proyectar mesociclos "
        "completos de 4, 8 o 12 semanas seleccionando las fechas de destino en el calendario. El backend genera copias atómicas "
        "de las rutinas con todos sus ejercicios, tempos y superseries asociadas."
    )

    # 2.4 Ficha Clínica y Alertas
    p_h2 = doc.add_paragraph()
    r = p_h2.add_run("2.4 Ficha Clínica del Atleta y Alertas Médicas en Vivo")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x16, 0x1D, 0x16)
    p_h2.paragraph_format.space_before = Pt(10)
    p_h2.paragraph_format.space_after = Pt(6)

    p_med = doc.add_paragraph()
    p_med.paragraph_format.space_after = Pt(6)
    p_med.paragraph_format.line_spacing = 1.15
    p_med.add_run(
        "Cada alumno cuenta con una Ficha Clínica integrada. Si el atleta registra antecedentes o lesiones activas "
        "en el campo 'injuries_notes' (ej. 'Tendinopatía rotuliana rodilla izquierda' o 'Hernia L4-L5'), el sistema "
        "despliega automáticamente un Banner de Alerta Médica Destacado en rojo/ámbar en la parte superior del Constructor de Rutinas. "
        "Esto garantiza que el coach tenga siempre presente la condición del atleta antes de seleccionar ejercicios axiales "
        "o con estrés articular específico.\n\n"
        "Adicionalmente, el campo 'private_coach_notes' permite al entrenador mantener anotaciones privadas de carácter "
        "estrictamente confidencial (estrategias psicológicas, observaciones familiares, etc.) que jamás son visibles para el alumno."
    )

    # 2.5 Live Activity Feed
    p_h2 = doc.add_paragraph()
    r = p_h2.add_run("2.5 Auditoría y Visto Bueno Institucional (Live Activity Feed)")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x16, 0x1D, 0x16)
    p_h2.paragraph_format.space_before = Pt(10)
    p_h2.paragraph_format.space_after = Pt(6)

    p_feed = doc.add_paragraph()
    p_feed.paragraph_format.space_after = Pt(6)
    p_feed.paragraph_format.line_spacing = 1.15
    p_feed.add_run(
        "El Live Activity Feed centraliza en un único panel cronológico todas las interacciones de los atletas: sesiones completadas, "
        "logs de hábitos nutricionales registrados, fotos comparativas subidas y comentarios emitidos. "
        "Cada tarjeta de rutina completada incluye el botón oficial 'Dar V°B°' (Marcar como Revisado). Al presionarlo, el endpoint "
        "'PUT /api/v1/routines/{id}/mark-reviewed' actualiza 'is_reviewed_by_coach = True' y registra la marca de tiempo exacta, "
        "otorgando tranquilidad al atleta de que su esfuerzo ha sido supervisado profesionalmente por su coach."
    )

    doc.add_page_break()

    # -------------------------------------------------------------------------
    # CAPÍTULO 3: MANUAL DE USO PARA EL ATLETA (ALUMNO)
    # -------------------------------------------------------------------------
    p_c3 = doc.add_paragraph()
    r = p_c3.add_run("CAPÍTULO 3: MANUAL DE USO PARA EL ATLETA (ALUMNO)")
    r.font.name = "Arial"
    r.font.size = Pt(17)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x4D, 0x60, 0x2E)
    p_c3.paragraph_format.space_before = Pt(12)
    p_c3.paragraph_format.space_after = Pt(8)

    doc.add_picture(diag_logger, width=Inches(6.5))
    p_cap3 = doc.add_paragraph()
    p_cap3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap3.paragraph_format.space_after = Pt(12)
    r_cap3 = p_cap3.add_run("Figura 3.1: Pantalla del Interactive Workout Logger con Rest Timer y Registro Serie a Serie.")
    r_cap3.font.name = "Arial"
    r_cap3.font.size = Pt(8.5)
    r_cap3.font.italic = True
    r_cap3.font.color.rgb = RGBColor(0x5A, 0x66, 0x5A)

    # 3.1 Activación
    p_h2 = doc.add_paragraph()
    r = p_h2.add_run("3.1 Activación de Cuenta y Ficha de Perfil TrueCoach")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x16, 0x1D, 0x16)
    p_h2.paragraph_format.space_before = Pt(10)
    p_h2.paragraph_format.space_after = Pt(6)

    p_act = doc.add_paragraph()
    p_act.paragraph_format.space_after = Pt(6)
    p_act.paragraph_format.line_spacing = 1.15
    p_act.add_run(
        "El atleta recibe de su entrenador un enlace de invitación único. Al ingresar a 'https://appmottus.raevsi.cl/#/register', "
        "el formulario de registro valida automáticamente el RUT y el token de activación, solicitando la completitud "
        "de la Ficha de Perfil Oficial:\n\n"
        "• Nombre y Apellido: Datos personales de identificación institucional.\n"
        "• Correo Electrónico y Teléfono: Canales de contacto para uso administrativo interno.\n"
        "• Fecha de Cumpleaños: Permite al sistema calcular la edad cronológica para rangos de frecuencia cardíaca y felicitaciones de aniversario.\n"
        "• Ubicación: Ciudad o comuna de residencia del alumno.\n"
        "• Género y Parámetros Antropométricos: Peso actual (kg o lbs) y estatura (cm o in).\n"
        "• Preferencia de Unidades: Selección entre Sistema Métrico Internacional ('metric') o Sistema Imperial ('imperial'). "
        "Toda la interfaz del alumno convertirá automáticamente las unidades en tiempo real.\n"
        "• Contraseña de Acceso: Clave privada protegida mediante cifrado Bcrypt."
    )

    # 3.2 Interactive Workout Logger
    p_h2 = doc.add_paragraph()
    r = p_h2.add_run("3.2 El Interactive Workout Logger (Entrenamiento en Vivo)")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x16, 0x1D, 0x16)
    p_h2.paragraph_format.space_before = Pt(10)
    p_h2.paragraph_format.space_after = Pt(6)

    p_iwl = doc.add_paragraph()
    p_iwl.paragraph_format.space_after = Pt(6)
    p_iwl.paragraph_format.line_spacing = 1.15
    p_iwl.add_run(
        "Al ingresar a 'Mis Rutinas' y seleccionar la sesión del día, el atleta visualiza la secuencia de ejercicios prescrita. "
        "Cada ejercicio presenta las siguientes herramientas interactivas:\n\n"
        "1. Marca Anterior ('Last Performance'): Encima de las series, una tarjeta destacada le muestra al atleta exactamente "
        "cuánto peso levantó, cuántas repeticiones logró y cuál fue su 1RM estimado en la última ocasión que ejecutó ese mismo ejercicio. "
        "Esto elimina la incertidumbre y estimula la sobrecarga progresiva.\n\n"
        "2. Registro Serie por Serie: Cada serie dispone de cajas numéricas independientes para registrar el peso real levantado "
        "('actual_weight'), las repeticiones ejecutadas ('actual_reps') y el RPE real percibido ('actual_rpe'). "
        "Al presionar el botón de confirmación [OK], la serie se guarda atómicamente en 'bdmottus.exercise_logs'.\n\n"
        "3. Notas Técnicas y Video de Corrección: Cada ejercicio permite al alumno redactar notas sobre sensaciones musculares "
        "y adjuntar un enlace a un video de su técnica (almacenado en YouTube, Vimeo o Drive) para revisión visual del entrenador.\n\n"
        "4. Auto-completado de Rutina: Cuando el atleta registra todas las series prescritas en la sesión, el backend actualiza "
        "inmediatamente 'is_executed = True', marcando la rutina con check verde en el calendario y notificando al Live Feed."
    )

    # 3.3 Rest Timer
    p_h2 = doc.add_paragraph()
    r = p_h2.add_run("3.3 El Cronómetro de Descanso Flotante (Rest Timer)")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x16, 0x1D, 0x16)
    p_h2.paragraph_format.space_before = Pt(10)
    p_h2.paragraph_format.space_after = Pt(6)

    p_rt = doc.add_paragraph()
    p_rt.paragraph_format.space_after = Pt(6)
    p_rt.paragraph_format.line_spacing = 1.15
    p_rt.add_run(
        "Al confirmar una serie ejecutada, el sistema activa automáticamente un Rest Timer flotante en pantalla. "
        "Sus características de diseño incluyen:\n\n"
        "• Cuenta Regresiva Reactiva: Basada en el tiempo prescrito por el coach (ej. 90 segundos o 2 minutos).\n"
        "• Ajuste Rápido en Vivo: Botones interactivos [+15s] y [-15s] que permiten ajustar el descanso sobre la marcha sin pausar la sesión.\n"
        "• Alerta Sonora con Web Audio API: Al llegar a 00:00, el navegador sintetiza un tono audible de alta frecuencia "
        "mediante la Web Audio API nativa, alertando al atleta incluso si tiene el teléfono apoyado a un costado del banco de pesas."
    )

    # 3.4 Comparador Side-by-Side
    p_h2 = doc.add_paragraph()
    r = p_h2.add_run("3.4 El Comparador Fotográfico y Antropométrico (Side-by-Side)")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x16, 0x1D, 0x16)
    p_h2.paragraph_format.space_before = Pt(10)
    p_h2.paragraph_format.space_after = Pt(6)

    doc.add_picture(diag_comp, width=Inches(6.5))
    p_cap4 = doc.add_paragraph()
    p_cap4.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap4.paragraph_format.space_after = Pt(12)
    r_cap4 = p_cap4.add_run("Figura 3.2: Comparador Fotográfico Side-by-Side con Cálculo Automático de Variación Neta (Delta).")
    r_cap4.font.name = "Arial"
    r_cap4.font.size = Pt(8.5)
    r_cap4.font.italic = True
    r_cap4.font.color.rgb = RGBColor(0x5A, 0x66, 0x5A)

    p_comp = doc.add_paragraph()
    p_comp.paragraph_format.space_after = Pt(6)
    p_comp.paragraph_format.line_spacing = 1.15
    p_comp.add_run(
        "La vista 'Mi Progreso' incorpora un potente Comparador Side-by-Side que evalúa objetivamente la recomposición corporal "
        "del alumno a lo largo del tiempo:\n\n"
        "• Contraste Visual de Fotografías: Permite seleccionar dos fechas cualquiera (ej. 'Semana 1 vs Semana 8') y contrastar "
        "en paralelo las fotos de Frente, Perfil Lateral y Espalda.\n"
        "• Panel de Variación Neta (Delta): El sistema calcula automáticamente la diferencia matemática en cada perímetro:\n"
        "  Delta = Medición Fecha B - Medición Fecha A\n"
        "  Mostrando reducciones favorables de grasa en cintura (ej. -5.5 cm) y ganancias de masa muscular en pecho y brazos "
        "(ej. +2.5 cm y +1.3 cm) con insignias de color destacadas."
    )

    # 3.5 Hábitos y Mensajería
    p_h2 = doc.add_paragraph()
    r = p_h2.add_run("3.5 Hábitos Diarios e Inbox de Mensajería 1 a 1")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x16, 0x1D, 0x16)
    p_h2.paragraph_format.space_before = Pt(10)
    p_h2.paragraph_format.space_after = Pt(6)

    p_hab = doc.add_paragraph()
    p_hab.paragraph_format.space_after = Pt(6)
    p_hab.paragraph_format.line_spacing = 1.15
    p_hab.add_run(
        "El atleta complementa sus entrenamientos con el módulo de 'Hábitos Diarios', registrando en pocos segundos su ingesta "
        "energética (kcal), proteínas (g), consumo de agua (L), pasos diarios y horas de sueño frente a las metas fijadas por el coach.\n\n"
        "Para cualquier duda o ajuste en la programación, el atleta cuenta con un botón permanente de chat ('MessageSquare') "
        "en la barra de navegación superior. Este botón abre un Inbox Directo 1 a 1 conectado a 'bdmottus.direct_messages' "
        "con conteo de mensajes no leídos y actualización en tiempo real."
    )

    doc.add_page_break()

    # -------------------------------------------------------------------------
    # CAPÍTULO 4: ANÁLISIS DE RENDIMIENTO, FÓRMULAS Y CIENCIA DEL ENTRENAMIENTO
    # -------------------------------------------------------------------------
    p_c4 = doc.add_paragraph()
    r = p_c4.add_run("CAPÍTULO 4: ANÁLISIS DE RENDIMIENTO, FÓRMULAS Y CIENCIA DEL ENTRENAMIENTO")
    r.font.name = "Arial"
    r.font.size = Pt(17)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x4D, 0x60, 0x2E)
    p_c4.paragraph_format.space_before = Pt(12)
    p_c4.paragraph_format.space_after = Pt(8)

    doc.add_picture(diag_epley, width=Inches(6.5))
    p_cap5 = doc.add_paragraph()
    p_cap5.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap5.paragraph_format.space_after = Pt(12)
    r_cap5 = p_cap5.add_run("Figura 4.1: Curva de Progresión de Fuerza y Carga Estimada según la Fórmula de Epley.")
    r_cap5.font.name = "Arial"
    r_cap5.font.size = Pt(8.5)
    r_cap5.font.italic = True
    r_cap5.font.color.rgb = RGBColor(0x5A, 0x66, 0x5A)

    # 4.1 Fórmula de Epley
    p_h2 = doc.add_paragraph()
    r = p_h2.add_run("4.1 Matemática de la Fuerza Máxima Teórica (Fórmula de Epley)")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x16, 0x1D, 0x16)
    p_h2.paragraph_format.space_before = Pt(10)
    p_h2.paragraph_format.space_after = Pt(6)

    p_epley = doc.add_paragraph()
    p_epley.paragraph_format.space_after = Pt(6)
    p_epley.paragraph_format.line_spacing = 1.15
    p_epley.add_run(
        "Evaluar la fuerza máxima real a 1 repetición (1RM) con cargas límite de forma frecuente representa un riesgo biomecánico "
        "innecesario de lesión articular y sobreentrenamiento del sistema nervioso central. Por esta razón, el motor analítico de "
        "AppMottus implementa la Fórmula de Epley, internacionalmente validada en ciencias del deporte para estimar con alta precisión "
        "el 1RM a partir de series submáximas ejecutadas entre 2 y 10 repeticiones:\n\n"
        "1RM (kg) = Peso Levantado x (1 + (Repeticiones Realizadas / 30))\n\n"
        "Si el atleta levanta 100 kg para 6 repeticiones:\n"
        "1RM = 100 x (1 + (6 / 30)) = 100 x (1 + 0.20) = 120.0 kg\n\n"
        "El backend calcula este valor automáticamente para cada serie registrada, almacenando y proyectando la curva de evolución "
        "histórica en la vista 'Estadísticas' y en el banner de 'Marca Anterior'."
    )

    # Tabla de Equivalencias Epley
    p_tbl_epley = doc.add_paragraph()
    p_tbl_epley.paragraph_format.space_before = Pt(8)
    p_tbl_epley.paragraph_format.space_after = Pt(4)
    r_tep = p_tbl_epley.add_run("Tabla 4.1: Estimación de 1RM según Repeticiones Submáximas (Fórmula de Epley)")
    r_tep.font.name = "Arial"
    r_tep.font.size = Pt(9.5)
    r_tep.font.bold = True
    r_tep.font.color.rgb = RGBColor(0x4D, 0x60, 0x2E)

    t_ep = doc.add_table(rows=7, cols=5)
    t_ep.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_ep.autofit = False
    for col in t_ep.columns:
        col.width = Inches(1.3)
    set_table_clean_borders(t_ep)

    ep_headers = ["Carga Real", "2 Reps (x1.066)", "4 Reps (x1.133)", "6 Reps (x1.200)", "8 Reps (x1.266)"]
    for c_idx, h_text in enumerate(ep_headers):
        cell = t_ep.cell(0, c_idx)
        set_cell_background(cell, COLOR_PRIMARY_HEX)
        set_cell_margins(cell, top=80, bottom=80, left=80, right=80)
        p = cell.paragraphs[0]
        rh = p.add_run(h_text)
        rh.font.name = "Arial"
        rh.font.size = Pt(8.5)
        rh.font.bold = True
        rh.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    loads_samples = [60, 80, 100, 120, 140, 160]
    for r_idx, load in enumerate(loads_samples):
        bg = "FFFFFF" if r_idx % 2 == 0 else COLOR_LIGHT_BG_HEX
        vals = [
            f"{load} kg",
            f"{load * (1 + 2/30):.1f} kg",
            f"{load * (1 + 4/30):.1f} kg",
            f"{load * (1 + 6/30):.1f} kg",
            f"{load * (1 + 8/30):.1f} kg"
        ]
        for c_idx, val in enumerate(vals):
            cell = t_ep.cell(r_idx + 1, c_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
            p = cell.paragraphs[0]
            rv = p.add_run(val)
            rv.font.name = "Arial"
            rv.font.size = Pt(8)
            if c_idx == 0:
                rv.font.bold = True
                rv.font.color.rgb = RGBColor(0x16, 0x1D, 0x16)
            else:
                rv.font.color.rgb = RGBColor(0x2D, 0x3B, 0x24)

    # 4.2 Tonelaje y Volumen
    p_h2 = doc.add_paragraph()
    r = p_h2.add_run("4.2 Cuantificación del Tonelaje y Carga de Trabajo Acumulada")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x16, 0x1D, 0x16)
    p_h2.paragraph_format.space_before = Pt(12)
    p_h2.paragraph_format.space_after = Pt(6)

    p_vol = doc.add_paragraph()
    p_vol.paragraph_format.space_after = Pt(6)
    p_vol.paragraph_format.line_spacing = 1.15
    p_vol.add_run(
        "El volumen total o Tonelaje representa la suma ponderada del producto entre la carga real y las repeticiones ejecutadas "
        "en cada serie de un ejercicio o sesión:\n\n"
        "Tonelaje Total = Sumatoria (Carga Real (kg) x Repeticiones Logradas)\n\n"
        "Por ejemplo, una sesión compuesta por:\n"
        "• Press de Banca: 3 series x 8 reps con 80 kg = 1,920 kg\n"
        "• Press Inclinado: 3 series x 10 reps con 60 kg = 1,800 kg\n"
        "• Fondos en Paralelas: 3 series x 10 reps con 80 kg (peso corporal) = 2,400 kg\n"
        "Tonelaje de la Sesión = 1,920 + 1,800 + 2,400 = 6,120 kg (6.12 Toneladas)\n\n"
        "El seguimiento del tonelaje sesión a sesión permite al entrenador modular con exactitud la sobrecarga progresiva "
        "y detectar oportunamente mesetas de estancamiento o aumentos excesivos de fatiga que requieran una semana de descarga."
    )

    # 4.3 Escala RPE / RIR
    p_h2 = doc.add_paragraph()
    r = p_h2.add_run("4.3 Guía de Autorregulación: Escala RPE / RIR de Borg Modificada")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x16, 0x1D, 0x16)
    p_h2.paragraph_format.space_before = Pt(12)
    p_h2.paragraph_format.space_after = Pt(6)

    p_rpe_desc = doc.add_paragraph()
    p_rpe_desc.paragraph_format.space_after = Pt(6)
    p_rpe_desc.paragraph_format.line_spacing = 1.15
    p_rpe_desc.add_run(
        "La escala RPE (Rate of Perceived Exertion) de Borg Modificada combinada con el concepto de RIR (Reps in Reserve) "
        "es el estándar de oro para prescribir intensidades de esfuerzo autorreguladas, considerando el estado neuromuscular "
        "diario del atleta sin forzar porcentajes estáticos rígidos:"
    )

    t_rpe = doc.add_table(rows=7, cols=3)
    t_rpe.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_rpe.autofit = False
    t_rpe.columns[0].width = Inches(1.3)
    t_rpe.columns[1].width = Inches(1.8)
    t_rpe.columns[2].width = Inches(3.4)
    set_table_clean_borders(t_rpe)

    rpe_headers = ["Puntaje RPE", "Reps en Reserva (RIR)", "Descripción Fisiológica y Percepción de Esfuerzo"]
    for c_idx, h_text in enumerate(rpe_headers):
        cell = t_rpe.cell(0, c_idx)
        set_cell_background(cell, COLOR_PRIMARY_HEX)
        set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
        p = cell.paragraphs[0]
        rh = p.add_run(h_text)
        rh.font.name = "Arial"
        rh.font.size = Pt(8.5)
        rh.font.bold = True
        rh.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    rpe_matrix = [
        ("RPE 10.0", "RIR 0 (Fallo Concéntrico)", "Esfuerzo máximo absoluto. Imposible realizar otra repetición con técnica adecuada ni aumentar la carga."),
        ("RPE 9.5", "RIR 0-1", "Extremadamente exigente. Podría intentarse 1 repetición más pero con pérdida de velocidad o riesgo biomecánico."),
        ("RPE 9.0", "RIR 1 repetición", "Muy exigente. El atleta garantiza que podría haber completado exactamente 1 repetición más con esfuerzo máximo."),
        ("RPE 8.5", "RIR 1-2 repeticiones", "Intensidad ideal para hipertrofia y fuerza funcional. Certeza de poder ejecutar 1 o 2 repeticiones adicionales."),
        ("RPE 8.0", "RIR 2 repeticiones", "Carga exigente pero controlada. Velocidad de barra fluida. Quedan 2 repeticiones claras en el tanque."),
        ("RPE 7.0 - 7.5", "RIR 3 repeticiones", "Carga moderada a pesada. Ideal para series de aproximación, trabajo de potencia o semanas de descarga activa.")
    ]

    for r_idx, (rpe_val, rir_val, expl) in enumerate(rpe_matrix):
        bg = "FFFFFF" if r_idx % 2 == 0 else COLOR_LIGHT_BG_HEX
        for c_idx, val in enumerate([rpe_val, rir_val, expl]):
            cell = t_rpe.cell(r_idx + 1, c_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=60, bottom=60, left=100, right=100)
            p = cell.paragraphs[0]
            rv = p.add_run(val)
            rv.font.name = "Arial"
            rv.font.size = Pt(8)
            if c_idx == 0:
                rv.font.bold = True
                rv.font.color.rgb = RGBColor(0x4D, 0x60, 0x2E)
            elif c_idx == 1:
                rv.font.bold = True
                rv.font.color.rgb = RGBColor(0x16, 0x1D, 0x16)
            else:
                rv.font.color.rgb = RGBColor(0x2D, 0x3B, 0x24)

    # 4.4 Tempo de 4 Dígitos
    p_h2 = doc.add_paragraph()
    r = p_h2.add_run("4.4 Guía Cinética de Tempo de 4 Dígitos (Cadencia de Movimiento)")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x16, 0x1D, 0x16)
    p_h2.paragraph_format.space_before = Pt(12)
    p_h2.paragraph_format.space_after = Pt(6)

    p_tempo = doc.add_paragraph()
    p_tempo.paragraph_format.space_after = Pt(6)
    p_tempo.paragraph_format.line_spacing = 1.15
    p_tempo.add_run(
        "El Tempo determina la duración del Tiempo Bajo Tensión (TUT - Time Under Tension) en cada fase de la repetición. "
        "En AppMottus se prescribe universalmente mediante la notación estándar internacional de 4 dígitos (ej. '3-1-1-0'):\n\n"
        "• 1er Dígito (3): Fase Excéntrica (Bajada / Negativa). Tiempo en segundos que dura el descenso controlado de la carga "
        "(ej. bajar la barra al pecho en press de banca o bajar en sentadilla).\n"
        "• 2do Dígito (1): Pausa Isométrica en Posición Estirada (Fondo). Tiempo en segundos que se sostiene la posición más baja "
        "antes de revertir el movimiento (elimina el rebote viscoelástico y maximiza la activación muscular).\n"
        "• 3er Dígito (1 o 'X'): Fase Concéntrica (Subida / Positiva). Tiempo en segundos para vencer la carga. Si figura una 'X', "
        "indica aceleración concéntrica con intención de máxima potencia explosiva.\n"
        "• 4to Dígito (0): Pausa Isométrica en Posición Acortada (Bloqueo Superior). Tiempo de espera en la cúspide antes de comenzar "
        "la siguiente repetición."
    )

    doc.add_page_break()

    # -------------------------------------------------------------------------
    # CAPÍTULO 5: APÉNDICE DE TROUBLESHOOTING Y OPERACIONES (DEVOPS)
    # -------------------------------------------------------------------------
    p_c5 = doc.add_paragraph()
    r = p_c5.add_run("CAPÍTULO 5: APÉNDICE DE TROUBLESHOOTING Y OPERACIONES (DEVOPS)")
    r.font.name = "Arial"
    r.font.size = Pt(17)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x4D, 0x60, 0x2E)
    p_c5.paragraph_format.space_before = Pt(12)
    p_c5.paragraph_format.space_after = Pt(8)

    doc.add_picture(diag_life, width=Inches(6.5))
    p_cap6 = doc.add_paragraph()
    p_cap6.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap6.paragraph_format.space_after = Pt(12)
    r_cap6 = p_cap6.add_run("Figura 5.1: Flujo Completo del Ciclo de Vida del Alumno, Auditoría y Despliegue.")
    r_cap6.font.name = "Arial"
    r_cap6.font.size = Pt(8.5)
    r_cap6.font.italic = True
    r_cap6.font.color.rgb = RGBColor(0x5A, 0x66, 0x5A)

    # 5.1 Diagnóstico
    p_h2 = doc.add_paragraph()
    r = p_h2.add_run("5.1 Diagnóstico y Resolución de Incidencias en Backend (FastAPI)")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x16, 0x1D, 0x16)
    p_h2.paragraph_format.space_before = Pt(10)
    p_h2.paragraph_format.space_after = Pt(6)

    troubles = [
        ("Error de Inicio Uvicorn (NameError / ImportError)",
         "Causa: Módulo o función no exportada correctamente en 'backend/app/main.py' o esquemas Pydantic faltantes en 'schemas.py'.\n"
         "Solución: Ejecutar en el servidor: 'source venv/bin/activate && python -c \"from app.main import app; print(app)\"'. "
         "Revisar 'journalctl -u appmottus-api -n 50 --no-pager' para identificar la línea exacta del fallo."),
        ("Conexión Rechazada a Base de Datos (PostgreSQL RDS)",
         "Causa: Variables de entorno 'DATABASE_URL' no leídas correctamente o grupo de seguridad de AWS RDS bloqueando la IP pública del servidor.\n"
         "Solución: Verificar en 'backend/.env' la variable: 'DATABASE_URL=postgresql://user:pass@host:5432/mottus?options=-csearch_path%3Dbdmottus,public'. "
         "Probar conectividad directa mediante: 'psql -h <host> -U <user> -d mottus'."),
        ("Bloqueo de Indización en Git (.git/index.lock)",
         "Causa: Proceso git abortado bruscamente que dejó el archivo de bloqueo abierto impidiendo commits o pulls.\n"
         "Solución: En la terminal ejecutar: 'rm -f .git/index.lock' y reintentar 'git status'.")
    ]

    for title, desc in troubles:
        p_tr = doc.add_paragraph()
        p_tr.paragraph_format.space_after = Pt(4)
        p_tr.paragraph_format.line_spacing = 1.15
        r_t = p_tr.add_run(f"• {title}:\n")
        r_t.font.name = "Arial"
        r_t.font.size = Pt(9.5)
        r_t.font.bold = True
        r_t.font.color.rgb = RGBColor(0x4D, 0x60, 0x2E)
        r_d = p_tr.add_run(desc)
        r_d.font.name = "Arial"
        r_d.font.size = Pt(9)
        r_d.font.color.rgb = RGBColor(0x1A, 0x20, 0x1A)

    # 5.2 Despliegue Automatizado
    p_h2 = doc.add_paragraph()
    r = p_h2.add_run("5.2 Procedimientos de Despliegue Automatizado (CI/CD)")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x16, 0x1D, 0x16)
    p_h2.paragraph_format.space_before = Pt(12)
    p_h2.paragraph_format.space_after = Pt(6)

    p_deploy = doc.add_paragraph()
    p_deploy.paragraph_format.space_after = Pt(6)
    p_deploy.paragraph_format.line_spacing = 1.15
    p_deploy.add_run(
        "El ciclo de actualización y despliegue a producción en el servidor Ubuntu de AWS está totalmente automatizado mediante "
        "GitHub Actions ('.github/workflows/deploy.yml') y el script orquestador idempotente 'deploy/deploy.sh':\n\n"
        "1. Disparo Automático: Cada 'git push origin main' activa el workflow en GitHub Actions, que se conecta vía SSH seguro a AWS.\n"
        "2. Sincronización Git: Ejecuta 'git fetch origin main' y 'git reset --hard origin/main' en '/var/www/appmottus.raevsi.cl'.\n"
        "3. Entorno Python & Migraciones: Activa el virtualenv en 'backend/venv', instala requerimientos y corre secuencialmente "
        "los scripts de migración idempotentes ('migrate_truecoach_features.py', 'migrate_truecoach_phase2.py', "
        "'migrate_truecoach_phase3.py', 'migrate_truecoach_profile.py'). Cada script utiliza 'ADD COLUMN IF NOT EXISTS', "
        "garantizando que ninguna migración falle si las columnas ya existen.\n"
        "4. Reinicio de Servicio Systemd: Ejecuta 'sudo systemctl restart appmottus-api.service' y verifica respuesta con 'curl 127.0.0.1:8006'.\n"
        "5. Compilación del Frontend: Accede a '/frontend', ejecuta 'npm install', 'npm run build' con Vite, traslada el build "
        "a '/var/www/html/appmottus.raevsi.cl' y recarga la configuración de Nginx sin caída de servicio (zero downtime)."
    )

    # Comandos Utiles
    p_h2 = doc.add_paragraph()
    r = p_h2.add_run("5.3 Comandos Rápidos de Auditoría en Servidor AWS")
    r.font.name = "Arial"
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x16, 0x1D, 0x16)
    p_h2.paragraph_format.space_before = Pt(12)
    p_h2.paragraph_format.space_after = Pt(6)

    commands_list = [
        ("Ver estado del backend Uvicorn:", "sudo systemctl status appmottus-api.service"),
        ("Monitorear logs en vivo de FastAPI:", "sudo journalctl -u appmottus-api.service -f"),
        ("Inspeccionar logs de despliegue:", "tail -n 100 /var/www/appmottus.raevsi.cl/logs/deploy-*.log"),
        ("Comprobar escucha en puerto interno 8006:", "sudo ss -tulpn | grep 8006"),
        ("Verificar sintaxis de Nginx:", "sudo nginx -t"),
        ("Recargar Nginx tras cambios de proxy:", "sudo systemctl reload nginx")
    ]

    for label, cmd in commands_list:
        p_cmd = doc.add_paragraph()
        p_cmd.paragraph_format.space_after = Pt(3)
        rc_lbl = p_cmd.add_run(f"{label}\n")
        rc_lbl.font.name = "Arial"
        rc_lbl.font.size = Pt(8.5)
        rc_lbl.font.bold = True
        rc_lbl.font.color.rgb = RGBColor(0x4D, 0x60, 0x2E)

        rc_code = p_cmd.add_run(f"  $ {cmd}")
        rc_code.font.name = "Consolas"
        rc_code.font.size = Pt(8.5)
        rc_code.font.color.rgb = RGBColor(0x16, 0x1D, 0x16)

    # -------------------------------------------------------------------------
    # GUARDADO Y COPIA A TODOS LOS DESTINOS REQUERIDOS
    # -------------------------------------------------------------------------
    print(f"Guardando documento completo en: {OUTPUT_DOCX_FULL}...")
    try:
        doc.save(OUTPUT_DOCX_FULL)
        print("✔ Guardado exitoso de manual_usuario_appmottus_completo.docx")
    except PermissionError:
        print("Aviso: manual_usuario_appmottus_completo.docx está abierto en Word.")

    print(f"Guardando copia estándar en: {OUTPUT_DOCX_STD}...")
    try:
        doc.save(OUTPUT_DOCX_STD)
        print("✔ Guardado exitoso de manual_usuario_appmottus.docx")
    except PermissionError:
        print("Aviso: manual_usuario_appmottus.docx está abierto en Word. Por favor ciérralo si deseas sobreescribirlo directamente.")

    print(f"Guardando copia en frontend/public: {FRONTEND_PUBLIC_DOCX}...")
    try:
        doc.save(FRONTEND_PUBLIC_DOCX)
        print("✔ Guardado exitoso en frontend/public/manual_usuario_appmottus.docx")
    except PermissionError:
        print("Aviso: frontend/public/manual_usuario_appmottus.docx bloqueado temporalmente.")

    pub_full = os.path.join(OUTPUT_DIR, 'frontend', 'public', 'manual_usuario_appmottus_completo.docx')
    try:
        doc.save(pub_full)
        print("✔ Guardado exitoso en frontend/public/manual_usuario_appmottus_completo.docx")
    except PermissionError:
        pass

    if os.path.exists(os.path.dirname(FRONTEND_DIST_DOCX)):
        print(f"Guardando copia en frontend/dist: {FRONTEND_DIST_DOCX}...")
        try:
            doc.save(FRONTEND_DIST_DOCX)
        except PermissionError:
            pass

    print("✔ ¡Manual Técnico y de Usuario generado exitosamente!")
    return OUTPUT_DOCX_FULL

if __name__ == "__main__":
    build_complete_user_manual()
