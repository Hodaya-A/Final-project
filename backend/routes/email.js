import express from "express";
import emailjs from "@emailjs/nodejs";

const router = express.Router();

// POST /api/send-order-email
router.post("/send-order-email", async (req, res) => {
  try {
    const { to, orderId, total, items } = req.body;

    if (!to) return res.status(400).json({ error: "Missing 'to' email" });

    // Read EmailJS config from env
    const serviceId = process.env.EMAILJS_SERVICE_ID;
    const templateId = process.env.EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      console.warn("⚠️ EmailJS not configured - missing env vars");
      return res
        .status(500)
        .json({ error: "EmailJS not configured on server" });
    }

    // Prepare items list for email
    const itemList = (items || [])
      .map((it) => `${it.name} (${it.quantity})`)
      .join(", ");

    // Send email using EmailJS
    const templateParams = {
      user_email: to,
      title: `הזמנה ${orderId || ""}`,
      order_items: itemList,
      order_total: `₪${Number(total || 0).toFixed(2)}`,
      order_date: new Date().toLocaleString("he-IL"),
    };

    console.log("📧 Sending email via EmailJS to:", to);

    const response = await emailjs.send(serviceId, templateId, templateParams, {
      publicKey: publicKey,
    });

    console.log("✅ Email sent successfully:", response.status, response.text);
    res.json({ success: true, status: response.status, text: response.text });
  } catch (err) {
    console.error("❌ Error sending order email:", err);
    res
      .status(500)
      .json({ error: "Error sending email", details: err.message });
  }
});

export default router;
