import os
import sys
from datetime import datetime

# Matplotlib para generación de diagramas
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Python-docx
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUTPUT_DOCX = os.path.join(OUTPUT_DIR, 'manual_usuario_appmottus.docx')
ASSETS_DIR = os.path.join(OUTPUT_DIR, 'manual_assets')
os.makedirs(ASSETS_DIR, exist_ok=True)

# Paleta de Colores Mottus Gym
COLOR_PRIMARY_HEX = "4D602E"       # Verde militar profundo
COLOR_SECONDARY_HEX = "89A854"     # Verde oliva claro
COLOR_ACCENT_HEX = "6E8842"        # Verde corporativo
COLOR_LIGHT_BG_HEX = "F4F6F1"      # Fondo muy claro para tablas
COLOR_DARK_TEXT_HEX = "1A201A"     # Texto principal casi negro
COLOR_MUTED_HEX = "5A665A"         # Texto secundario

def set_cell_background(cell, fill_hex):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tc_pr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_mar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tc_pr.append(tc_mar)

# -----------------------------------------------------------------------------
# GENERADORES DE DIAGRAMAS E ILUSTRACIONES (PNG)
# -----------------------------------------------------------------------------

def generate_architecture_diagram():
    fig, ax = plt.subplots(figsize=(8.5, 4.2), dpi=200)
    fig.patch.set_facecolor('#0E130E')
    ax.set_facecolor('#0E130E')
    ax.axis('off')

    # Boxes
    boxes = [
        {"x": 0.05, "y": 0.60, "w": 0.25, "h": 0.32, "title": "Módulo Alumno", "desc": "Interactive Logger\nRest Timer · Hábitos\nComparador Fotos\nChat Directo 1-a-1", "color": "#6E8842"},
        {"x": 0.05, "y": 0.12, "w": 0.25, "h": 0.32, "title": "Módulo Entrenador", "desc": "Workout Builder Pro\nPlantillas & Mesociclos\nFicha Clínica Alumno\nFeed en Vivo & V°B°", "color": "#4D602E"},
        {"x": 0.38, "y": 0.25, "w": 0.25, "h": 0.52, "title": "Core API FastAPI", "desc": "FastAPI + Uvicorn\nAutenticación JWT\nAlgoritmo 1RM Epley\nFiltros & Calendario\nPuerto 8006", "color": "#2D3B24"},
        {"x": 0.71, "y": 0.25, "w": 0.25, "h": 0.52, "title": "AWS RDS PostgreSQL", "desc": "Esquema bdmottus\nTablas Normalizadas\nHistorial Serie a Serie\nPerímetros & Fotos\nMensajería Directa", "color": "#1C2618"}
    ]

    for b in boxes:
        rect = patches.FancyBboxPatch((b['x'], b['y']), b['w'], b['h'],
                                      boxstyle="round,pad=0.02,rounding_size=0.03",
                                      linewidth=1.8, edgecolor=b['color'], facecolor='#161F16')
        ax.add_patch(rect)
        ax.text(b['x'] + b['w']/2, b['y'] + b['h'] - 0.06, b['title'], color='#DEEAC1',
                fontsize=11, fontweight='bold', ha='center', va='center')
        ax.text(b['x'] + b['w']/2, b['y'] + b['h']/2 - 0.03, b['desc'], color='#D1DDD0',
                fontsize=8.5, ha='center', va='center', linespacing=1.35)

    # Arrows
    arrow_props = dict(facecolor='#89A854', edgecolor='#89A854', width=2, headwidth=7)
    ax.annotate('', xy=(0.37, 0.65), xytext=(0.31, 0.72), arrowprops=arrow_props)
    ax.annotate('', xy=(0.37, 0.40), xytext=(0.31, 0.30), arrowprops=arrow_props)
    ax.annotate('', xy=(0.70, 0.52), xytext=(0.64, 0.52), arrowprops=arrow_props)

    plt.title("ARQUITECTURA INTEGRAL DE LA PLATAFORMA APPMOTTUS", color='#DEEAC1', fontsize=13, fontweight='bold', pad=15)
    path = os.path.join(ASSETS_DIR, 'diagram_architecture.png')
    plt.tight_layout()
    plt.savefig(path, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close()
    return path

def generate_workout_logger_mockup():
    fig, ax = plt.subplots(figsize=(8.5, 4.4), dpi=200)
    fig.patch.set_facecolor('#0F140F')
    ax.set_facecolor('#0F140F')
    ax.axis('off')

    # Card background
    card = patches.FancyBboxPatch((0.04, 0.05), 0.92, 0.90, boxstyle="round,pad=0.02,rounding_size=0.03",
                                  linewidth=1.5, edgecolor='#6E8842', facecolor='#161D16')
    ax.add_patch(card)

    # Header
    ax.text(0.08, 0.88, "SESIÓN: HIPERTROFIA TREN SUPERIOR (A1/A2)", color='#FFFFFF', fontsize=12, fontweight='bold')
    ax.text(0.08, 0.83, "✔ 3 Bloques: Calentamiento (10m) · Trabajo Principal (45m) · Vuelta a la Calma (5m)", color='#A2B496', fontsize=8.5)

    # Floating timer indicator
    timer_rect = patches.FancyBboxPatch((0.72, 0.79), 0.21, 0.12, boxstyle="round,pad=0.01", edgecolor='#89A854', facecolor='#22301F')
    ax.add_patch(timer_rect)
    ax.text(0.825, 0.865, "REST TIMER", color='#81C784', fontsize=8, fontweight='bold', ha='center')
    ax.text(0.825, 0.82, "01:24 (+15s / -15s)", color='#FFFFFF', fontsize=9.5, fontweight='bold', ha='center')

    # Exercise 1: Warm-up
    e1 = patches.FancyBboxPatch((0.07, 0.56), 0.86, 0.20, boxstyle="round,pad=0.01", edgecolor='#445533', facecolor='#1C251C')
    ax.add_patch(e1)
    ax.text(0.09, 0.72, "BLOQUE 1: CALENTAMIENTO · Movilidad Articular Escapular", color='#89A854', fontsize=9.5, fontweight='bold')
    ax.text(0.09, 0.67, "Prescripción: 2 series x 15 reps | Tempo: 2-0-2-0 | Sin carga", color='#D1DDD0', fontsize=8.5)
    ax.text(0.09, 0.60, "[OK] Serie 1: 15 reps completadas    [OK] Serie 2: 15 reps completadas", color='#81C784', fontsize=8.5, fontweight='bold')

    # Exercise 2: Main workout (Superset A1)
    e2 = patches.FancyBboxPatch((0.07, 0.12), 0.86, 0.38, boxstyle="round,pad=0.01", edgecolor='#89A854', facecolor='#1C251C')
    ax.add_patch(e2)
    ax.text(0.09, 0.45, "BLOQUE 2: PRINCIPAL · Press de Banca Plano (Superserie A1)", color='#DEEAC1', fontsize=10.5, fontweight='bold')
    ax.text(0.09, 0.40, "Objetivo: 85.0 kg · RPE 8.5 · Tempo 3-1-1-0 | Marca anterior: 82.5 kg x 8 reps (104.5 kg 1RM)", color='#FFB74D', fontsize=8.5)

    # Sets table mockup inside
    ax.text(0.10, 0.33, "Serie 1:   [ 82.5 kg ] x [ 8 reps ]  RPE: [ 8.0 ]   Nota: 'Sólido control excéntrico'  [OK]", color='#E2EFC8', fontsize=8)
    ax.text(0.10, 0.26, "Serie 2:   [ 85.0 kg ] x [ 8 reps ]  RPE: [ 8.5 ]   Nota: 'Buena potencia en el punto cero'  [OK]", color='#E2EFC8', fontsize=8)
    ax.text(0.10, 0.19, "Serie 3:   [ 87.5 kg ] x [ 6 reps ]  RPE: [ 9.5 ]   Nota: 'Última repetición al fallo técnico'  [OK]", color='#FFD54F', fontsize=8)
    ax.text(0.10, 0.14, "Estado: Sesión completada automáticamente al registrar todas las series.", color='#81C784', fontsize=8, fontweight='bold')

    plt.title("INTERACTIVE WORKOUT LOGGER CON REST TIMER Y MARCA ANTERIOR", color='#DEEAC1', fontsize=12, fontweight='bold', pad=12)
    path = os.path.join(ASSETS_DIR, 'diagram_workout_logger.png')
    plt.tight_layout()
    plt.savefig(path, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close()
    return path

def generate_epley_progression_chart():
    fig, ax = plt.subplots(figsize=(8, 3.8), dpi=200)
    fig.patch.set_facecolor('#0F140F')
    ax.set_facecolor('#151D15')

    sessions = ['Sem 1\n(03 Oct)', 'Sem 2\n(10 Oct)', 'Sem 3\n(17 Oct)', 'Sem 4\n(24 Oct)', 'Sem 5\n(31 Oct)', 'Sem 6\n(07 Nov)']
    max_weights = [75.0, 77.5, 80.0, 82.5, 85.0, 87.5]
    epley_1rm = [95.0, 98.2, 101.3, 105.2, 108.4, 112.5]

    ax.plot(sessions, epley_1rm, marker='o', color='#FFB74D', linewidth=2.5, label='1RM Estimado (Fórmula de Epley)')
    ax.plot(sessions, max_weights, marker='s', color='#89A854', linewidth=2.2, label='Carga Real Levantada (kg)')

    for i, txt in enumerate(epley_1rm):
        ax.annotate(f"{txt}kg", (sessions[i], epley_1rm[i] + 1.2), color='#FFB74D', fontsize=8.5, ha='center', weight='bold')

    for i, txt in enumerate(max_weights):
        ax.annotate(f"{txt}kg", (sessions[i], max_weights[i] - 3.2), color='#DEEAC1', fontsize=8.5, ha='center')

    ax.set_ylim(65, 122)
    ax.grid(True, linestyle='--', alpha=0.15, color='#FFFFFF')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color((1.0, 1.0, 1.0, 0.2))
    ax.spines['bottom'].set_color((1.0, 1.0, 1.0, 0.2))
    ax.tick_params(colors='#A2B496', labelsize=8.5)
    ax.legend(facecolor='#1C251C', edgecolor='#6E8842', labelcolor='#FFFFFF', fontsize=8.5, loc='upper left')

    plt.title("PROGRESIÓN DE FUERZA Y SOBRECARGA: 1RM EPLEY VS CARGA REAL", color='#DEEAC1', fontsize=11, fontweight='bold', pad=12)
    path = os.path.join(ASSETS_DIR, 'diagram_epley_chart.png')
    plt.tight_layout()
    plt.savefig(path, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close()
    return path

def generate_comparator_mockup():
    fig, ax = plt.subplots(figsize=(8.5, 3.8), dpi=200)
    fig.patch.set_facecolor('#0F140F')
    ax.set_facecolor('#0F140F')
    ax.axis('off')

    # Card
    rect = patches.FancyBboxPatch((0.03, 0.05), 0.94, 0.90, boxstyle="round,pad=0.02,rounding_size=0.03",
                                  linewidth=1.5, edgecolor='#6E8842', facecolor='#161D16')
    ax.add_patch(rect)

    ax.text(0.06, 0.86, "COMPARADOR FOTOGRÁFICO & ANTROPOMÉTRICO (SIDE-BY-SIDE)", color='#FFFFFF', fontsize=11, fontweight='bold')
    ax.text(0.06, 0.80, "Contraste entre Evaluación Inicial (01 Oct) y Evaluación Actual (07 Nov)", color='#A2B496', fontsize=8.5)

    # Photo A
    pA = patches.FancyBboxPatch((0.06, 0.15), 0.26, 0.58, boxstyle="round,pad=0.01", edgecolor='#90CAF9', facecolor='#12181F')
    ax.add_patch(pA)
    ax.text(0.19, 0.66, "EVALUACIÓN 'ANTES'", color='#90CAF9', fontsize=8.5, fontweight='bold', ha='center')
    ax.text(0.19, 0.44, "[ FOTOGRAFÍA\nFRONTAL\n01 OCT 2026 ]", color='#78909C', fontsize=8.5, ha='center')
    ax.text(0.19, 0.22, "Peso: 82.5 kg\nCintura: 88 cm", color='#FFFFFF', fontsize=8, ha='center')

    # Photo B
    pB = patches.FancyBboxPatch((0.36, 0.15), 0.26, 0.58, boxstyle="round,pad=0.01", edgecolor='#81C784', facecolor='#132014')
    ax.add_patch(pB)
    ax.text(0.49, 0.66, "EVALUACIÓN 'DESPUÉS'", color='#81C784', fontsize=8.5, fontweight='bold', ha='center')
    ax.text(0.49, 0.44, "[ FOTOGRAFÍA\nFRONTAL\n07 NOV 2026 ]", color='#81C784', fontsize=8.5, ha='center')
    ax.text(0.49, 0.22, "Peso: 78.5 kg\nCintura: 82 cm", color='#FFFFFF', fontsize=8, ha='center')

    # Deltas Box
    pDelta = patches.FancyBboxPatch((0.66, 0.15), 0.28, 0.58, boxstyle="round,pad=0.01", edgecolor='#89A854', facecolor='#1F2B1A')
    ax.add_patch(pDelta)
    ax.text(0.80, 0.66, "VARIACIONES NETAS (DELTA)", color='#FFB74D', fontsize=8.5, fontweight='bold', ha='center')
    ax.text(0.68, 0.54, "Delta Peso:", color='#D1DDD0', fontsize=8.5)
    ax.text(0.88, 0.54, "- 4.0 kg  [OK]", color='#81C784', fontsize=8.5, fontweight='bold', ha='right')
    ax.text(0.68, 0.46, "Delta Cintura:", color='#D1DDD0', fontsize=8.5)
    ax.text(0.88, 0.46, "- 6.0 cm  [OK]", color='#81C784', fontsize=8.5, fontweight='bold', ha='right')
    ax.text(0.68, 0.38, "Delta Cadera:", color='#D1DDD0', fontsize=8.5)
    ax.text(0.88, 0.38, "- 3.5 cm  [OK]", color='#81C784', fontsize=8.5, fontweight='bold', ha='right')
    ax.text(0.68, 0.30, "Delta Brazo:", color='#D1DDD0', fontsize=8.5)
    ax.text(0.88, 0.30, "+ 1.5 cm  [+]", color='#FFB74D', fontsize=8.5, fontweight='bold', ha='right')
    ax.text(0.68, 0.22, "Delta % Grasa:", color='#D1DDD0', fontsize=8.5)
    ax.text(0.88, 0.22, "- 2.8 %  [OK]", color='#81C784', fontsize=8.5, fontweight='bold', ha='right')

    plt.title("ANÁLISIS DE COMPOSICIÓN CORPORAL Y EVALUACIÓN FOTOGRÁFICA", color='#DEEAC1', fontsize=11, fontweight='bold', pad=12)
    path = os.path.join(ASSETS_DIR, 'diagram_comparator.png')
    plt.tight_layout()
    plt.savefig(path, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close()
    return path

# -----------------------------------------------------------------------------
# CONSTRUCCIÓN DEL DOCUMENTO WORD (.DOCX)
# -----------------------------------------------------------------------------

def build_docx_manual():
    print("Iniciando compilación del Manual de Usuario AppMottus...")
    doc = Document()

    # Configuración de márgenes estándar de 2.54 cm (1 pulgada)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Estilos de encabezado y fuentes
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(40, 48, 40)

    # -------------------------------------------------------------------------
    # PORTADA FORMAL Y ELEGANTE
    # -------------------------------------------------------------------------
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(72)
    title_p.paragraph_format.space_after = Pt(12)
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_title = title_p.add_run("MANUAL DE USUARIO OFICIAL")
    run_title.font.size = Pt(28)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(77, 96, 46) # #4D602E

    sub_p = doc.add_paragraph()
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub_p.paragraph_format.space_after = Pt(24)
    run_sub = sub_p.add_run("Plataforma Integral de Entrenamiento & Gestión de Fuerza\nAppMottus Studio (appmottus.raevsi.cl)")
    run_sub.font.size = Pt(15)
    run_sub.font.color.rgb = RGBColor(110, 136, 66) # #6E8842

    # Portada Metadata Box
    meta_table = doc.add_table(rows=5, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Versión de la Plataforma:", "3.0 (TrueCoach Parity Definitiva)"),
        ("Entorno de Producción:", "https://appmottus.raevsi.cl"),
        ("Destinatarios:", "Alumnos (Atletas), Entrenadores (Coaches) y Administradores"),
        ("Fecha de Publicación:", datetime.now().strftime("%B %Y")),
        ("Estado de Implementación:", "En Producción Activa (AWS RDS + Nginx + FastAPI)")
    ]

    for idx, (k, v) in enumerate(meta_data):
        row = meta_table.rows[idx]
        cell_k, cell_v = row.cells[0], row.cells[1]
        cell_k.width = Inches(2.6)
        cell_v.width = Inches(3.8)
        set_cell_background(cell_k, "F0F4EC")
        set_cell_background(cell_v, "FFFFFF")
        set_cell_margins(cell_k, 80, 80, 120, 120)
        set_cell_margins(cell_v, 80, 80, 120, 120)
        p_k = cell_k.paragraphs[0]
        r_k = p_k.add_run(k)
        r_k.font.bold = True
        r_k.font.size = Pt(10)
        r_k.font.color.rgb = RGBColor(77, 96, 46)
        p_v = cell_v.paragraphs[0]
        r_v = p_v.add_run(v)
        r_v.font.size = Pt(10)

    doc.add_page_break()

    # -------------------------------------------------------------------------
    # TABLA DE CONTENIDOS Y SINOPSIS
    # -------------------------------------------------------------------------
    h1 = doc.add_heading("Tabla de Contenidos", level=1)
    h1.paragraph_format.space_before = Pt(16)
    h1.paragraph_format.space_after = Pt(12)

    toc_items = [
        ("1. Introducción y Acceso a la Plataforma", "Visión general, roles, activación por enlace e inicio de sesión."),
        ("2. Ficha de Perfil TrueCoach & Preferencias", "Configuración de unidades métricas/imperiales, fecha de cumpleaños y ubicación."),
        ("3. Módulo del Alumno: Entrenamiento y Registro", "Interactive Workout Logger serie por serie, Rest Timer, marcas anteriores y comentarios."),
        ("4. Módulo del Alumno: Hábitos y Comparador Visual", "Nutrición diaria, pasos, agua, sueño y evaluación fotográfica Antes vs Después."),
        ("5. Módulo del Coach: Constructor de Rutinas Pro", "Prescripción en 3 bloques, superseries A1/A2, RPE, Tempo y clonación multi-fecha."),
        ("6. Módulo del Coach: Biblioteca de Plantillas y Mesociclos", "Plantillas reutilizables y programación de programas de entrenamiento multi-semana."),
        ("7. Módulo del Coach: Monitoreo, Feed y Ficha Clínica", "Live Activity Feed, V°B° de sesiones y gestión de antecedentes médicos y lesiones."),
        ("8. Analítica Avanzada: Progresión de 1RM Epley", "Fundamentos matemáticos, curvas de tendencia, tonelaje y cumplimiento."),
        ("9. Centro de Mensajería Directa 1 a 1", "Comunicación bidireccional privada entre Coach y Atleta.")
    ]

    toc_table = doc.add_table(rows=len(toc_items), cols=2)
    toc_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for idx, (title, desc) in enumerate(toc_items):
        row = toc_table.rows[idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.8)
        c1.width = Inches(3.6)
        set_cell_background(c0, "F8FAF7" if idx % 2 == 0 else "FFFFFF")
        set_cell_background(c1, "F8FAF7" if idx % 2 == 0 else "FFFFFF")
        set_cell_margins(c0, 60, 60, 100, 100)
        set_cell_margins(c1, 60, 60, 100, 100)
        p0 = c0.paragraphs[0]
        r0 = p0.add_run(title)
        r0.font.bold = True
        r0.font.size = Pt(10)
        r0.font.color.rgb = RGBColor(77, 96, 46)
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(desc)
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = RGBColor(90, 102, 90)

    doc.add_page_break()

    # -------------------------------------------------------------------------
    # SECCIÓN 1: INTRODUCCIÓN Y PRIMEROS PASOS
    # -------------------------------------------------------------------------
    h1 = doc.add_heading("1. Introducción y Acceso a la Plataforma", level=1)
    p = doc.add_paragraph(
        "AppMottus Studio es el sistema integral de prescripción de entrenamiento, registro serie por serie y "
        "seguimiento de composición corporal de Mottus Gym Studio (appmottus.raevsi.cl). Diseñada bajo los estándares "
        "de rendimiento de TrueCoach, la plataforma divide las operaciones en dos grandes perfiles: Alumnos (Atletas) y "
        "Entrenadores (Coaches y Administradores)."
    )

    doc.add_picture(generate_architecture_diagram(), width=Inches(6.4))
    doc.add_paragraph("Ilustración 1.1: Diagrama de Arquitectura y Flujo Operacional de AppMottus.", style='Caption')

    doc.add_heading("1.1 Roles de Usuario y Permisos", level=2)
    roles_table = doc.add_table(rows=4, cols=3)
    roles_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Rol del Sistema", "Identificador", "Capacidades Clave"]
    for i, h in enumerate(headers):
        cell = roles_table.rows[0].cells[i]
        set_cell_background(cell, COLOR_PRIMARY_HEX)
        set_cell_margins(cell, 90, 90, 100, 100)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.font.bold = True
        r.font.size = Pt(10)
        r.font.color.rgb = RGBColor(255, 255, 255)

    roles_data = [
        ("Administrador", "RUT / Contraseña", "Gestión total de coaches, alumnos, membresías, auditoría y métricas globales."),
        ("Entrenador (Coach)", "RUT / Contraseña", "Constructor de rutinas, plantillas, mesociclos, feed en vivo, chat 1-a-1 y V°B°."),
        ("Alumno (Atleta)", "RUT / Contraseña", "Workout Logger interactivo, Rest timer, hábitos diarios, comparador de fotos y chat.")
    ]

    for idx, (r_name, r_auth, r_caps) in enumerate(roles_data):
        row = roles_table.rows[idx + 1]
        for c_idx, val in enumerate([r_name, r_auth, r_caps]):
            cell = row.cells[c_idx]
            set_cell_background(cell, "F8FAF7" if idx % 2 == 0 else "FFFFFF")
            set_cell_margins(cell, 70, 70, 100, 100)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(9.5)
            if c_idx == 0:
                r.font.bold = True
                r.font.color.rgb = RGBColor(77, 96, 46)

    doc.add_heading("1.2 Flujo de Alta por Invitación Única (RUT Token)", level=2)
    doc.add_paragraph(
        "Por motivos de seguridad y control de membresía, los alumnos no se registran de forma abierta. "
        "El Entrenador ingresa el RUT del alumno en el panel 'Alumnos' y el sistema genera automáticamente un enlace "
        "con token de un solo uso:"
    )
    p_box = doc.add_paragraph()
    r_box = p_box.add_run("https://appmottus.raevsi.cl/register?token=XyZ987...TokenSeguro...")
    r_box.font.bold = True
    r_box.font.color.rgb = RGBColor(77, 96, 46)

    # -------------------------------------------------------------------------
    # SECCIÓN 2: FICHA DE PERFIL TRUECOACH
    # -------------------------------------------------------------------------
    h1 = doc.add_heading("2. Ficha de Perfil TrueCoach & Preferencias", level=1)
    doc.add_paragraph(
        "Al acceder al enlace de activación, el alumno completa su Ficha de Perfil Oficial adaptada a los estándares de "
        "TrueCoach. Toda la información se almacena a nivel de base de datos de manera segura y privada:"
    )

    fields_table = doc.add_table(rows=9, cols=3)
    fields_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Campo de Perfil", "Obligatoriedad", "Descripción y Uso en el Entrenamiento"]):
        cell = fields_table.rows[0].cells[i]
        set_cell_background(cell, COLOR_PRIMARY_HEX)
        set_cell_margins(cell, 80, 80, 90, 90)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.font.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    profile_fields = [
        ("Nombre y Apellido", "Obligatorio", "Identificación oficial en el panel del entrenador y reportes."),
        ("Correo Electrónico", "Obligatorio", "Identificador alternativo de inicio de sesión."),
        ("Celular / WhatsApp", "Obligatorio", "Canal de contacto directo para avisos urgentes o coordinación."),
        ("Fecha de Nacimiento", "Obligatorio", "Permite calcular edad biológica para algoritmos de recuperación."),
        ("Ciudad / Ubicación", "Obligatorio", "Localidad geográfica del alumno (ej. Viña del Mar, Chile)."),
        ("Género / Sexo", "Obligatorio", "Cálculo de tasas metabólicas basales y gasto calórico."),
        ("Sistema de Unidades", "Obligatorio", "Selector entre 'Métrico' (kg / cm) e 'Imperial' (lbs / in)."),
        ("Peso y Estatura", "Obligatorio", "Línea base antropométrica inicial para el cálculo de IMC y fuerza relativa.")
    ]

    for idx, (f_name, f_req, f_desc) in enumerate(profile_fields):
        row = fields_table.rows[idx + 1]
        for c_idx, val in enumerate([f_name, f_req, f_desc]):
            cell = row.cells[c_idx]
            set_cell_background(cell, "F8FAF7" if idx % 2 == 0 else "FFFFFF")
            set_cell_margins(cell, 60, 60, 80, 80)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(9)
            if c_idx == 0:
                r.font.bold = True
                r.font.color.rgb = RGBColor(77, 96, 46)

    # -------------------------------------------------------------------------
    # SECCIÓN 3: MÓDULO DEL ALUMNO (ATLETA)
    # -------------------------------------------------------------------------
    h1 = doc.add_heading("3. Módulo del Alumno: Entrenamiento y Registro", level=1)
    doc.add_paragraph(
        "El módulo del alumno ('Mis Rutinas') está diseñado para ejecutarse cómodamente en dispositivos móviles "
        "mientras se entrena en el gimnasio. Integra el Interactive Workout Logger con cronómetro interactivo y "
        "retroalimentación histórica in situ."
    )

    doc.add_picture(generate_workout_logger_mockup(), width=Inches(6.4))
    doc.add_paragraph("Ilustración 3.1: Pantalla del Workout Logger con cronómetro de descanso y marcas previas.", style='Caption')

    doc.add_heading("3.1 Estructura de Sesión en 3 Bloques", level=2)
    doc.add_paragraph(
        "Cada rutina se divide visualmente en 3 momentos clave diseñados por el entrenador:\n"
        "• Calentamiento (Warm-up): Movilidad articular, liberación miofascial y activación neuromuscular previa.\n"
        "• Bloque Principal (Workout): Los ejercicios de fuerza prescritos con series, repeticiones y formatos.\n"
        "• Vuelta a la Calma (Cool-down): Estiramientos estáticos, ejercicios respiratorios y normalización del ritmo cardíaco."
    )

    doc.add_heading("3.2 Interactive Workout Logger Serie por Serie", level=2)
    doc.add_paragraph(
        "Para cada serie del entrenamiento, el alumno cuenta con controles directos:\n"
        "1. Peso Real (kg o lbs): Carga efectivamente levantada.\n"
        "2. Repeticiones Reales: Conteo exacto de repeticiones completadas en buena forma técnica.\n"
        "3. RPE Real (1 al 10): Escala de esfuerzo percibido para calibrar fatiga.\n"
        "4. Notas del Alumno: Sensaciones (ej. 'Fácil con 80kg', 'Molestia leve en muñeca').\n"
        "5. Checkbox de Finalización (✔): Al marcar la serie como completada, se almacena en AWS RDS y dispara el cronómetro de descanso."
    )

    doc.add_heading("3.3 Cronómetro de Descanso Flotante (Rest Timer)", level=2)
    doc.add_paragraph(
        "Al finalizar una serie, un widget flotante en la esquina inferior derecha se activa automáticamente con la "
        "cuenta regresiva prescrita por el coach (ej. 90 segundos). El timer cuenta con:\n"
        "• Alerta sonora suave mediante Web Audio API al llegar a cero (beep audible).\n"
        "• Botones de ajuste rápido (+15s y -15s) para adaptar descansos sobre la marcha.\n"
        "• Controles de Pausa, Reanudar y Cerrar."
    )

    doc.add_heading("3.4 Marca Anterior (Last Performance)", level=2)
    doc.add_paragraph(
        "Junto al título de cada ejercicio, el sistema analiza el historial del alumno y despliega la insignia dorada "
        "'⚡ Marca anterior: 82.5 kg x 8 reps'. Esto permite al atleta saber exactamente cuánto levantó la sesión anterior "
        "para garantizar la sobrecarga progresiva sin necesidad de revisar notas antiguas."
    )

    # -------------------------------------------------------------------------
    # SECCIÓN 4: HÁBITOS Y COMPARADOR VISUAL
    # -------------------------------------------------------------------------
    h1 = doc.add_heading("4. Módulo del Alumno: Hábitos y Comparador Visual", level=1)
    doc.add_paragraph(
        "En la vista 'Mi Progreso', los atletas registran métricas de estilo de vida y monitorean cambios físicos visuales "
        "mediante el comparador fotográfico Side-by-Side."
    )

    doc.add_picture(generate_comparator_mockup(), width=Inches(6.4))
    doc.add_paragraph("Ilustración 4.1: Comparador fotográfico Side-by-Side y tabla de variaciones netas.", style='Caption')

    doc.add_heading("4.1 Registro Diario de Nutrición y Estilo de Vida", level=2)
    doc.add_paragraph(
        "Los atletas registran diariamente: Calorías consumidas (kcal), Proteína (gramos), Agua (litros), Pasos diarios "
        "y Horas de sueño. El entrenador puede definir metas diarias (ej. 2.400 kcal, 160g proteína, 3.0L agua, 10.000 pasos) "
        "que se reflejan en tiempo real en la vista del alumno."
    )

    doc.add_heading("4.2 Comparador Antes vs Después (Side-by-Side)", level=2)
    doc.add_paragraph(
        "El atleta selecciona dos fechas de evaluación (Línea Base 'Antes' vs Medición 'Después'). El sistema contrasta:\n"
        "• Fotografías en 3 ángulos: Vista Frontal, Vista Lateral (Perfil) y Vista Posterior (Espalda).\n"
        "• Variación Neta (Δ): Diferencias en kilogramos y centímetros de cintura, cadera, pecho, brazo y muslo con insignias de color."
    )

    # -------------------------------------------------------------------------
    # SECCIÓN 5: MÓDULO DEL ENTRENADOR
    # -------------------------------------------------------------------------
    h1 = doc.add_heading("5. Módulo del Coach: Constructor de Rutinas Pro", level=1)
    doc.add_paragraph(
        "El módulo 'Constructor de Rutinas' permite a los entrenadores programar entrenamientos altamente individualizados "
        "con prescripción técnica avanzada."
    )

    doc.add_heading("5.1 Prescripción Avanzada por Ejercicio", level=2)
    doc.add_paragraph(
        "Al agregar un ejercicio, el coach dispone de los siguientes parámetros:\n"
        "• Superseries (A1, A2, B1, B2, C): Agrupación lógica de ejercicios antagonistas o biseries.\n"
        "• Formatos de Entrenamiento: Regular, Superserie, Circuito, AMRAP (As Many Reps As Possible), EMOM (Every Minute on the Minute).\n"
        "• Carga Objetivo (Target Weight en kg o lbs): Carga recomendada para la jornada.\n"
        "• RPE Objetivo (Escala de Borg / Esfuerzo Percibido): Ej. 8.5 (dejando 1-2 repeticiones en reserva).\n"
        "• Tempo de Ejecución: Notación de 4 dígitos (ej. 3-1-1-0 = 3s excéntrica, 1s pausa abajo, 1s concéntrica explosiva, 0s arriba).\n"
        "• Notas Técnicas del Coach: Indicaciones sobre agarre, respiración o foco muscular."
    )

    doc.add_heading("5.2 Programación Múltiple (Duplicate to Dates)", level=2)
    doc.add_paragraph(
        "Permite clonar instantáneamente la sesión a fechas adicionales del mes con un solo clic, evitando la duplicación manual."
    )

    # -------------------------------------------------------------------------
    # SECCIÓN 6: PLANTILLAS MAESTRAS Y MESOCICLOS
    # -------------------------------------------------------------------------
    h1 = doc.add_heading("6. Módulo del Coach: Plantillas Maestras y Mesociclos", level=1)
    doc.add_paragraph(
        "Siguiendo el flujo de trabajo de TrueCoach, los entrenadores no diseñan cada rutina desde cero. Crean "
        "Plantillas Maestras (Workout Templates) y Programas Mesociclos Multi-Semana que aplican a sus alumnos en un clic."
    )

    doc.add_heading("6.1 Biblioteca de Plantillas (Workout Templates)", level=2)
    doc.add_paragraph(
        "Las plantillas se etiquetan por categoría ('Fuerza', 'Hipertrofia', 'Full Body', 'Metabólico'). Cada plantilla "
        "guarda todos los ejercicios, bloques, superseries, series, tempos y notas. Además, cualquier rutina exitosa "
        "puede ser guardada como plantilla en 1 clic desde el historial."
    )

    doc.add_heading("6.2 Programación de Mesociclos (Multi-Week Programs)", level=2)
    doc.add_paragraph(
        "Las plantillas incluyen metadatos de semana (Semana 1 a 12) y día de la semana (Lunes a Domingo). Con el botón "
        "'Aplicar Programa', el coach selecciona las plantillas deseadas, elige una fecha de inicio (ej. próximo lunes) y "
        "el backend de AppMottus calendariza automáticamente semanas completas de entrenamiento proyectadas en el calendario del alumno."
    )

    # -------------------------------------------------------------------------
    # SECCIÓN 7: MONITORIZACIÓN, FEED Y FICHA CLÍNICA
    # -------------------------------------------------------------------------
    h1 = doc.add_heading("7. Módulo del Coach: Monitoreo, Feed y Ficha Clínica", level=1)
    doc.add_paragraph(
        "El entrenador dispone de herramientas de supervisión proactiva para revisar el progreso de toda su cartera de alumnos."
    )

    doc.add_heading("7.1 Live Activity Feed & Pending Reviews", level=2)
    doc.add_paragraph(
        "En la vista de Analítica, la pestaña 'Feed de Actividad en Vivo' unifica en tiempo real:\n"
        "• Rutinas recién completadas por los alumnos.\n"
        "• Comentarios y dudas técnicas formuladas en las sesiones.\n"
        "• Registros de hábitos diarios completados.\n"
        "Cada tarjeta de rutina completada cuenta con el botón 'Dar V°B° / Revisar'. Al hacer clic, se actualiza el estado "
        "a revisada y el alumno ve en su pantalla la insignia verde '✔ V°B° Coach Revisado'."
    )

    doc.add_heading("7.2 Ficha Clínica del Atleta & Alertas Médicas", level=2)
    doc.add_paragraph(
        "En la vista 'Alumnos', cada perfil cuenta con una Ficha Clínica confidencial:\n"
        "• Antecedentes de Lesiones: Molestias crónicas o zonas de cuidado (ej. 'Tendinopatía rotuliana derecha').\n"
        "• Objetivos de Rendimiento: Metas específicas a corto y mediano plazo.\n"
        "• Equipamiento Disponible: Espacio de entrenamiento (gimnasio comercial, rack casero, mancuernas).\n"
        "• Notas Privadas del Coach: Apuntes internos sólo visibles para el equipo técnico.\n\n"
        "ALERTA ACTIVA: Al seleccionar un alumno en el Constructor de Rutinas, si tiene lesiones registradas, el sistema "
        "despliega inmediatamente un banner rojo de advertencia médica para evitar ejercicios contraindicados."
    )

    # -------------------------------------------------------------------------
    # SECCIÓN 8: ANALÍTICA AVANZADA Y 1RM EPLEY
    # -------------------------------------------------------------------------
    h1 = doc.add_heading("8. Analítica Avanzada: Progresión de 1RM Epley", level=1)
    doc.add_paragraph(
        "AppMottus implementa el estándar biomecánico de la Fórmula de Epley para proyectar el 1RM (Una Repetición Máxima) "
        "teórico a partir de series submáximas, protegiendo al atleta de lesiones por levantamientos máximos innecesarios."
    )

    doc.add_picture(generate_epley_progression_chart(), width=Inches(6.4))
    doc.add_paragraph("Ilustración 8.1: Curva de Progresión de 1RM Estimado vs Carga Real en Sentadilla.", style='Caption')

    doc.add_heading("8.1 Fundamento Matemático del 1RM", level=2)
    p_math = doc.add_paragraph()
    r_math = p_math.add_run("1RM Estimado = Peso Levantado × (1 + Repeticiones / 30)")
    r_math.font.bold = True
    r_math.font.size = Pt(12)
    r_math.font.color.rgb = RGBColor(77, 96, 46)

    doc.add_paragraph(
        "El backend en Python analiza todo el histórico serie por serie en `bdmottus.exercise_logs` y calcula:\n"
        "• All-Time Best 1RM: El récord histórico teórico del alumno en dicho ejercicio.\n"
        "• Volumen Total Acumulado: Tonelaje en kg (Series × Reps × Peso).\n"
        "• Curva SVG de Tendencia: Grafica la evolución temporal de fuerza sesión a sesión."
    )

    # -------------------------------------------------------------------------
    # SECCIÓN 9: MENSAJERÍA DIRECTA 1 A 1
    # -------------------------------------------------------------------------
    h1 = doc.add_heading("9. Centro de Mensajería Directa 1 a 1", level=1)
    doc.add_paragraph(
        "Para mantener una comunicación fluida sin depender de aplicaciones de mensajería externas, AppMottus incluye "
        "un buzón de Mensajería Directa 1 a 1 (Direct Inbox TrueCoach):\n"
        "• Acceso permanente en la barra superior (Navbar) con icono de chat.\n"
        "• Contador numérico dinámico de mensajes no leídos (badge verde).\n"
        "• Para el Coach: Selector lateral para conmutar instantáneamente entre conversaciones de todos sus alumnos.\n"
        "• Para el Alumno: Canal privado exclusivo y seguro con su entrenador.\n"
        "• Auto-marcado como leído: Al abrir la conversación, los mensajes dirigidos al usuario pasan a estado leído automáticamente."
    )

    # -------------------------------------------------------------------------
    # APÉNDICE: TABLAS DE REFERENCIA TÉCNICA
    # -------------------------------------------------------------------------
    h1 = doc.add_heading("Apéndice: Tablas de Referencia Técnica", level=1)

    doc.add_heading("A.1 Escala de Esfuerzo Percibido (RPE / RIR)", level=2)
    rpe_table = doc.add_table(rows=6, cols=3)
    rpe_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Valor RPE", "RIR (Reps en Reserva)", "Descripción de la Intensidad"]):
        cell = rpe_table.rows[0].cells[i]
        set_cell_background(cell, COLOR_PRIMARY_HEX)
        set_cell_margins(cell, 80, 80, 90, 90)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.font.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    rpe_data = [
        ("10.0", "0 reps (Fallo técnico)", "Esfuerzo máximo absoluto. Imposible realizar otra repetición con técnica válida."),
        ("9.0 - 9.5", "1 rep en reserva", "Esfuerzo muy elevado. Podría realizar a lo sumo 1 repetición adicional."),
        ("8.0 - 8.5", "2 reps en reserva", "Carga óptima para hipertrofia pesada. 2 repeticiones antes del fallo técnico."),
        ("7.0 - 7.5", "3 reps en reserva", "Carga moderada/alta. Velocidad de barra fluida. Buen estímulo de fuerza base."),
        ("6.0 o menor", "4+ reps en reserva", "Carga ligera de velocidad, calentamiento, técnica o descarga metabólica.")
    ]

    for idx, (val_rpe, val_rir, val_desc) in enumerate(rpe_data):
        row = rpe_table.rows[idx + 1]
        for c_idx, val in enumerate([val_rpe, val_rir, val_desc]):
            cell = row.cells[c_idx]
            set_cell_background(cell, "F8FAF7" if idx % 2 == 0 else "FFFFFF")
            set_cell_margins(cell, 60, 60, 80, 80)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(9)
            if c_idx == 0:
                r.font.bold = True
                r.font.color.rgb = RGBColor(77, 96, 46)

    doc.add_heading("A.2 Guía de Notación de Tempo (4 Dígitos)", level=2)
    doc.add_paragraph(
        "Ejemplo: Tempo '3-1-1-0' en Sentadilla:\n"
        "• Primer dígito (3): 3 segundos de fase excéntrica (bajada controlada).\n"
        "• Segundo dígito (1): 1 segundo de pausa isométrica en el punto de máxima flexión (abajo).\n"
        "• Tercer dígito (1): 1 segundo de fase concéntrica (subida potente y controlada).\n"
        "• Cuarto dígito (0): 0 segundos de pausa arriba (respiración y descenso continuo)."
    )

    # Pie de página / Conclusión
    doc.add_paragraph()
    footer_p = doc.add_paragraph()
    footer_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_f = footer_p.add_run("© 2026 AppMottus Gym Studio · Todos los derechos reservados · appmottus.raevsi.cl")
    r_f.font.size = Pt(9)
    r_f.font.color.rgb = RGBColor(110, 136, 66)

    # Guardar documento Word
    doc.save(OUTPUT_DOCX)
    print(f"\n✔ ¡Manual de Usuario generado exitosamente en:\n  {OUTPUT_DOCX}")
    return OUTPUT_DOCX

if __name__ == "__main__":
    build_docx_manual()
