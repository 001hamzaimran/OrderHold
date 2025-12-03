import transporter from "./Email.js";

const sendEditEmail = async (email, shop, OrderId) => {
    try {
        await transporter.sendMail({
            from: `"OrderHold" <${process.env.Email_Sender}>`,
            to: email,
            subject: "Thank You for Your Order — Edit or Add Upsell Items",
            text: "Thank you for your order! Click the link to edit or add upsell products.",
            html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        @media only screen and (max-width: 620px) {
          .container {
            width: 100% !important;
            padding: 20px !important;
          }
          .header, .content, .footer {
            padding-left: 20px !important;
            padding-right: 20px !important;
          }
          h1 { font-size: 22px !important; }
          h2 { font-size: 18px !important; }
          p { font-size: 14px !important; }
          .cta-button {
            display: block !important;
            width: 100% !important;
          }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f5fa; font-family: 'Segoe UI', Roboto, sans-serif; color: #2b2d42;">
      <div class="container" style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 14px; box-shadow: 0 8px 20px rgba(0,0,0,0.05); overflow: hidden; width: 100%;">

        <!-- Header -->
        <div class="header" style="background: linear-gradient(90deg, #4a00e0, #8e2de2); padding: 28px 32px; color: #ffffff; text-align: center;">
          <h1 style="margin: 0; font-size: 26px; letter-spacing: 1px;">Thank You for Your Order</h1>
          <p style="margin-top: 8px; font-size: 16px; opacity: 0.9;">You can still edit your order!</p>
        </div>

        <!-- Content -->
        <div class="content" style="padding: 36px 32px;">
          <h2 style="font-size: 22px; color: #4a00e0; margin-bottom: 16px;">Want to Add More Items? 🚀</h2>

          <p style="font-size: 16px; line-height: 1.6;">
            You’ve successfully placed your order. If you wish to <strong>edit your order</strong> or 
            <strong>add upsell products</strong>, simply click the link below:
          </p>

          <p style="font-size: 16px; margin-top: 20px; word-wrap: break-word;">
            <a href="https://${shop}?OrderId=${OrderId}" style="color: #8e2de2; font-weight: bold; text-decoration: none;">
              https://${shop}?OrderId=${OrderId}
            </a>
          </p>

          <div style="margin-top: 32px; text-align: center;">
            <a 
              href="https://${shop}?OrderId=${OrderId}"
              target="_blank"
              class="cta-button"
              style="
                display: inline-block; 
                background-color: #8e2de2; 
                color: #fff; 
                padding: 14px 28px; 
                border-radius: 6px; 
                text-decoration: none; 
                font-weight: 600; 
                font-size: 16px; 
                box-shadow: 0 4px 10px rgba(142, 45, 226, 0.2); 
                transition: 0.3s ease;
              "
            >
              Edit Your Order / Add Upsell Items
            </a>
          </div>

          <p style="font-size: 15px; line-height: 1.5; color: #555; margin-top: 25px;">
            If you have questions, just reply to this email — we're always here to help.
          </p>
        </div>

        <!-- Footer -->
        <div class="footer" style="background-color: #f0e6ff; padding: 18px 32px; text-align: center; font-size: 12px; color: #666;">
          &copy; ${new Date().getFullYear()} OrderHold. All rights reserved.<br/>
          Want to stop receiving emails? <a href="#" style="color: #4a00e0; text-decoration: underline;">Unsubscribe</a>
        </div>
      </div>
    </body>
    </html>
  `
        });

        return { success: true };
    } catch (error) {
        console.log("Email error", error);
        return {
            success: false,
            message: "Email not sent",
            error,
        };
    }
};

export default sendEditEmail;
