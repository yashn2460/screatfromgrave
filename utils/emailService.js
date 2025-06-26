const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // Looking to send emails in production? Check out our Email API/SMTP product!
var transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "294b6d40e7440d",
    pass: "07eb78e1c6bdb6"
  }
});
  return transport;
};

// Send death verification notification to recipients
const sendDeathVerificationNotification = async (recipient, videoMessages, deceasedUser) => {
  try {
    const transporter = createTransporter();
    
    // Create HTML content for the email
    const videoList = videoMessages.map(video => `
      <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
        <h3 style="color: #333; margin: 0 0 10px 0;">${video.title}</h3>
        <p style="color: #666; margin: 5px 0;">${video.description || 'No description provided'}</p>
        <p style="color: #666; margin: 5px 0;">Duration: ${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}</p>
        <a href="${video.file_url}" style="display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">
          Watch Video Message
        </a>
      </div>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Important Message from ${deceasedUser.name}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
          .video-section { margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: #d32f2f; margin: 0;">Important Message</h1>
          </div>
          
          <p>Dear ${recipient.full_name},</p>
          
          <p>We are writing to inform you that ${deceasedUser.name} has passed away, and we have been authorized to share their video messages with you.</p>
          
          <p>These messages were recorded by ${deceasedUser.name} and were intended to be shared with you at this time. We understand this may be a difficult moment, and we hope these messages provide comfort and closure.</p>
          
          <div class="video-section">
            <h2 style="color: #333;">Video Messages from ${deceasedUser.name}</h2>
            ${videoList}
          </div>
          
          <p>If you have any questions or need assistance accessing these messages, please don't hesitate to contact us.</p>
          
          <p>With deepest sympathy,<br>
          The Afternote Team</p>
          
          <div class="footer">
            <p>This message was sent to you because you were designated as a recipient of video messages from ${deceasedUser.name}.</p>
            <p>If you believe you received this message in error, please contact us immediately.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Important Message from ${deceasedUser.name}

Dear ${recipient.full_name},

We are writing to inform you that ${deceasedUser.name} has passed away, and we have been authorized to share their video messages with you.

These messages were recorded by ${deceasedUser.name} and were intended to be shared with you at this time. We understand this may be a difficult moment, and we hope these messages provide comfort and closure.

Video Messages from ${deceasedUser.name}:
${videoMessages.map(video => `
- ${video.title}
  ${video.description || 'No description provided'}
  Duration: ${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}
  Watch at: ${video.file_url}
`).join('')}

If you have any questions or need assistance accessing these messages, please don't hesitate to contact us.

With deepest sympathy,
The Afternote Team

---
This message was sent to you because you were designated as a recipient of video messages from ${deceasedUser.name}.
If you believe you received this message in error, please contact us immediately.
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipient.email,
      subject: `Important Message from ${deceasedUser.name} - Afternote`,
      text: textContent,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Death verification notification sent to ${recipient.email}:`, result.messageId);
    return result;
  } catch (error) {
    console.error(`Error sending death verification notification to ${recipient.email}:`, error);
    throw error;
  }
};

// Send notification to all recipients of a user's video messages
const notifyAllRecipients = async (userId, deceasedUser) => {
  try {
    const VideoMessage = require('../models/VideoMessage');
    const Recipient = require('../models/Recipient');
    
    // Get all video messages for the user
    const videoMessages = await VideoMessage.find({ user_id: userId });
    
    if (videoMessages.length === 0) {
      console.log(`No video messages found for user ${userId}`);
      return;
    }

    // Get all unique recipients
    const recipientIds = [...new Set(videoMessages.flatMap(video => video.recipient_ids))];
    const recipients = await Recipient.find({ _id: { $in: recipientIds } });

    console.log(`Sending death verification notifications to ${recipients.length} recipients`);

    // Send notifications to all recipients
    const emailPromises = recipients.map(recipient => 
      sendDeathVerificationNotification(recipient, videoMessages, deceasedUser)
    );

    await Promise.allSettled(emailPromises);
    console.log(`Death verification notifications sent to all recipients for user ${userId}`);
  } catch (error) {
    console.error(`Error notifying recipients for user ${userId}:`, error);
    throw error;
  }
};

// Send notification to specific recipients
const notifySpecificRecipients = async (recipientIds, videoMessages, deceasedUser) => {
  try {
    const Recipient = require('../models/Recipient');
    
    const recipients = await Recipient.find({ _id: { $in: recipientIds } });
    
    console.log(`Sending death verification notifications to ${recipients.length} specific recipients`);

    const emailPromises = recipients.map(recipient => 
      sendDeathVerificationNotification(recipient, videoMessages, deceasedUser)
    );

    await Promise.allSettled(emailPromises);
    console.log(`Death verification notifications sent to specific recipients`);
  } catch (error) {
    console.error(`Error notifying specific recipients:`, error);
    throw error;
  }
};

// Send contact form notification to admin
const sendContactNotification = async (contact) => {
  try {
    const transporter = createTransporter();
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Contact Form Submission</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
          .contact-info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .message-box { border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">New Contact Form Submission</h1>
          </div>
          
          <div class="contact-info">
            <h3>Contact Information</h3>
            <p><strong>Name:</strong> ${contact.name}</p>
            <p><strong>Email:</strong> ${contact.email}</p>
            ${contact.phone ? `<p><strong>Phone:</strong> ${contact.phone}</p>` : ''}
            <p><strong>Category:</strong> ${contact.category}</p>
            <p><strong>Submitted:</strong> ${new Date(contact.createdAt).toLocaleString()}</p>
          </div>
          
          <div class="message-box">
            <h3>Message</h3>
            <p><strong>Subject:</strong> ${contact.subject}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${contact.message}</p>
          </div>
          
          <div class="footer">
            <p>This is an automated notification from the Afternote contact form.</p>
            <p>Contact ID: ${contact._id}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
New Contact Form Submission

Contact Information:
Name: ${contact.name}
Email: ${contact.email}
${contact.phone ? `Phone: ${contact.phone}` : ''}
Category: ${contact.category}
Submitted: ${new Date(contact.createdAt).toLocaleString()}

Message:
Subject: ${contact.subject}
Message: ${contact.message}

---
This is an automated notification from the Afternote contact form.
Contact ID: ${contact._id}
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
      subject: `New Contact Form Submission - ${contact.subject}`,
      text: textContent,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Contact notification sent to admin:`, result.messageId);
    return result;
  } catch (error) {
    console.error(`Error sending contact notification:`, error);
    throw error;
  }
};

// Send response to contact form submitter
const sendContactResponse = async (contact, responseMessage) => {
  try {
    const transporter = createTransporter();
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Response to your contact form submission</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #28a745; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
          .original-message { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .response-message { border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Response to your inquiry</h1>
          </div>
          
          <p>Dear ${contact.name},</p>
          
          <p>Thank you for contacting us. We have received your message and would like to provide you with a response.</p>
          
          <div class="original-message">
            <h3>Your original message:</h3>
            <p><strong>Subject:</strong> ${contact.subject}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${contact.message}</p>
          </div>
          
          <div class="response-message">
            <h3>Our response:</h3>
            <p style="white-space: pre-wrap;">${responseMessage}</p>
          </div>
          
          <p>If you have any further questions, please don't hesitate to contact us again.</p>
          
          <p>Best regards,<br>
          The Afternote Team</p>
          
          <div class="footer">
            <p>This is a response to your contact form submission from Afternote.</p>
            <p>Contact ID: ${contact._id}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Response to your inquiry

Dear ${contact.name},

Thank you for contacting us. We have received your message and would like to provide you with a response.

Your original message:
Subject: ${contact.subject}
Message: ${contact.message}

Our response:
${responseMessage}

If you have any further questions, please don't hesitate to contact us again.

Best regards,
The Afternote Team

---
This is a response to your contact form submission from Afternote.
Contact ID: ${contact._id}
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: contact.email,
      subject: `Re: ${contact.subject} - Afternote Support`,
      text: textContent,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Contact response sent to ${contact.email}:`, result.messageId);
    return result;
  } catch (error) {
    console.error(`Error sending contact response to ${contact.email}:`, error);
    throw error;
  }
};

module.exports = {
  sendDeathVerificationNotification,
  notifyAllRecipients,
  notifySpecificRecipients,
  sendContactNotification,
  sendContactResponse
}; 