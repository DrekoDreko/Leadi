import { NextResponse } from "next/server";
import { deleteLeadForCurrentUser, updateLeadForCurrentUser } from "@/lib/leads/repository";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const lead = await updateLeadForCurrentUser(id, body);

    return NextResponse.json({ lead });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Nao foi possivel atualizar o lead."
      },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteLeadForCurrentUser(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Nao foi possivel remover o lead."
      },
      { status: 400 }
    );
  }
}
