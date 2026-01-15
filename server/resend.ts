
import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email};
}

export async function getUncachableResendClient() {
  const credentials = await getCredentials();
  return {
    client: new Resend(credentials.apiKey),
    fromEmail: credentials.fromEmail
  };
}

export async function sendSimulationReport(email: string, report: { name: string, score: number, feedback: any, transcript: any[] }) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const transcriptHtml = report.transcript.map(t => `
      <p><strong>${t.role === 'user' ? 'Rep' : 'Dr. Hayes'}:</strong> ${t.content}</p>
    `).join('');

    const feedbackHtml = `
      <h3>Total Score: ${report.score}/100</h3>
      <h4>Strengths:</h4>
      <ul>${report.feedback.strengths.map((s: string) => `<li>${s}</li>`).join('')}</ul>
      <h4>Improvements:</h4>
      <ul>${report.feedback.improvements.map((i: string) => `<li>${i}</li>`).join('')}</ul>
      ${report.feedback.incorrectClaims?.length ? `<h4>Accuracy Alerts:</h4><ul>${report.feedback.incorrectClaims.map((c: string) => `<li>${c}</li>`).join('')}</ul>` : ''}
    `;

    await client.emails.send({
      from: fromEmail || 'onboarding@resend.dev',
      to: email,
      subject: `Simulation Report: ${report.name} (${report.score}%)`,
      html: `
        <h1>Universal Cone Challenge Simulation Report</h1>
        <p><strong>User:</strong> ${report.name}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        <hr />
        ${feedbackHtml}
        <hr />
        <h3>Full Transcript:</h3>
        ${transcriptHtml}
      `
    });
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}
