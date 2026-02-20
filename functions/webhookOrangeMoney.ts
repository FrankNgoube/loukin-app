import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const webhookData = await req.json();

    console.log('Webhook Orange Money reçu:', webhookData);

    // Validation webhook (vérifier signature si disponible)
    const webhookSecret = Deno.env.get('PAYMENT_WEBHOOK_SECRET');
    const signature = req.headers.get('x-signature');
    
    // TODO: Valider signature selon docs Orange Money

    const { order_id, status, pay_token } = webhookData;

    // Récupérer transaction
    const transactions = await base44.asServiceRole.entities.Transaction.filter({
      id: order_id
    });

    if (transactions.length === 0) {
      return Response.json({ error: 'Transaction non trouvée' }, { status: 404 });
    }

    const transaction = transactions[0];

    // Traiter selon statut
    if (status === 'SUCCESS' || status === 'SUCCESSFUL') {
      await processSuccessfulPayment(base44, transaction);
    } else if (status === 'FAILED' || status === 'EXPIRED') {
      await base44.asServiceRole.entities.Transaction.update(transaction.id, {
        payment_status: 'failed',
        metadata: {
          ...transaction.metadata,
          webhook_received_at: new Date().toISOString(),
          failure_reason: webhookData.message || 'Paiement échoué'
        }
      });

      // Notification fan
      await base44.asServiceRole.entities.Notification.create({
        user_email: transaction.fan_email,
        type: 'payment_received',
        title: '❌ Paiement échoué',
        message: `Votre paiement de ${transaction.gross_amount} FCFA n'a pas abouti.`,
        is_read: false
      });
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('Erreur webhook Orange Money:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function processSuccessfulPayment(base44, transaction) {
  // 1. Mettre à jour transaction
  await base44.asServiceRole.entities.Transaction.update(transaction.id, {
    payment_status: 'completed',
    payment_confirmed_at: new Date().toISOString(),
    metadata: {
      ...transaction.metadata,
      webhook_received_at: new Date().toISOString()
    }
  });

  // 2. Mettre à jour solde créateur
  const balances = await base44.asServiceRole.entities.CreatorBalance.filter({
    creator_email: transaction.creator_email
  });

  if (balances.length > 0) {
    const balance = balances[0];
    await base44.asServiceRole.entities.CreatorBalance.update(balance.id, {
      pending_balance: (balance.pending_balance || 0) + transaction.creator_amount,
      lifetime_earnings: (balance.lifetime_earnings || 0) + transaction.creator_amount
    });
  } else {
    await base44.asServiceRole.entities.CreatorBalance.create({
      creator_email: transaction.creator_email,
      pending_balance: transaction.creator_amount,
      lifetime_earnings: transaction.creator_amount
    });
  }

  // 3. Débloquer contenu selon type
  if (transaction.transaction_type === 'subscription' && transaction.subscription_id) {
    // Activer abonnement
    await base44.asServiceRole.entities.Subscription.create({
      fan_email: transaction.fan_email,
      creator_email: transaction.creator_email,
      tier_id: transaction.subscription_id,
      amount_monthly: transaction.gross_amount,
      status: 'active',
      auto_renew: true,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    
    // Notification abonnement pour créateur
    const fanProfiles = await base44.asServiceRole.entities.CreatorProfile.filter({ user_email: transaction.fan_email });
    const fanProfile = fanProfiles[0];
    const fanUsers = await base44.asServiceRole.entities.User.filter({ email: transaction.fan_email });
    const fanUser = fanUsers[0];
    
    await base44.asServiceRole.entities.Notification.create({
      user_email: transaction.creator_email,
      type: 'new_subscriber',
      title: '🎉 Nouvel abonné',
      message: `${fanProfile?.display_name || fanUser?.full_name || 'Un utilisateur'} s'est abonné à votre contenu`,
      from_user_email: transaction.fan_email,
      from_user_name: fanProfile?.display_name || fanUser?.full_name,
      is_read: false
    });
  }
  
  if (transaction.transaction_type === 'ppv' && transaction.content_id) {
    // Notification achat PPV pour créateur
    const fanProfiles = await base44.asServiceRole.entities.CreatorProfile.filter({ user_email: transaction.fan_email });
    const fanProfile = fanProfiles[0];
    const fanUsers = await base44.asServiceRole.entities.User.filter({ email: transaction.fan_email });
    const fanUser = fanUsers[0];
    
    await base44.asServiceRole.entities.Notification.create({
      user_email: transaction.creator_email,
      type: 'ppv_purchase',
      title: '💳 Achat de contenu',
      message: `${fanProfile?.display_name || fanUser?.full_name || 'Un utilisateur'} a acheté votre contenu pour ${transaction.gross_amount} FCFA`,
      from_user_email: transaction.fan_email,
      from_user_name: fanProfile?.display_name || fanUser?.full_name,
      is_read: false,
      link: `/PostDetail?id=${transaction.content_id}`
    });
  }

  // 4. Notifications
  await base44.asServiceRole.entities.Notification.create({
    user_email: transaction.fan_email,
    type: 'payment_received',
    title: '✅ Paiement confirmé',
    message: `Votre paiement de ${transaction.gross_amount} FCFA a été confirmé !`,
    is_read: false
  });

  await base44.asServiceRole.entities.Notification.create({
    user_email: transaction.creator_email,
    type: 'payment_received',
    title: '💰 Paiement reçu',
    message: `Vous avez reçu ${transaction.creator_amount} FCFA (80% de ${transaction.gross_amount} FCFA)`,
    from_user_email: transaction.fan_email,
    is_read: false
  });
}