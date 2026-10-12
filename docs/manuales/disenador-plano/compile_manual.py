import sys
from pathlib import Path
import typst

manual_dir = Path(__file__).resolve().parent

docs = [
    ("manual.typ", "Manual_Disenador_De_Plano_Nightflow_VIP.pdf"),
    ("guia_visual_negocios.typ", "Guia_Visual_Crear_Plano_Para_Clubes.pdf")
]

for typ_file, pdf_file in docs:
    input_typ = manual_dir / typ_file
    output_pdf = manual_dir / pdf_file
    if input_typ.exists():
        print(f"Compilando {typ_file} -> {pdf_file}...")
        typst.compile(str(input_typ), output=str(output_pdf))
        print(f"  [OK] Generado: {pdf_file} ({output_pdf.stat().st_size} bytes)")
    else:
        print(f"  [ALERTA] No se encontro {typ_file}")

print("Todos los manuales PDF estan al dia.")
