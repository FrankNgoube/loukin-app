import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { transaction_id } = await req.json();

    if (!transaction_id) {
      return Response.json({ error: 'transaction_id requis' }, { status: 400 });
    }

    const transactions = await base44.entities.Transaction.filter({ id: transaction_id });

    if (transactions.length === 0) {
      return Response.json({ error: 'Transaction non trouvée' }, { status: 404 });
    }

    const transaction = transactions[0];

    // Vérifier que l'utilisateur est autorisé
    if (transaction.fan_email !== user.email && transaction.creator_email !== user.email) {
      return Response.json({ error: 'Non autorisé' }, { status: 403 });
    }

    return Response.json({
      transaction_id: transaction.id,
      status: transaction.payment_status,
      amount: transaction.gross_amount,
      creator_amount: transaction.creator_amount,
      platform_fee: transaction.platform_fee,
      payment_provider: transaction.payment_provider,
      content_unlocked: transaction.payment_status === 'completed',
      created_at: transaction.created_date,
      confirmed_at: transaction.payment_confirmed_at
    });

  } catch (error) {
    console.error('Erreur vérification paiement:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});