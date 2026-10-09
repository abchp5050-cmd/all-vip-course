import fs from 'fs';

let content = fs.readFileSync('src/components/SupportWidget.jsx', 'utf8');

// I'll replace everything from '{/* Main Floating Button */}' to the end.
const splitText = '{/* Main Floating Button */}';
const parts = content.split(splitText);

if (parts.length === 2) {
  const newButton = \`{/* Main Floating Button */}
      <motion.button
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative group flex items-center justify-center h-12 w-12 sm:w-auto sm:px-4 sm:h-[42px] bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.3)] shadow-blue-500/30 border border-white/10 backdrop-blur-md"
      >
        <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-pulse pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative flex items-center gap-2">
          {isOpen ? (
            <X className="w-5 h-5 sm:w-4 sm:h-4" />
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
        </div>
      </motion.button>
    </div>
  )
}
\`;

  let newContent = parts[0] + newButton;

  // Also replace position
  newContent = newContent.replace(
    /className="fixed bottom-24 sm:bottom-12 right-4 sm:right-6 z-\[60\] flex flex-col items-end"/,
    'className="fixed bottom-[100px] sm:bottom-8 right-4 sm:right-6 z-[60] flex flex-col items-end"'
  );
  // Also check original position in case git checkout restored it
  newContent = newContent.replace(
    /className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-\[60\] flex flex-col items-end"/,
    'className="fixed bottom-[100px] sm:bottom-8 right-4 sm:right-6 z-[60] flex flex-col items-end"'
  );

  fs.writeFileSync('src/components/SupportWidget.jsx', newContent);
} else {
  console.log("Could not split by Main Floating Button text");
}
