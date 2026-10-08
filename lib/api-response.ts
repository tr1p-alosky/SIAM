import { NextResponse } from "next/server";
import { ApiAuthError } from "@/lib/auth";

export function apiErrorResponse(error: unknown, fallback: string) {
  if (error instanceof ApiAuthError) {
    return NextResponse.json(
      { estatus: "error", mensaje: error.message },
      { status: error.status },
    );
  }

  console.error(fallback, error);
  return NextResponse.json(
    { estatus: "error", mensaje: fallback },
    { status: 500 },
  );
}
