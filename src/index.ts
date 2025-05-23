import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

const app = new Hono();

app.get("/", (c) => c.text("ok"));

app.post("/email", async (c) => {
  const { raw } = await c.req.json();
  const [email, pass, refreshToken, clientId] = raw.split("|");
  const accessToken = await getAccessToken(refreshToken, clientId);

  const client = new ImapFlow({
    host: "outlook.office365.com",
    port: 993,
    secure: true,
    auth: {
      user: email,
      pass,
      accessToken,
    },
    logger: false,
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock("Junk");
    // const lock = await client.getMailboxLock("INBOX");
    try {
      const latestMessage = await client.fetchOne(
        (client.mailbox as any).exists,
        {
          source: true,
        },
      );

      if (!latestMessage?.source) {
        return c.json({ error: "No email found" }, 404);
      }

      const parsed = await simpleParser(latestMessage.source);

      // const emailData = {
      //   from: parsed.from?.text,
      //   date: parsed.date,
      //   subject: parsed.subject,
      //   text: parsed.text,
      //   code: getVerificationCodeFromMaildrop(parsed.subject ?? "") ?? "",
      // };
      const code = getVerificationCodeFromMaildrop(parsed.subject ?? "") ?? "";
      return c.json({ code });
    } finally {
      lock.release();
    }
  } catch (err) {
    return c.json({ error: "Failed to retrieve email", err }, 500);
  } finally {
    await client.logout();
  }
});

const getVerificationCodeFromMaildrop = (subject: string) => {
  const subjectMatch = subject.match(/Verification Code:\s*([0-9\-]+)/);
  if (subjectMatch?.[1]) {
    return subjectMatch[1];
  }

  return null;
};

export async function getAccessToken(
  refreshToken: string,
  clientId: string,
): Promise<string> {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    grant_type: "refresh_token",
  });

  const response = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  const { access_token } = await response.json();
  return access_token;
}

serve({
  fetch: app.fetch,
  port: 3333,
});

console.log("http://localhost:3333");
