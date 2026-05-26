import axios from "axios";

export const sendMail = async (emailData: {
  to: String;
  user: string;
  htmlBody: String;
  subject: string;
}) => {
  try {
    const response = await axios.post(
      "https://api.zeptomail.in/v1.1/email",
      {
        from: {
          address: "noreply@scalenevolve.com",
          name: "EVOLVE",
        },

        to: [
          {
            email_address: {
              address: emailData.to,
              name: emailData.user,
            },
          },
        ],

        subject: emailData.subject,

        htmlbody: emailData.htmlBody,
        track_clicks: true,
        track_opens: true,
        client_reference: "reference",
        mime_headers: {
          message: "value",
        },
      },
      {
        headers: {
          Accept: "application/json",

          "Content-Type": "application/json",

          Authorization: `Zoho-enczapikey ${process.env.ZP_API_KEY}`,
        },
      },
    );

    console.log(response.data);
  } catch (error: any) {
    console.error(error.response?.data || error.message);
  }
};
