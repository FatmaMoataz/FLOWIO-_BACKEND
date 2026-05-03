const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
  // 1. نجيب الـ Token من الـ Header
  const token = req.header('x-auth-token');
  
  // 2. لو مفيش Token، نرفض الدخول (401 Unauthorized)
  if (!token) return res.status(401).send('Access denied. No token provided.');

  try {
    // 3. نتأكد إن الـ Token سليم ومقري بالمفتاح السري بتاعنا
    const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
    
    // 4. نخزن بيانات اليوزر (اللي فكيناها من الـ Token) في الـ req عشان الـ Routes التانية تستخدمها
    req.user = decoded; 
    
    // 5. انقل للوظيفة اللي بعدي (الـ Route الأصلي)
    next();
  } catch (ex) {
    // 6. لو الـ Token غلط أو منتهي الصلاحية (400 Bad Request)
    res.status(400).send('Invalid token.');
  }
};