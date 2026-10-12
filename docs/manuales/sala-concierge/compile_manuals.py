import sys
from pathlib import Path
import typst

manual_dir = Path(__file__).resolve().parent

docs = [
    ("guia_visual_sala_concierge.typ", "Guia_Visual_Sala_Concierge_Dueno.pdf"),
    ("manual_tecnico_sala_concierge.typ", "Manual_Tecnico_Sala_Concierge_Operaciones.pdf")
]

for typ_file, pdf_file in docs:
    input_typ = manual_dir / typ_file
    output_pdf = manual_dir / pdf_file
    if input_typ.exists():
        print(f"Compilando {typ_file} -> {pdf_file}...")
        try:
            typst.compile(str(input_typ), output=str(output_pdf))
            size_kb = output_pdf.stat().st_size / 1024
            print(f"  [OK] Generado: {pdf_file} ({size_kb:.1f} KB)")
        except Exception as e:
            print(f"  [ERROR] Fallo al compilar {typ_file}: {e}")
            sys.exit(1)
    else:
        print(f"  [ALERTA] No se encontro {typ_file}")

print("Todos los manuales PDF de Sala y Concierge han sido compilados con exito.")
