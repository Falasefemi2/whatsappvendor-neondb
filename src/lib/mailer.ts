import { Resend } from "resend"

const resend = new Resend(Bun.env.RESEND_API_KEY)

export const sendApprovalPendingEmail = async (
    name: string,
    email: string,
    slug: string
) => {
    const storeUrl = `${Bun.env.FRONTEND_URL}/stores/${slug}`

    await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: "🎉 Application Received — You're almost live!",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Hi ${name}, we've received your application!</h2>
                <p>Thank you for signing up as a vendor. Our team is reviewing your application and you'll hear back from us within <strong>24 hours</strong>.</p>
                <p>Once approved, your store will be live at:</p>
                <a href="${storeUrl}" style="
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #4F46E5;
                    color: white;
                    text-decoration: none;
                    border-radius: 6px;
                    margin: 16px 0;
                ">${storeUrl}</a>
                <p>In the meantime, sit tight — we'll notify you as soon as you're approved and ready to start posting products.</p>
                <hr />
                <p style="color: #888; font-size: 12px;">If you didn't create this account, ignore this email.</p>
            </div>
        `
    })
}


export const sendApprovalEmail = async (
    name: string,
    email: string,
    slug: string
) => {
    const storeUrl = `${Bun.env.FRONTEND_URL}/stores/${slug}`

    await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: "🎉 Your store has been approved!",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Congratulations ${name}! Your store is now live 🚀</h2>

        <p>Your vendor application has been reviewed and approved.</p>

        <p>Your store is now publicly available at:</p>

        <a href="${storeUrl}" style="
          display: inline-block;
          padding: 12px 24px;
          background-color: #16A34A;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin: 16px 0;
        ">
          Visit Your Store
        </a>

        <p>You can now log in to your dashboard and start adding products, managing inventory, and growing your store.</p>

        <p>If you have any questions, feel free to reach out to our support team.</p>

        <hr />

        <p style="color:#888;font-size:12px">
          Welcome to the marketplace and happy selling!
        </p>
      </div>
    `
    })
}
