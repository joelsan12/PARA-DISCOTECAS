import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = Path(__file__).resolve().parent
SRC_IMG_DIR = BASE_DIR / "img"
OUT_IMG_DIR = BASE_DIR / "img_annotated"
OUT_IMG_DIR.mkdir(exist_ok=True)

try:
    FONT_BADGE = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 20)
    FONT_LABEL = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 17)
    FONT_DESC = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 15)
except Exception:
    FONT_BADGE = FONT_LABEL = FONT_DESC = ImageFont.load_default()

GOLD = (229, 181, 79)
EMERALD = (52, 211, 153)
WHITE = (255, 255, 255)
BLACK = (10, 12, 18)
CYAN = (56, 189, 248)
PURPLE = (168, 85, 247)

def draw_pill_badge(draw, x, y, number_text, text, subtitle="", color=GOLD, point_to=None):
    num_box = draw.textbbox((0, 0), number_text, font=FONT_BADGE)
    num_w = num_box[2] - num_box[0]
    
    t_box = draw.textbbox((0, 0), text, font=FONT_LABEL)
    t_w = t_box[2] - t_box[0]
    t_h = t_box[3] - t_box[1]
    
    sub_w = 0
    sub_h = 0
    if subtitle:
        s_box = draw.textbbox((0, 0), subtitle, font=FONT_DESC)
        sub_w = s_box[2] - s_box[0]
        sub_h = s_box[3] - s_box[1] + 4

    total_w = max(t_w, sub_w) + 65
    total_h = max(42, t_h + sub_h + 18)

    if point_to:
        px, py = point_to
        draw.line([(x + 20, y + total_h // 2), (px, py)], fill=color, width=3)
        draw.ellipse([px - 6, py - 6, px + 6, py + 6], fill=color, outline=WHITE, width=2)

    draw.rounded_rectangle([x, y, x + total_w, y + total_h], radius=10, fill=(10, 14, 24), outline=color, width=2)
    
    circle_r = 16
    cx = x + 24
    cy = y + total_h // 2
    draw.ellipse([cx - circle_r, cy - circle_r, cx + circle_r, cy + circle_r], fill=color, outline=WHITE, width=1)
    draw.text((cx - num_w // 2, cy - 13), number_text, fill=BLACK, font=FONT_BADGE)
    
    tx = x + 48
    draw.text((tx, y + 8), text, fill=WHITE, font=FONT_LABEL)
    if subtitle:
        draw.text((tx, y + 8 + t_h + 4), subtitle, fill=(200, 210, 225), font=FONT_DESC)

def draw_focus_ring(draw, x1, y1, x2, y2, color=GOLD, width=3):
    draw.rounded_rectangle([x1, y1, x2, y2], radius=8, outline=color, width=width)

# ==========================================
# 1. IMAGEN 1: SALA EN VIVO CONTROL GENERAL
# ==========================================
def annotate_image_1():
    img = Image.open(SRC_IMG_DIR / "01_sala_en_vivo_general.png").convert("RGBA")
    draw = ImageDraw.Draw(img)

    # Señal 1: Conmutador dual integrado (Sala en Vivo vs Concierge)
    draw_focus_ring(draw, 1440, 410, 1735, 452, color=GOLD, width=3)
    draw_pill_badge(draw, 1140, 360, "1", "Selector de Modo de Operación", "Alterna entre 'Sala en Vivo' y 'Piso & Concierge'", color=GOLD, point_to=(1580, 410))

    # Señal 2: Barra de Contadores de Estado
    draw_focus_ring(draw, 435, 478, 970, 515, color=EMERALD, width=3)
    draw_pill_badge(draw, 750, 440, "2", "Contadores de Presencia en Tiempo Real", "En Sala, Reservada, Hold 12 min, Cerrada, Disponible", color=EMERALD, point_to=(550, 495))

    # Señal 3: Plano Cenital Interactivo
    draw_focus_ring(draw, 415, 545, 1190, 970, color=CYAN, width=3)
    draw_pill_badge(draw, 440, 600, "3", "Plano Cenital con Halos en Vivo", "Toca cualquier mesa para ver cuenta o comanda", color=CYAN, point_to=(770, 660))

    # Señal 4: Estado Operativo de Mesas
    draw_focus_ring(draw, 1228, 545, 1760, 970, color=GOLD, width=3)
    draw_pill_badge(draw, 960, 720, "4", "Lista de Mesas en Sala", "Aforo, consumo mínimo y anticipos recaudados", color=GOLD, point_to=(1228, 750))

    img.save(OUT_IMG_DIR / "guia_01_sala_en_vivo_control.png")
    print("[OK] Generada: guia_01_sala_en_vivo_control.png")

# ==========================================
# 2. IMAGEN 2: INSPECCIÓN DE MESA Y COMANDA
# ==========================================
def annotate_image_2():
    img = Image.open(SRC_IMG_DIR / "02_mesa_seleccionada_comanda.png").convert("RGBA")
    draw = ImageDraw.Draw(img)

    # Señal 1: Mesa activa en el plano (VIP-03)
    draw_focus_ring(draw, 770, 240, 860, 280, color=GOLD, width=4)
    draw_pill_badge(draw, 500, 210, "1", "Mesa Seleccionada en el Plano", "Se ilumina con halo azul/dorado de inspección", color=GOLD, point_to=(770, 260))

    # Señal 2: Tarjeta de Ficha de Mesa (inferior)
    draw_focus_ring(draw, 415, 690, 1190, 890, color=EMERALD, width=3)
    draw_pill_badge(draw, 220, 710, "2", "Ficha Operativa de la Mesa", "Código, zona (Palco Presidencial) y aforo (14 pers.)", color=EMERALD, point_to=(415, 740))

    # Señal 3: Peticiones y Concierge de esa mesa
    draw_focus_ring(draw, 435, 840, 1170, 885, color=CYAN, width=3)
    draw_pill_badge(draw, 700, 870, "3", "Peticiones Directas de la Mesa", "Alertas de botellas, mesero, bengalas o cuenta", color=CYAN, point_to=(600, 860))

    # Señal 4: Lista rápida a la derecha
    draw_focus_ring(draw, 1228, 150, 1760, 750, color=GOLD, width=3)
    draw_pill_badge(draw, 960, 320, "4", "Consulta Rápida de Inventario", "Revisa consumos mínimos y balance sin salir", color=GOLD, point_to=(1228, 350))

    img.save(OUT_IMG_DIR / "guia_02_inspeccion_mesa_comanda.png")
    print("[OK] Generada: guia_02_inspeccion_mesa_comanda.png")

# ==========================================
# 3. IMAGEN 3: COLA CONCIERGE EN VIVO
# ==========================================
def annotate_image_3():
    img = Image.open(SRC_IMG_DIR / "03_modo_concierge_cola.png").convert("RGBA")
    draw = ImageDraw.Draw(img)

    # Señal 1: Botón Piso & Concierge Activo
    draw_focus_ring(draw, 1565, 410, 1735, 452, color=GOLD, width=4)
    draw_pill_badge(draw, 1240, 355, "1", "Modo Concierge Activado", "Muestra la atención directa a clientes en mesa", color=GOLD, point_to=(1650, 410))

    # Señal 2: Filtros de Solicitudes
    draw_focus_ring(draw, 1245, 620, 1690, 660, color=CYAN, width=3)
    draw_pill_badge(draw, 980, 600, "2", "Filtros de Atención", "Todas, Pendientes, En atención y Completadas", color=CYAN, point_to=(1245, 638))

    # Señal 3: Cola en Tiempo Real
    draw_focus_ring(draw, 1228, 545, 1760, 830, color=EMERALD, width=3)
    draw_pill_badge(draw, 960, 740, "3", "Cola Concierge en Vivo", "Pedidos de champaña, servicio VIP y asistencia", color=EMERALD, point_to=(1228, 770))

    # Señal 4: Plano Cenital como Referencia
    draw_focus_ring(draw, 415, 545, 1190, 970, color=PURPLE, width=3)
    draw_pill_badge(draw, 440, 580, "4", "Ubicación Espacial en el Mapa", "Identifica al instante qué mesa necesita atención", color=PURPLE, point_to=(770, 660))

    img.save(OUT_IMG_DIR / "guia_03_cola_concierge_atencion.png")
    print("[OK] Generada: guia_03_cola_concierge_atencion.png")

if __name__ == "__main__":
    annotate_image_1()
    annotate_image_2()
    annotate_image_3()
    print("Todas las imagenes de Sala y Concierge fueron anotadas con exito!")
