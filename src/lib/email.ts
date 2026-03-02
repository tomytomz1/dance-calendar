import { Resend } from "resend";

const getResend = () => {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
};

const FROM_EMAIL = process.env.EMAIL_FROM || "Dance Calendar <noreply@example.com>";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  const resend = getResend();
  
  if (!resend) {
    console.log("Email would be sent:", options);
    return { success: true, messageId: "dev-mode" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      console.error("Email error:", error);
      return { success: false, error };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("Email error:", error);
    return { success: false, error };
  }
}

export function generateWelcomeEmail(name: string, isOrganizer: boolean) {
  const subject = isOrganizer
    ? "Welcome to Dance Calendar - Organizer Registration"
    : "Welcome to Dance Calendar!";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #8b5cf6; margin-bottom: 10px;">Dance Calendar</h1>
        </div>
        
        <h2>Welcome, ${name}!</h2>
        
        ${
          isOrganizer
            ? `
          <p>Thank you for registering as an event organizer on Dance Calendar!</p>
          <p>Your account is currently pending approval. Once an admin reviews and approves your account, you'll be able to:</p>
          <ul>
            <li>Create and manage dance events</li>
            <li>Reach dancers in your community</li>
            <li>Track event attendance</li>
          </ul>
          <p>We'll notify you once your account is approved.</p>
        `
            : `
          <p>Thank you for joining Dance Calendar!</p>
          <p>You can now:</p>
          <ul>
            <li>Browse dance events in your area</li>
            <li>Subscribe to notifications for your favorite dance styles</li>
            <li>Never miss a dance event again!</li>
          </ul>
        `
        }
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
          <p>Dance Calendar - Find your rhythm</p>
        </div>
      </body>
    </html>
  `;

  return { subject, html };
}

export function generateNewEventEmail(
  eventTitle: string,
  eventDate: string,
  eventTime: string,
  venue: string,
  city: string,
  danceStyles: string[],
  eventUrl: string
) {
  const subject = `New Dance Event: ${eventTitle}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #8b5cf6; margin-bottom: 10px;">Dance Calendar</h1>
        </div>
        
        <h2>New Event Alert!</h2>
        
        <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #8b5cf6;">${eventTitle}</h3>
          <p><strong>Date:</strong> ${eventDate}</p>
          <p><strong>Time:</strong> ${eventTime}</p>
          <p><strong>Venue:</strong> ${venue}</p>
          <p><strong>City:</strong> ${city}</p>
          <p><strong>Styles:</strong> ${danceStyles.join(", ")}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${eventUrl}" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            View Event Details
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
          <p>You're receiving this because you subscribed to dance event notifications.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe" style="color: #8b5cf6;">Unsubscribe</a></p>
        </div>
      </body>
    </html>
  `;

  return { subject, html };
}

export function generateEventReminderEmail(
  eventTitle: string,
  eventDate: string,
  eventTime: string,
  venue: string,
  address: string,
  eventUrl: string
) {
  const subject = `Reminder: ${eventTitle} is tomorrow!`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #8b5cf6; margin-bottom: 10px;">Dance Calendar</h1>
        </div>
        
        <h2>Event Reminder</h2>
        
        <p>Don't forget! You have an upcoming dance event:</p>
        
        <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #8b5cf6;">${eventTitle}</h3>
          <p><strong>Date:</strong> ${eventDate}</p>
          <p><strong>Time:</strong> ${eventTime}</p>
          <p><strong>Venue:</strong> ${venue}</p>
          <p><strong>Address:</strong> ${address}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${eventUrl}" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            View Event
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
          <p>Dance Calendar - Find your rhythm</p>
        </div>
      </body>
    </html>
  `;

  return { subject, html };
}
