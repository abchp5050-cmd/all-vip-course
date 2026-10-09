import re

with open('src/pages/admin/AdminDashboard.jsx', 'r') as f:
    content = f.read()

# Add import
import_banner = 'import ManageBanners from "./ManageBanners"\nimport HeaderFooterBuilder from "./HeaderFooterBuilder"'
content = content.replace('import HeaderFooterBuilder from "./HeaderFooterBuilder"', import_banner)

# Add icon import Image if not present
if 'Image,' not in content:
    content = content.replace('Layout,', 'Layout,\n  Image,')

# Add to navItems
new_navItem = '{ name: "Header & Footer", path: "/admin/header-footer", icon: Layout },\n    { name: "Banners", path: "/admin/banners", icon: Image },'
content = content.replace('{ name: "Header & Footer", path: "/admin/header-footer", icon: Layout },', new_navItem)

# Add Route
new_route = '<Route path="header-footer" element={<HeaderFooterBuilder />} />\n              <Route path="banners" element={<ManageBanners />} />'
content = content.replace('<Route path="header-footer" element={<HeaderFooterBuilder />} />', new_route)

with open('src/pages/admin/AdminDashboard.jsx', 'w') as f:
    f.write(content)
