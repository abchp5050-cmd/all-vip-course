const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/WebsiteSettings.jsx', 'utf8');

// Add paymentMethods to initial state
content = content.replace(
  'paymentInstructions: "Please pay to 018XXXXXXXX via bKash",',
  'paymentInstructions: "Please pay to 018XXXXXXXX via bKash",\n    paymentMethods: [],'
);

// Load paymentMethods in fetchSettings
content = content.replace(
  'settingsData.paymentInstructions = data.instructions || "Please pay to 018XXXXXXXX via bKash"',
  'settingsData.paymentInstructions = data.instructions || "Please pay to 018XXXXXXXX via bKash"\n            settingsData.paymentMethods = data.methods || []'
);

// Save paymentMethods in handleSave
content = content.replace(
  'instructions: settings.paymentInstructions,',
  'instructions: settings.paymentInstructions,\n        methods: settings.paymentMethods,'
);

// Add helper functions for payment methods
const helpers = `
  const addPaymentMethod = () => {
    setSettings(prev => ({
      ...prev,
      paymentMethods: [...prev.paymentMethods, { id: Date.now().toString(), provider: "bKash", number: "", type: "Personal", isActive: true }]
    }))
  }

  const updatePaymentMethod = (index, field, value) => {
    const newMethods = [...settings.paymentMethods]
    newMethods[index][field] = value
    setSettings({ ...settings, paymentMethods: newMethods })
  }

  const removePaymentMethod = (index) => {
    const newMethods = settings.paymentMethods.filter((_, i) => i !== index)
    setSettings({ ...settings, paymentMethods: newMethods })
  }

  const handleSave = async () => {
`;
content = content.replace('const handleSave = async () => {', helpers);

// Inject UI for Payment Methods
const paymentUI = `
        {/* Payment Settings */}
        <div className="border-t border-border pt-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-indigo-500" />
              Payment Methods
            </h2>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900 border border-border rounded-xl p-4 mb-6">
            {settings.paymentMethods.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Smartphone className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p>No payment methods added yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {settings.paymentMethods.map((method, index) => (
                  <div key={method.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white dark:bg-slate-950 p-4 rounded-lg border border-border shadow-sm relative">
                    <GripVertical className="hidden sm:block w-5 h-5 text-muted-foreground cursor-grab shrink-0" />
                    
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3 w-full">
                      <select
                        value={method.provider}
                        onChange={(e) => updatePaymentMethod(index, 'provider', e.target.value)}
                        className="bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                      >
                        <option value="bKash">bKash</option>
                        <option value="Nagad">Nagad</option>
                        <option value="Rocket">Rocket</option>
                        <option value="Upay">Upay</option>
                        <option value="Bank">Bank Account</option>
                      </select>

                      <input
                        type="text"
                        value={method.number}
                        onChange={(e) => updatePaymentMethod(index, 'number', e.target.value)}
                        placeholder="Account Number"
                        className="sm:col-span-1 bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                      />

                      <select
                        value={method.type}
                        onChange={(e) => updatePaymentMethod(index, 'type', e.target.value)}
                        className="bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                      >
                        <option value="Personal">Personal</option>
                        <option value="Merchant">Merchant</option>
                        <option value="Agent">Agent</option>
                      </select>

                      <div className="flex items-center gap-2">
                         <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={method.isActive}
                            onChange={(e) => updatePaymentMethod(index, 'isActive', e.target.checked)}
                          />
                          <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                        <span className="text-xs text-muted-foreground">{method.isActive ? 'Active' : 'Disabled'}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => removePaymentMethod(index)}
                      className="absolute top-2 right-2 sm:relative sm:top-0 sm:right-0 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <button
              onClick={addPaymentMethod}
              className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Payment Method
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Checkout Payment Instructions</label>
            <textarea
              value={settings.paymentInstructions}
              onChange={(e) => setSettings({ ...settings, paymentInstructions: e.target.value })}
              rows={3}
              placeholder="Enter instructions for checkout page..."
              className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary smooth-transition resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              These instructions will be displayed below the payment methods on the checkout page.
            </p>
          </div>
        </div>
`;

content = content.replace(/\{\/\* Payment Settings \*\/\}.*?(?=\{\/\* Save Button \*\/})/s, paymentUI);

fs.writeFileSync('src/pages/admin/WebsiteSettings.jsx', content);
