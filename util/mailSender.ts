import { SendMailClient } from "zeptomail";

export const sendMail = async (emailData: {
  to: string;
  userName: string;
  htmlBody: string;
  subject: string;
}) => {
  let client = new SendMailClient({
    url: process.env.ZEPTO_URL!,
    token: process.env.ZEPTO_TOKEN!,
  });

  client
    .sendMail({
      from: {
        address: "noreply@scalenevolve.com",
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
    })
    .then((resp) => console.log("success"))
    .catch((error) => console.log("error"));
};
