import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Plus, Edit2, Trash2, Home, Save, X } from "lucide-react";
import { toast } from "sonner";

export default function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSubcategoryForm, setShowSubcategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  
  const [categoryForm, setCategoryForm] = useState({
    title: "",
    description: "",
    icon: "",
    imageURL: "",
    showOnHomepage: false,
    order: 0
  });

  const [subcategoryForm, setSubcategoryForm] = useState({
    categoryId: "",
    title: "",
    description: "",
    imageURL: "",
    order: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const categoriesQuery = query(collection(db, "categories"), orderBy("order", "asc"));
      const categoriesSnapshot = await getDocs(categoriesQuery);
      const categoriesData = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesData);

      const subcategoriesQuery = query(collection(db, "subcategories"), orderBy("order", "asc"));
      const subcategoriesSnapshot = await getDocs(subcategoriesQuery);
      const subcategoriesData = subcategoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSubcategories(subcategoriesData);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load categories");
      setLoading(false);
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      const categoryData = {
        ...categoryForm,
        order: Number(categoryForm.order),
        updatedAt: new Date()
      };

      if (editingCategory) {
        await updateDoc(doc(db, "categories", editingCategory.id), categoryData);
        toast.success("Category updated successfully");
      } else {
        await addDoc(collection(db, "categories"), {
          ...categoryData,
          createdAt: new Date()
        });
        toast.success("Category added successfully");
      }

      resetCategoryForm();
      fetchData();
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Failed to save category");
    }
  };

  const handleSaveSubcategory = async (e) => {
    e.preventDefault();
    try {
      const subcategoryData = {
        ...subcategoryForm,
        order: Number(subcategoryForm.order),
        updatedAt: new Date()
      };

      if (editingSubcategory) {
        await updateDoc(doc(db, "subcategories", editingSubcategory.id), subcategoryData);
        toast.success("Subcategory updated successfully");
      } else {
        await addDoc(collection(db, "subcategories"), {
          ...subcategoryData,
          createdAt: new Date()
        });
        toast.success("Subcategory added successfully");
      }

      resetSubcategoryForm();
      fetchData();
    } catch (error) {
      console.error("Error saving subcategory:", error);
      toast.error("Failed to save subcategory");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    
    try {
      await deleteDoc(doc(db, "categories", categoryId));
      toast.success("Category deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  };

  const handleDeleteSubcategory = async (subcategoryId) => {
    if (!confirm("Are you sure you want to delete this subcategory?")) return;
    
    try {
      await deleteDoc(doc(db, "subcategories", subcategoryId));
      toast.success("Subcategory deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      toast.error("Failed to delete subcategory");
    }
  };

  const editCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      title: category.title,
      description: category.description,
      icon: category.icon || "",
      imageURL: category.imageURL || "",
      showOnHomepage: category.showOnHomepage || false,
      order: category.order || 0
    });
    setShowCategoryForm(true);
  };

  const editSubcategory = (subcategory) => {
    setEditingSubcategory(subcategory);
    setSubcategoryForm({
      categoryId: subcategory.categoryId,
      title: subcategory.title,
      description: subcategory.description,
      imageURL: subcategory.imageURL || "",
      order: subcategory.order || 0
    });
    setShowSubcategoryForm(true);
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      title: "",
      description: "",
      icon: "",
      imageURL: "",
      showOnHomepage: false,
      order: 0
    });
    setEditingCategory(null);
    setShowCategoryForm(false);
  };

  const resetSubcategoryForm = () => {
    setSubcategoryForm({
      categoryId: "",
      title: "",
      description: "",
      imageURL: "",
      order: 0
    });
    setEditingSubcategory(null);
    setShowSubcategoryForm(false);
  };

  const getSubcategoriesForCategory = (categoryId) => {
    return subcategories.filter(sub => sub.categoryId === categoryId);
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Manage Categories</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Categories */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">Main Categories</h2>
            <button
              onClick={() => setShowCategoryForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
            >
              <Plus size={20} />
              Add Category
            </button>
          </div>

          {/* Category Form */}
          {showCategoryForm && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-card-foreground">
                {editingCategory ? "Edit Category" : "New Category"}
              </h3>
              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-card-foreground">Title</label>
                  <input
                    type="text"
                    value={categoryForm.title}
                    onChange={(e) => setCategoryForm({ ...categoryForm, title: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-card-foreground">Description</label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-card-foreground">Icon (optional)</label>
                  <input
                    type="text"
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Icon name or URL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-card-foreground">Image URL (optional)</label>
                  <input
                    type="url"
                    value={categoryForm.imageURL}
                    onChange={(e) => setCategoryForm({ ...categoryForm, imageURL: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                  {categoryForm.imageURL && (
                    <div className="mt-2">
                      <img src={categoryForm.imageURL} alt="Preview" className="w-20 h-20 object-cover rounded" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-card-foreground">Order</label>
                  <input
                    type="number"
                    value={categoryForm.order}
                    onChange={(e) => setCategoryForm({ ...categoryForm, order: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                    min="0"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="showOnHomepage"
                    checked={categoryForm.showOnHomepage}
                    onChange={(e) => setCategoryForm({ ...categoryForm, showOnHomepage: e.target.checked })}
                    className="w-5 h-5 text-primary border-border rounded focus:ring-primary"
                  />
                  <label htmlFor="showOnHomepage" className="text-sm font-medium text-card-foreground flex items-center gap-2">
                    <Home size={18} />
                    Show on Homepage
                  </label>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
                  >
                    <Save size={18} />
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={resetCategoryForm}
                    className="flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition"
                  >
                    <X size={18} />
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Categories List */}
          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-card-foreground">{category.title}</h3>
                      {category.showOnHomepage && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                          <Home size={12} />
                          Homepage
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {getSubcategoriesForCategory(category.id).length} subcategories
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => editCategory(category)}
                      className="p-2 text-primary hover:bg-primary/10 rounded-lg transition"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subcategories */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">Subcategories</h2>
            <button
              onClick={() => setShowSubcategoryForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition"
            >
              <Plus size={20} />
              Add Subcategory
            </button>
          </div>

          {/* Subcategory Form */}
          {showSubcategoryForm && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-card-foreground">
                {editingSubcategory ? "Edit Subcategory" : "New Subcategory"}
              </h3>
              <form onSubmit={handleSaveSubcategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-card-foreground">Parent Category</label>
                  <select
                    value={subcategoryForm.categoryId}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, categoryId: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-card-foreground">Title</label>
                  <input
                    type="text"
                    value={subcategoryForm.title}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, title: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-card-foreground">Description</label>
                  <textarea
                    value={subcategoryForm.description}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-card-foreground">Image URL (optional)</label>
                  <input
                    type="url"
                    value={subcategoryForm.imageURL}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, imageURL: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                  {subcategoryForm.imageURL && (
                    <div className="mt-2">
                      <img src={subcategoryForm.imageURL} alt="Preview" className="w-20 h-20 object-cover rounded" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-card-foreground">Order</label>
                  <input
                    type="number"
                    value={subcategoryForm.order}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, order: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                    min="0"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition"
                  >
                    <Save size={18} />
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={resetSubcategoryForm}
                    className="flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition"
                  >
                    <X size={18} />
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Subcategories List */}
          <div className="space-y-3">
            {subcategories.map((subcategory) => {
              const parentCategory = categories.find(c => c.id === subcategory.categoryId);
              return (
                <div key={subcategory.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-card-foreground">{subcategory.title}</h3>
                      <p className="text-xs text-primary mb-2">
                        {parentCategory?.title || "Unknown Category"}
                      </p>
                      <p className="text-sm text-muted-foreground">{subcategory.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editSubcategory(subcategory)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteSubcategory(subcategory.id)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
