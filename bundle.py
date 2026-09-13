import os

with open(r'C:\tvn-phelieu\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

with open(r'C:\tvn-phelieu\css\style.css', 'r', encoding='utf-8') as f:
    css = f.read()

with open(r'C:\tvn-phelieu\js\main.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace css link with inline style
html_bundled = html.replace('<link rel="stylesheet" href="css/style.css">', f'<style>\n{css}\n</style>')
# Replace js script tag with inline script
html_bundled = html_bundled.replace('<script src="js/main.js"></script>', f'<script>\n{js}\n</script>')

out_path = r'C:\tvn-phelieu\index_all_in_one.html'
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(html_bundled)

print(f"Bundled successfully to {out_path}, size: {len(html_bundled)} bytes")
