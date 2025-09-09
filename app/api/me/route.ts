import { NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSessionInfo();
    
    if (!session.isAuthenticated) {
      return NextResponse.json({ 
        ok: false, 
        error: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      user: session.user,
      email: session.email,
      role: session.role,
      isAuthenticated: session.isAuthenticated
    }, {
      headers: {
        'Cache-Control': 'no-store'
      }
    });

  } catch (error) {
    console.error('Error in /api/me:', error);
    return NextResponse.json({
      ok: false,
      error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}
