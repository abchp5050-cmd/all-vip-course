const fs = require('fs');
const file = 'src/pages/Checkout.jsx';
let content = fs.readFileSync(file, 'utf8');

const useEffects = `  useEffect(() => {
    if (userProfile?.name || currentUser?.displayName) {
      setCustomerName(userProfile?.name || currentUser?.displayName || "")
    }
  }, [userProfile, currentUser])

  useEffect(() => {
    if (!currentUser) {
      navigate("/login")
      return
    }

    const tempItem = localStorage.getItem("tempCheckoutItem")
    if (tempItem) {
      try {
        setCartItems(JSON.parse(tempItem))
      } catch (error) {
        console.error("Error loading checkout items:", error)
        navigate("/courses")
      }
    } else {
      navigate("/courses")
    }
  }, [currentUser, navigate])

  useEffect(() => {
    // Scroll to enrollment section on load with offset for fixed header
    const element = document.getElementById('enrollment-section');
    if (element) {
      setTimeout(() => {
        const y = element.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);`;

content = content.replace('  const [copied, setCopied] = useState(null)', '  const [copied, setCopied] = useState(null)\n\n' + useEffects);

fs.writeFileSync(file, content);
