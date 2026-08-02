import type { ApplicantInfo, DiscordConfig, ResearchResult } from "./types";

/**
 * Sends the generated report to a Discord channel using the Discord bot REST API.
 * Uses multipart/form-data so the PDF can be attached directly to the message,
 * per Discord's "Create Message" endpoint (POST /channels/{channel.id}/messages).
 */
export async function sendReportToDiscord(
  config: DiscordConfig,
  applicant: ApplicantInfo,
  result: ResearchResult,
  pdfBuffer: Buffer
): Promise<{ ok: boolean; error?: string }> {
  const { botToken, channelId } = config;
  if (!botToken || !channelId) {
    return { ok: false, error: "Missing Discord bot token or channel ID." };
  }

  const embed = {
    title: `New Company Research Report — ${result.company.name}`,
    color: 0xb5651d,
    fields: [
      { name: "Applicant", value: applicant.name || "Unknown", inline: true },
      { name: "Email", value: applicant.email || "Unknown", inline: true },
      {
        name: "Company Website",
        value: result.company.website || "Unknown",
        inline: false,
      },
      {
        name: "Competitors Found",
        value: String(result.competitors.length),
        inline: true,
      },
      { name: "AI Model", value: result.model, inline: true },
    ],
    timestamp: result.generatedAt,
  };

  const form = new FormData();
  form.append(
    "payload_json",
    JSON.stringify({
      embeds: [embed],
    })
  );
  const filename = `${result.company.name.replace(/[^a-z0-9]+/gi, "_")}_report.pdf`;
  form.append(
    "files[0]",
    new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" }),
    filename
  );

  const res = await fetch(
    `https://discord.com/api/v10/channels/${channelId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bot ${botToken}`,
      },
      body: form,
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, error: `Discord API error (${res.status}): ${body}` };
  }

  return { ok: true };
}
