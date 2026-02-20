import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const {
      creator_email,
      transaction_type,
      amount,
      payment_provider,
      phone_number,
      content_id,
      subscription_tier_id
    } = await req.json();

    // Validation
    if (!creator_email || !transaction_type || !amount || !payment_provider || !phone_number) {
      return Response.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // Validation montant
    if (amount < 500 || amount > 500000) {
      return Response.json({ error: 'Montant invalide (min: 500 FCFA, max: 500 000 FCFA)' }, { status: 400 });
    }

    // Validation numéro camerounais
    const phoneRegex = /^(237)?[6][0-9]{8}$/;
    const cleanPhone = phone_number.replace(/\s+/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return Response.json({ error: 'Numéro invalide. Format: 237 6XX XXX XXX' }, { status: 400 });
    }

    // Validation provider
    if (!['orange_money', 'mtn_momo'].includes(payment_provider)) {
      return Response.json({ error: 'Opérateur invalide' }, { status: 400 });
    }

    // Calcul commission (20%)
    const platform_fee = Math.round(amount * 0.20);
    const creator_amount = amount - platform_fee;

    // Création transaction
    const transaction = await base44.asServiceRole.entities.Transaction.create({
      transaction_type,
      fan_email: user.email,
      creator_email,
      gross_amount: amount,
      platform_fee,
      creator_amount,
      payment_provider,
      phone_number: cleanPhone,
      payment_status: 'pending',
      disbursement_status: 'pending',
      content_id,
      subscription_id: subscription_tier_id,
      metadata: {
        initiated_by: user.full_name,
        initiated_at: new Date().toISOString()
      }
    });

    // Initier paiement selon provider
    let paymentResponse;
    if (payment_provider === 'orange_money') {
      paymentResponse = await initiateOrangeMoney(transaction.id, amount, cleanPhone);
    } else {
      paymentResponse = await initiateMTNMomo(transaction.id, amount, cleanPhone);
    }

    // Mise à jour avec external_transaction_id
    await base44.asServiceRole.entities.Transaction.update(transaction.id, {
      external_transaction_id: paymentResponse.external_ref
    });

    return Response.json({
      transaction_id: transaction.id,
      status: 'pending',
      external_ref: paymentResponse.external_ref,
      message: 'Vérifiez votre téléphone pour confirmer le paiement'
    });

  } catch (error) {
    console.error('Erreur initiation paiement:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function initiateOrangeMoney(transactionId, amount, phoneNumber) {
  const clientId = Deno.env.get('ORANGE_MONEY_CLIENT_ID');
  const clientSecret = Deno.env.get('ORANGE_MONEY_CLIENT_SECRET');
  const merchantKey = Deno.env.get('ORANGE_MONEY_MERCHANT_KEY');

  // 1. Obtenir token OAuth
  const tokenResponse = await fetch('https://api.orange.com/oauth/v3/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const { access_token } = await tokenResponse.json();

  // 2. Initier paiement
  const paymentResponse = await fetch('https://api.orange.com/orange-money-webpay/cm/v1/webpayment', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      merchant_key: merchantKey,
      currency: 'XAF',
      order_id: transactionId,
      amount: amount,
      return_url: `${Deno.env.get('BASE44_APP_URL')}/payment-callback`,
      cancel_url: `${Deno.env.get('BASE44_APP_URL')}/payment-cancel`,
      notif_url: `${Deno.env.get('BASE44_APP_URL')}/api/functions/webhookOrangeMoney`,
      lang: 'fr',
      reference: transactionId
    })
  });

  const paymentData = await paymentResponse.json();
  
  return {
    external_ref: paymentData.payment_token || paymentData.notif_token,
    payment_url: paymentData.payment_url
  };
}

async function initiateMTNMomo(transactionId, amount, phoneNumber) {
  const subscriptionKey = Deno.env.get('MTN_MOMO_SUBSCRIPTION_KEY');
  const apiUser = Deno.env.get('MTN_MOMO_API_USER');
  const apiKey = Deno.env.get('MTN_MOMO_API_KEY');

  // 1. Obtenir token
  const tokenResponse = await fetch(`https://sandbox.momodeveloper.mtn.com/collection/token/`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${apiUser}:${apiKey}`)}`,
      'Ocp-Apim-Subscription-Key': subscriptionKey
    }
  });

  const { access_token } = await tokenResponse.json();

  // 2. Request to Pay
  const referenceId = crypto.randomUUID();
  
  const paymentResponse = await fetch(`https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'X-Reference-Id': referenceId,
      'X-Target-Environment': 'mtncameroon',
      'Ocp-Apim-Subscription-Key': subscriptionKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: amount.toString(),
      currency: 'XAF',
      externalId: transactionId,
      payer: {
        partyIdType: 'MSISDN',
        partyId: phoneNumber.replace('237', '')
      },
      payerMessage: 'Paiement LouKin',
      payeeNote: `Transaction ${transactionId}`
    })
  });

  if (!paymentResponse.ok) {
    throw new Error('Erreur MTN MoMo');
  }

  return {
    external_ref: referenceId
  };
}