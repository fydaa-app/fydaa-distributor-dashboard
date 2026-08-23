import { NextResponse } from "next/server";
import ifsc from "ifsc";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ifscCode = String(body?.ifsc ?? "").trim().toUpperCase();

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
      return NextResponse.json(
        { error: "Invalid IFSC code" },
        { status: 400 }
      );
    }

    const details = await ifsc.fetchDetails(ifscCode);

    if (!details || !details.BANK) {
      return NextResponse.json(
        { error: "Could not find bank details" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      BANK: details.BANK,
      BRANCH: details.BRANCH,
      ADDRESS: details.ADDRESS,
      CITY: details.CITY,
      STATE: details.STATE,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not find bank details" },
      { status: 404 }
    );
  }
}
