import nodemailer from 'nodemailer';
import type { ErrorGroup, Project } from '@prisma/client';

interface AlertContext {
  project: Pick<Project, 'name' | 'alertWebhookUrl' | 'alertEmail'>;
  group: Pick<ErrorGroup, 'id' | 'title' | 'message' | 'environment' | 'totalOccurrences'>;
  projectId: string;
}

function buildSlackPayload({ project, group, projectId }: AlertContext) {
  const dashboardUrl = `${process.env.DASHBOARD_ORIGIN ?? 'http://localhost:3000'}/projects/${projectId}`;
  return {
    text: `[${project.name}] New error: ${group.title}`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `New error in ${project.name}` },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Error*\n${group.title}` },
          { type: 'mrkdwn', text: `*Environment*\n${group.environment}` },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View in Mini Sentry' },
            url: `${dashboardUrl}/errors/${group.id}`,
          },
        ],
      },
    ],
  };
}

async function sendSlackAlert(webhookUrl: string, ctx: AlertContext): Promise<void> {
  const body = JSON.stringify(buildSlackPayload(ctx));
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  if (!res.ok) {
    throw new Error(`Slack webhook failed: ${res.status}`);
  }
}

async function sendEmailAlert(to: string, ctx: AlertContext): Promise<void> {
  const { project, group, projectId } = ctx;
  const smtpHost = process.env.SMTP_HOST;
  if (!smtpHost) return; // email silently skipped if SMTP not configured

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });

  const dashboardUrl = `${process.env.DASHBOARD_ORIGIN ?? 'http://localhost:3000'}/projects/${projectId}`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? 'Mini Sentry <noreply@mini-sentry.local>',
    to,
    subject: `[${project.name}] New error: ${group.title}`,
    html: `
      <h2>New error detected in <strong>${project.name}</strong></h2>
      <p><strong>Error:</strong> ${group.message}</p>
      <p><strong>Environment:</strong> ${group.environment}</p>
      <p><a href="${dashboardUrl}/errors/${group.id}">View in Mini Sentry →</a></p>
    `,
    text: [
      `New error in ${project.name}`,
      `Error: ${group.message}`,
      `Environment: ${group.environment}`,
      `View: ${dashboardUrl}/errors/${group.id}`,
    ].join('\n'),
  });
}

export async function sendNewGroupAlert(ctx: AlertContext): Promise<void> {
  const { project } = ctx;
  const tasks: Promise<void>[] = [];

  if (project.alertWebhookUrl) {
    tasks.push(
      sendSlackAlert(project.alertWebhookUrl, ctx).catch((err: unknown) => {
        console.error('[alerting] slack webhook failed', err);
      })
    );
  }

  if (project.alertEmail) {
    tasks.push(
      sendEmailAlert(project.alertEmail, ctx).catch((err: unknown) => {
        console.error('[alerting] email failed', err);
      })
    );
  }

  await Promise.all(tasks);
}
