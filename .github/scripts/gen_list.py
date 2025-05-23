import os
import json

pdf_dir = 'pdfs'
list_file = os.path.join(pdf_dir, 'list.json')

pdfs = [f for f in os.listdir(pdf_dir) if f.lower().endswith('.pdf')]
pdfs.sort()

data = []
for pdf in pdfs:
    name = os.path.splitext(pdf)[0].replace('_', ' ').title()
    data.append({
        "title": name,
        "description": f"Notes from {name}.",
        "filename": pdf
    })

with open(list_file, 'w') as f:
    json.dump(data, f, indent=2)

print(f"✅ Updated {list_file} with {len(data)} PDFs.")
