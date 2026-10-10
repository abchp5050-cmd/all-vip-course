import re

file_path = 'firestore.rules'
with open(file_path, 'r') as f:
    content = f.read()

content = re.sub(r'\s*// ===== Banners Collection =====\s*match /banners/\{bannerId\} \{\s*allow read: if true;\s*allow create: if isAdmin\(\);\s*allow update: if isAdmin\(\);\s*allow delete: if isAdmin\(\);\s*\}\n', '\n', content)

with open(file_path, 'w') as f:
    f.write(content)

print('Patched firestore.rules')
