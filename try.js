const http = require('http'); // 1. Load HTTP Module
const EventEmitter = require('events'); // 2. Load Events Module

const emitter = new EventEmitter(); // 3. Create an Instance of EventEmitter

// --- الـ Listener (اللي قاعد مستني الإشارة) ---
// بنقول للسيرفر: "أول ما تسمع تنبيه اسمه requestReceived، نفذ الـ function دي"
emitter.on('requestReceived', (url) => {
    console.log(`[Event Log]: Someone visited this path: ${url}`);
});

// --- الـ HTTP Server (المحرك الأساسي) ---
const server = http.createServer((req, res) => {
    if (req.url === '/') {
        // أول ما حد يطلب الصفحة الرئيسية، بنعمل Emit (إطلاق إشارة)
        emitter.emit('requestReceived', req.url); 
        
        res.write('Welcome to my Home Page! 🚀');
        res.end();
    }
});

// السيرفر نفسه بيبدأ يعمل "Listen" على بورت معين
server.listen(5000);
console.log('Server is running on port 5000...');