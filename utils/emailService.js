const sgMail = require('@sendgrid/mail');
const EmailTemplate = require('../models/EmailTemplate');

// Email templates are now fetched from the database (EmailTemplate model) if available.
// If not found, the service falls back to the hardcoded template in this file.
// Admins can manage templates via the /admin/email-templates API.

// Initialize SendGrid with API key
const initializeSendGrid = () => {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY environment variable is required');
  }
  sgMail.setApiKey(apiKey);
};

// Template variable replacement function
const replaceTemplateVariables = (template, variables) => {
  let result = template;
  
  // Handle {{#each}} loops first
  const eachRegex = /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
  result = result.replace(eachRegex, (match, arrayPath, templateContent) => {
    const keys = arrayPath.trim().split('.');
    let array = variables;
    
    for (const key of keys) {
      if (array && typeof array === 'object' && key in array) {
        array = array[key];
      } else {
        return match; // Return original if array not found
      }
    }
    
    if (!Array.isArray(array)) {
      return match; // Return original if not an array
    }
    
    // Process each item in the array
    return array.map(item => {
      let itemTemplate = templateContent;
      const itemRegex = /\{\{([^}]+)\}\}/g;
      
      return itemTemplate.replace(itemRegex, (itemMatch, variablePath) => {
        const itemKeys = variablePath.trim().split('.');
        let value = item;
        
        for (const key of itemKeys) {
          if (value && typeof value === 'object' && key in value) {
            value = value[key];
          } else {
            return itemMatch; // Return original if variable not found
          }
        }
        
        return value !== undefined ? value : itemMatch;
      });
    }).join('');
  });
  
  // Replace regular variables in the format {{variable}} or {{object.property}}
  const variableRegex = /\{\{([^}]+)\}\}/g;
  
  result = result.replace(variableRegex, (match, variablePath) => {
    const keys = variablePath.trim().split('.');
    let value = variables;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        // If variable not found, return the original placeholder
        return match;
      }
    }
    
    return value !== undefined ? value : match;
  });
  
  return result;
};

// Helper to get template from DB or fallback
async function getEmailTemplateOrDefault(type, defaultSubject, defaultHtml, defaultText) {
  try {
    const template = await EmailTemplate.findOne({ type, isActive: true });
    if (template) {
      return {
        subject: template.subject,
        html: template.html,
        text: template.text
      };
    }
  } catch (err) {
    console.error('Error fetching email template from DB:', err);
  }
  return { subject: defaultSubject, html: defaultHtml, text: defaultText };
}

// Send death verification notification to recipients
const sendDeathVerificationNotification = async (recipient, videoMessages, deceasedUser) => {
  try {
    initializeSendGrid();
    
    // Create video list for template
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

    // Create variables object for template replacement
    const templateVariables = {
      deceasedUser: {
        name: deceasedUser.name,
        email: deceasedUser.email
      },
      recipient: {
        full_name: recipient.full_name,
        email: recipient.email
      },
      videoList: videoList,
      videoMessages: videoMessages.map(video => ({
        title: video.title,
        description: video.description || 'No description provided',
        duration: `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}`,
        file_url: video.file_url
      }))
    };

    // Default templates (fallback)
    const defaultHtmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Important Message from {{deceasedUser.name}}</title>
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
          
          <p>Dear {{recipient.full_name}},</p>
          
          <p>We are writing to inform you that {{deceasedUser.name}} has passed away, and we have been authorized to share their video messages with you.</p>
          
          <p>These messages were recorded by {{deceasedUser.name}} and were intended to be shared with you at this time. We understand this may be a difficult moment, and we hope these messages provide comfort and closure.</p>
          
          <div class="video-section">
            <h2 style="color: #333;">Video Messages from {{deceasedUser.name}}</h2>
            {{videoList}}
          </div>
          
          <p>If you have any questions or need assistance accessing these messages, please don't hesitate to contact us.</p>
          
          <p>With deepest sympathy,<br>
          The Afternote Team</p>
          
          <div class="footer">
            <p>This message was sent to you because you were designated as a recipient of video messages from {{deceasedUser.name}}.</p>
            <p>If you believe you received this message in error, please contact us immediately.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const defaultTextContent = `
Important Message from {{deceasedUser.name}}

Dear {{recipient.full_name}},

We are writing to inform you that {{deceasedUser.name}} has passed away, and we have been authorized to share their video messages with you.

These messages were recorded by {{deceasedUser.name}} and were intended to be shared with you at this time. We understand this may be a difficult moment, and we hope these messages provide comfort and closure.

Video Messages from {{deceasedUser.name}}:
{{#each videoMessages}}
- {{title}}
  {{description}}
  Duration: {{duration}}
  Watch at: {{file_url}}
{{/each}}

If you have any questions or need assistance accessing these messages, please don't hesitate to contact us.

With deepest sympathy,
The Afternote Team

---
This message was sent to you because you were designated as a recipient of video messages from {{deceasedUser.name}}.
If you believe you received this message in error, please contact us immediately.
    `;

    // Fetch template from DB or fallback
    const template = await getEmailTemplateOrDefault(
      'death_verification_notification',
      `Important Message from {{deceasedUser.name}} - Afternote`,
      defaultHtmlContent,
      defaultTextContent
    );

    // Replace template variables
    const processedSubject = replaceTemplateVariables(template.subject, templateVariables);
    const processedHtml = replaceTemplateVariables(template.html, templateVariables);
    const processedText = replaceTemplateVariables(template.text, templateVariables);

    const msg = {
      to: recipient.email,
      from: process.env.SENDGRID_FROM_EMAIL || process.env.SENDGRID_VERIFIED_SENDER,
      subject: processedSubject,
      text: processedText,
      html: processedHtml
    };

    const result = await sgMail.send(msg);
    console.log(`Death verification notification sent to ${recipient.email}:`, result[0].statusCode);
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
    initializeSendGrid();
    
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

    const msg = {
      to: process.env.ADMIN_EMAIL || process.env.SENDGRID_FROM_EMAIL,
      from: process.env.SENDGRID_FROM_EMAIL || process.env.SENDGRID_VERIFIED_SENDER,
      subject: `New Contact Form Submission - ${contact.subject}`,
      text: textContent,
      html: htmlContent
    };

    const result = await sgMail.send(msg);
    console.log(`Contact notification sent to admin:`, result[0].statusCode);
    return result;
  } catch (error) {
    console.error(`Error sending contact notification:`, error);
    throw error;
  }
};

// Send response to contact form submitter
const sendContactResponse = async (contact, responseMessage) => {
  try {
    initializeSendGrid();
    
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

    const msg = {
      to: contact.email,
      from: process.env.SENDGRID_FROM_EMAIL || process.env.SENDGRID_VERIFIED_SENDER,
      subject: `Re: ${contact.subject} - Afternote Support`,
      text: textContent,
      html: htmlContent
    };

    const result = await sgMail.send(msg);
    console.log(`Contact response sent to ${contact.email}:`, result[0].statusCode);
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