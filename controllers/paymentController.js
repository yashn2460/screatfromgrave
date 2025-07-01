const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const User = require('../models/User');

/**
 * Create a payment intent for the one-time service charge
 * @route POST /api/payments/create-payment-intent
 * @access Private
 */
const createPaymentIntent = async (req, res) => {
  try {
    const { id } = req.user; // From JWT token
    const { paymentMethod } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required'
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

    // Check if user has already made a successful payment
    const existingPayment = await Payment.findOne({
      userId: id,
      status: 'succeeded'
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed for this user'
      });
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 17900, // £179.00 in pence
      currency: 'gbp',
      payment_method: paymentMethod,
      confirm: true,
      return_url: process.env.STRIPE_RETURN_URL || 'http://localhost:3000/payment-success',
      metadata: {
        userId: id,
        service: 'afternote-one-time'
      },
      description: 'Afternote Service - One-time charge'
    });

    // Save payment record to database
    const payment = new Payment({
      userId:id,
      stripePaymentIntentId: paymentIntent.id,
      amount: 17900,
      currency: 'gbp',
      status: paymentIntent.status,
      paymentMethod,
      description: 'Afternote Service - One-time charge',
      metadata: {
        service: 'afternote-one-time',
        userEmail: user.email
      }
    });

    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Payment intent created successfully',
      data: {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
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

    res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully',
      data: {
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        receiptUrl: payment.receiptUrl
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
    console.log(`Payment ${paymentIntent.id} marked as succeeded`);
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