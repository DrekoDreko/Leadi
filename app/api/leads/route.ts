import { NextResponse } from "next/server";
import { createLeadForCurrentUser, getLeadsForCurrentUser } from "@/lib/leads/repository";

export async function GET() {
  const state = await getLeadsForCurrentUser();

  return NextResponse.json(state);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const lead = await createLeadForCurrentUser(body);

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Nao foi possivel criar o lead."
      },
      { status: 400 }
    );
  }
}
