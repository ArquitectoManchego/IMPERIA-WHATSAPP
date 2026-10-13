import { NextResponse } from 'next/server';
import { listAutomationRules, saveAutomationRule, toggleAutomationRule } from '@/lib/crm-store';

export async function GET() {
  try {
    const rules = await listAutomationRules();
    return NextResponse.json(rules);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'toggle') {
      const { id, active } = body;
      if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });
      await toggleAutomationRule(id, active === true);
      return NextResponse.json({ success: true, id, active });
    }

    const saved = await saveAutomationRule(body);
    return NextResponse.json({ success: true, rule: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
