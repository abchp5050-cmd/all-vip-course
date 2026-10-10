import re

file_path = 'src/pages/admin/AdminDashboard.jsx'
with open(file_path, 'r') as f:
    content = f.read()

content = re.sub(r'import ManageBanners from "\./ManageBanners"\n', '', content)
content = re.sub(r'\s*\{\s*name:\s*"Banners",\s*path:\s*"/admin/banners",\s*icon:\s*Image\s*\},\n', '\n', content)
content = re.sub(r'\s*<Route path="banners" element=\{<ManageBanners />\} />\n', '\n', content)

with open(file_path, 'w') as f:
    f.write(content)

print('Patched AdminDashboard.jsx')
