import fs from 'fs';

let content = fs.readFileSync('src/components/SupportWidget.jsx', 'utf8');

// replace the main floating button
content = content.replace(
  /<motion\.button[\s\S]*?className="relative group flex items-center justify-center gap-1\.5 px-3 h-\[42px\] bg-gradient-to-r from-slate-900 to-\[#111827\] text-white rounded-full shadow-lg shadow-blue-500\/10 hover:shadow-xl border border-blue-500\/20 backdrop-blur-md w-auto min-w-\[140px\] max-w-\[150px\]"/,
  `<motion.button
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative group flex items-center justify-center h-12 w-12 sm:w-auto sm:px-4 sm:h-[42px] bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.3)] shadow-blue-500/30 border border-white/10 backdrop-blur-md"`
);

// fix inner icon/text
content = content.replace(
  /<div className="relative flex items-center gap-1\.5">[\s\S]*?<\/div>/,
  `<div className="relative flex items-center gap-2">
          {isOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <>
              <div className="relative flex-shrink-0">
                <MessageCircle className="w-5 h-5 sm:w-4 sm:h-4 text-white" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-blue-600 rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-blue-600 rounded-full" />
              </div>
              <span className="hidden sm:inline-block text-xs font-bold tracking-wide text-white">Chat</span>
            </>
          )}
        </div>`
);

// Adjust position to be right but not overlapping important footer (say, bottom-24)
content = content.replace(
  /className="fixed bottom-24 sm:bottom-12 right-4 sm:right-6 z-\[60\] flex flex-col items-end"/,
  'className="fixed bottom-[100px] sm:bottom-8 right-4 sm:right-6 z-[60] flex flex-col items-end"'
);

fs.writeFileSync('src/components/SupportWidget.jsx', content);
