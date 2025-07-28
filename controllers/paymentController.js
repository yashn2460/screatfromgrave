const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const User = require('../models/User');
const Recipient = require('../models/Recipient');

/**
 * Create a payment intent for the one-time service charge
 * @route POST /api/payments/create-payment-intent
 * @access Private
 */
const createPaymentIntent = async (req, res) => {
  try {
    const { id } = req.user; // From JWT token
    const { paymentMethod, recipientId, recipientName, amount, currency } = req.body;

    if (!paymentMethod || !recipientId || !recipientName) {
      return res.status(400).json({
        success: false,
        message: 'Payment method, recipientId, and recipientName are required'
      });
    }

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if recipient exists and belongs to the user
    const recipient = await Recipient.findOne({ _id: recipientId, user_id: id });
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found or does not belong to user'
      });
    }

    // Check if payment is already completed for this recipient
    if (recipient.paymentCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed for this recipient'
      });
    }

    // Check if there's already a pending or succeeded payment for this recipient
    const existingPayment = await Payment.findOne({
      recipientId: recipientId,
      status: { $in: ['pending', 'succeeded'] }
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Payment already exists for this recipient'
      });
    }

    // Use provided amount and currency or defaults
    const paymentAmount = amount || 17900;
    const paymentCurrency = currency || 'gbp';

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: paymentAmount,
      currency: paymentCurrency,
      payment_method: paymentMethod,
      confirm: true,
      return_url: process.env.STRIPE_RETURN_URL || 'http://localhost:3000/payment-success',
      metadata: {
        userId: id,
        recipientId: recipientId,
        recipientName: recipientName,
        service: 'afternote-one-time'
      },
      description: `Afternote Service - One-time charge for ${recipientName}`
    });

    // Save payment record to database
    const payment = new Payment({
      userId: id,
      recipientId: recipientId,
      recipientName: recipientName,
      stripePaymentIntentId: paymentIntent.id,
      amount: paymentAmount,
      currency: paymentCurrency,
      status: paymentIntent.status,
      paymentMethod,
      description: `Afternote Service - One-time charge for ${recipientName}`,
      metadata: {
        service: 'afternote-one-time',
        userEmail: user.email,
        recipientEmail: recipient.email
      }
    });

    await payment.save();
    recipient.paymentCompleted = true;
    recipient.paymentCompletedAt = new Date();
    await recipient.save();

    res.status(200).json({
      success: true,
      message: 'Payment intent created successfully',
      data: {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        recipientId: recipientId,
        recipientName: recipientName
      }
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    
    if (error.type === 'StripeCardError') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message
    });
  }
};

/**
 * Confirm a payment intent
 * @route POST /api/payments/confirm-payment
 * @access Private
 */
const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const { id } = req.user;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required'
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Verify the payment belongs to the user
    if (paymentIntent.metadata.userId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to payment'
      });
    }

    // Update payment status in database
    const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    payment.status = paymentIntent.status;
    if (paymentIntent.charges.data.length > 0) {
      payment.receiptUrl = paymentIntent.charges.data[0].receipt_url;
    }
    await payment.save();

    // Mark recipient's payment as completed if payment succeeded
    if (paymentIntent.status === 'succeeded' && payment.recipientId) {
      await Recipient.findByIdAndUpdate(payment.recipientId, {
        paymentCompleted: true,
        paymentCompletedAt: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully',
      data: {
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        receiptUrl: payment.receiptUrl,
        recipientId: payment.recipientId,
        recipientName: payment.recipientName,
        paymentCompleted: paymentIntent.status === 'succeeded'
      }
    });

  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: error.message
    });
  }
};

/**
 * Get payment status
 * @route GET /api/payments/status/:paymentIntentId
 * @access Private
 */
const getPaymentStatus = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const { id } = req.user;

    // Find payment in database
    const payment = await Payment.findOne({ 
      stripePaymentIntentId: paymentIntentId,
      userId: id
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Get latest status from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Update local status if different
    if (payment.status !== paymentIntent.status) {
      payment.status = paymentIntent.status;
      if (paymentIntent.charges.data.length > 0) {
        payment.receiptUrl = paymentIntent.charges.data[0].receipt_url;
      }
      await payment.save();
    }

    res.status(200).json({
      success: true,
      data: {
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        receiptUrl: payment.receiptUrl,
        recipientId: payment.recipientId,
        recipientName: payment.recipientName,
        paymentCompleted: payment.status === 'succeeded',
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt
      }
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status',
      error: error.message
    });
  }
};

/**
 * Get user's payment history
 * @route GET /api/payments/history
 * @access Private
 */
const getPaymentHistory = async (req, res) => {
  try {
    const { id } = req.user;

    const payments = await Payment.find({ userId: id })
      .sort({ createdAt: -1 })
      .exec();

    res.status(200).json({
      success: true,
      data: {
        payments
      }
    });

  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment history',
      error: error.message
    });
  }
};

/**
 * Webhook to handle Stripe events
 * @route POST /api/payments/webhook
 * @access Public
 */
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

const handlePaymentSucceeded = async (paymentIntent) => {
  const payment = await Payment.findOne({ 
    stripePaymentIntentId: paymentIntent.id 
  });
  
  if (payment) {
    payment.status = 'succeeded';
    if (paymentIntent.charges.data.length > 0) {
      payment.receiptUrl = paymentIntent.charges.data[0].receipt_url;
    }
    await payment.save();
    
    // Mark recipient's payment as completed
    if (payment.recipientId) {
      await Recipient.findByIdAndUpdate(payment.recipientId, {
        paymentCompleted: true,
        paymentCompletedAt: new Date()
      });
    }
    
    console.log(`Payment ${paymentIntent.id} marked as succeeded for recipient ${payment.recipientName}`);
  }
};

const handlePaymentFailed = async (paymentIntent) => {
  const payment = await Payment.findOne({ 
    stripePaymentIntentId: paymentIntent.id 
  });
  
  if (payment) {
    payment.status = 'failed';
    await payment.save();
    console.log(`Payment ${paymentIntent.id} marked as failed`);
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getPaymentStatus,
  getPaymentHistory,
  handleWebhook
}; 