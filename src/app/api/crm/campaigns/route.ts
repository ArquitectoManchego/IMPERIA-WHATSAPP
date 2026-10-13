import { NextResponse } from 'next/server';
import { listCampaigns, saveCampaign } from '@/lib/crm-store';
import { getWhatsAppProvider } from '@/lib/whatsapp-provider';

export async function GET() {
  try {
    const campaigns = await listCampaigns();
    return NextResponse.json(campaigns);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'save') {
      const saved = await saveCampaign(body.campaign);
      return NextResponse.json({ success: true, campaign: saved });
    }

    if (action === 'execute') {
      const { campaignId } = body;
      const campaigns = await listCampaigns();
      const campaign = campaigns.find(c => c.id === campaignId);
      if (!campaign) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });

      const automationsEnabled = process.env.CRM_AUTOMATIONS_ENABLED === 'true';
      const testPhone = process.env.CRM_TEST_PHONE;

      const provider = getWhatsAppProvider();
      let sentCount = 0;
      let failedCount = 0;

      const updatedRecipients = [];
      for (const r of campaign.recipients) {
        if (r.status === 'sent') {
          updatedRecipients.push(r);
          continue;
        }

        // Safety check if automations are disabled
        if (!automationsEnabled && testPhone && !r.phone.includes(testPhone.replace(/\D/g, '').slice(-10))) {
          updatedRecipients.push({
            ...r,
            status: 'failed' as const,
            error: 'Modo seguro: Envíos masivos restringidos al teléfono de pruebas autorizado.',
          });
          failedCount++;
          continue;
        }

        try {
          const personalizedMsg = campaign.messageTemplate
            .replace(/\{\{nombre\}\}/gi, r.name || 'Cliente')
            .replace(/\{\{telefono\}\}/gi, r.phone);

          await provider.sendMessage({
            chatId: r.phone.includes('@') ? r.phone : `${r.phone.replace(/\D/g, '')}@c.us`,
            message: personalizedMsg,
            mediaBase64: campaign.mediaBase64,
          });

          updatedRecipients.push({
            ...r,
            status: 'sent' as const,
            sentAt: new Date().toISOString(),
          });
          sentCount++;
        } catch (err: any) {
          updatedRecipients.push({
            ...r,
            status: 'failed' as const,
            error: err.message,
          });
          failedCount++;
        }
      }

      const updatedCampaign = await saveCampaign({
        ...campaign,
        status: failedCount > 0 && sentCount === 0 ? 'paused' : 'completed',
        recipients: updatedRecipients,
        progress: {
          total: updatedRecipients.length,
          sent: sentCount,
          failed: failedCount,
        },
      });

      return NextResponse.json({ success: true, campaign: updatedCampaign });
    }

    const created = await saveCampaign(body);
    return NextResponse.json({ success: true, campaign: created });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
