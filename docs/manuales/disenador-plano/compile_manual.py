import sys
from pathlib import Path
import typst

manual_dir = Path(__file__).resolve().parent
input_typ = manual_dir / "manual.typ"
output_pdf = manual_dir / "Manual_Disenador_De_Plano_Nightflow_VIP.pdf"

if not input_typ.exists():
    print(f"Error: {input_typ} no existe")
    sys.exit(1)

print(f"Compilando {input_typ} -> {output_pdf}...")
typst.compile(str(input_typ), output=str(output_pdf))
print(f"¡PDF generado con éxito en: {output_pdf} ({output_pdf.stat().st_size} bytes)!")
