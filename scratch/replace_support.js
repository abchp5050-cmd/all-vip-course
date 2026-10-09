const fs = require('fs');

let content = fs.readFileSync('src/components/SupportWidget.jsx', 'utf8');

content = content.replace(
  /className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-\[60\] flex flex-col items-end"/,
  'className="fixed bottom-24 sm:bottom-12 right-4 sm:right-6 z-[60] flex flex-col items-end"'
);

content = content.replace(
  /<motion\.button[\s\S]*?className="relative group flex items-center justify-center gap-1\.5 sm:gap-2 px-4 sm:px-5 h-\[52px\] bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full shadow-lg shadow-blue-500\/20 hover:shadow-xl hover:shadow-blue-500\/30 border border-white\/20 backdrop-blur-md w-auto min-w-\[200px\] max-w-\[200px\]"/,
  `<motion.button
        animate={{ boxShadow: ["0px 0px 0px 0px rgba(59,130,246,0.4)", "0px 0px 20px 4px rgba(59,130,246,0)", "0px 0px 0px 0px rgba(59,130,246,0)"] }}
        transition={{ duration: 2, repeat: Infinity }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative group flex items-center justify-center gap-1.5 px-3 sm:px-4 h-[40px] bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 text-white rounded-full shadow-lg hover:shadow-xl backdrop-blur-md w-auto min-w-[140px] max-w-[160px]"`
);

content = content.replace(
  /<span className="text-\[13px\] sm:text-sm font-bold tracking-wide whitespace-nowrap">Chat With Admin<\/span>/,
  `<span className="text-xs font-semibold tracking-wide whitespace-nowrap text-blue-400">Support Chat</span>`
);

fs.writeFileSync('src/components/SupportWidget.jsx', content);
