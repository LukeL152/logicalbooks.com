#!/usr/bin/env python3
"""
Stamp lbooks-contract_template.pdf with branded header/footer and export
two variants:
 - contracts/monthly-bookkeeping-agreement.pdf
 - contracts/catch-up-bookkeeping-agreement.pdf

Requires: PyPDF2, reportlab, svglib
Install:
  python3 -m pip install --user PyPDF2 reportlab svglib

Run:
  python3 scripts/stamp_contracts.py
"""
import io
import os
import sys

TEMPLATE_PDF = 'lbooks-contract_template.pdf'
OUTPUTS = [
    ('contracts/monthly-bookkeeping-agreement.pdf', 'Monthly Bookkeeping Agreement'),
    ('contracts/catch-up-bookkeeping-agreement.pdf', 'Catch‑Up Bookkeeping Agreement'),
]
LOGO_SVG = 'assets/img/favicon.svg'

def main():
    try:
        from PyPDF2 import PdfReader, PdfWriter
        from reportlab.pdfgen import canvas
        from reportlab.lib.units import inch
        from reportlab.graphics import renderPDF
        from svglib.svglib import svg2rlg
    except Exception as e:
        sys.stderr.write('\nMissing dependencies. Please install: PyPDF2 reportlab svglib\n')
        sys.stderr.write('Install command:\n  python3 -m pip install --user PyPDF2 reportlab svglib\n\n')
        raise

    if not os.path.exists(TEMPLATE_PDF):
        raise SystemExit(f"Template PDF not found: {TEMPLATE_PDF}")

    os.makedirs('contracts', exist_ok=True)

    # Load template and SVG logo
    base = PdfReader(TEMPLATE_PDF)
    try:
        logo = svg2rlg(LOGO_SVG)
    except Exception:
        logo = None

    for out_path, title in OUTPUTS:
        writer = PdfWriter()
        for page_index, page in enumerate(base.pages):
            width = float(page.mediabox.width)
            height = float(page.mediabox.height)

            buf = io.BytesIO()
            c = canvas.Canvas(buf, pagesize=(width, height))

            # Header: logo + brand + gold rule
            top = height - 0.5*inch
            x_pad = 0.7*inch
            brand_color = (0/255, 54/255, 84/255)  # #003654
            gold_color = (245/255, 189/255, 2/255) # #F5BD02

            # Draw logo if available
            if logo is not None:
                try:
                    # scale logo to ~24px tall
                    scale = 24.0 / max(logo.height, 1)
                    with c.saveState():
                        c.translate(x_pad, top - 18)
                        c.scale(scale, scale)
                        renderPDF.draw(logo, c, 0, 0)
                except Exception:
                    pass

            # Brand text
            c.setFillColorRGB(*brand_color)
            c.setFont('Helvetica-Bold', 12)
            c.drawString(x_pad + 28, top - 6, 'Logical Books')

            # Contact line (right)
            c.setFont('Helvetica', 9.5)
            contact = 'logicalbooks.com  •  (336) 858‑3549  •  info@logicalbooks.com'
            text_w = c.stringWidth(contact, 'Helvetica', 9.5)
            c.drawString(width - x_pad - text_w, top - 6, contact)

            # Gold rule
            c.setStrokeColorRGB(*gold_color)
            c.setLineWidth(1.5)
            c.line(x_pad, top - 16, width - x_pad, top - 16)

            # Footer: page number right
            footer_y = 0.45*inch
            page_label = f"Page {page_index + 1}"
            c.setFont('Helvetica', 9.5)
            c.setFillColorRGB(0.29, 0.34, 0.39)
            w = c.stringWidth(page_label, 'Helvetica', 9.5)
            c.drawString(width - x_pad - w, footer_y, page_label)

            # Title on first page
            if page_index == 0:
                c.setFillColorRGB(*brand_color)
                c.setFont('Helvetica-Bold', 16)
                c.drawString(x_pad, top - 36, title)

            c.showPage()
            c.save()

            buf.seek(0)
            overlay = PdfReader(buf)
            over_page = overlay.pages[0]
            # Merge
            page.merge_page(over_page)
            writer.add_page(page)

        with open(out_path, 'wb') as f:
            writer.write(f)
        print(f'Wrote {out_path}')

if __name__ == '__main__':
    main()

