import { NextResponse } from 'next/server';
import {
  getPipelineStages,
  savePipelineStages,
  listDeals,
  addDeal,
  updateDeal,
  deleteDeal,
  updateContactStage,
  listContacts,
} from '@/lib/crm-store';
import { getMetadataState } from '@/lib/crm-metadata-store';

export async function GET() {
  try {
    const [stages, deals, contacts, metadata] = await Promise.all([
      getPipelineStages(),
      listDeals(),
      listContacts(),
      getMetadataState(),
    ]);

    return NextResponse.json({
      stages,
      deals,
      contacts,
      inactivitySettings: metadata.inactivitySettings,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'move_stage') {
      const { phone, stageId } = body;
      if (!phone || !stageId) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
      await updateContactStage(phone, stageId);
      return NextResponse.json({ success: true, phone, stageId });
    }

    if (action === 'save_stages') {
      const { stages } = body;
      if (!Array.isArray(stages)) return NextResponse.json({ error: 'Formato inválido de etapas' }, { status: 400 });
      const saved = await savePipelineStages(stages);
      return NextResponse.json({ success: true, stages: saved });
    }

    if (action === 'add_deal') {
      const { deal } = body;
      if (!deal || !deal.title || !deal.contactId) return NextResponse.json({ error: 'Datos de oportunidad incompletos' }, { status: 400 });
      const created = await addDeal(deal);
      return NextResponse.json({ success: true, deal: created });
    }

    if (action === 'update_deal') {
      const { dealId, patch } = body;
      if (!dealId || !patch) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
      const updated = await updateDeal(dealId, patch);
      return NextResponse.json({ success: true, deal: updated });
    }

    if (action === 'delete_deal') {
      const { dealId } = body;
      if (!dealId) return NextResponse.json({ error: 'Falta dealId' }, { status: 400 });
      await deleteDeal(dealId);
      return NextResponse.json({ success: true, dealId });
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
