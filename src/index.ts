import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

const app = new Hono();

app.get("/email", async (c) => {
  const client = new ImapFlow({
    host: "outlook.office365.com",
    port: 993,
    secure: true,
    auth: {
      user: "RollandeNoonanjanuary832@outlook.com",
      pass: "6DxjdaIsy388",
      accessToken:
        "EwA4BOl3BAAUcDnR9grBJokeAHaUV8R3+rVHX+IAASts221JkRORbpp115EU4Sc1SQ/3nsCRXc6TPlAKYbXfcG9HGfmLZkfj/uP5mKHMtwSTD5ZltETjbtfIsYhlluG3wtaUAuPjhlhfOnNkQH+d1mBsCcCqa1FuQUbTd1neabIJ3gxvvfG9JC0nH+f8it842EtFNOd/4YDdI8JZdfrfqonHdjBDa6JCkGWT1C8taQGZlhh29ITLFbkB5YQF01E+Bj7M5RpYyqc0akcoo+4DfSSIHIJaasJ0oUsfBG+8XaBZyvTOVqVb3MRgIwuUUjI22Pqg8nGF1akN2J33Ky1VmKD2hGe+yDVYHCWIFi5v6LxCN2k0/5LxLUF3qiSJnhYQZgAAEDddsd9B9OxMkjEVD/Sf0QgAA1Moos/9x+QSW0CNzim4TogPHmj6MxQH5qrCuwoFpjPXotobu9S1aWZJeDM9oqHmTfocWCyBE0hejM4IR2C/iTkvSyJD/14EPxgCLlGZUum7gvvzgnQPr1gd1mug5nWqDTbbjw9DVZKClnVC6GgB8p7FZPyJ1lyIX4tXTdWziRjKoUiYO970YV4kni5HFfopmv9Kpw4jCHFJNsWk7p4E4Ia71n4taIjY7BH8xgYFqRSvNJUt8ZMCtAP5QflH3IR3XExPxoFOaV3t7QW0Dy0vpxu2IeqXJ9E7AkmbXRKCM2NJVaEsdlNVSsYBXTh+JpfPjj2kQ7m2S9hwYQXLcOqpaoJP+0zHRL/0RktsfQroLwm6tz+RrZdHQy2fPL36GdZWsmMhYk/Tv7jo5WjH/8NYPzIK3crxadHjW7Pt26p7eH/vXOW5/n3TMHIcuItUGZpRBFb7wsc6MNBn/fRaWLlzHm3zfih/2mIxljV3i7oUkTNEop5MerDkaayK7tEy0J/ky2kErRR6ClNxIBRCYtYmamOqPKDwvHlRbAJ4GjndmA+EDJUzN2OUBg4iDCaOlszzOug5uKJtDYCiAklkDjhiSzyTxQ+SssFpm97wjXywPb5xS3kZ976RNz9EiSrxzA8rpj1qUKLzRZhBI9t2bxK9JQMNeP3Wl5d16lUNjixTPVfywEZLk7C7yM+H2YbP+eZAJ+D0r/mfJo22jqXwMCPHxoAEccA3DKHNX8eOeWq4uhqV5goAyK9sjzr0iw3dJGzy2G07tMwFTWDs3fWcLsnS3TG5lq6ik2kxu+jQFfXRsmCbLseU3cSLOM0ZeBAL0FK9z3IG4YOHewy2K0r9OY0zTRwI6nPDEHTz8Eg9V7FmQA2cmXn6AjYpIZq9i2byLkhiP9Sk1kePBRwwz2ocCd8zUvcHGNGjj76iiIs1mzI6iPFdkwkI0IMjbQbVIYDrTax6SuH//TI6MnEdnJMaS9qmTpt46+QGiDN5pefs+L0hjfP9icsXahycH90BV0R4y7kI60ED",
    },
    logger: false,
  });

  try {
    await client.connect();

    const lock = await client.getMailboxLock("Junk");
    try {
      const latestMessage = await client.fetchOne(
        (client.mailbox as any).exists,
        {
          source: true,
        }
      );

      if (!latestMessage?.source) {
        return c.json({ error: "No email found" }, 404);
      }

      const parsed = await simpleParser(latestMessage.source);

      const emailData = {
        from: parsed.from?.text,
        date: parsed.date,
        subject: parsed.subject,
        text: parsed.text,
      };

      return c.json(emailData);
    } finally {
      lock.release();
    }
  } catch (err) {
    return c.json({ error: "Failed to retrieve email" }, 500);
  } finally {
    await client.logout();
  }
});

serve(app);
