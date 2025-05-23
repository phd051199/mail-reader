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
        "EwA4BOl3BAAUcDnR9grBJokeAHaUV8R3+rVHX+IAAUE3SXZcs3PKXdT56ldibgyIF1RqXfKS9vMuhoqYljO4+EPXh1Fqtk05QiREwxFWeBq9g69V2Yoch15XsVc7bsmARvIBvAUuD91NiCjcEyhHu4lJWFFz/k4TUv+eT/HbxPvtTFWlBTEC8vt3rgVLY6xp0gr2rOz6rKG4DXohyO2YAYTSEzpj0Hk7Huo9h59cu0I4SiKTUUyZFYY14XYfx6L3IQqleWgfJKmN/Pj6bQAfJe2vsOHVdAtTIucJuTB00+SlhaWr7pgo0n4KbcoL1JxS+khBP64WZf6SQdCF+TJUinZnBytjYITZMp7zR5MDI4fnmaWS/Hg3KI34oY4MM5kQZgAAEAdxXb+mgipyilz4PlrfDjEAA68aNasjWHeVlNOaAXtGJioDqjm0Aqw58MZnuuFVQOe4wYZf5Ui0FIfp00l3IkQj5zZdo2JCAYz4fY9rCFBMEcaosJvhFo66k8G7HIOu/+F/JcX0xioC2D0WqpC2Be3lE0yXYo6gLkNPrQE+MaFjlDsE60UWo/aPPiplj+aDSZQIaE0NpRKmQYKxToVSeNS4uKrClqBD+pp0xvXd1LUJuVP/kmyzvXc4k11C2YYx2lYb5Hql3T3cpdIyc3ApVV0X1f4YXtNfJhg/5hmVr9NMNGe4Kq8pHDBJv8twePDo8xJIll315yFfFv8018l92ZpW7GcvxmatQ74R2YJI9YGrUQmTskIPWUjsveV6UksQt2Ma/oFZ1v+z6hhthysr15ZP40CN61MmRhg+lgdrDRwgX/D54nskiSFbNH+hRQ1FETSxXadrwBV6PPo40GqsRwQ/1RRW7XTIa1xiwxeNPy5Z//m07m/5/gN5pltLDPQNdM+31lTviVNxbAyc0pYwmX8ry5tIyGafP0NFeMFQSgj8WWiF+lFfJpgAkZv0Y1v5KoD4I28KpCVi4T9j6h7CwQhxVUGazLxongkIHbvU/pQ2kHb9fZrFY0GW89JPi4LPZovpUhlfVehlO5GPFMW1n4wnKGjvqb+wlwzNkOlIos5DNFwFKPUYiIHJdZdbFFjHZqPasNRyUwFYLJw6pkR/FvGGmqa0z9wtYPa+dODaVIO54HigE8v9UdZC+hfe53yLsb6K17HymMn48dZPrC4EO7bXRzdVTN7+JVv4oF4uuq+WqRCpX0rCEEmo4J/qVC0F4TLJDb/SQlWcDHg+e3TqzjlinnU4W+dLwpmq5C41Pmk5o57gdWFHbHcIVUk+48Sm8ZceHpmiB2LC6740W6LgdXDLRqF/XG+2rMcNfeS1OVPXCSnVt4/FGUnKOtzYurvsRi7OEi7+6jHo3wvUN3dpvZmh12Nq1rRuDHeqCmT4b8dxZ3jR64DFzjb0+bZ0hJVOCjdOAcyth3Z1tOI+T5cm/VVNgkED",
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
        code: getVerificationCodeFromMaildrop(parsed.subject ?? "")
      };

      return c.json(emailData);
    } finally {
      lock.release();
    }
  } catch (err) {
    return c.json({ error: "Failed to retrieve email", err }, 500);
  } finally {
    await client.logout();
  }
});

const getVerificationCodeFromMaildrop =  (
  subject: string,
) => {
  const subjectMatch = subject.match(
    /Verification Code:\s*([0-9\-]+)/
  );
  if (subjectMatch?.[1]) {
    return subjectMatch[1];
  }

  return null;
};

serve(app);
