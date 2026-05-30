import { SendMailClient } from "zeptomail";

export const sendMail = async (emailData: {
  to: string;
  userName: string;
  htmlBody: string;
  subject: string;
}) => {
  try {
    const client = new SendMailClient({
      url: process.env.ZEPTO_URL!,
      token: process.env.ZEPTO_TOKEN!,
    });

    const resp = await client.sendMail({
      from: {
        address: process.env.MAIL_FROM!,
        name: "noreply",
      },
      to: [
        {
          email_address: {
            address: emailData.to,
            name: emailData.userName,
          },
        },
      ],
      subject: emailData.subject,
      htmlbody: emailData.htmlBody,
    });

    console.log("Mail success", resp);

    return resp;
  } catch (error) {
    console.error("Mail failed", error);
    throw error;
  }
};
