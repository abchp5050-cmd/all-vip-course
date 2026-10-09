const fs = require('fs');

let content = fs.readFileSync('src/pages/Checkout.jsx', 'utf8');

// Update imports
content = content.replace(
  'import { collection, addDoc, serverTimestamp } from "firebase/firestore"',
  'import { collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore"'
);

// Add state for paymentMethods and instructions
content = content.replace(
  'const [cartItems, setCartItems] = useState([])',
  'const [cartItems, setCartItems] = useState([])\n  const [paymentMethods, setPaymentMethods] = useState([])\n  const [paymentInstructions, setPaymentInstructions] = useState("")'
);

// Add useEffect to load payment methods
const useEffectCode = `
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const paymentSettingsRef = query(collection(db, "settings"), where("type", "==", "payment"))
        const snapshot = await getDocs(paymentSettingsRef)
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data()
          setPaymentInstructions(data.instructions || "")
          // Filter to only active methods
          const activeMethods = (data.methods || []).filter(m => m.isActive)
          
          if (activeMethods.length === 0) {
            // Fallback if none configured
            setPaymentMethods([
              { id: "1", provider: "bKash", number: "01831952349", type: "Personal" },
              { id: "2", provider: "Nagad", number: "01831952349", type: "Personal" }
            ])
          } else {
            setPaymentMethods(activeMethods)
          }
        } else {
          // Fallback if no doc exists
          setPaymentMethods([
            { id: "1", provider: "bKash", number: "01831952349", type: "Personal" },
            { id: "2", provider: "Nagad", number: "01831952349", type: "Personal" }
          ])
        }
      } catch (error) {
        console.error("Error fetching payment settings:", error)
        // Fallback
        setPaymentMethods([
          { id: "1", provider: "bKash", number: "01831952349", type: "Personal" },
          { id: "2", provider: "Nagad", number: "01831952349", type: "Personal" }
        ])
      }
    }
    fetchPaymentSettings()
  }, [])
`;

content = content.replace(
  'const getTotal = () => {',
  useEffectCode + '\n  const getTotal = () => {'
);

// Helper function to get theme colors per provider
const colorHelper = `
  const getProviderTheme = (provider) => {
    const p = provider.toLowerCase()
    if (p.includes('bkash')) return { bg: '#E2136E', text: 'text-white', border: 'border-[#E2136E]', name: 'বিকাশ' }
    if (p.includes('nagad')) return { bg: '#F7931E', text: 'text-white', border: 'border-[#F7931E]', name: 'নগদ' }
    if (p.includes('rocket')) return { bg: '#8C1590', text: 'text-white', border: 'border-[#8C1590]', name: 'রকেট' }
    if (p.includes('upay')) return { bg: '#FDE300', text: 'text-black', border: 'border-[#FDE300]', name: 'উপায়' }
    return { bg: '#3b82f6', text: 'text-white', border: 'border-blue-500', name: provider }
  }

  const subtotal = getTotal()
`;

content = content.replace('const subtotal = getTotal()', colorHelper);

// Replace the hardcoded payment methods block
const paymentMethodsUI = `
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 mb-6 lg:mb-8">
                {paymentMethods.map((method) => {
                  const theme = getProviderTheme(method.provider)
                  return (
                    <div key={method.id} className={\`relative overflow-hidden rounded-2xl bg-gradient-to-br from-[\${theme.bg}]/10 to-transparent border border-[\${theme.bg}]/20 p-4 lg:p-5 group hover:border-[\${theme.bg}]/50 transition-colors\`}>
                      <div className="flex items-center gap-3 mb-3 lg:mb-4">
                        <div className={\`w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-[\${theme.bg}] flex items-center justify-center shadow-lg shrink-0\`}>
                          <span className={\`\${theme.text} font-bold text-[10px] lg:text-xs\`}>{method.provider}</span>
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-[13px] lg:text-sm leading-tight">{theme.name} ({method.type})</h3>
                          <p className="text-[11px] lg:text-xs text-slate-400 mt-0.5">
                            {method.type === 'Merchant' ? 'পেমেন্ট (Payment)' : 'সেন্ড মানি/ক্যাশ ইন'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-slate-950/50 p-2.5 lg:p-3 rounded-xl border border-slate-800">
                        <span className="text-base lg:text-lg font-mono font-bold text-white tracking-widest">{method.number}</span>
                        <button 
                          type="button"
                          onClick={() => handleCopy(method.number)}
                          className="p-1.5 lg:p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors group-hover:text-white"
                          title="Copy Number"
                        >
                          {copied === method.number ? <CheckCircle2 className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 lg:w-4 lg:h-4" />}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
`;

content = content.replace(
  /<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 mb-6 lg:mb-8">.*?<\/div>\s*<\/div>\s*<form/s,
  paymentMethodsUI + '\n              </div>\n              <form'
);

// Add payment instructions if they exist
content = content.replace(
  '<form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">',
  `{paymentInstructions && (
                <div className="p-3 lg:p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 text-xs lg:text-sm text-slate-400 mb-6 whitespace-pre-wrap">
                  {paymentInstructions}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">`
);

fs.writeFileSync('src/pages/Checkout.jsx', content);
