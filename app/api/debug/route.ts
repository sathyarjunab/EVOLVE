import pool from "../../db/connection";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await pool.query("SELECT NOW()");

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error,
    });
  }
}