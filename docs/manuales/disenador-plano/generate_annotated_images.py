import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = Path(__file__).resolve().parent
SRC_IMG_DIR = BASE_DIR / "img"
OUT_IMG_DIR = BASE_DIR / "img_annotated"
OUT_IMG_DIR.mkdir(exist_ok=True)

# Cargar fuentes del sistema
try:
    FONT_TITLE = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 26)
    FONT_BADGE = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 20)
    FONT_LABEL = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 17)
    FONT_DESC = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 15)
except Exception:
    FONT_TITLE = FONT_BADGE = FONT_LABEL = FONT_DESC = ImageFont.load_default()

# Colores VIP
GOLD = (229, 181, 79)
GOLD_DARK = (180, 130, 40)
EMERALD = (52, 211, 153)
WHITE = (255, 255, 255)
BLACK = (10, 12, 18)
BG_CARD = (15, 20, 32, 235)
RED = (239, 68, 68)

def draw_pill_badge(draw, x, y, number_text, text, subtitle="", color=GOLD, point_to=None):
    """Dibuja un badge numérico con banner y puntero hacia un elemento de la pantalla."""
    # Medir texto
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

    # Si hay flecha/línea conectora al objetivo
    if point_to:
        px, py = point_to
        # Línea guía
        mid_x = (x + px) // 2
        draw.line([(x + 20, y + total_h // 2), (px, py)], fill=color, width=3)
        # Punto objetivo
        draw.ellipse([px - 6, py - 6, px + 6, py + 6], fill=color, outline=WHITE, width=2)

    # Fondo redondeado con sombra y borde dorado
    draw.rounded_rectangle([x, y, x + total_w, y + total_h], radius=10, fill=(10, 14, 24), outline=color, width=2)
    
    # Círculo numérico
    circle_r = 16
    cx = x + 24
    cy = y + total_h // 2
    draw.ellipse([cx - circle_r, cy - circle_r, cx + circle_r, cy + circle_r], fill=color, outline=WHITE, width=1)
    
    # Número
    draw.text((cx - num_w // 2, cy - 13), number_text, fill=BLACK, font=FONT_BADGE)
    
    # Textos
    tx = x + 48
    draw.text((tx, y + 8), text, fill=WHITE, font=FONT_LABEL)
    if subtitle:
        draw.text((tx, y + 8 + t_h + 4), subtitle, fill=(200, 210, 225), font=FONT_DESC)

def draw_focus_ring(draw, x1, y1, x2, y2, color=GOLD, width=3, label=None):
    """Dibuja un marco resaltado con esquinas suaves."""
    draw.rounded_rectangle([x1, y1, x2, y2], radius=8, outline=color, width=width)
    if label:
        l_box = draw.textbbox((0, 0), label, font=FONT_DESC)
        lw = l_box[2] - l_box[0]
        draw.rectangle([x1 + 10, y1 - 10, x1 + 20 + lw, y1 + 8], fill=(10, 14, 24))
        draw.text((x1 + 15, y1 - 9), label, fill=color, font=FONT_DESC)

# ==========================================
# 1. IMAGEN 1: ELEGIR PLANTILLA
# ==========================================
def annotate_image_1():
    img = Image.open(SRC_IMG_DIR / "01_plantillas_arquetipos.png").convert("RGBA")
    draw = ImageDraw.Draw(img)
    
    # Señal 1: El modal y las 4 plantillas
    draw_focus_ring(draw, 508, 150, 796, 680, color=GOLD, width=3)
    draw_pill_badge(draw, 340, 200, "1", "Elige el diseño de tu club", "Plantilla 'Herradura VIP' para grandes salas", color=GOLD, point_to=(510, 270))

    # Señal 2: Botón de carga
    draw_focus_ring(draw, 524, 634, 782, 674, color=EMERALD, width=4)
    draw_pill_badge(draw, 800, 615, "2", "Haz clic en 'Cargar esta plantilla'", "Crea las 12 mesas en su lugar exacto automáticamente", color=EMERALD, point_to=(770, 654))

    # Señal 3: Opciones alternativas
    draw_pill_badge(draw, 960, 220, "3", "Otras opciones de sala", "Anfiteatros, Terrazas / Rooftops o Lienzo en blanco", color=(56, 189, 248), point_to=(850, 270))

    img.save(OUT_IMG_DIR / "guia_01_elegir_plantilla.png")
    print("[OK] Generada: guia_01_elegir_plantilla.png")

# ==========================================
# 2. IMAGEN 2: MAPA Y ZONAS
# ==========================================
def annotate_image_2():
    img = Image.open(SRC_IMG_DIR / "02_lienzo_herradura_cargado.png").convert("RGBA")
    draw = ImageDraw.Draw(img)
    
    # Señal 1: Barra superior de mesas activas
    draw_focus_ring(draw, 435, 403, 765, 438, color=GOLD, width=3)
    draw_pill_badge(draw, 800, 395, "1", "Tus 12 mesas ya están listas", "Guardado automático y conteo en tiempo real", color=GOLD, point_to=(765, 420))

    # Señal 2: Balcón VIP
    draw_pill_badge(draw, 880, 520, "2", "Zona VIP (Balcón elevado)", "Mesas 1 a 5 con vista panorámica a la pista", color=GOLD, point_to=(815, 660))

    # Señal 3: Cabina DJ
    draw_focus_ring(draw, 775, 940, 855, 980, color=EMERALD, width=3)
    draw_pill_badge(draw, 920, 930, "3", "Cabina del DJ", "Con mesas Stage contiguas a los lados", color=EMERALD, point_to=(855, 960))

    # Señal 4: Palcos Laterales y Arrastre
    draw_pill_badge(draw, 240, 760, "4", "¡Todo se puede mover!", "Arrastra cualquier mesa con el mouse o dedo", color=(168, 85, 247), point_to=(600, 815))

    img.save(OUT_IMG_DIR / "guia_02_mapa_y_zonas.png")
    print("[OK] Generada: guia_02_mapa_y_zonas.png")

# ==========================================
# 3. IMAGEN 3: CAMBIAR PRECIOS Y CAPACIDAD
# ==========================================
def annotate_image_3():
    img = Image.open(SRC_IMG_DIR / "03_inspector_propiedades_mesa.png").convert("RGBA")
    draw = ImageDraw.Draw(img)
    
    # Señal 1: Mesa seleccionada en el mapa
    draw_focus_ring(draw, 770, 640, 860, 680, color=GOLD, width=4)
    draw_pill_badge(draw, 500, 600, "1", "Toca cualquier mesa", "Se iluminará en dorado", color=GOLD, point_to=(770, 660))

    # Señal 2: Panel lateral derecho con propiedades
    draw_focus_ring(draw, 1220, 468, 1760, 980, color=GOLD, width=3)
    draw_pill_badge(draw, 950, 480, "2", "Inspector Lateral", "Aquí configuras todo de esa mesa", color=GOLD, point_to=(1220, 510))

    # Señal 3: Código y número
    draw_focus_ring(draw, 1245, 608, 1485, 648, color=(56, 189, 248), width=3)
    draw_pill_badge(draw, 920, 615, "3", "Nombre de la Mesa", "Ejemplo: VIP-03 o PALCO 1", color=(56, 189, 248), point_to=(1245, 628))

    # Señal 4: Capacidad de personas
    draw_focus_ring(draw, 1500, 672, 1735, 712, color=EMERALD, width=3)
    draw_pill_badge(draw, 1260, 730, "4", "¿Cuántas personas entran?", "Toca los botones rápidos: 4p, 6p, 8p, 10p, 14p", color=EMERALD, point_to=(1500, 692))

    # Señal 5: Forma y color de categoría
    draw_focus_ring(draw, 1245, 805, 1735, 960, color=GOLD, width=3)
    draw_pill_badge(draw, 930, 830, "5", "Forma y Color VIP", "Círculo, cápsula, cuadrado y colores de zona", color=GOLD, point_to=(1245, 850))

    img.save(OUT_IMG_DIR / "guia_03_cambiar_precio_y_cupo.png")
    print("[OK] Generada: guia_03_cambiar_precio_y_cupo.png")

# ==========================================
# 4. IMAGEN 4: AGREGAR NUEVA MESA
# ==========================================
def annotate_image_4():
    img = Image.open(SRC_IMG_DIR / "04_modal_nueva_mesa.png").convert("RGBA")
    draw = ImageDraw.Draw(img)
    
    # Señal 1: Nombre y Capacidad
    draw_focus_ring(draw, 630, 335, 795, 375, color=GOLD, width=3)
    draw_pill_badge(draw, 340, 330, "1", "Nombre de la nueva mesa", "Ejemplo: VIP-10 o TERRAZA-1", color=GOLD, point_to=(630, 355))

    # Señal 2: Consumo Mínimo
    draw_focus_ring(draw, 630, 575, 795, 615, color=EMERALD, width=3)
    draw_pill_badge(draw, 310, 565, "2", "Consumo Mínimo ($)", "¿Cuánto deben gastar en botellas?", color=EMERALD, point_to=(630, 595))

    # Señal 3: Anticipo / Reserva
    draw_focus_ring(draw, 820, 575, 985, 615, color=GOLD, width=3)
    draw_pill_badge(draw, 1010, 565, "3", "Anticipo de Reserva ($)", "¿Cuánto pagan para apartar la mesa?", color=GOLD, point_to=(985, 595))

    # Señal 4: Previsualizador en vivo
    draw_focus_ring(draw, 1020, 318, 1295, 675, color=(56, 189, 248), width=3)
    draw_pill_badge(draw, 1310, 350, "4", "Simulador en Vivo", "Mira el tamaño y color antes de crearla", color=(56, 189, 248), point_to=(1295, 460))

    # Señal 5: Botón Insertar
    draw_focus_ring(draw, 820, 686, 985, 726, color=GOLD, width=4)
    draw_pill_badge(draw, 1010, 680, "5", "Clic en 'Insertar en Plano'", "Aparece en el mapa lista para acomodar", color=GOLD, point_to=(985, 706))

    img.save(OUT_IMG_DIR / "guia_04_crear_nueva_mesa.png")
    print("[OK] Generada: guia_04_crear_nueva_mesa.png")

# ==========================================
# 5. IMAGEN 5: GUARDAR PLANO
# ==========================================
def annotate_image_5():
    img = Image.open(SRC_IMG_DIR / "05_guardado_sincronizacion.png").convert("RGBA")
    draw = ImageDraw.Draw(img)
    
    # Señal 1: Botón Guardar Plano
    draw_focus_ring(draw, 1495, 400, 1650, 440, color=EMERALD, width=4)
    draw_pill_badge(draw, 1060, 335, "1", "¡Paso Final! Clic en GUARDAR PLANO", "Aplica todos los cambios en tu negocio", color=EMERALD, point_to=(1550, 400))

    # Señal 2: Estado de guardado y mesas activas
    draw_focus_ring(draw, 400, 400, 505, 440, color=GOLD, width=3)
    draw_pill_badge(draw, 520, 395, "2", "Confirmación de Sala", "12 mesas activas registradas en vivo", color=GOLD, point_to=(505, 420))

    img.save(OUT_IMG_DIR / "guia_05_guardar_plano.png")
    print("[OK] Generada: guia_05_guardar_plano.png")

# ==========================================
# 6. IMAGEN 6: SALA EN VIVO
# ==========================================
def annotate_image_6():
    img = Image.open(SRC_IMG_DIR / "06_sala_concierge_operativa.png").convert("RGBA")
    draw = ImageDraw.Draw(img)
    
    # Señal 1: Pestaña Sala & Concierge
    draw_focus_ring(draw, 15, 248, 230, 288, color=GOLD, width=3)
    draw_pill_badge(draw, 240, 245, "1", "Entra a 'Sala & Concierge'", "Para ver tu club operando en vivo", color=GOLD, point_to=(230, 268))

    # Señal 2: Contador de aforo disponible
    draw_focus_ring(draw, 430, 240, 725, 340, color=EMERALD, width=3)
    draw_pill_badge(draw, 740, 260, "2", "Aforo en Tiempo Real", "Muestra cuántas mesas tienes libres (12/12)", color=EMERALD, point_to=(725, 290))

    # Señal 3: Mapa interactivo central
    draw_pill_badge(draw, 500, 570, "3", "Tus meseros ven la sala así", "Saben qué mesa está ocupada, libre o reservada", color=GOLD, point_to=(780, 660))

    # Señal 4: Lista de mesas y consumos mínimos
    draw_focus_ring(draw, 1230, 545, 1755, 960, color=GOLD, width=3)
    draw_pill_badge(draw, 960, 720, "4", "Control de Consumos", "Capacidad y cuentas de cada mesa", color=GOLD, point_to=(1230, 750))

    img.save(OUT_IMG_DIR / "guia_06_plano_en_vivo_clientes.png")
    print("[OK] Generada: guia_06_plano_en_vivo_clientes.png")

if __name__ == "__main__":
    annotate_image_1()
    annotate_image_2()
    annotate_image_3()
    annotate_image_4()
    annotate_image_5()
    annotate_image_6()
    print("Todas las imagenes fueron anotadas con exito!")
