const auth = require('../middleware/auth'); 
const express = require('express');
const router = express.Router();

// Route محمي - لا يمكن دخوله بدون Token 🛡️
router.post('/', auth, async (req, res) => {
    try {
        // هنا المفروض يكون كود الحفظ في الداتابيز
        // بس عشان نخلص Phase 1، هنكتفي بالرد ده:
        res.send({
            message: "Authorization Successful! Phase 1 is done. ✅",
            user: req.user // البيانات اللي البواب فكها من الـ Token
        });
    } catch (ex) {
        res.status(500).send("Server Error");
    }
});

module.exports = router;